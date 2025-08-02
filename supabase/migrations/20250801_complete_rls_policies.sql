-- =====================================================
-- Migration: Complete RLS Policies for All Tables
-- Description: Implements comprehensive Row Level Security
-- Author: ImobiPRO Team
-- Date: 2025-08-01
-- =====================================================

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get user's company_id
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT "companyId" 
    FROM "User" 
    WHERE id = auth.uid()
  );
END;
$$;

-- Function to check if user is CREATOR (DEV_MASTER)
CREATE OR REPLACE FUNCTION is_creator()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM "User" 
    WHERE id = auth.uid() 
    AND role = 'CREATOR'
  );
END;
$$;

-- Function to check if user is ADMIN
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM "User" 
    WHERE id = auth.uid() 
    AND role IN ('ADMIN', 'CREATOR')
  );
END;
$$;

-- Function to check if user is from same company
CREATE OR REPLACE FUNCTION is_same_company(company_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN company_id = get_user_company_id() OR is_creator();
END;
$$;

-- =====================================================
-- COMPANIES TABLE
-- =====================================================

-- Enable RLS
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "company_select" ON "Company";
DROP POLICY IF EXISTS "company_insert" ON "Company";
DROP POLICY IF EXISTS "company_update" ON "Company";
DROP POLICY IF EXISTS "company_delete" ON "Company";

-- SELECT: Users can only see their own company (except CREATOR)
CREATE POLICY "company_select" ON "Company"
  FOR SELECT
  USING (
    id = get_user_company_id() 
    OR is_creator()
  );

-- INSERT: Only CREATOR can create companies
CREATE POLICY "company_insert" ON "Company"
  FOR INSERT
  WITH CHECK (is_creator());

-- UPDATE: Only CREATOR and company's ADMIN can update
CREATE POLICY "company_update" ON "Company"
  FOR UPDATE
  USING (
    is_creator() 
    OR (id = get_user_company_id() AND is_admin())
  );

-- DELETE: Only CREATOR can delete companies
CREATE POLICY "company_delete" ON "Company"
  FOR DELETE
  USING (is_creator());

-- =====================================================
-- USERS TABLE
-- =====================================================

-- Enable RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "user_select" ON "User";
DROP POLICY IF EXISTS "user_insert" ON "User";
DROP POLICY IF EXISTS "user_update" ON "User";
DROP POLICY IF EXISTS "user_delete" ON "User";

-- SELECT: Users can see others from same company
CREATE POLICY "user_select" ON "User"
  FOR SELECT
  USING (
    -- CREATOR sees all
    is_creator()
    -- Others see only same company users
    OR "companyId" = get_user_company_id()
    -- User can always see themselves
    OR id = auth.uid()
  );

-- INSERT: Only ADMIN and CREATOR can create users
CREATE POLICY "user_insert" ON "User"
  FOR INSERT
  WITH CHECK (
    is_admin() 
    AND (
      -- CREATOR can create any user
      is_creator() 
      -- ADMIN can only create in their company
      OR "companyId" = get_user_company_id()
    )
  );

-- UPDATE: Users can update own profile, ADMIN can update company users
CREATE POLICY "user_update" ON "User"
  FOR UPDATE
  USING (
    -- User updates own profile
    id = auth.uid()
    -- CREATOR updates anyone
    OR is_creator()
    -- ADMIN updates company users (not other ADMINs)
    OR (
      is_admin() 
      AND "companyId" = get_user_company_id() 
      AND role = 'AGENT'
    )
  );

-- DELETE: Only CREATOR can delete users
CREATE POLICY "user_delete" ON "User"
  FOR DELETE
  USING (is_creator());

-- =====================================================
-- PROPERTIES TABLE
-- =====================================================

-- Enable RLS
ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "property_select" ON "Property";
DROP POLICY IF EXISTS "property_insert" ON "Property";
DROP POLICY IF EXISTS "property_update" ON "Property";
DROP POLICY IF EXISTS "property_delete" ON "Property";

-- SELECT: Users see properties from their company
CREATE POLICY "property_select" ON "Property"
  FOR SELECT
  USING (
    -- CREATOR sees all
    is_creator()
    -- Same company users see all company properties
    OR EXISTS (
      SELECT 1 FROM "User" u 
      WHERE u.id = "Property"."agentId" 
      AND u."companyId" = get_user_company_id()
    )
  );

-- INSERT: Any authenticated user from company can create
CREATE POLICY "property_insert" ON "Property"
  FOR INSERT
  WITH CHECK (
    -- Must be creating for an agent in same company
    EXISTS (
      SELECT 1 FROM "User" u 
      WHERE u.id = "agentId" 
      AND u."companyId" = get_user_company_id()
    )
  );

-- UPDATE: Agent who owns or ADMIN from company can update
CREATE POLICY "property_update" ON "Property"
  FOR UPDATE
  USING (
    -- CREATOR can update any
    is_creator()
    -- Owner agent can update
    OR "agentId" = auth.uid()
    -- Company ADMIN can update
    OR (
      is_admin() 
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.id = "Property"."agentId" 
        AND u."companyId" = get_user_company_id()
      )
    )
  );

-- DELETE: Only ADMIN and CREATOR can delete
CREATE POLICY "property_delete" ON "Property"
  FOR DELETE
  USING (
    is_creator()
    OR (
      is_admin() 
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.id = "Property"."agentId" 
        AND u."companyId" = get_user_company_id()
      )
    )
  );

-- =====================================================
-- CONTACTS TABLE
-- =====================================================

-- Enable RLS
ALTER TABLE "Contact" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "contact_select" ON "Contact";
DROP POLICY IF EXISTS "contact_insert" ON "Contact";
DROP POLICY IF EXISTS "contact_update" ON "Contact";
DROP POLICY IF EXISTS "contact_delete" ON "Contact";

-- SELECT: Agent sees own contacts, ADMIN sees all company contacts
CREATE POLICY "contact_select" ON "Contact"
  FOR SELECT
  USING (
    -- CREATOR sees all
    is_creator()
    -- Own contacts
    OR "agentId" = auth.uid()
    -- ADMIN sees company contacts
    OR (
      is_admin() 
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.id = "Contact"."agentId" 
        AND u."companyId" = get_user_company_id()
      )
    )
  );

-- INSERT: Any authenticated user can create own contacts
CREATE POLICY "contact_insert" ON "Contact"
  FOR INSERT
  WITH CHECK (
    -- Must be creating for self or same company agent (if ADMIN)
    "agentId" = auth.uid()
    OR (
      is_admin() 
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.id = "agentId" 
        AND u."companyId" = get_user_company_id()
      )
    )
  );

-- UPDATE: Owner or ADMIN can update
CREATE POLICY "contact_update" ON "Contact"
  FOR UPDATE
  USING (
    -- CREATOR can update any
    is_creator()
    -- Owner can update
    OR "agentId" = auth.uid()
    -- Company ADMIN can update
    OR (
      is_admin() 
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.id = "Contact"."agentId" 
        AND u."companyId" = get_user_company_id()
      )
    )
  );

-- DELETE: Owner or ADMIN can delete
CREATE POLICY "contact_delete" ON "Contact"
  FOR DELETE
  USING (
    -- CREATOR can delete any
    is_creator()
    -- Owner can delete
    OR "agentId" = auth.uid()
    -- Company ADMIN can delete
    OR (
      is_admin() 
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.id = "Contact"."agentId" 
        AND u."companyId" = get_user_company_id()
      )
    )
  );

-- =====================================================
-- APPOINTMENTS TABLE
-- =====================================================

-- Enable RLS
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "appointment_select" ON "Appointment";
DROP POLICY IF EXISTS "appointment_insert" ON "Appointment";
DROP POLICY IF EXISTS "appointment_update" ON "Appointment";
DROP POLICY IF EXISTS "appointment_delete" ON "Appointment";

-- SELECT: Agent sees own, ADMIN sees all company appointments
CREATE POLICY "appointment_select" ON "Appointment"
  FOR SELECT
  USING (
    -- CREATOR sees all
    is_creator()
    -- Own appointments
    OR "agentId" = auth.uid()
    -- ADMIN sees company appointments
    OR (
      is_admin() 
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.id = "Appointment"."agentId" 
        AND u."companyId" = get_user_company_id()
      )
    )
  );

-- INSERT: Authenticated users can create appointments
CREATE POLICY "appointment_insert" ON "Appointment"
  FOR INSERT
  WITH CHECK (
    -- Creating for self
    "agentId" = auth.uid()
    -- Or ADMIN creating for company agent
    OR (
      is_admin() 
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.id = "agentId" 
        AND u."companyId" = get_user_company_id()
      )
    )
  );

-- UPDATE: Owner or ADMIN can update
CREATE POLICY "appointment_update" ON "Appointment"
  FOR UPDATE
  USING (
    -- CREATOR can update any
    is_creator()
    -- Owner can update
    OR "agentId" = auth.uid()
    -- Company ADMIN can update
    OR (
      is_admin() 
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.id = "Appointment"."agentId" 
        AND u."companyId" = get_user_company_id()
      )
    )
  );

-- DELETE: Owner or ADMIN can delete
CREATE POLICY "appointment_delete" ON "Appointment"
  FOR DELETE
  USING (
    -- CREATOR can delete any
    is_creator()
    -- Owner can delete
    OR "agentId" = auth.uid()
    -- Company ADMIN can delete
    OR (
      is_admin() 
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.id = "Appointment"."agentId" 
        AND u."companyId" = get_user_company_id()
      )
    )
  );

-- =====================================================
-- DEALS TABLE
-- =====================================================

-- Enable RLS
ALTER TABLE "Deal" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "deal_select" ON "Deal";
DROP POLICY IF EXISTS "deal_insert" ON "Deal";
DROP POLICY IF EXISTS "deal_update" ON "Deal";
DROP POLICY IF EXISTS "deal_delete" ON "Deal";

-- SELECT: Agent sees own, ADMIN sees all company deals
CREATE POLICY "deal_select" ON "Deal"
  FOR SELECT
  USING (
    -- CREATOR sees all
    is_creator()
    -- Own deals
    OR "agentId" = auth.uid()
    -- ADMIN sees company deals
    OR (
      is_admin() 
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.id = "Deal"."agentId" 
        AND u."companyId" = get_user_company_id()
      )
    )
  );

-- INSERT: Authenticated users can create deals
CREATE POLICY "deal_insert" ON "Deal"
  FOR INSERT
  WITH CHECK (
    -- Creating for self
    "agentId" = auth.uid()
    -- Or ADMIN creating for company agent
    OR (
      is_admin() 
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.id = "agentId" 
        AND u."companyId" = get_user_company_id()
      )
    )
  );

-- UPDATE: Owner or ADMIN can update
CREATE POLICY "deal_update" ON "Deal"
  FOR UPDATE
  USING (
    -- CREATOR can update any
    is_creator()
    -- Owner can update
    OR "agentId" = auth.uid()
    -- Company ADMIN can update
    OR (
      is_admin() 
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.id = "Deal"."agentId" 
        AND u."companyId" = get_user_company_id()
      )
    )
  );

-- DELETE: Only ADMIN and CREATOR can delete
CREATE POLICY "deal_delete" ON "Deal"
  FOR DELETE
  USING (
    is_creator()
    OR (
      is_admin() 
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.id = "Deal"."agentId" 
        AND u."companyId" = get_user_company_id()
      )
    )
  );

-- =====================================================
-- ACTIVITIES TABLE
-- =====================================================

-- Enable RLS
ALTER TABLE "Activity" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "activity_select" ON "Activity";
DROP POLICY IF EXISTS "activity_insert" ON "Activity";

-- SELECT: Users see activities from their company
CREATE POLICY "activity_select" ON "Activity"
  FOR SELECT
  USING (
    -- CREATOR sees all
    is_creator()
    -- Same company activities
    OR EXISTS (
      SELECT 1 FROM "User" u 
      WHERE u.id = "Activity"."userId" 
      AND u."companyId" = get_user_company_id()
    )
  );

-- INSERT: Authenticated users can create activities
CREATE POLICY "activity_insert" ON "Activity"
  FOR INSERT
  WITH CHECK (
    -- Must be creating for self
    "userId" = auth.uid()
  );

-- Activities are immutable (no UPDATE/DELETE policies)

-- =====================================================
-- CHATS TABLE
-- =====================================================

-- Enable RLS
ALTER TABLE "Chat" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "chat_select" ON "Chat";
DROP POLICY IF EXISTS "chat_insert" ON "Chat";
DROP POLICY IF EXISTS "chat_update" ON "Chat";
DROP POLICY IF EXISTS "chat_delete" ON "Chat";

-- SELECT: Agent sees own chats, ADMIN sees company chats
CREATE POLICY "chat_select" ON "Chat"
  FOR SELECT
  USING (
    -- CREATOR sees all
    is_creator()
    -- Own chats
    OR "agentId" = auth.uid()
    -- ADMIN sees company chats
    OR (
      is_admin() 
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.id = "Chat"."agentId" 
        AND u."companyId" = get_user_company_id()
      )
    )
  );

-- INSERT: Authenticated users can create chats
CREATE POLICY "chat_insert" ON "Chat"
  FOR INSERT
  WITH CHECK (
    -- Creating for self
    "agentId" = auth.uid()
    -- Or ADMIN creating for company agent
    OR (
      is_admin() 
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.id = "agentId" 
        AND u."companyId" = get_user_company_id()
      )
    )
  );

-- UPDATE: Owner or ADMIN can update
CREATE POLICY "chat_update" ON "Chat"
  FOR UPDATE
  USING (
    -- CREATOR can update any
    is_creator()
    -- Owner can update
    OR "agentId" = auth.uid()
    -- Company ADMIN can update
    OR (
      is_admin() 
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.id = "Chat"."agentId" 
        AND u."companyId" = get_user_company_id()
      )
    )
  );

-- DELETE: Only ADMIN and CREATOR can delete
CREATE POLICY "chat_delete" ON "Chat"
  FOR DELETE
  USING (
    is_creator()
    OR (
      is_admin() 
      AND EXISTS (
        SELECT 1 FROM "User" u 
        WHERE u.id = "Chat"."agentId" 
        AND u."companyId" = get_user_company_id()
      )
    )
  );

-- =====================================================
-- MESSAGES TABLE
-- =====================================================

-- Enable RLS
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "message_select" ON "Message";
DROP POLICY IF EXISTS "message_insert" ON "Message";

-- SELECT: Users see messages from chats they have access to
CREATE POLICY "message_select" ON "Message"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Chat" c
      WHERE c.id = "Message"."chatId"
      AND (
        -- CREATOR sees all
        is_creator()
        -- Chat owner
        OR c."agentId" = auth.uid()
        -- ADMIN of company
        OR (
          is_admin() 
          AND EXISTS (
            SELECT 1 FROM "User" u 
            WHERE u.id = c."agentId" 
            AND u."companyId" = get_user_company_id()
          )
        )
      )
    )
  );

-- INSERT: Users can send messages to chats they have access to
CREATE POLICY "message_insert" ON "Message"
  FOR INSERT
  WITH CHECK (
    -- Must be the sender
    "senderId" = auth.uid()
    -- And have access to the chat
    AND EXISTS (
      SELECT 1 FROM "Chat" c
      WHERE c.id = "chatId"
      AND (
        c."agentId" = auth.uid()
        OR (
          is_admin() 
          AND EXISTS (
            SELECT 1 FROM "User" u 
            WHERE u.id = c."agentId" 
            AND u."companyId" = get_user_company_id()
          )
        )
      )
    )
  );

-- Messages are immutable (no UPDATE/DELETE)

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Company isolation indexes
CREATE INDEX IF NOT EXISTS idx_user_company ON "User"("companyId");
CREATE INDEX IF NOT EXISTS idx_property_agent ON "Property"("agentId");
CREATE INDEX IF NOT EXISTS idx_contact_agent ON "Contact"("agentId");
CREATE INDEX IF NOT EXISTS idx_appointment_agent ON "Appointment"("agentId");
CREATE INDEX IF NOT EXISTS idx_deal_agent ON "Deal"("agentId");
CREATE INDEX IF NOT EXISTS idx_activity_user ON "Activity"("userId");
CREATE INDEX IF NOT EXISTS idx_chat_agent ON "Chat"("agentId");
CREATE INDEX IF NOT EXISTS idx_message_chat ON "Message"("chatId");

-- Role-based indexes
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);

-- =====================================================
-- VERIFICATION QUERIES (for testing)
-- =====================================================

-- Test queries to verify RLS is working:
-- SELECT COUNT(*) FROM "Property"; -- Should only show company properties
-- SELECT COUNT(*) FROM "Contact"; -- AGENT sees own, ADMIN sees all company
-- SELECT COUNT(*) FROM "User" WHERE role = 'CREATOR'; -- Should be 0 for non-CREATOR