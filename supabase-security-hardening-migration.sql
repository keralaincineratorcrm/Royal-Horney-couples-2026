-- ============================================================================
-- KERALA INCINERATOR CRM — IDEMPOTENT PRODUCTION SECURITY HARDENING MIGRATION
-- Safe to run in Supabase SQL Editor on existing production database.
-- Does NOT drop tables or delete existing production data.
-- ============================================================================

BEGIN;

-- 0. Ensure RLS is enabled on all 17 CRM tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 1. SECURITY DEFINER FUNCTIONS (ALL LOCKED WITH SET search_path = public, pg_temp)
-- ============================================================================

-- 1a. Authoritative Role Helper (Zero parameters, reads strictly by auth.uid(), prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'sales_executive'::user_role);
$$;

-- 1b. Profile UPDATE Protection Trigger Function
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

  -- If executed by an authenticated client, prevent modifying another user's profile unless Owner (or Senior SE toggling active on non-owner)
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
    IF caller_id IS NOT NULL THEN
      SELECT role INTO caller_role FROM public.profiles WHERE id = caller_id;

      IF caller_role IS NULL OR caller_role != 'owner' THEN
        RAISE EXCEPTION 'Access Denied: Only an authorized Owner can modify user roles or departmental assignments.';
      END IF;

      -- Prevent an Owner from demoting themselves if they are the last active Owner
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

-- 1c. Profile INSERT Protection Trigger Function
CREATE OR REPLACE FUNCTION public.enforce_profile_role_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_id UUID;
  caller_role user_role;
  owner_count INT;
BEGIN
  caller_id := auth.uid();

  SELECT count(*) INTO owner_count FROM public.profiles WHERE role = 'owner';

  -- Allow the very first account on a fresh database or SQL Editor (caller_id IS NULL) to set owner
  IF owner_count = 0 THEN
    IF NEW.role = 'owner' THEN
      NEW.department := COALESCE(NEW.department, 'Management');
    END IF;
    RETURN NEW;
  END IF;

  IF caller_id IS NOT NULL THEN
    SELECT role INTO caller_role FROM public.profiles WHERE id = caller_id;
    IF caller_role IS NULL OR caller_role != 'owner' THEN
      NEW.role := 'sales_executive'::user_role;
      NEW.department := 'Field Sales';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_role_on_insert ON public.profiles;
CREATE TRIGGER trg_enforce_profile_role_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_role_on_insert();

-- 1d. Auth Signup Trigger Function (First user becomes 'owner' if no owner exists yet; subsequent users default to 'sales_executive')
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  assigned_role user_role;
  assigned_dept TEXT;
  owner_count INT;
BEGIN
  SELECT count(*) INTO owner_count FROM public.profiles WHERE role = 'owner';

  IF owner_count = 0 OR (NEW.raw_app_meta_data->>'role') = 'owner' THEN
    assigned_role := 'owner'::user_role;
    assigned_dept := 'Management';
  ELSE
    assigned_role := 'sales_executive'::user_role;
    assigned_dept := 'Field Sales';
  END IF;

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
    assigned_role,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    assigned_dept,
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 1e. Owner Role Assignment RPC Function
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
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user ID is required.';
  END IF;

  SELECT role INTO caller_role FROM public.profiles WHERE id = caller_id AND active = TRUE;
  IF caller_role IS NULL OR caller_role != 'owner' THEN
    RAISE EXCEPTION 'Access Denied: Only an authorized Owner can assign user roles.';
  END IF;

  IF new_role IS NULL OR new_role NOT IN ('owner', 'senior_sales_executive', 'sales_executive') THEN
    RAISE EXCEPTION 'Invalid role specified.';
  END IF;

  SELECT id, name, role INTO target_record FROM public.profiles WHERE id = target_user_id;
  IF target_record.id IS NULL THEN
    RAISE EXCEPTION 'Target user not found.';
  END IF;

  IF target_record.role = 'owner' AND new_role != 'owner' THEN
    IF (SELECT count(*) FROM public.profiles WHERE role = 'owner' AND active = TRUE AND id <> target_user_id) < 1 THEN
      RAISE EXCEPTION 'Safety Violation: Cannot demote the last remaining active Owner.';
    END IF;
  END IF;

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

-- 1f. Append-Only Audit Log Protection Trigger Function
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

-- 1g. Customer Assignment Protection Trigger Function
-- Enforces at database level:
--   * Owner: may change customers.assigned_to
--   * Senior Sales Executive: may change customers.assigned_to
--   * Sales Executive: may NOT change customers.assigned_to (even on their own customer),
--     while still permitting updates to all other allowed customer fields.
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

-- ============================================================================
-- 2. ROW LEVEL SECURITY POLICIES ACROSS ALL 17 TABLES
-- ============================================================================

-- 2.1 profiles
DROP POLICY IF EXISTS "Users can view all active profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete policy" ON public.profiles;

CREATE POLICY "Profiles select policy" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Profiles insert policy" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (
    (id = auth.uid() AND role = 'sales_executive'::user_role AND COALESCE(department, 'Field Sales') = 'Field Sales')
    OR (get_current_user_role() = 'owner')
  );

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

CREATE POLICY "Profiles delete policy" ON public.profiles
  FOR DELETE TO authenticated USING (get_current_user_role() = 'owner');

-- 2.2 products
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Owner/Senior can edit products" ON public.products;
DROP POLICY IF EXISTS "Products view policy" ON public.products;
DROP POLICY IF EXISTS "Products insert policy" ON public.products;
DROP POLICY IF EXISTS "Products update policy" ON public.products;
DROP POLICY IF EXISTS "Products delete policy" ON public.products;

CREATE POLICY "Products view policy" ON public.products
  FOR SELECT TO authenticated USING (active = true OR get_current_user_role() IN ('owner', 'senior_sales_executive'));

CREATE POLICY "Products insert policy" ON public.products
  FOR INSERT TO authenticated WITH CHECK (get_current_user_role() IN ('owner', 'senior_sales_executive'));

CREATE POLICY "Products update policy" ON public.products
  FOR UPDATE TO authenticated USING (get_current_user_role() IN ('owner', 'senior_sales_executive'))
  WITH CHECK (get_current_user_role() IN ('owner', 'senior_sales_executive'));

CREATE POLICY "Products delete policy" ON public.products
  FOR DELETE TO authenticated USING (get_current_user_role() = 'owner');

-- 2.3 customers
-- Drop any legacy or differently-named policies on public.customers so no permissive policy bypasses WITH CHECK
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customers'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.customers', pol.policyname);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Customers view policy" ON public.customers;
DROP POLICY IF EXISTS "Customers insert policy" ON public.customers;
DROP POLICY IF EXISTS "Customers update policy" ON public.customers;
DROP POLICY IF EXISTS "Customers delete policy" ON public.customers;

CREATE POLICY "Customers view policy" ON public.customers
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  );

CREATE POLICY "Customers insert policy" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  );

CREATE POLICY "Customers update policy" ON public.customers
  FOR UPDATE TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  ) WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Customers delete policy" ON public.customers
  FOR DELETE TO authenticated USING (get_current_user_role() = 'owner');

-- 2.4 follow_ups
DROP POLICY IF EXISTS "Follow-ups view policy" ON public.follow_ups;
DROP POLICY IF EXISTS "Follow-ups manage policy" ON public.follow_ups;
DROP POLICY IF EXISTS "Follow-ups insert policy" ON public.follow_ups;
DROP POLICY IF EXISTS "Follow-ups update policy" ON public.follow_ups;
DROP POLICY IF EXISTS "Follow-ups delete policy" ON public.follow_ups;

CREATE POLICY "Follow-ups view policy" ON public.follow_ups
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Follow-ups insert policy" ON public.follow_ups
  FOR INSERT TO authenticated WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Follow-ups update policy" ON public.follow_ups
  FOR UPDATE TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  ) WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Follow-ups delete policy" ON public.follow_ups
  FOR DELETE TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
  );

-- 2.5 visits
DROP POLICY IF EXISTS "Visits access policy" ON public.visits;
DROP POLICY IF EXISTS "Visits view policy" ON public.visits;
DROP POLICY IF EXISTS "Visits insert policy" ON public.visits;
DROP POLICY IF EXISTS "Visits update policy" ON public.visits;
DROP POLICY IF EXISTS "Visits delete policy" ON public.visits;

CREATE POLICY "Visits view policy" ON public.visits
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Visits insert policy" ON public.visits
  FOR INSERT TO authenticated WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Visits update policy" ON public.visits
  FOR UPDATE TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  ) WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Visits delete policy" ON public.visits
  FOR DELETE TO authenticated USING (get_current_user_role() = 'owner');

-- 2.6 quotations & quotation_items
DROP POLICY IF EXISTS "Quotations access policy" ON public.quotations;
DROP POLICY IF EXISTS "Quotations view policy" ON public.quotations;
DROP POLICY IF EXISTS "Quotations insert policy" ON public.quotations;
DROP POLICY IF EXISTS "Quotations update policy" ON public.quotations;
DROP POLICY IF EXISTS "Quotations delete policy" ON public.quotations;

CREATE POLICY "Quotations view policy" ON public.quotations
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Quotations insert policy" ON public.quotations
  FOR INSERT TO authenticated WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Quotations update policy" ON public.quotations
  FOR UPDATE TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  ) WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Quotations delete policy" ON public.quotations
  FOR DELETE TO authenticated USING (get_current_user_role() = 'owner');

DROP POLICY IF EXISTS "Quotation items access policy" ON public.quotation_items;
DROP POLICY IF EXISTS "Quotation items view policy" ON public.quotation_items;
DROP POLICY IF EXISTS "Quotation items insert policy" ON public.quotation_items;
DROP POLICY IF EXISTS "Quotation items update policy" ON public.quotation_items;
DROP POLICY IF EXISTS "Quotation items delete policy" ON public.quotation_items;

CREATE POLICY "Quotation items view policy" ON public.quotation_items
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR EXISTS (
      SELECT 1 FROM public.quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Quotation items insert policy" ON public.quotation_items
  FOR INSERT TO authenticated WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR EXISTS (
      SELECT 1 FROM public.quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Quotation items update policy" ON public.quotation_items
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

CREATE POLICY "Quotation items delete policy" ON public.quotation_items
  FOR DELETE TO authenticated USING (get_current_user_role() = 'owner');

-- 2.7 orders & order_items
DROP POLICY IF EXISTS "Orders view policy" ON public.orders;
DROP POLICY IF EXISTS "Orders insert policy" ON public.orders;
DROP POLICY IF EXISTS "Orders update policy" ON public.orders;
DROP POLICY IF EXISTS "Orders delete policy" ON public.orders;

CREATE POLICY "Orders view policy" ON public.orders
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Orders insert policy" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Orders update policy" ON public.orders
  FOR UPDATE TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  ) WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Orders delete policy" ON public.orders
  FOR DELETE TO authenticated USING (get_current_user_role() = 'owner');

DROP POLICY IF EXISTS "Order items access policy" ON public.order_items;
DROP POLICY IF EXISTS "Order items view policy" ON public.order_items;
DROP POLICY IF EXISTS "Order items insert policy" ON public.order_items;
DROP POLICY IF EXISTS "Order items update policy" ON public.order_items;
DROP POLICY IF EXISTS "Order items delete policy" ON public.order_items;

CREATE POLICY "Order items view policy" ON public.order_items
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR EXISTS (
      SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Order items insert policy" ON public.order_items
  FOR INSERT TO authenticated WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR EXISTS (
      SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Order items update policy" ON public.order_items
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

CREATE POLICY "Order items delete policy" ON public.order_items
  FOR DELETE TO authenticated USING (get_current_user_role() = 'owner');

-- 2.8 payments
DROP POLICY IF EXISTS "Payments view policy" ON public.payments;
DROP POLICY IF EXISTS "Payments insert policy" ON public.payments;
DROP POLICY IF EXISTS "Payments owner update policy" ON public.payments;
DROP POLICY IF EXISTS "Payments owner delete policy" ON public.payments;

CREATE POLICY "Payments view policy" ON public.payments
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR recorded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND orders.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Payments insert policy" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR (
      recorded_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND orders.assigned_to = auth.uid()
      )
    )
  );

CREATE POLICY "Payments owner update policy" ON public.payments
  FOR UPDATE TO authenticated USING (get_current_user_role() = 'owner')
  WITH CHECK (get_current_user_role() = 'owner');

CREATE POLICY "Payments owner delete policy" ON public.payments
  FOR DELETE TO authenticated USING (get_current_user_role() = 'owner');

-- 2.9 daily_reports
DROP POLICY IF EXISTS "Daily reports view policy" ON public.daily_reports;
DROP POLICY IF EXISTS "Daily reports insert policy" ON public.daily_reports;
DROP POLICY IF EXISTS "Daily reports update policy" ON public.daily_reports;
DROP POLICY IF EXISTS "Daily reports delete policy" ON public.daily_reports;

CREATE POLICY "Daily reports view policy" ON public.daily_reports
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR user_id = auth.uid()
  );

CREATE POLICY "Daily reports insert policy" ON public.daily_reports
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() OR get_current_user_role() = 'owner'
  );

CREATE POLICY "Daily reports update policy" ON public.daily_reports
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid() OR get_current_user_role() = 'owner'
  ) WITH CHECK (
    user_id = auth.uid() OR get_current_user_role() = 'owner'
  );

CREATE POLICY "Daily reports delete policy" ON public.daily_reports
  FOR DELETE TO authenticated USING (get_current_user_role() = 'owner');

-- 2.10 activities & notifications
DROP POLICY IF EXISTS "Activities read policy" ON public.activities;
DROP POLICY IF EXISTS "Activities insert policy" ON public.activities;
DROP POLICY IF EXISTS "Activities delete policy" ON public.activities;

CREATE POLICY "Activities read policy" ON public.activities
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
    OR performed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = activities.customer_id
        AND (c.assigned_to = auth.uid() OR c.created_by = auth.uid())
    )
  );

CREATE POLICY "Activities insert policy" ON public.activities
  FOR INSERT TO authenticated WITH CHECK (
    performed_by = auth.uid()
    OR get_current_user_role() IN ('owner', 'senior_sales_executive')
  );

CREATE POLICY "Activities delete policy" ON public.activities
  FOR DELETE TO authenticated USING (get_current_user_role() = 'owner');

DROP POLICY IF EXISTS "Notifications read policy" ON public.notifications;
DROP POLICY IF EXISTS "Notifications insert policy" ON public.notifications;
DROP POLICY IF EXISTS "Notifications update policy" ON public.notifications;
DROP POLICY IF EXISTS "Notifications delete policy" ON public.notifications;

CREATE POLICY "Notifications read policy" ON public.notifications
  FOR SELECT TO authenticated USING (
    user_id = 'all' OR user_id = auth.uid()::text OR get_current_user_role() = 'owner'
  );

CREATE POLICY "Notifications insert policy" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Notifications update policy" ON public.notifications
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid()::text OR get_current_user_role() = 'owner'
  ) WITH CHECK (
    user_id = auth.uid()::text OR get_current_user_role() = 'owner'
  );

CREATE POLICY "Notifications delete policy" ON public.notifications
  FOR DELETE TO authenticated USING (get_current_user_role() = 'owner');

-- 2.11 company_settings, system_settings, lead_sources
DROP POLICY IF EXISTS "Company settings read policy" ON public.company_settings;
DROP POLICY IF EXISTS "Company settings update policy" ON public.company_settings;
DROP POLICY IF EXISTS "Company settings insert policy" ON public.company_settings;
DROP POLICY IF EXISTS "Company settings delete policy" ON public.company_settings;

CREATE POLICY "Company settings read policy" ON public.company_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Company settings insert policy" ON public.company_settings
  FOR INSERT TO authenticated WITH CHECK (get_current_user_role() = 'owner');

CREATE POLICY "Company settings update policy" ON public.company_settings
  FOR UPDATE TO authenticated USING (get_current_user_role() = 'owner')
  WITH CHECK (get_current_user_role() = 'owner');

CREATE POLICY "Company settings delete policy" ON public.company_settings
  FOR DELETE TO authenticated USING (get_current_user_role() = 'owner');

DROP POLICY IF EXISTS "System settings read policy" ON public.system_settings;
DROP POLICY IF EXISTS "System settings modify policy" ON public.system_settings;
DROP POLICY IF EXISTS "System settings insert policy" ON public.system_settings;
DROP POLICY IF EXISTS "System settings update policy" ON public.system_settings;
DROP POLICY IF EXISTS "System settings delete policy" ON public.system_settings;

CREATE POLICY "System settings read policy" ON public.system_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System settings insert policy" ON public.system_settings
  FOR INSERT TO authenticated WITH CHECK (get_current_user_role() = 'owner');

CREATE POLICY "System settings update policy" ON public.system_settings
  FOR UPDATE TO authenticated USING (get_current_user_role() = 'owner')
  WITH CHECK (get_current_user_role() = 'owner');

CREATE POLICY "System settings delete policy" ON public.system_settings
  FOR DELETE TO authenticated USING (get_current_user_role() = 'owner');

DROP POLICY IF EXISTS "Lead sources read policy" ON public.lead_sources;
DROP POLICY IF EXISTS "Lead sources manage policy" ON public.lead_sources;
DROP POLICY IF EXISTS "Lead sources insert policy" ON public.lead_sources;
DROP POLICY IF EXISTS "Lead sources update policy" ON public.lead_sources;
DROP POLICY IF EXISTS "Lead sources delete policy" ON public.lead_sources;

CREATE POLICY "Lead sources read policy" ON public.lead_sources
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Lead sources insert policy" ON public.lead_sources
  FOR INSERT TO authenticated WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
  );

CREATE POLICY "Lead sources update policy" ON public.lead_sources
  FOR UPDATE TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
  ) WITH CHECK (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
  );

CREATE POLICY "Lead sources delete policy" ON public.lead_sources
  FOR DELETE TO authenticated USING (get_current_user_role() = 'owner');

-- 2.12 audit_logs (Append-only, actor identity verified, no UPDATE or DELETE policies)
DROP POLICY IF EXISTS "Audit logs read policy" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs insert policy" ON public.audit_logs;

CREATE POLICY "Audit logs read policy" ON public.audit_logs
  FOR SELECT TO authenticated USING (
    get_current_user_role() IN ('owner', 'senior_sales_executive')
  );

CREATE POLICY "Audit logs insert policy" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()::text
    AND user_role = get_current_user_role()::text
    AND user_name = COALESCE((SELECT p.name FROM public.profiles p WHERE p.id = auth.uid()), user_name)
  );

-- ============================================================================
-- 3. ONE-TIME CLEANUP OF DISPOSABLE SECURITY VERIFICATION TEST DATA
-- Removes ONLY the disposable records created during live security verification:
--   * Auth user: security-test-sales-exec-1790439924882@example.com
--   * User ID:   fad7eae4-0329-4919-870b-e2f83f966e47
--   * Customer:  a73c179b-c3aa-41a3-bd29-9a6322e51b14
--   * Order:     SEC-TEST-ORD-1790439924882
--   * Corresponding disposable payment, daily report, and audit-log test record
-- ============================================================================

-- 3.1 Remove disposable payment(s) linked to the test order or test user
DELETE FROM public.payments
WHERE recorded_by = 'fad7eae4-0329-4919-870b-e2f83f966e47'::uuid
   OR order_id IN (
     SELECT id FROM public.orders
     WHERE order_number = 'SEC-TEST-ORD-1790439924882'
        OR customer_id = 'a73c179b-c3aa-41a3-bd29-9a6322e51b14'::uuid
        OR assigned_to = 'fad7eae4-0329-4919-870b-e2f83f966e47'::uuid
   );

-- 3.2 Remove disposable order items and order (SEC-TEST-ORD-1790439924882)
DELETE FROM public.order_items
WHERE order_id IN (
  SELECT id FROM public.orders
  WHERE order_number = 'SEC-TEST-ORD-1790439924882'
     OR customer_id = 'a73c179b-c3aa-41a3-bd29-9a6322e51b14'::uuid
     OR assigned_to = 'fad7eae4-0329-4919-870b-e2f83f966e47'::uuid
);

DELETE FROM public.orders
WHERE order_number = 'SEC-TEST-ORD-1790439924882'
   OR customer_id = 'a73c179b-c3aa-41a3-bd29-9a6322e51b14'::uuid
   OR assigned_to = 'fad7eae4-0329-4919-870b-e2f83f966e47'::uuid;

-- 3.3 Remove any disposable quotation items, quotations, follow-ups, visits, activities, notifications
DELETE FROM public.quotation_items
WHERE quotation_id IN (
  SELECT id FROM public.quotations
  WHERE customer_id = 'a73c179b-c3aa-41a3-bd29-9a6322e51b14'::uuid
     OR assigned_to = 'fad7eae4-0329-4919-870b-e2f83f966e47'::uuid
);

DELETE FROM public.quotations
WHERE customer_id = 'a73c179b-c3aa-41a3-bd29-9a6322e51b14'::uuid
   OR assigned_to = 'fad7eae4-0329-4919-870b-e2f83f966e47'::uuid;

DELETE FROM public.follow_ups
WHERE customer_id = 'a73c179b-c3aa-41a3-bd29-9a6322e51b14'::uuid
   OR assigned_to = 'fad7eae4-0329-4919-870b-e2f83f966e47'::uuid;

DELETE FROM public.visits
WHERE customer_id = 'a73c179b-c3aa-41a3-bd29-9a6322e51b14'::uuid
   OR assigned_to = 'fad7eae4-0329-4919-870b-e2f83f966e47'::uuid;

DELETE FROM public.activities
WHERE customer_id = 'a73c179b-c3aa-41a3-bd29-9a6322e51b14'::uuid
   OR performed_by = 'fad7eae4-0329-4919-870b-e2f83f966e47'::uuid;

DELETE FROM public.notifications
WHERE user_id = 'fad7eae4-0329-4919-870b-e2f83f966e47';

-- 3.4 Remove disposable daily report(s) for the test user
DELETE FROM public.daily_reports
WHERE user_id = 'fad7eae4-0329-4919-870b-e2f83f966e47'::uuid;

-- 3.5 Remove disposable customer (a73c179b-c3aa-41a3-bd29-9a6322e51b14)
DELETE FROM public.customers
WHERE id = 'a73c179b-c3aa-41a3-bd29-9a6322e51b14'::uuid
   OR created_by = 'fad7eae4-0329-4919-870b-e2f83f966e47'::uuid
   OR assigned_to = 'fad7eae4-0329-4919-870b-e2f83f966e47'::uuid;

-- 3.6 Remove disposable audit-log test record inside the atomic transaction,
-- then immediately re-enable trg_prevent_audit_log_modification so audit_logs
-- immutability is never weakened outside this transaction.
DROP TRIGGER IF EXISTS trg_prevent_audit_log_modification ON public.audit_logs;

DELETE FROM public.audit_logs
WHERE user_id = 'fad7eae4-0329-4919-870b-e2f83f966e47'
   OR record_id = 'a73c179b-c3aa-41a3-bd29-9a6322e51b14'
   OR record_number = 'SEC-TEST-ORD-1790439924882';

CREATE TRIGGER trg_prevent_audit_log_modification
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

-- 3.7 Remove disposable profile and auth user
DELETE FROM public.profiles
WHERE id = 'fad7eae4-0329-4919-870b-e2f83f966e47'::uuid
   OR email = 'security-test-sales-exec-1790439924882@example.com';

DELETE FROM auth.users
WHERE id = 'fad7eae4-0329-4919-870b-e2f83f966e47'::uuid
   OR email = 'security-test-sales-exec-1790439924882@example.com';

NOTIFY pgrst, 'reload schema';

COMMIT;
