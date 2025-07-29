-- Migration: Add WhatsApp Module
-- Description: Creates tables and enums for WhatsApp connections functionality
-- Author: ImobiPRO Team
-- Date: 2025-07-29

-- Create enums for WhatsApp module
CREATE TYPE "WhatsAppStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'CONNECTING', 'ERROR', 'QR_CODE_PENDING');
CREATE TYPE "ConnectionAction" AS ENUM ('CONNECT', 'DISCONNECT', 'QR_GENERATED', 'ERROR', 'RECONNECT');
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT', 'LOCATION', 'STICKER', 'CONTACT');

-- Create WhatsAppInstance table
CREATE TABLE "WhatsAppInstance" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "displayName" TEXT,
    "status" "WhatsAppStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "qrCode" TEXT,
    "qrCodeExpiry" TIMESTAMP(3),
    "autoReply" BOOLEAN NOT NULL DEFAULT false,
    "autoReplyMessage" TEXT,
    "webhookUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "canConnect" BOOLEAN NOT NULL DEFAULT true,
    "maxDailyMessages" INTEGER DEFAULT 1000,
    "lastConnectionAt" TIMESTAMP(3),
    "messagesSentToday" INTEGER NOT NULL DEFAULT 0,
    "messagesReceivedToday" INTEGER NOT NULL DEFAULT 0,
    "totalMessagesSent" INTEGER NOT NULL DEFAULT 0,
    "totalMessagesReceived" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppInstance_pkey" PRIMARY KEY ("id")
);

-- Create WhatsAppConnectionLog table
CREATE TABLE "WhatsAppConnectionLog" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "action" "ConnectionAction" NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "duration" INTEGER,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppConnectionLog_pkey" PRIMARY KEY ("id")
);

-- Create WhatsAppMessage table
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "whatsappMessageId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "caption" TEXT,
    "fromNumber" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "isFromMe" BOOLEAN NOT NULL,
    "messageStatus" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "chatId" TEXT,
    "contactId" TEXT,
    "metadata" JSONB,
    "mediaUrl" TEXT,
    "mediaSize" INTEGER,
    "mediaMimeType" TEXT,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "isAutoReply" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- Create WhatsAppConfig table
CREATE TABLE "WhatsAppConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "maxInstancesPerAgent" INTEGER NOT NULL DEFAULT 1,
    "autoQRRefresh" BOOLEAN NOT NULL DEFAULT true,
    "qrRefreshInterval" INTEGER NOT NULL DEFAULT 300,
    "messageRateLimit" INTEGER NOT NULL DEFAULT 20,
    "autoReplyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "webhookSecret" TEXT,
    "n8nWebhookUrl" TEXT,
    "enableN8nIntegration" BOOLEAN NOT NULL DEFAULT false,
    "allowedIPs" TEXT[],
    "requireIPWhitelist" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppConfig_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX "WhatsAppInstance_instanceId_key" ON "WhatsAppInstance"("instanceId");
CREATE UNIQUE INDEX "WhatsAppInstance_agentId_key" ON "WhatsAppInstance"("agentId");
CREATE UNIQUE INDEX "WhatsAppMessage_whatsappMessageId_key" ON "WhatsAppMessage"("whatsappMessageId");
CREATE UNIQUE INDEX "WhatsAppConfig_companyId_key" ON "WhatsAppConfig"("companyId");

-- Create indexes for performance
CREATE INDEX "WhatsAppInstance_status_isActive_idx" ON "WhatsAppInstance"("status", "isActive");
CREATE INDEX "WhatsAppInstance_phoneNumber_idx" ON "WhatsAppInstance"("phoneNumber");
CREATE INDEX "WhatsAppConnectionLog_instanceId_action_createdAt_idx" ON "WhatsAppConnectionLog"("instanceId", "action", "createdAt");
CREATE INDEX "WhatsAppConnectionLog_status_createdAt_idx" ON "WhatsAppConnectionLog"("status", "createdAt");
CREATE INDEX "WhatsAppMessage_instanceId_timestamp_idx" ON "WhatsAppMessage"("instanceId", "timestamp");
CREATE INDEX "WhatsAppMessage_conversationId_timestamp_idx" ON "WhatsAppMessage"("conversationId", "timestamp");
CREATE INDEX "WhatsAppMessage_fromNumber_timestamp_idx" ON "WhatsAppMessage"("fromNumber", "timestamp");
CREATE INDEX "WhatsAppMessage_messageStatus_timestamp_idx" ON "WhatsAppMessage"("messageStatus", "timestamp");
CREATE INDEX "WhatsAppMessage_isProcessed_createdAt_idx" ON "WhatsAppMessage"("isProcessed", "createdAt");

-- Add foreign key constraints
ALTER TABLE "WhatsAppInstance" ADD CONSTRAINT "WhatsAppInstance_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WhatsAppConnectionLog" ADD CONSTRAINT "WhatsAppConnectionLog_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WhatsAppInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WhatsAppInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WhatsAppConfig" ADD CONSTRAINT "WhatsAppConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enable Row Level Security (RLS)
ALTER TABLE "WhatsAppInstance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhatsAppConnectionLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhatsAppMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhatsAppConfig" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for WhatsAppInstance
CREATE POLICY "Users can view their own WhatsApp instances" ON "WhatsAppInstance"
    FOR SELECT USING (auth.uid()::text = "agentId");

CREATE POLICY "Users can create their own WhatsApp instances" ON "WhatsAppInstance"
    FOR INSERT WITH CHECK (auth.uid()::text = "agentId");

CREATE POLICY "Users can update their own WhatsApp instances" ON "WhatsAppInstance"
    FOR UPDATE USING (auth.uid()::text = "agentId");

CREATE POLICY "Users can delete their own WhatsApp instances" ON "WhatsAppInstance"
    FOR DELETE USING (auth.uid()::text = "agentId");

-- Create RLS policies for WhatsAppConnectionLog
CREATE POLICY "Users can view their own WhatsApp connection logs" ON "WhatsAppConnectionLog"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "WhatsAppInstance" 
            WHERE "WhatsAppInstance"."id" = "WhatsAppConnectionLog"."instanceId" 
            AND "WhatsAppInstance"."agentId" = auth.uid()::text
        )
    );

CREATE POLICY "System can create WhatsApp connection logs" ON "WhatsAppConnectionLog"
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for WhatsAppMessage
CREATE POLICY "Users can view their own WhatsApp messages" ON "WhatsAppMessage"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "WhatsAppInstance" 
            WHERE "WhatsAppInstance"."id" = "WhatsAppMessage"."instanceId" 
            AND "WhatsAppInstance"."agentId" = auth.uid()::text
        )
    );

CREATE POLICY "System can create WhatsApp messages" ON "WhatsAppMessage"
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for WhatsAppConfig
CREATE POLICY "Users can view their company's WhatsApp config" ON "WhatsAppConfig"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "User"."id" = auth.uid()::text 
            AND "User"."companyId" = "WhatsAppConfig"."companyId"
        )
    );

CREATE POLICY "Admins can manage WhatsApp config" ON "WhatsAppConfig"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "User"."id" = auth.uid()::text 
            AND "User"."companyId" = "WhatsAppConfig"."companyId"
            AND "User"."role" IN ('ADMIN', 'CREATOR')
        )
    );

-- Create trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_instance_updated_at 
    BEFORE UPDATE ON "WhatsAppInstance" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_message_updated_at 
    BEFORE UPDATE ON "WhatsAppMessage" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_config_updated_at 
    BEFORE UPDATE ON "WhatsAppConfig" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();