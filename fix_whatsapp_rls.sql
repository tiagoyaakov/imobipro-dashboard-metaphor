-- Fix WhatsApp RLS Policies
-- This script will fix the RLS policies for WhatsApp tables

-- First, let's drop and recreate the RLS policies for WhatsAppInstance
DROP POLICY IF EXISTS "Users can view their own WhatsApp instances" ON "WhatsAppInstance";
DROP POLICY IF EXISTS "Users can create their own WhatsApp instances" ON "WhatsAppInstance";
DROP POLICY IF EXISTS "Users can update their own WhatsApp instances" ON "WhatsAppInstance";
DROP POLICY IF EXISTS "Users can delete their own WhatsApp instances" ON "WhatsAppInstance";

-- Recreate RLS policies with better checks
CREATE POLICY "Users can view their own WhatsApp instances" ON "WhatsAppInstance"
    FOR SELECT USING (
        (SELECT auth.uid())::text = "agentId"
    );

CREATE POLICY "Users can create their own WhatsApp instances" ON "WhatsAppInstance"
    FOR INSERT WITH CHECK (
        (SELECT auth.uid())::text = "agentId"
    );

CREATE POLICY "Users can update their own WhatsApp instances" ON "WhatsAppInstance"
    FOR UPDATE USING (
        (SELECT auth.uid())::text = "agentId"
    );

CREATE POLICY "Users can delete their own WhatsApp instances" ON "WhatsAppInstance"
    FOR DELETE USING (
        (SELECT auth.uid())::text = "agentId"
    );

-- Also recreate policies for WhatsAppConnectionLog
DROP POLICY IF EXISTS "Users can view their own WhatsApp connection logs" ON "WhatsAppConnectionLog";
DROP POLICY IF EXISTS "System can create WhatsApp connection logs" ON "WhatsAppConnectionLog";

CREATE POLICY "Users can view their own WhatsApp connection logs" ON "WhatsAppConnectionLog"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "WhatsAppInstance" 
            WHERE "WhatsAppInstance"."id" = "WhatsAppConnectionLog"."instanceId" 
            AND "WhatsAppInstance"."agentId" = (SELECT auth.uid())::text
        )
    );

CREATE POLICY "System can create WhatsApp connection logs" ON "WhatsAppConnectionLog"
    FOR INSERT WITH CHECK (true);

-- Recreate policies for WhatsAppMessage
DROP POLICY IF EXISTS "Users can view their own WhatsApp messages" ON "WhatsAppMessage";
DROP POLICY IF EXISTS "System can create WhatsApp messages" ON "WhatsAppMessage";

CREATE POLICY "Users can view their own WhatsApp messages" ON "WhatsAppMessage"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "WhatsAppInstance" 
            WHERE "WhatsAppInstance"."id" = "WhatsAppMessage"."instanceId" 
            AND "WhatsAppInstance"."agentId" = (SELECT auth.uid())::text
        )
    );

CREATE POLICY "System can create WhatsApp messages" ON "WhatsAppMessage"
    FOR INSERT WITH CHECK (true);

-- Make sure RLS is enabled
ALTER TABLE "WhatsAppInstance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhatsAppConnectionLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhatsAppMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhatsAppConfig" ENABLE ROW LEVEL SECURITY;