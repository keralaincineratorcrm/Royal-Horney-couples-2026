-- ====================================================================
-- KERALA INCINERATOR SALES CRM & DAILY ACTIVITY MANAGEMENT SYSTEM
-- SUPABASE POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom Enums
CREATE TYPE user_role AS ENUM ('owner', 'senior_sales_executive', 'sales_executive');
CREATE TYPE lead_status AS ENUM (
  'New Lead', 'Contacted', 'Interested', 'Quotation Sent',
  'Follow-up', 'Ordered', 'Delivered', 'Completed',
  'No Need', 'Purchased Another Brand'
);
CREATE TYPE order_chance AS ENUM ('High', 'Medium', 'Low');
CREATE TYPE lead_source AS ENUM ('Website', 'Phone', 'WhatsApp', 'Reference', 'Walk-in', 'Other');
CREATE TYPE contact_type AS ENUM ('Call', 'WhatsApp', 'Visit');
CREATE TYPE follow_up_status AS ENUM ('Pending', 'Completed', 'Overdue', 'Cancelled');
CREATE TYPE visit_outcome AS ENUM (
  'Interested', 'Quotation Required', 'Order Confirmed',
  'Need More Information', 'Not Interested', 'Follow-up Required'
);
CREATE TYPE quotation_status AS ENUM ('Draft', 'Sent', 'Viewed', 'Negotiation', 'Accepted', 'Rejected', 'Expired');
CREATE TYPE payment_status AS ENUM ('Pending', 'Advance', 'Paid', 'Partial');
CREATE TYPE delivery_status AS ENUM ('Pending', 'Processing', 'Delivered', 'Cancelled');

-- 3. Profiles Table (Linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'sales_executive',
  phone TEXT,
  avatar_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  default_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Customers & Leads Table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternative_phone TEXT,
  place TEXT NOT NULL,
  address TEXT,
  care_of TEXT,
  product_interested_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_interested_name TEXT,
  enquiry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  lead_source lead_source NOT NULL DEFAULT 'Phone',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  lead_status lead_status NOT NULL DEFAULT 'New Lead',
  order_chance order_chance NOT NULL DEFAULT 'Medium',
  expected_value NUMERIC(12, 2) DEFAULT 0.00,
  remarks TEXT,
  next_follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Follow-ups Table
CREATE TABLE follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  follow_up_date DATE NOT NULL,
  follow_up_time TIME NOT NULL DEFAULT '10:00:00',
  contact_type contact_type NOT NULL DEFAULT 'Call',
  customer_response TEXT,
  order_chance order_chance NOT NULL DEFAULT 'Medium',
  next_follow_up_date DATE,
  remarks TEXT,
  status follow_up_status NOT NULL DEFAULT 'Pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Customer Visits Table
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  visit_time TIME NOT NULL,
  location TEXT NOT NULL,
  gps_latitude NUMERIC(10, 7),
  gps_longitude NUMERIC(10, 7),
  products_discussed TEXT[],
  visit_remarks TEXT,
  outcome visit_outcome NOT NULL DEFAULT 'Follow-up Required',
  next_follow_up_date DATE,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_out_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Quotations Table
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  discount_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  tax_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  validity_days INT NOT NULL DEFAULT 15,
  quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status quotation_status NOT NULL DEFAULT 'Draft',
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Quotation Items Table
CREATE TABLE quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

-- 10. Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_status payment_status NOT NULL DEFAULT 'Pending',
  delivery_status delivery_status NOT NULL DEFAULT 'Pending',
  delivery_address TEXT,
  delivery_date DATE,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Order Items Table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

-- 12. Payments Table (Financial Ledger)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name TEXT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'UPI',
  reference_number TEXT,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Daily Reports Table
CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  calls_made INT NOT NULL DEFAULT 0,
  customers_contacted INT NOT NULL DEFAULT 0,
  visits_completed INT NOT NULL DEFAULT 0,
  new_leads_created INT NOT NULL DEFAULT 0,
  quotations_sent INT NOT NULL DEFAULT 0,
  orders_received INT NOT NULL DEFAULT 0,
  follow_ups_completed INT NOT NULL DEFAULT 0,
  hot_leads_count INT NOT NULL DEFAULT 0,
  medium_leads_count INT NOT NULL DEFAULT 0,
  low_leads_count INT NOT NULL DEFAULT 0,
  tomorrow_follow_ups_count INT NOT NULL DEFAULT 0,
  remarks TEXT,
  CONSTRAINT unique_user_daily_report UNIQUE(user_id, date)
);

-- 13. Customer Activities & Audit Log
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_name TEXT,
  amount NUMERIC(12, 2),
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. In-App Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- UUID or 'all'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role with safe lowest-privilege default
-- SECURITY DEFINER with locked search_path; reads strictly by auth.uid() with zero caller parameters (prevents RLS recursion & impersonation)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'sales_executive'::user_role);
$$;

-- ====================================================================
-- 1. PROFILES TABLE: HARDENED ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
DROP POLICY IF EXISTS "Users can view all active profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Owner can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON profiles;
DROP POLICY IF EXISTS "Profiles insert policy" ON profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON profiles;
DROP POLICY IF EXISTS "Profiles delete policy" ON profiles;

-- Read: All authenticated users can view profiles (required for CRM lead assignment & team directory)
CREATE POLICY "Profiles select policy" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- Insert: New accounts can self-register ONLY as 'sales_executive' (lowest privilege).
-- Authorized Owners can insert any profile.
CREATE POLICY "Profiles insert policy" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (
    (id = auth.uid() AND role = 'sales_executive'::user_role AND COALESCE(department, 'Field Sales') = 'Field Sales')
    OR (get_current_user_role() = 'owner')
  );

-- Update: Authenticated users can update their own personal info (name, phone, avatar),
-- but CANNOT change their role, department, or active status.
-- Authorized Owners can update any profile including roles.
CREATE POLICY "Profiles update policy" ON public.profiles
  FOR UPDATE TO authenticated USING (
    id = auth.uid() OR get_current_user_role() = 'owner'
  ) WITH CHECK (
    (
      id = auth.uid()
      AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
      AND COALESCE(department, '') = COALESCE((SELECT p.department FROM public.profiles p WHERE p.id = auth.uid()), '')
      AND active = (SELECT p.active FROM public.profiles p WHERE p.id = auth.uid())
    )
    OR (get_current_user_role() = 'owner')
  );

-- Delete: Strictly restricted to authorized Owner accounts
CREATE POLICY "Profiles delete policy" ON public.profiles
  FOR DELETE TO authenticated USING (
    get_current_user_role() = 'owner'
  );

-- ====================================================================
-- DATABASE TRIGGERS: PREVENT ROLE SELF-ESCALATION & UNAUTHORIZED EDITS
-- ====================================================================

-- 1. Trigger to enforce role protection on UPDATE (stops direct REST API/SQL manipulation)
CREATE OR REPLACE FUNCTION public.enforce_profile_role_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_id UUID;
  caller_role user_role;
BEGIN
  caller_id := auth.uid();

  -- Prevent primary key / user ID modification
  IF NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'Profile ID is immutable.';
  END IF;

  -- If executed by an authenticated client, prevent modifying another user's profile unless Owner (or Senior SE toggling active)
  IF caller_id IS NOT NULL AND caller_id <> OLD.id THEN
    SELECT role INTO caller_role FROM public.profiles WHERE id = caller_id;
    IF caller_role IS NULL OR caller_role NOT IN ('owner', 'senior_sales_executive') THEN
      RAISE EXCEPTION 'Access Denied: You cannot modify another user profile.';
    END IF;
    IF caller_role = 'senior_sales_executive' AND (
      NEW.role IS DISTINCT FROM OLD.role OR
      NEW.department IS DISTINCT FROM OLD.department OR
      OLD.role = 'owner'
    ) THEN
      RAISE EXCEPTION 'Access Denied: Senior Sales Executives cannot modify user roles, departments, or Owner accounts.';
    END IF;
  END IF;

  -- Intercept role or department alteration
  IF NEW.role IS DISTINCT FROM OLD.role OR NEW.department IS DISTINCT FROM OLD.department THEN
    -- If executed by an authenticated client (caller_id is present)
    IF caller_id IS NOT NULL THEN
      SELECT role INTO caller_role FROM public.profiles WHERE id = caller_id;
      
      -- Reject if caller is not an existing authorized Owner
      IF caller_role IS NULL OR caller_role != 'owner' THEN
        RAISE EXCEPTION 'Access Denied: Only an authorized Owner can modify user roles or departmental assignments.';
      END IF;

      -- Safety constraint: prevent an Owner from demoting themselves if they are the only active Owner
      IF caller_id = OLD.id AND NEW.role != 'owner' THEN
        IF (SELECT count(*) FROM public.profiles WHERE role = 'owner' AND active = TRUE AND id <> caller_id) < 1 THEN
          RAISE EXCEPTION 'Safety Violation: Cannot demote the last remaining active Owner.';
        END IF;
      END IF;
    END IF;
  END IF;

  -- Intercept account activation/deactivation
  IF NEW.active IS DISTINCT FROM OLD.active THEN
    IF caller_id IS NOT NULL THEN
      SELECT role INTO caller_role FROM public.profiles WHERE id = caller_id;
      IF caller_role IS NULL OR caller_role NOT IN ('owner', 'senior_sales_executive') THEN
        RAISE EXCEPTION 'Access Denied: Only management can modify employee account active status.';
      END IF;

      -- Prevent deactivating the last active Owner
      IF OLD.role = 'owner' AND NEW.active = FALSE THEN
        IF (SELECT count(*) FROM public.profiles WHERE role = 'owner' AND active = TRUE AND id <> OLD.id) < 1 THEN
          RAISE EXCEPTION 'Safety Violation: Cannot deactivate the last remaining active Owner.';
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_role_protection ON public.profiles;
CREATE TRIGGER trg_enforce_profile_role_protection
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_role_protection();

-- 2. Trigger to enforce default role on direct INSERT
CREATE OR REPLACE FUNCTION public.enforce_profile_role_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_id UUID;
  caller_role user_role;
BEGIN
  caller_id := auth.uid();
  
  -- If caller is authenticated
  IF caller_id IS NOT NULL THEN
    SELECT role INTO caller_role FROM public.profiles WHERE id = caller_id;
    -- If caller is not an Owner, force role to lowest privilege 'sales_executive'
    IF caller_role IS NULL OR caller_role != 'owner' THEN
      NEW.role := 'sales_executive'::user_role;
      NEW.department := 'Field Sales';
    END IF;
  ELSE
    -- Unauthenticated or signup trigger insert fallback: always lowest privilege
    NEW.role := 'sales_executive'::user_role;
    NEW.department := 'Field Sales';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_role_on_insert ON public.profiles;
CREATE TRIGGER trg_enforce_profile_role_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_role_on_insert();

-- 3. Trigger to automatically create profile on Supabase auth.users signup
-- SECURITY HARDENING: Client-supplied roles in raw_user_meta_data (e.g., owner, admin, management, senior_sales_executive)
-- are strictly ignored! Every public signup is unconditionally assigned 'sales_executive' (lowest privilege).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    phone,
    department,
    active
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'sales_executive'::user_role,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'Field Sales',
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    updated_at = NOW();
  -- NOTE: role and department are NEVER updated on conflict to prevent metadata tampering
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- SECURE DATABASE RPC: ASSIGN USER ROLE
-- Only callable by an authenticated Owner to promote/reassign roles
-- ====================================================================
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id UUID,
  new_role user_role
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_id UUID;
  caller_role user_role;
  target_record RECORD;
BEGIN
  -- 1. Verify caller is authenticated
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- 2. Verify target_user_id is provided
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user ID is required.';
  END IF;

  -- 3. Verify caller is an authorized Owner in public.profiles
  SELECT role INTO caller_role FROM public.profiles WHERE id = caller_id AND active = TRUE;
  IF caller_role IS NULL OR caller_role != 'owner' THEN
    RAISE EXCEPTION 'Access Denied: Only an authorized Owner can assign user roles.';
  END IF;

  -- 4. Validate target role enum
  IF new_role IS NULL OR new_role NOT IN ('owner', 'senior_sales_executive', 'sales_executive') THEN
    RAISE EXCEPTION 'Invalid role specified.';
  END IF;

  -- 5. Verify target user exists
  SELECT id, name, role INTO target_record FROM public.profiles WHERE id = target_user_id;
  IF target_record.id IS NULL THEN
    RAISE EXCEPTION 'Target user not found.';
  END IF;

  -- 6. Safety check: Prevent removing/demoting the final active Owner
  IF target_record.role = 'owner' AND new_role != 'owner' THEN
    IF (SELECT count(*) FROM public.profiles WHERE role = 'owner' AND active = TRUE AND id <> target_user_id) < 1 THEN
      RAISE EXCEPTION 'Safety Violation: Cannot demote the last remaining active Owner.';
    END IF;
  END IF;

  -- 7. Perform the role update
  UPDATE public.profiles
  SET
    role = new_role,
    department = CASE
      WHEN new_role = 'owner' THEN 'Management'
      WHEN new_role = 'senior_sales_executive' THEN 'Sales Leadership'
      ELSE 'Field Sales'
    END,
    updated_at = NOW()
  WHERE id = target_user_id;

  -- 8. Record immutable audit log
  INSERT INTO public.audit_logs (
    user_id,
    user_name,
    user_role,
    action,
    module,
    record_id,
    record_number,
    description,
    previous_value,
    new_value
  ) VALUES (
    caller_id::text,
    COALESCE((SELECT name FROM public.profiles WHERE id = caller_id), 'Owner'),
    'owner',
    'User Role Modified',
    'Users',
    target_user_id::text,
    target_record.name,
    'Role changed for ' || target_record.name || ' from ' || target_record.role || ' to ' || new_role,
    target_record.role::text,
    new_role::text
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'old_role', target_record.role,
    'new_role', new_role,
    'updated_at', NOW()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.assign_user_role(UUID, user_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, user_role) TO authenticated;

-- 2. Products: Read active catalog; write restricted to Owner & Senior SE; delete Owner only
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Owner/Senior can edit products" ON products;
DROP POLICY IF EXISTS "Products view policy" ON products;
DROP POLICY IF EXISTS "Products insert policy" ON products;
DROP POLICY IF EXISTS "Products update policy" ON products;
DROP POLICY IF EXISTS "Products delete policy" ON products;

CREATE POLICY "Products view policy" ON products
  FOR SELECT TO authenticated USING (active = true OR get_current_user_role() IN ('owner', 'senior_sales_executive'));

CREATE POLICY "Products insert policy" ON products
  FOR INSERT TO authenticated WITH CHECK (get_current_user_role() IN ('owner', 'senior_sales_executive'));

CREATE POLICY "Products update policy" ON products
  FOR UPDATE TO authenticated USING (get_current_user_role() IN ('owner', 'senior_sales_executive'))
  WITH CHECK (get_current_user_role() IN ('owner', 'senior_sales_executive'));

CREATE POLICY "Products delete policy" ON products
  FOR DELETE TO authenticated USING (get_current_user_role() = 'owner');

-- 3. Customers & Leads:
-- Owner & Senior SE: Full view and manage across organization (including reassigning assigned_to)
-- Sales Exec: Only view & edit their own assigned or created leads; CANNOT reassign assigned_to
CREATE OR REPLACE FUNCTION public.enforce_customer_assignment_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_id UUID;
  caller_role user_role;
BEGIN
  caller_id := auth.uid();

  -- Enforce at database level that only Owner or Senior Sales Executive may change assigned_to or created_by
  IF caller_id IS NOT NULL THEN
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
      SELECT role INTO caller_role FROM public.profiles WHERE id = caller_id AND active = TRUE;
      IF caller_role IS NULL OR caller_role NOT IN ('owner', 'senior_sales_executive') THEN
        RAISE EXCEPTION 'Access Denied: Sales Executives cannot reassign customers to another user.';
      END IF;
    END IF;

    IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
      SELECT role INTO caller_role FROM public.profiles WHERE id = caller_id AND active = TRUE;
      IF caller_role IS NULL OR caller_role NOT IN ('owner', 'senior_sales_executive') THEN
        RAISE EXCEPTION 'Access Denied: Sales Executives cannot modify customer creator ownership.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_customer_assignment_protection ON public.customers;
CREATE TRIGGER trg_enforce_customer_assignment_protection
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.enforce_customer_assignment_protection();

DROP POLICY IF EXISTS "Customers view policy" ON customers;
DROP POLICY IF EXISTS "Customers insert policy" ON customers;
DROP POLICY IF EXISTS "Customers update policy" ON customers;
DROP POLICY IF EXISTS "Customers delete policy" ON customers;

CREATE POLICY "Customers view policy" ON customers
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  );

CREATE POLICY "Customers insert policy" ON customers
  FOR INSERT TO authenticated WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  );

CREATE POLICY "Customers update policy" ON customers
  FOR UPDATE TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  ) WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Customers delete policy" ON customers
  FOR DELETE TO authenticated USING (
    get_current_user_role() = 'owner'
  );

-- 4. Follow-ups:
-- Owner & Senior SE: Full team visibility
-- Sales Exec: Access assigned follow-ups only; delete restricted to management
DROP POLICY IF EXISTS "Follow-ups view policy" ON follow_ups;
DROP POLICY IF EXISTS "Follow-ups manage policy" ON follow_ups;
DROP POLICY IF EXISTS "Follow-ups insert policy" ON follow_ups;
DROP POLICY IF EXISTS "Follow-ups update policy" ON follow_ups;
DROP POLICY IF EXISTS "Follow-ups delete policy" ON follow_ups;

CREATE POLICY "Follow-ups view policy" ON follow_ups
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Follow-ups insert policy" ON follow_ups
  FOR INSERT TO authenticated WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Follow-ups update policy" ON follow_ups
  FOR UPDATE TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  ) WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Follow-ups delete policy" ON follow_ups
  FOR DELETE TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
  );

-- 5. Customer Visits:
DROP POLICY IF EXISTS "Visits access policy" ON visits;
DROP POLICY IF EXISTS "Visits view policy" ON visits;
DROP POLICY IF EXISTS "Visits insert policy" ON visits;
DROP POLICY IF EXISTS "Visits update policy" ON visits;
DROP POLICY IF EXISTS "Visits delete policy" ON visits;

CREATE POLICY "Visits view policy" ON visits
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Visits insert policy" ON visits
  FOR INSERT TO authenticated WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Visits update policy" ON visits
  FOR UPDATE TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  ) WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Visits delete policy" ON visits
  FOR DELETE TO authenticated USING (
    get_current_user_role() = 'owner'
  );

-- 6. Quotations & Items:
DROP POLICY IF EXISTS "Quotations access policy" ON quotations;
DROP POLICY IF EXISTS "Quotations view policy" ON quotations;
DROP POLICY IF EXISTS "Quotations insert policy" ON quotations;
DROP POLICY IF EXISTS "Quotations update policy" ON quotations;
DROP POLICY IF EXISTS "Quotations delete policy" ON quotations;

CREATE POLICY "Quotations view policy" ON quotations
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Quotations insert policy" ON quotations
  FOR INSERT TO authenticated WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Quotations update policy" ON quotations
  FOR UPDATE TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  ) WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Quotations delete policy" ON quotations
  FOR DELETE TO authenticated USING (
    get_current_user_role() = 'owner'
  );

DROP POLICY IF EXISTS "Quotation items access policy" ON quotation_items;
DROP POLICY IF EXISTS "Quotation items view policy" ON quotation_items;
DROP POLICY IF EXISTS "Quotation items insert policy" ON quotation_items;
DROP POLICY IF EXISTS "Quotation items update policy" ON quotation_items;
DROP POLICY IF EXISTS "Quotation items delete policy" ON quotation_items;

CREATE POLICY "Quotation items view policy" ON quotation_items
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR EXISTS (
      SELECT 1 FROM public.quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Quotation items insert policy" ON quotation_items
  FOR INSERT TO authenticated WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR EXISTS (
      SELECT 1 FROM public.quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Quotation items update policy" ON quotation_items
  FOR UPDATE TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR EXISTS (
      SELECT 1 FROM public.quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.assigned_to = auth.uid()
    )
  ) WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR EXISTS (
      SELECT 1 FROM public.quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Quotation items delete policy" ON quotation_items
  FOR DELETE TO authenticated USING (
    get_current_user_role() = 'owner'
  );

-- 7. Orders & Items:
DROP POLICY IF EXISTS "Orders view policy" ON orders;
DROP POLICY IF EXISTS "Orders insert policy" ON orders;
DROP POLICY IF EXISTS "Orders update policy" ON orders;
DROP POLICY IF EXISTS "Orders delete policy" ON orders;

CREATE POLICY "Orders view policy" ON orders
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Orders insert policy" ON orders
  FOR INSERT TO authenticated WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Orders update policy" ON orders
  FOR UPDATE TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  ) WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Orders delete policy" ON orders
  FOR DELETE TO authenticated USING (
    get_current_user_role() = 'owner'
  );

DROP POLICY IF EXISTS "Order items access policy" ON order_items;
DROP POLICY IF EXISTS "Order items view policy" ON order_items;
DROP POLICY IF EXISTS "Order items insert policy" ON order_items;
DROP POLICY IF EXISTS "Order items update policy" ON order_items;
DROP POLICY IF EXISTS "Order items delete policy" ON order_items;

CREATE POLICY "Order items view policy" ON order_items
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR EXISTS (
      SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Order items insert policy" ON order_items
  FOR INSERT TO authenticated WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR EXISTS (
      SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Order items update policy" ON order_items
  FOR UPDATE TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR EXISTS (
      SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.assigned_to = auth.uid()
    )
  ) WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR EXISTS (
      SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Order items delete policy" ON order_items
  FOR DELETE TO authenticated USING (
    get_current_user_role() = 'owner'
  );

-- 8. Payments (Financial Ledger Protection):
DROP POLICY IF EXISTS "Payments view policy" ON payments;
DROP POLICY IF EXISTS "Payments insert policy" ON payments;
DROP POLICY IF EXISTS "Payments owner update policy" ON payments;
DROP POLICY IF EXISTS "Payments owner delete policy" ON payments;

CREATE POLICY "Payments view policy" ON payments
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR recorded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND orders.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Payments insert policy" ON payments
  FOR INSERT TO authenticated WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR (
      recorded_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND orders.assigned_to = auth.uid()
      )
    )
  );

-- Financial ledger immutability: Sales Executives & Senior Sales Executives CANNOT modify or delete recorded payments; Owner only
CREATE POLICY "Payments owner update policy" ON payments
  FOR UPDATE TO authenticated USING (get_current_user_role() = 'owner')
  WITH CHECK (get_current_user_role() = 'owner');

CREATE POLICY "Payments owner delete policy" ON payments
  FOR DELETE TO authenticated USING (get_current_user_role() = 'owner');

-- 9. Daily Reports:
DROP POLICY IF EXISTS "Daily reports view policy" ON daily_reports;
DROP POLICY IF EXISTS "Daily reports insert policy" ON daily_reports;
DROP POLICY IF EXISTS "Daily reports update policy" ON daily_reports;
DROP POLICY IF EXISTS "Daily reports delete policy" ON daily_reports;

CREATE POLICY "Daily reports view policy" ON daily_reports
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR user_id = auth.uid()
  );

CREATE POLICY "Daily reports insert policy" ON daily_reports
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() OR get_current_user_role() = 'owner'
  );

CREATE POLICY "Daily reports update policy" ON daily_reports
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid() OR get_current_user_role() = 'owner'
  ) WITH CHECK (
    user_id = auth.uid() OR get_current_user_role() = 'owner'
  );

CREATE POLICY "Daily reports delete policy" ON daily_reports
  FOR DELETE TO authenticated USING (
    get_current_user_role() = 'owner'
  );

-- 9b. Activities & Notifications:
DROP POLICY IF EXISTS "Activities read policy" ON activities;
DROP POLICY IF EXISTS "Activities insert policy" ON activities;
DROP POLICY IF EXISTS "Activities delete policy" ON activities;

-- Sales Executives can only read activities they performed or belonging to their assigned/created customers
CREATE POLICY "Activities read policy" ON activities
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR performed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = activities.customer_id
        AND (c.assigned_to = auth.uid() OR c.created_by = auth.uid())
    )
  );

CREATE POLICY "Activities insert policy" ON activities
  FOR INSERT TO authenticated WITH CHECK (
    performed_by = auth.uid()
    OR get_current_user_role() IN ('owner', 'senior_sales_executive')
  );

CREATE POLICY "Activities delete policy" ON activities
  FOR DELETE TO authenticated USING (
    get_current_user_role() = 'owner'
  );

DROP POLICY IF EXISTS "Notifications read policy" ON notifications;
DROP POLICY IF EXISTS "Notifications insert policy" ON notifications;
DROP POLICY IF EXISTS "Notifications update policy" ON notifications;
DROP POLICY IF EXISTS "Notifications delete policy" ON notifications;

CREATE POLICY "Notifications read policy" ON notifications
  FOR SELECT TO authenticated USING (
    user_id = 'all' OR user_id = auth.uid()::text OR get_current_user_role() = 'owner'
  );

CREATE POLICY "Notifications insert policy" ON notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Notifications update policy" ON notifications
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid()::text OR get_current_user_role() = 'owner'
  ) WITH CHECK (
    user_id = auth.uid()::text OR get_current_user_role() = 'owner'
  );

CREATE POLICY "Notifications delete policy" ON notifications
  FOR DELETE TO authenticated USING (
    get_current_user_role() = 'owner'
  );

-- ==========================================
-- 10. COMPANY SETTINGS & SYSTEM CONFIGURATION
-- ==========================================

CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'Kerala Incinerator',
  tagline TEXT DEFAULT 'Clean Environment, Better Tomorrow.',
  category TEXT DEFAULT 'Commercial, Institutional & Domestic Waste Incinerators',
  logo_url TEXT DEFAULT '',
  gstin TEXT DEFAULT '32AAACK1234F1Z8 (Kerala State)',
  phone TEXT DEFAULT '+91 94471 20001 / +91 98460 34567',
  whatsapp TEXT DEFAULT '+91 94471 20001',
  email TEXT DEFAULT 'sales@keralaincinerator.com',
  website TEXT DEFAULT 'https://keralaincinerator.com',
  office_address TEXT DEFAULT 'Industrial Estate, South Kalamassery, Kochi, Kerala - 682033',
  manufacturing_hub TEXT DEFAULT 'Aimury, Perumbavoor, Ernakulam, Kerala - 683544',
  district TEXT DEFAULT 'Ernakulam',
  state TEXT DEFAULT 'Kerala',
  pin_code TEXT DEFAULT '683544',
  default_terms JSONB DEFAULT '[]'::jsonb,
  authorized_signatory_label TEXT DEFAULT 'Authorized Signatory / Plant Commercial Head',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS lead_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- ==========================================
-- 11. AUDIT LOGS (APPEND-ONLY IMMUTABLE LEDGER)
-- ==========================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_id TEXT,
  record_number TEXT,
  description TEXT NOT NULL,
  details JSONB,
  previous_value TEXT,
  new_value TEXT
);

-- RLS Enablement
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Company & System Settings: Viewable by authenticated users; Insert/Update/Delete ONLY by Owner
DROP POLICY IF EXISTS "Company settings read policy" ON company_settings;
DROP POLICY IF EXISTS "Company settings update policy" ON company_settings;
DROP POLICY IF EXISTS "Company settings insert policy" ON company_settings;
DROP POLICY IF EXISTS "Company settings delete policy" ON company_settings;

CREATE POLICY "Company settings read policy" ON company_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Company settings insert policy" ON company_settings
  FOR INSERT TO authenticated WITH CHECK (get_current_user_role() = 'owner');

CREATE POLICY "Company settings update policy" ON company_settings
  FOR UPDATE TO authenticated USING (get_current_user_role() = 'owner')
  WITH CHECK (get_current_user_role() = 'owner');

CREATE POLICY "Company settings delete policy" ON company_settings
  FOR DELETE TO authenticated USING (get_current_user_role() = 'owner');

DROP POLICY IF EXISTS "System settings read policy" ON system_settings;
DROP POLICY IF EXISTS "System settings modify policy" ON system_settings;
DROP POLICY IF EXISTS "System settings insert policy" ON system_settings;
DROP POLICY IF EXISTS "System settings update policy" ON system_settings;
DROP POLICY IF EXISTS "System settings delete policy" ON system_settings;

CREATE POLICY "System settings read policy" ON system_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System settings insert policy" ON system_settings
  FOR INSERT TO authenticated WITH CHECK (get_current_user_role() = 'owner');

CREATE POLICY "System settings update policy" ON system_settings
  FOR UPDATE TO authenticated USING (get_current_user_role() = 'owner')
  WITH CHECK (get_current_user_role() = 'owner');

CREATE POLICY "System settings delete policy" ON system_settings
  FOR DELETE TO authenticated USING (get_current_user_role() = 'owner');

-- Lead Sources: Viewable by all; Insert/Update by Owner & Senior Sales Executive; Delete by Owner only
DROP POLICY IF EXISTS "Lead sources read policy" ON lead_sources;
DROP POLICY IF EXISTS "Lead sources manage policy" ON lead_sources;
DROP POLICY IF EXISTS "Lead sources insert policy" ON lead_sources;
DROP POLICY IF EXISTS "Lead sources update policy" ON lead_sources;
DROP POLICY IF EXISTS "Lead sources delete policy" ON lead_sources;

CREATE POLICY "Lead sources read policy" ON lead_sources
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Lead sources insert policy" ON lead_sources
  FOR INSERT TO authenticated WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
  );

CREATE POLICY "Lead sources update policy" ON lead_sources
  FOR UPDATE TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
  ) WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
  );

CREATE POLICY "Lead sources delete policy" ON lead_sources
  FOR DELETE TO authenticated USING (
    get_current_user_role() = 'owner'
  );

-- Audit Logs: Viewable by Owner & Senior Sales Executive; Append-only for all authenticated; UPDATE & DELETE STRICTLY PROHIBITED
DROP POLICY IF EXISTS "Audit logs read policy" ON audit_logs;
DROP POLICY IF EXISTS "Audit logs insert policy" ON audit_logs;

CREATE POLICY "Audit logs read policy" ON audit_logs
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
  );

CREATE POLICY "Audit logs insert policy" ON audit_logs
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()::text
    AND user_role = get_current_user_role()::text
    AND user_name = COALESCE((SELECT p.name FROM public.profiles p WHERE p.id = auth.uid()), user_name)
  );

-- Trigger to enforce append-only immutability on audit_logs even against privileged callers
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'Security Violation: audit_logs is an append-only immutable ledger and cannot be updated or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_modification ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_log_modification
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();


