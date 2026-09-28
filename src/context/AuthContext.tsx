import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import { dataStore, supabase, isSupabaseConfigured } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

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
  // Map 'staff', 'sales_executive', or any other role to standard staff role
  return 'sales_executive';
}

export function formatSupabaseAuthError(err: any): string {
  if (!isSupabaseConfigured || !supabase) {
    return 'Authentication service is not configured correctly. Please contact the administrator.';
  }

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

  // Sync all profiles from public.profiles into DataStore so team members stay in sync
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

  // Helper to map Supabase auth user into CRM profile from public.profiles
  const syncUserFromSupabase = async (sbUser: User): Promise<UserProfile> => {
    if (supabase) {
      try {
        // 1. Check if profile exists in Supabase public.profiles by user id
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

        // 2. Check if any owner exists in public.profiles yet (for first-account bootstrap)
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

        // Re-fetch authoritative row from public.profiles after upsert
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

    // Fallback Profile if public.profiles table is unreachable
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

  // Initial Auth Listener & Session Restoration (Prevents logout on page refresh)
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

    // Official Supabase auth state change listener
    let subscription: { unsubscribe: () => void } | null = null;
    const sbClient = supabase;
    if (sbClient) {
      const authListener = sbClient.auth.onAuthStateChange(async (event, newSession) => {
        if (!isMounted) return;

        if (event === 'SIGNED_OUT' || !newSession) {
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

    // DataStore listener for reactive UI updates (never clobbers active Supabase session)
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

  // Official Supabase Email + Password Sign In
  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        error: 'Authentication service is not configured correctly. Please contact the administrator.',
      };
    }

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
  };

  // Official Supabase Sign Up & Profile Creation
  const signUp = async (data: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    phone?: string;
  }): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        error: 'Authentication service is not configured correctly. Please contact the administrator.',
      };
    }

    try {
      // Check if any owner exists yet in public.profiles so the very first account can bootstrap as Owner
      let initialRole: UserRole = 'sales_executive';
      try {
        const { count: ownerCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'owner');
        if (ownerCount === 0 && data.role === 'owner') {
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
  };

  // Official Supabase Sign Out
  const signOut = async (): Promise<void> => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase sign out note:', e);
      }
    }
    setSession(null);
    setRawUser(null);
    dataStore.clearCurrentUser();
    setIsAuthenticated(false);
    window.history.replaceState({}, '', '/login');
  };

  // Official Supabase Reset Password
  const resetPassword = async (email: string): Promise<{ error?: string; success?: boolean }> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        error: 'Authentication service is not configured correctly. Please contact the administrator.',
      };
    }

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
  };

  const updateCurrentUserProfile = (updates: Partial<UserProfile>) => {
    if (rawUser) {
      const safeUpdates: Partial<UserProfile> = { ...updates };
      delete (safeUpdates as any).role;
      delete (safeUpdates as any).department;
      delete (safeUpdates as any).active;

      dataStore.updateUser(rawUser.id, safeUpdates);
      setRawUser((prev) => (prev ? { ...prev, ...safeUpdates } : null));

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
