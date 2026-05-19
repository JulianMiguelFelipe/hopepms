-- ============================================================================
-- HopePMS | PR-01 db/rls-product-select
-- Description: Enables RLS on product table and establishes data visibility rules.
-- Visibility:
--   • USER roles see only 'ACTIVE' records.
--   • ADMIN and SUPERADMIN roles see both 'ACTIVE' and 'INACTIVE' records.
-- ============================================================================

-- Step 1: Ensure Row Level Security is active on the target table
ALTER TABLE public."product" ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "product_select" ON public."product";

-- Step 3: Implement SELECT policy using a security-definer helper function context
CREATE POLICY "product_select"
ON public."product" FOR SELECT TO authenticated
USING (
  "record_status" = 'ACTIVE'
  OR public.get_my_user_type() IN ('ADMIN', 'SUPERADMIN')
);