-- ============================================================================
-- HopePMS | PR-02 db/rls-product-write
-- Description: Establishes write-level enforcement paths for the product matrix.
-- Permissions:
--   • INSERT: Validates if authenticated context holds PRD_ADD = 1.
--   • UPDATE: Validates PRD_EDIT = 1 for general alterations/recovery, and
--             PRD_DEL = 1 when changing status to 'INACTIVE'.
-- ============================================================================

-- Step 1: Drop existing write policies to allow fresh application updates
DROP POLICY IF EXISTS "product_insert" ON public."product";
DROP POLICY IF EXISTS "product_update" ON public."product";

-- Step 2: Enforce policy restriction on INSERT transactions
CREATE POLICY "product_insert"
ON public."product" FOR INSERT TO authenticated
WITH CHECK (
  public.get_my_right('PRD_ADD') = 1
);

-- Step 3: Enforce policy restriction on UPDATE transactions (Edit, Soft-Delete, Recovery)
CREATE POLICY "product_update"
ON public."product" FOR UPDATE TO authenticated
USING (
  -- Evaluates profile parameters before execution begins
  public.get_my_user_type() IN ('ADMIN', 'SUPERADMIN') 
  OR public.get_my_right('PRD_EDIT') = 1 
  OR public.get_my_right('PRD_DEL') = 1
)
WITH CHECK (
  -- Evaluates field conditions applied to the post-operation record row state
  CASE 
    -- Scenario A: Performing a Soft-Delete (transitioning to INACTIVE) requires PRD_DEL right
    WHEN "record_status" = 'INACTIVE' THEN public.get_my_right('PRD_DEL') = 1
    
    -- Scenario B: General content edits or recovery transitions require PRD_EDIT right
    ELSE public.get_my_right('PRD_EDIT') = 1
  END
);