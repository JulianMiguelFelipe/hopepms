-- =============================================================
-- HopePMS | PR-01 db/initial-schema
-- Description: Core Schema Initialization combining HopeDB + Rights Management
-- Incorporates project requirements:
--   • userId tracking as TEXT to map cleanly to Supabase Auth UUID records.
--   • record_status and stamp markers appended to critical entities.
--   • salesDetail structure added to support reporting metrics.
-- Run order: Run FIRST inside the Supabase SQL Editor workspace.
-- =============================================================

-- ============================================================
-- 1. RIGHTS MANAGEMENT SUBSYSTEM ENTITIES
-- ============================================================

-- MODULE TABLE (Tracks major functional application partitions)
CREATE TABLE IF NOT EXISTS public."Module" (
  "Module_ID"     VARCHAR(30) NOT NULL PRIMARY KEY,
  "DESCRIPTION"   VARCHAR(100),
  "Record_status" VARCHAR(10) NOT NULL CHECK ("Record_status" IN ('ACTIVE', 'INACTIVE')),
  "Stamp"         VARCHAR(60)
);

-- RIGHTS TABLE (Establishes individual granular permission definitions)
CREATE TABLE IF NOT EXISTS public."rights" (
  "Right_ID"      VARCHAR(15) NOT NULL PRIMARY KEY,
  "Description"   VARCHAR(30),
  "Right_value"   INT         NOT NULL CHECK ("Right_value" IN (0, 1)),
  "Module_ID"     VARCHAR(30) NOT NULL REFERENCES public."Module"("Module_ID"),
  "Record_status" VARCHAR(10) NOT NULL CHECK ("Record_status" IN ('ACTIVE', 'INACTIVE')),
  "Stamp"         VARCHAR(60)
);

-- USER TABLE (Core profile tracking — primary key configured to catch Supabase UUIDs)
CREATE TABLE IF NOT EXISTS public."user" (
  "userId"        TEXT        NOT NULL PRIMARY KEY,
  "username"      VARCHAR(50),
  "lastName"      VARCHAR(50),
  "firstName"     VARCHAR(50),
  "user_type"     VARCHAR(20) CHECK ("user_type" IN ('SUPERADMIN', 'USER', 'ADMIN')),
  "record_status" VARCHAR(10) CHECK ("record_status" IN ('ACTIVE', 'INACTIVE')),
  "stamp"         VARCHAR(60)
);

-- USER_MODULE TABLE (Maps permission matrix scaling across high-level modules)
CREATE TABLE IF NOT EXISTS public."user_module" (
  "userid"        TEXT        NOT NULL REFERENCES public."user"("userId") ON DELETE CASCADE,
  "Module_ID"     VARCHAR(30) NOT NULL REFERENCES public."Module"("Module_ID"),
  "rights_value"  INT         NOT NULL CHECK ("rights_value" IN (0, 1)),
  "record_status" VARCHAR(10) NOT NULL CHECK ("record_status" IN ('ACTIVE', 'INACTIVE')),
  "stamp"         VARCHAR(60),
  PRIMARY KEY ("userid", "Module_ID")
);

-- USERMODULE_RIGHTS TABLE (Maps fine-grained user permissions over system triggers)
CREATE TABLE IF NOT EXISTS public."UserModule_Rights" (
  "userid"        TEXT        NOT NULL REFERENCES public."user"("userId") ON DELETE CASCADE,
  "Right_ID"      VARCHAR(30) NOT NULL REFERENCES public."rights"("Right_ID"),
  "Right_value"   INT         NOT NULL CHECK ("Right_value" IN (0, 1)),
  "Record_status" VARCHAR(10) NOT NULL CHECK ("Record_status" IN ('ACTIVE', 'INACTIVE')),
  "Stamp"         VARCHAR(60),
  PRIMARY KEY ("userid", "Right_ID")
);

-- ============================================================
-- 2. CORE BUSINESS DOMAIN ENTITIES
-- ============================================================

-- PRODUCT TABLE (Appended with soft-delete record status fields)
CREATE TABLE IF NOT EXISTS public."product" (
  "prodCode"      VARCHAR(6)  NOT NULL PRIMARY KEY,
  "description"   VARCHAR(30),
  "unit"          VARCHAR(3)  CONSTRAINT unit_ck CHECK ("unit" IN ('pc', 'ea', 'mtr', 'pkg', 'ltr')),
  "record_status" VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK ("record_status" IN ('ACTIVE', 'INACTIVE')),
  "stamp"         VARCHAR(60)
);

-- PRICEHIST TABLE (Maintains chronological valuation changes)
CREATE TABLE IF NOT EXISTS public."priceHist" (
  "effDate"   DATE          NOT NULL,
  "prodCode"  VARCHAR(6)    NOT NULL REFERENCES public."product"("prodCode"),
  "unitPrice" DECIMAL(10,2) CONSTRAINT unitP_ck CHECK ("unitPrice" > 0),
  "stamp"     VARCHAR(60),
  PRIMARY KEY ("effDate", "prodCode")
);

-- SALESDETAIL TABLE (Maintains record velocity to support REP_002 analytical tracking)
CREATE TABLE IF NOT EXISTS public."salesDetail" (
  "salesId"  SERIAL     PRIMARY KEY,
  "prodCode" VARCHAR(6) REFERENCES public."product"("prodCode"),
  "quantity" INT        CHECK ("quantity" > 0),
  "saleDate" DATE       NOT NULL DEFAULT CURRENT_DATE
);