-- ============================================================================
-- HopePMS | PR-01 db/view-top-selling
-- Description: Initializes top-selling analytical tracking view for REP_002.
-- Constraints:
--   • Only evaluates products matching an 'ACTIVE' record status.
--   • Ranks by sum total quantity in descending sequence.
--   • Limited to the top 10 rows for high-velocity analysis.
-- ============================================================================

-- Step 1: Drop existing view structure if present to avoid configuration collisions
DROP VIEW IF EXISTS public.top_selling_products;

-- Step 2: Establish the aggregation pipeline structure
CREATE VIEW public.top_selling_products AS
SELECT
  p."prodCode",
  p."description",
  p."unit",
  SUM(sd."quantity")::INTEGER AS "totalQty"
FROM public."product" p
JOIN public."salesDetail" sd ON sd."prodCode" = p."prodCode"
WHERE p."record_status" = 'ACTIVE'
GROUP BY p."prodCode", p."description", p."unit"
ORDER BY "totalQty" DESC
LIMIT 10;

-- Step 3: Grant standard data querying authorization access to system instances
GRANT SELECT ON public.top_selling_products TO authenticated;