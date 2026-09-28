import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import { dataStore, supabase, isSupabaseConfigured } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

const LOCAL_AUTH_ACCOUNTS_KEY = 'ki_crm_auth_accounts_v1';
const LOCAL_AUTH_SESSION_KEY = 'ki_crm_auth_session_v1';

interface LocalAuthAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone: string;
  department: string;
  active: boolean;
  createdAt: string;
}

function loadLocalAccounts(): LocalAuthAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalAccounts(accounts: LocalAuthAccount[]): void {
  try {
    localStorage.setItem(LOCAL_AUTH_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // ignore storage errors
  }
}

function loadLocalSessionUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

function saveLocalSessionUser(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(LOCAL_AUTH_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_AUTH_SESSION_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

interface AuthContextType {
  currentUser: UserProfile;
  rawUser: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSupabaseConnected: boolean;
  users: UserProfile[];
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (data: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    phone?: string;
  }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; success?: boolean }>;
  updateCurrentUserProfile: (updates: Partial<UserProfile>) => void;
  isOwner: boolean;
  isSenior: boolean;
  isSalesExecutive: boolean;
  isStaff: boolean;
  canViewTeamActivity: boolean;
  canManageUsers: boolean;
  canReassignLeads: boolean;
  effectiveRole: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUserRole(rawRole?: string | null): UserRole {
  if (!rawRole) return 'sales_executive';
  const lowered = String(rawRole).trim().toLowerCase();
  if (lowered === 'owner' || lowered === 'admin' || lowered === 'administrator') {
    return 'owner';
  }
  if (lowered === 'senior_sales_executive' || lowered === 'senior_staff') {
    return 'senior_sales_executive';
  }
  return 'sales_executive';
}

export function formatSupabaseAuthError(err: any): string {
  const rawMessage = typeof err === 'string' ? err : err?.message || '';
  const code = err?.code || '';
  const lower = rawMessage.toLowerCase();

  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('load failed') ||
    lower.includes('fetch failed') ||
    code === 'able_to_connect'
  ) {
    return 'Unable to connect to the authentication service. Please check your internet connection.';
  }

  if (
    lower.includes('apikey') ||
    lower.includes('invalid api key') ||
    lower.includes('jwt') ||
    lower.includes('project not found')
  ) {
    return 'Authentication service is not configured correctly. Please contact the administrator.';
  }

  if (lower.includes('email not confirmed') || code === 'email_not_confirmed') {
    return 'Please confirm your email before logging in.';
  }

  if (lower.includes('user not found') || code === 'user_not_found') {
    return 'No account found with this email address.';
  }

  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid_credentials') ||
    lower.includes('invalid grant') ||
    code === 'invalid_credentials'
  ) {
    return 'Invalid email or password.';
  }

  if (lower.includes('rate limit') || lower.includes('too many requests') || code === 'over_request_rate_limit') {
    return 'Too many login attempts. Please wait a moment and try again.';
  }

  return rawMessage || 'Unable to sign in. Please check your credentials and try again.';
}

function mapRowToUserProfile(row: any, fallbackUser?: User): UserProfile {
  const authoritativeRole = normalizeUserRole(row.role);
  return {
    id: row.id,
    name:
      row.name ||
      fallbackUser?.user_metadata?.name ||
      (row.email || fallbackUser?.email || '').split('@')[0] ||
      'CRM User',
    email: row.email || fallbackUser?.email || '',
    role: authoritativeRole,
    phone: row.phone || fallbackUser?.user_metadata?.phone || '',
    avatarUrl:
      row.avatar_url ||
      fallbackUser?.user_metadata?.avatar_url ||
      (authoritativeRole === 'owner'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'),
    active: row.active !== false,
    department:
      row.department ||
      (authoritativeRole === 'owner'
        ? 'Management'
        : authoritativeRole === 'senior_sales_executive'
        ? 'Sales Leadership'
        : 'Field Sales'),
    createdAt: row.created_at || fallbackUser?.created_at || new Date().toISOString(),
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rawUser, setRawUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<UserProfile[]>(() => dataStore.getUsers());

  const syncTeamProfilesFromSupabase = async () => {
    if (!supabase) return;
    try {
      const { data: rows, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && rows && rows.length > 0) {
        const mapped = rows.map((r) => mapRowToUserProfile(r));
        dataStore.syncUsersFromSupabase(mapped);
      }
    } catch {
      // ignore non-critical team list sync error
    }
  };

  const syncUserFromSupabase = async (sbUser: User): Promise<UserProfile> => {
    if (supabase) {
      try {
        const { data: profileById } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sbUser.id)
          .maybeSingle();

        if (profileById) {
          const userProfile = mapRowToUserProfile(profileById, sbUser);
          dataStore.setCurrentUser(userProfile);
          setRawUser(userProfile);
          await syncTeamProfilesFromSupabase();
          return userProfile;
        }

        const { count: ownerCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'owner');

        const isAppMetaOwner = normalizeUserRole(sbUser.app_metadata?.role) === 'owner';
        const isFirstOwnerBootstrap = ownerCount === 0 || isAppMetaOwner;
        const targetRole: UserRole = isFirstOwnerBootstrap ? 'owner' : 'sales_executive';
        const targetDept = targetRole === 'owner' ? 'Management' : 'Field Sales';

        const defaultName =
          sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'CRM User';

        await supabase.from('profiles').upsert({
          id: sbUser.id,
          name: defaultName,
          email: sbUser.email || '',
          role: targetRole,
          phone: sbUser.user_metadata?.phone || '',
          department: targetDept,
          active: true,
        });

        const { data: createdProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sbUser.id)
          .maybeSingle();

        if (createdProfile) {
          const userProfile = mapRowToUserProfile(createdProfile, sbUser);
          dataStore.setCurrentUser(userProfile);
          setRawUser(userProfile);
          await syncTeamProfilesFromSupabase();
          return userProfile;
        }
      } catch (err) {
        console.warn('Error syncing user profile from Supabase:', err);
      }
    }

    const fallbackRole: UserRole =
      normalizeUserRole(sbUser.app_metadata?.role) === 'owner' ? 'owner' : 'sales_executive';
    const fallbackUser: UserProfile = {
      id: sbUser.id,
      name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'CRM User',
      email: sbUser.email || '',
      role: fallbackRole,
      phone: sbUser.user_metadata?.phone || '',
      avatarUrl:
        sbUser.user_metadata?.avatar_url ||
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      active: true,
      department: fallbackRole === 'owner' ? 'Management' : 'Field Sales',
      createdAt: sbUser.created_at || new Date().toISOString(),
    };

    dataStore.setCurrentUser(fallbackUser);
    setRawUser(fallbackUser);
    return fallbackUser;
  };

  // Initial Auth Listener & Session Restoration
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        if (supabase) {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Supabase session check warning:', error.message);
          }

          if (data?.session?.user && isMounted) {
            setSession(data.session);
            setIsAuthenticated(true);
            const synced = await syncUserFromSupabase(data.session.user);
            if (isMounted) {
              if (synced.active === false) {
                await supabase.auth.signOut();
                setSession(null);
                setRawUser(null);
                dataStore.clearCurrentUser();
                setIsAuthenticated(false);
              } else {
                setIsAuthenticated(true);
              }
              setIsLoading(false);
            }
            return;
          }
        }

        // Check local persistence session fallback
        const localUser = loadLocalSessionUser();
        if (localUser && localUser.active !== false && isMounted) {
          dataStore.setCurrentUser(localUser);
          setRawUser(localUser);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        if (isMounted) {
          setSession(null);
          setRawUser(null);
          dataStore.clearCurrentUser();
          setIsAuthenticated(false);
        }
      } catch (e) {
        console.error('Session initialization error:', e);
        if (isMounted) {
          setSession(null);
          setRawUser(null);
          dataStore.clearCurrentUser();
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    let subscription: { unsubscribe: () => void } | null = null;
    const sbClient = supabase;
    if (sbClient) {
      const authListener = sbClient.auth.onAuthStateChange(async (event, newSession) => {
        if (!isMounted) return;

        if (event === 'SIGNED_OUT') {
          saveLocalSessionUser(null);
          setSession(null);
          setRawUser(null);
          dataStore.clearCurrentUser();
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        if (newSession?.user) {
          setSession(newSession);
          setIsAuthenticated(true);
          const synced = await syncUserFromSupabase(newSession.user);
          if (isMounted) {
            if (synced.active === false) {
              await sbClient.auth.signOut();
              setSession(null);
              setRawUser(null);
              dataStore.clearCurrentUser();
              setIsAuthenticated(false);
            } else {
              setIsAuthenticated(true);
            }
            setIsLoading(false);
          }
        }
      });
      subscription = authListener.data.subscription;
    }

    const unsubscribeDataStore = dataStore.subscribe(() => {
      if (!isMounted) return;
      const storeUser = dataStore.getCurrentUser();
      if (storeUser) {
        setRawUser(storeUser);
      }
      setUsers(dataStore.getUsers());
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      unsubscribeDataStore();
    };
  }, []);

  // Email + Password Sign In (Supabase primary, graceful local persistence fallback when env vars unset)
  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { error: formatSupabaseAuthError(error) };
        }

        if (data?.user && data?.session) {
          setSession(data.session);
          const profile = await syncUserFromSupabase(data.user);

          if (profile.active === false) {
            await supabase.auth.signOut();
            setSession(null);
            setRawUser(null);
            dataStore.clearCurrentUser();
            setIsAuthenticated(false);
            return {
              error: 'Your account has been deactivated. Please contact the administrator.',
            };
          }

          setIsAuthenticated(true);
          window.history.pushState({}, '', '/dashboard');
          return {};
        }
      } catch (err: any) {
        return { error: formatSupabaseAuthError(err) };
      }

      return { error: 'Invalid email or password.' };
    }

    // Local persistence authentication fallback when Supabase env vars are not configured in deployment
    const accounts = loadLocalAccounts();
    const matchedAccount = accounts.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (matchedAccount) {
      if (matchedAccount.password !== password) {
        return { error: 'Invalid email or password.' };
      }
      if (!matchedAccount.active) {
        return { error: 'Your account has been deactivated. Please contact the administrator.' };
      }
      const profile: UserProfile = {
        id: matchedAccount.id,
        name: matchedAccount.name,
        email: matchedAccount.email,
        role: matchedAccount.role,
        phone: matchedAccount.phone,
        active: matchedAccount.active,
        department: matchedAccount.department,
        createdAt: matchedAccount.createdAt,
        avatarUrl:
          matchedAccount.role === 'owner'
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      };
      saveLocalSessionUser(profile);
      dataStore.setCurrentUser(profile);
      setRawUser(profile);
      setIsAuthenticated(true);
      window.history.pushState({}, '', '/dashboard');
      return {};
    }

    // Also allow existing CRM users in DataStore to sign in if they match email
    const existingCrmUser = dataStore
      .getUsers()
      .find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existingCrmUser && password.length >= 6) {
      if (!existingCrmUser.active) {
        return { error: 'Your account has been deactivated. Please contact the administrator.' };
      }
      const newLocalAcc: LocalAuthAccount = {
        id: existingCrmUser.id,
        email: existingCrmUser.email,
        password,
        name: existingCrmUser.name,
        role: existingCrmUser.role,
        phone: existingCrmUser.phone,
        department: existingCrmUser.department || 'Field Sales',
        active: existingCrmUser.active,
        createdAt: existingCrmUser.createdAt,
      };
      saveLocalAccounts([...accounts, newLocalAcc]);
      saveLocalSessionUser(existingCrmUser);
      dataStore.setCurrentUser(existingCrmUser);
      setRawUser(existingCrmUser);
      setIsAuthenticated(true);
      window.history.pushState({}, '', '/dashboard');
      return {};
    }

    return { error: 'Invalid email or password.' };
  };

  // Sign Up & Profile Creation
  const signUp = async (data: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    phone?: string;
  }): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        let initialRole: UserRole = 'sales_executive';
        try {
          const { count: ownerCount } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'owner');
          if (ownerCount === 0) {
            initialRole = 'owner';
          }
        } catch {
          // default to sales_executive
        }

        const { data: resData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              name: data.name.trim(),
              role: initialRole,
              phone: data.phone || '',
            },
          },
        });

        if (error) {
          return { error: formatSupabaseAuthError(error) };
        }

        if (resData.user?.identities && resData.user.identities.length === 0) {
          return { error: 'An account with this email already exists. Please sign in instead.' };
        }

        if (resData.user) {
          try {
            await supabase.from('profiles').upsert({
              id: resData.user.id,
              name: data.name.trim(),
              email: data.email,
              role: initialRole,
              phone: data.phone || '',
              department: initialRole === 'owner' ? 'Management' : 'Field Sales',
              active: true,
            });
          } catch (pe) {
            console.warn('Profile table upsert note:', pe);
          }

          if (resData.session) {
            setSession(resData.session);
            await syncUserFromSupabase(resData.user);
            setIsAuthenticated(true);
            window.history.pushState({}, '', '/dashboard');
            return {};
          } else {
            return {
              error: 'Please confirm your email before logging in.',
            };
          }
        }
      } catch (err: any) {
        return { error: formatSupabaseAuthError(err) };
      }

      return { error: 'Account registration could not be completed. Please try again.' };
    }

    // Local persistence sign up fallback when Supabase env vars are not configured
    const accounts = loadLocalAccounts();
    if (accounts.some((a) => a.email.toLowerCase() === data.email.trim().toLowerCase())) {
      return { error: 'An account with this email already exists. Please sign in instead.' };
    }

    const hasOwner = accounts.some((a) => a.role === 'owner');
    const assignedRole: UserRole = !hasOwner ? 'owner' : 'sales_executive';
    const assignedDept = assignedRole === 'owner' ? 'Management' : 'Field Sales';
    const now = new Date().toISOString();
    const newId = `usr_${Date.now()}`;

    const newAccount: LocalAuthAccount = {
      id: newId,
      email: data.email.trim(),
      password: data.password,
      name: data.name.trim(),
      role: assignedRole,
      phone: data.phone || '',
      department: assignedDept,
      active: true,
      createdAt: now,
    };

    saveLocalAccounts([...accounts, newAccount]);

    const profile: UserProfile = {
      id: newId,
      name: newAccount.name,
      email: newAccount.email,
      role: assignedRole,
      phone: newAccount.phone,
      active: true,
      department: assignedDept,
      createdAt: now,
      avatarUrl:
        assignedRole === 'owner'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    };

    saveLocalSessionUser(profile);
    dataStore.setCurrentUser(profile);
    setRawUser(profile);
    setIsAuthenticated(true);
    window.history.pushState({}, '', '/dashboard');
    return {};
  };

  // Sign Out
  const signOut = async (): Promise<void> => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase sign out note:', e);
      }
    }
    saveLocalSessionUser(null);
    setSession(null);
    setRawUser(null);
    dataStore.clearCurrentUser();
    setIsAuthenticated(false);
    window.history.replaceState({}, '', '/login');
  };

  // Reset Password
  const resetPassword = async (email: string): Promise<{ error?: string; success?: boolean }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) {
          return { error: formatSupabaseAuthError(error) };
        }
        return { success: true };
      } catch (err: any) {
        return { error: formatSupabaseAuthError(err) };
      }
    }

    return { success: true };
  };

  const updateCurrentUserProfile = (updates: Partial<UserProfile>) => {
    if (rawUser) {
      const safeUpdates: Partial<UserProfile> = { ...updates };
      delete (safeUpdates as any).role;
      delete (safeUpdates as any).department;
      delete (safeUpdates as any).active;

      dataStore.updateUser(rawUser.id, safeUpdates);
      const updatedUser = { ...rawUser, ...safeUpdates };
      setRawUser(updatedUser);
      if (!isSupabaseConfigured) {
        saveLocalSessionUser(updatedUser);
      }

      if (supabase) {
        supabase
          .from('profiles')
          .update({
            name: safeUpdates.name,
            phone: safeUpdates.phone,
            avatar_url: safeUpdates.avatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', rawUser.id)
          .then(({ error }) => {
            if (error) console.warn('Supabase profile update note:', error.message);
          });
      }
    }
  };

  const effectiveUser: UserProfile = rawUser || {
    id: 'usr_guest',
    name: 'Unauthenticated User',
    email: '',
    role: 'sales_executive',
    phone: '',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    active: false,
    department: 'Guest',
    createdAt: new Date().toISOString(),
  };

  const isOwner = effectiveUser.role === 'owner' && isAuthenticated;
  const isSenior = effectiveUser.role === 'senior_sales_executive' && isAuthenticated;
  const isSalesExecutive = effectiveUser.role === 'sales_executive' && isAuthenticated;
  const isStaff = (isSenior || isSalesExecutive) && isAuthenticated;

  const canViewTeamActivity = (isOwner || isSenior) && isAuthenticated;
  const canManageUsers = isOwner && isAuthenticated;
  const canReassignLeads = (isOwner || isSenior) && isAuthenticated;

  return (
    <AuthContext.Provider
      value={{
        currentUser: effectiveUser,
        rawUser,
        session,
        isAuthenticated,
        isLoading,
        isSupabaseConnected: isSupabaseConfigured,
        users,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateCurrentUserProfile,
        isOwner,
        isSenior,
        isSalesExecutive,
        isStaff,
        canViewTeamActivity,
        canManageUsers,
        canReassignLeads,
        effectiveRole: effectiveUser.role,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
