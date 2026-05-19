-- =========================================================================
-- 1. BASE SYSTEM TABLES (HOpeDB Schema Modifications)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.product (
    prodCode VARCHAR(6) NOT NULL PRIMARY KEY,
    description VARCHAR(30) NOT NULL,
    unit VARCHAR(3) CHECK (unit IN ('pc', 'ea', 'mtr', 'pkg', 'ltr')),
    record_status VARCHAR(10) DEFAULT 'ACTIVE' CHECK (record_status IN ('ACTIVE', 'INACTIVE')),
    stamp VARCHAR(60)
);

CREATE TABLE IF NOT EXISTS public.priceHist (
    effDate DATE NOT NULL,
    prodCode VARCHAR(6) NOT NULL REFERENCES public.product(prodCode),
    unitPrice DECIMAL(10,2) CHECK (unitPrice > 0),
    stamp VARCHAR(60),
    PRIMARY KEY (effDate, prodCode)
);

-- =========================================================================
-- 2. RIGHTS MANAGEMENT SCHEMA TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.user (
    userId VARCHAR(50) NOT NULL PRIMARY KEY, -- Expanded length to cleanly hold Supabase Auth UUIDs
    username VARCHAR(50),
    lastName VARCHAR(50),
    firstName VARCHAR(50),
    user_type VARCHAR(20) CHECK (user_type IN ('SUPERADMIN', 'USER', 'ADMIN')),
    record_status VARCHAR(10) CHECK (record_status IN ('ACTIVE', 'INACTIVE')),
    stamp VARCHAR(60)
);

CREATE TABLE IF NOT EXISTS public.Module (
    Module_ID VARCHAR(30) NOT NULL PRIMARY KEY,
    DESCRIPTION VARCHAR(100),
    Record_status VARCHAR(10) NOT NULL CHECK (Record_status IN ('ACTIVE', 'INACTIVE')),
    Stamp VARCHAR(60)
);

CREATE TABLE IF NOT EXISTS public.user_module (
    userid VARCHAR(50) NOT NULL REFERENCES public.user(userId),
    Module_ID VARCHAR(30) NOT NULL REFERENCES public.Module(Module_ID),
    rights_value INT NOT NULL CHECK (rights_value IN (0, 1)),
    record_status VARCHAR(10) NOT NULL CHECK (record_status IN ('ACTIVE', 'INACTIVE')),
    stamp VARCHAR(60),
    PRIMARY KEY (userid, Module_ID)
);

CREATE TABLE IF NOT EXISTS public.rights (
    Right_ID VARCHAR(15) NOT NULL PRIMARY KEY,
    Description VARCHAR(30),
    Right_value INT NOT NULL CHECK (Right_value IN (0, 1)),
    Module_ID VARCHAR(30) NOT NULL REFERENCES public.Module(Module_ID),
    Record_status VARCHAR(10) NOT NULL CHECK (Record_status IN ('ACTIVE', 'INACTIVE')),
    Stamp VARCHAR(60)
);

CREATE TABLE IF NOT EXISTS public.UserModule_Rights (
    userid VARCHAR(50) NOT NULL REFERENCES public.user(userId),
    Right_ID VARCHAR(30) NOT NULL REFERENCES public.rights(Right_ID),
    Right_value INT NOT NULL CHECK (Right_value IN (0, 1)),
    Record_status VARCHAR(10) NOT NULL CHECK (Record_status IN ('ACTIVE', 'INACTIVE')),
    Stamp VARCHAR(60),
    PRIMARY KEY (userid, Right_ID)
);

-- =========================================================================
-- 3. SEED MODULES AND SYSTEM RIGHTS DEFINITIONS
-- =========================================================================

INSERT INTO public.Module (Module_ID, DESCRIPTION, Record_status, Stamp) VALUES
('Prod_Mod', 'Product Module', 'ACTIVE', 'ACTIVATED USER1 2025-10-20 10:42'),
('Report_Mod', 'Report Module', 'ACTIVE', 'ACTIVATED USER1 2025-10-20 10:42'),
('Adm_Mod', 'Admin Module', 'ACTIVE', 'ACTIVATED USER1 2025-10-20 10:42')
ON CONFLICT (Module_ID) DO NOTHING;

INSERT INTO public.rights (Right_ID, Description, Right_value, Module_ID, Record_status, Stamp) VALUES
('PRD_DEL', 'Product Deletion', 1, 'Prod_Mod', 'ACTIVE', 'ACTIVATED USER1 2025-10-20 10:00'),
('PRD_EDIT', 'Product Edit', 1, 'Prod_Mod', 'ACTIVE', 'ACTIVATED USER1 2025-10-20 10:00'),
('PRD_ADD', 'Product Insertion', 1, 'Prod_Mod', 'ACTIVE', 'ACTIVATED USER1 2025-10-20 10:00'),
('REP_001', 'Product Report Listing', 1, 'Report_Mod', 'ACTIVE', 'ACTIVATED USER1 2025-10-20 10:00'),
('REP_002', 'Product Top Selling', 1, 'Report_Mod', 'ACTIVE', 'ACTIVATED USER1 2025-10-20 10:00'),
('ADM_USER', 'Admin Activate User', 0, 'Adm_Mod', 'ACTIVE', 'ACTIVATED USER1 2025-10-20 10:00')
ON CONFLICT (Right_ID) DO NOTHING;

-- =========================================================================
-- 4. AUTO-PROVISIONING AUTOMATION (TRIGGERS & FUNCTIONS)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.provision_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_username TEXT;
BEGIN
    -- Derive username: Check user metadata fields, fall back to email prefix
    v_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );

    -- Enforce single row isolation to avoid re-provisioning issues
    IF NOT EXISTS (SELECT 1 FROM public.user WHERE userId = NEW.id::text) THEN
        
        -- Insert profile defaults: Provision as USER and INACTIVE
        INSERT INTO public.user (userId, username, lastName, firstName, user_type, record_status, stamp)
        VALUES (
            NEW.id::text, 
            v_username,
            COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
            COALESCE(NEW.raw_user_meta_data->>'firstName', v_username),
            'USER', 
            'INACTIVE',
            'REGISTERED ' || NEW.id::text || ' ' || NOW()::text
        );

        -- Map mandatory Default Module Tier Access Matrix
        INSERT INTO public.user_module (userid, Module_ID, rights_value, record_status, stamp) VALUES
        (NEW.id::text, 'Prod_Mod',   1, 'ACTIVE', 'AUTO'),
        (NEW.id::text, 'Report_Mod', 1, 'ACTIVE', 'AUTO'),
        (NEW.id::text, 'Adm_Mod',    0, 'ACTIVE', 'AUTO');

        -- Map default baseline Functional Right Permissions Matrix
        INSERT INTO public.UserModule_Rights (userid, Right_ID, Right_value, Record_status, Stamp) VALUES
        (NEW.id::text, 'PRD_ADD',  1, 'ACTIVE', 'AUTO'),
        (NEW.id::text, 'PRD_EDIT', 1, 'ACTIVE', 'AUTO'),
        (NEW.id::text, 'PRD_DEL',  0, 'ACTIVE', 'AUTO'),
        (NEW.id::text, 'REP_001',  1, 'ACTIVE', 'AUTO'),
        (NEW.id::text, 'REP_002',  0, 'ACTIVE', 'AUTO'),
        (NEW.id::text, 'ADM_USER', 0, 'ACTIVE', 'AUTO');
    END IF;
    RETURN NEW;
END;
$$;

-- Bind the automation pipeline directly to Supabase Auth table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.provision_new_user();

-- =========================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable explicit protection processing on critical vectors
ALTER TABLE public.product ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.UserModule_Rights ENABLE ROW LEVEL SECURITY;

--- 5.1 PRODUCT TABLE POLICIES ---

-- Invisible to USER accounts if INACTIVE; fully readable by ADMIN and SUPERADMIN
CREATE POLICY user_sees_active_only ON public.product
    FOR SELECT TO authenticated
    USING (
        record_status = 'ACTIVE'
        OR EXISTS (
            SELECT 1 FROM public.user
            WHERE public.user.userId = auth.uid()::text
              AND public.user.user_type IN ('ADMIN', 'SUPERADMIN')
        )
    );

-- Block arbitrary modifications unless user is confirmed authorized via matrix logic
CREATE POLICY authorize_product_insert ON public.product
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.UserModule_Rights
            WHERE public.UserModule_Rights.userid = auth.uid()::text
              AND public.UserModule_Rights.Right_ID = 'PRD_ADD'
              AND public.UserModule_Rights.Right_value = 1
        )
    );

CREATE POLICY authorize_product_update ON public.product
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.UserModule_Rights
            WHERE public.UserModule_Rights.userid = auth.uid()::text
              AND (
                  (public.UserModule_Rights.Right_ID = 'PRD_EDIT' AND public.UserModule_Rights.Right_value = 1)
                  OR 
                  (public.UserModule_Rights.Right_ID = 'PRD_DEL' AND public.UserModule_Rights.Right_value = 1)
              )
        )
    );

--- 5.2 USER PROTECTION POLICIES (SUPERADMIN Shielding Rules) ---

-- Read operations are allowed for system tracking context
CREATE POLICY allow_authenticated_read_profiles ON public.user
    FOR SELECT TO authenticated
    USING (true);

-- ADMIN cannot alter user_type, status or data elements tied to a SUPERADMIN profile
CREATE POLICY admin_cannot_touch_superadmin ON public.user
    FOR UPDATE TO authenticated
    USING (
        -- Evaluates authorization context of performing client
        EXISTS (
            SELECT 1 FROM public.user
            WHERE public.user.userId = auth.uid()::text 
              AND public.user.user_type IN ('ADMIN', 'SUPERADMIN')
        )
        -- Targets only non-SUPERADMIN rows unless performer is the explicit SUPERADMIN
        AND (
            user_type != 'SUPERADMIN' 
            OR (SELECT public.user.user_type FROM public.user WHERE public.user.userId = auth.uid()::text) = 'SUPERADMIN'
        )
    );

--- 5.3 USER MODULE RIGHTS POLICIES ---

CREATE POLICY allow_authenticated_read_rights ON public.UserModule_Rights
    FOR SELECT TO authenticated
    USING (true);

-- Deny ADMIN or other accounts from mutating rights configurations assigned to a SUPERADMIN
CREATE POLICY protect_superadmin_rights ON public.UserModule_Rights
    FOR ALL TO authenticated
    USING (
        userid NOT IN (
            SELECT public.user.userId FROM public.user WHERE public.user.user_type = 'SUPERADMIN'
        )
    );

-- =========================================================================
-- 6. SYSTEM DATABASE REPORTING VIEWS
-- =========================================================================

-- REP_001 View Interface: Computes current prices filtering by effective history records
CREATE OR REPLACE VIEW public.view_product_current_price AS
SELECT p.prodCode, p.description, p.unit, ph.unitPrice, ph.effDate
FROM public.product p
JOIN public.priceHist ph ON ph.prodCode = p.prodCode
WHERE ph.effDate = (
    SELECT MAX(inner_ph.effDate) 
    FROM public.priceHist inner_ph 
    WHERE inner_ph.prodCode = p.prodCode
)
AND p.record_status = 'ACTIVE'
ORDER BY p.prodCode;