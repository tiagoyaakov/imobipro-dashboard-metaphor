-- Fix WhatsApp RLS Policies
-- This migration fixes the RLS policies for proper user access

-- Drop existing policies for WhatsAppInstance
DROP POLICY IF EXISTS "Users can view their own WhatsApp instances" ON "WhatsAppInstance";
DROP POLICY IF EXISTS "Users can create their own WhatsApp instances" ON "WhatsAppInstance";
DROP POLICY IF EXISTS "Users can update their own WhatsApp instances" ON "WhatsAppInstance";
DROP POLICY IF EXISTS "Users can delete their own WhatsApp instances" ON "WhatsAppInstance";

-- Recreate RLS policies with explicit auth.uid() checks
CREATE POLICY "Users can view their own WhatsApp instances" ON "WhatsAppInstance"
    FOR SELECT USING (
        auth.uid()::text = "agentId"
    );

CREATE POLICY "Users can create their own WhatsApp instances" ON "WhatsAppInstance"
    FOR INSERT WITH CHECK (
        auth.uid()::text = "agentId"
    );

CREATE POLICY "Users can update their own WhatsApp instances" ON "WhatsAppInstance"
    FOR UPDATE USING (
        auth.uid()::text = "agentId"
    ) WITH CHECK (
        auth.uid()::text = "agentId"
    );

CREATE POLICY "Users can delete their own WhatsApp instances" ON "WhatsAppInstance"
    FOR DELETE USING (
        auth.uid()::text = "agentId"
    );

-- Update policies for WhatsAppConnectionLog to be more explicit
DROP POLICY IF EXISTS "Users can view their own WhatsApp connection logs" ON "WhatsAppConnectionLog";
DROP POLICY IF EXISTS "System can create WhatsApp connection logs" ON "WhatsAppConnectionLog";

CREATE POLICY "Users can view their own WhatsApp connection logs" ON "WhatsAppConnectionLog"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "WhatsAppInstance" wi
            WHERE wi."id" = "WhatsAppConnectionLog"."instanceId" 
            AND wi."agentId" = auth.uid()::text
        )
    );

CREATE POLICY "Users can create WhatsApp connection logs" ON "WhatsAppConnectionLog"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "WhatsAppInstance" wi
            WHERE wi."id" = "WhatsAppConnectionLog"."instanceId" 
            AND wi."agentId" = auth.uid()::text
        )
    );

-- System-level policy for automated log creation (webhooks, etc.)
CREATE POLICY "Service role can manage connection logs" ON "WhatsAppConnectionLog"
    FOR ALL USING (
        current_setting('request.jwt.claim.role', true) = 'service_role'
    );

-- Update policies for WhatsAppMessage
DROP POLICY IF EXISTS "Users can view their own WhatsApp messages" ON "WhatsAppMessage";
DROP POLICY IF EXISTS "System can create WhatsApp messages" ON "WhatsAppMessage";

CREATE POLICY "Users can view their own WhatsApp messages" ON "WhatsAppMessage"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "WhatsAppInstance" wi
            WHERE wi."id" = "WhatsAppMessage"."instanceId" 
            AND wi."agentId" = auth.uid()::text
        )
    );

CREATE POLICY "Users can create WhatsApp messages" ON "WhatsAppMessage"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "WhatsAppInstance" wi
            WHERE wi."id" = "WhatsAppMessage"."instanceId" 
            AND wi."agentId" = auth.uid()::text
        )
    );

-- System-level policy for automated message creation (webhooks, etc.)
CREATE POLICY "Service role can manage messages" ON "WhatsAppMessage"
    FOR ALL USING (
        current_setting('request.jwt.claim.role', true) = 'service_role'
    );

-- Ensure RLS is enabled on all tables
ALTER TABLE "WhatsAppInstance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhatsAppConnectionLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhatsAppMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhatsAppConfig" ENABLE ROW LEVEL SECURITY;