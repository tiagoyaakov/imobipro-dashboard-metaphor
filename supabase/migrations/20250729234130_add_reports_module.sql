-- ===================================================================
-- MIGRATION: Reports Module
-- Description: Creates tables and policies for the Reports module
-- ===================================================================

-- Create enums for Reports module
CREATE TYPE "ReportType" AS ENUM (
  'WEEKLY_SALES',
  'LEAD_CONVERSION', 
  'APPOINTMENT_SUMMARY',
  'AGENT_PERFORMANCE',
  'PROPERTY_ANALYSIS',
  'CUSTOM'
);

CREATE TYPE "ReportFormat" AS ENUM (
  'WHATSAPP',
  'EMAIL',
  'PDF',
  'EXCEL',
  'JSON'
);

CREATE TYPE "ReportStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'SENT',
  'FAILED',
  'CANCELLED'
);

-- ===================================================================
-- CREATE TABLES
-- ===================================================================

-- Templates de relatório
CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ReportType" NOT NULL,
    "template" TEXT NOT NULL,
    "variables" JSONB,
    
    -- Permissões e controle
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    
    -- Timestamps
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Foreign keys
    CONSTRAINT "ReportTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReportTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Agendamento de relatórios
CREATE TABLE "ScheduledReport" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schedule" TEXT NOT NULL, -- Cron expression
    "recipients" TEXT[] NOT NULL DEFAULT '{}',
    "format" "ReportFormat" NOT NULL DEFAULT 'WHATSAPP',
    
    -- Configurações avançadas
    "filters" JSONB,
    "parameters" JSONB,
    
    -- Controle
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSentAt" TIMESTAMP WITH TIME ZONE,
    "nextSendAt" TIMESTAMP WITH TIME ZONE,
    
    -- Permissões
    "createdBy" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    
    -- Timestamps
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Foreign keys
    CONSTRAINT "ScheduledReport_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ReportTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScheduledReport_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScheduledReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Histórico de relatórios enviados
CREATE TABLE "ReportHistory" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "scheduledReportId" TEXT NOT NULL,
    
    -- Dados do envio
    "content" TEXT NOT NULL,
    "recipients" TEXT[] NOT NULL DEFAULT '{}',
    "format" "ReportFormat" NOT NULL,
    
    -- Status e métricas
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP WITH TIME ZONE,
    "error" TEXT,
    "executionTime" INTEGER, -- tempo de execução em ms
    "contentSize" INTEGER, -- tamanho do conteúdo em bytes
    
    -- Metadados
    "metadata" JSONB,
    "triggeredBy" TEXT, -- manual, scheduled, webhook
    
    -- Timestamp
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Foreign keys
    CONSTRAINT "ReportHistory_scheduledReportId_fkey" FOREIGN KEY ("scheduledReportId") REFERENCES "ScheduledReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ===================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ===================================================================

-- ReportTemplate indexes
CREATE INDEX "ReportTemplate_companyId_type_idx" ON "ReportTemplate"("companyId", "type");
CREATE INDEX "ReportTemplate_createdBy_isActive_idx" ON "ReportTemplate"("createdBy", "isActive");

-- ScheduledReport indexes
CREATE INDEX "ScheduledReport_companyId_isActive_idx" ON "ScheduledReport"("companyId", "isActive");
CREATE INDEX "ScheduledReport_nextSendAt_isActive_idx" ON "ScheduledReport"("nextSendAt", "isActive");

-- ReportHistory indexes
CREATE INDEX "ReportHistory_scheduledReportId_createdAt_idx" ON "ReportHistory"("scheduledReportId", "createdAt");
CREATE INDEX "ReportHistory_status_sentAt_idx" ON "ReportHistory"("status", "sentAt");

-- ===================================================================
-- SETUP ROW LEVEL SECURITY (RLS)
-- ===================================================================

-- Enable RLS on all tables
ALTER TABLE "ReportTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScheduledReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReportHistory" ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- CREATE RLS POLICIES
-- ===================================================================

-- ReportTemplate policies
CREATE POLICY "Users can view report templates from their company" ON "ReportTemplate"
    FOR SELECT USING (
        "companyId" IN (
            SELECT "companyId" FROM "User" WHERE "id" = auth.uid()::text
        )
    );

CREATE POLICY "Users can create report templates for their company" ON "ReportTemplate"
    FOR INSERT WITH CHECK (
        "companyId" IN (
            SELECT "companyId" FROM "User" WHERE "id" = auth.uid()::text
        )
        AND "createdBy" = auth.uid()::text
    );

CREATE POLICY "Users can update their own report templates or company admins can update all" ON "ReportTemplate"
    FOR UPDATE USING (
        ("createdBy" = auth.uid()::text AND "companyId" IN (
            SELECT "companyId" FROM "User" WHERE "id" = auth.uid()::text
        ))
        OR EXISTS (
            SELECT 1 FROM "User" 
            WHERE "id" = auth.uid()::text 
            AND "companyId" = "ReportTemplate"."companyId"
            AND "role" IN ('ADMIN', 'CREATOR')
        )
    );

CREATE POLICY "Users can delete their own report templates or company admins can delete all" ON "ReportTemplate"
    FOR DELETE USING (
        ("createdBy" = auth.uid()::text AND "companyId" IN (
            SELECT "companyId" FROM "User" WHERE "id" = auth.uid()::text
        ))
        OR EXISTS (
            SELECT 1 FROM "User" 
            WHERE "id" = auth.uid()::text 
            AND "companyId" = "ReportTemplate"."companyId"
            AND "role" IN ('ADMIN', 'CREATOR')
        )
    );

-- ScheduledReport policies
CREATE POLICY "Users can view scheduled reports from their company" ON "ScheduledReport"
    FOR SELECT USING (
        "companyId" IN (
            SELECT "companyId" FROM "User" WHERE "id" = auth.uid()::text
        )
    );

CREATE POLICY "Users can create scheduled reports for their company" ON "ScheduledReport"
    FOR INSERT WITH CHECK (
        "companyId" IN (
            SELECT "companyId" FROM "User" WHERE "id" = auth.uid()::text
        )
        AND "createdBy" = auth.uid()::text
    );

CREATE POLICY "Users can update their own scheduled reports or company admins can update all" ON "ScheduledReport"
    FOR UPDATE USING (
        ("createdBy" = auth.uid()::text AND "companyId" IN (
            SELECT "companyId" FROM "User" WHERE "id" = auth.uid()::text
        ))
        OR EXISTS (
            SELECT 1 FROM "User" 
            WHERE "id" = auth.uid()::text 
            AND "companyId" = "ScheduledReport"."companyId"
            AND "role" IN ('ADMIN', 'CREATOR')
        )
    );

CREATE POLICY "Users can delete their own scheduled reports or company admins can delete all" ON "ScheduledReport"
    FOR DELETE USING (
        ("createdBy" = auth.uid()::text AND "companyId" IN (
            SELECT "companyId" FROM "User" WHERE "id" = auth.uid()::text
        ))
        OR EXISTS (
            SELECT 1 FROM "User" 
            WHERE "id" = auth.uid()::text 
            AND "companyId" = "ScheduledReport"."companyId"
            AND "role" IN ('ADMIN', 'CREATOR')
        )
    );

-- ReportHistory policies (Read-only for users, write access only for system/admins)
CREATE POLICY "Users can view report history from their company" ON "ReportHistory"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "ScheduledReport" sr
            JOIN "User" u ON u.id = auth.uid()::text
            WHERE sr.id = "ReportHistory"."scheduledReportId"
            AND sr."companyId" = u."companyId"
        )
    );

-- Allow admins and creators to insert report history
CREATE POLICY "Admins and creators can insert report history" ON "ReportHistory"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "User" u
            JOIN "ScheduledReport" sr ON sr.id = "ReportHistory"."scheduledReportId"
            WHERE u.id = auth.uid()::text 
            AND u."companyId" = sr."companyId"
            AND u."role" IN ('ADMIN', 'CREATOR')
        )
    );

-- ===================================================================
-- CREATE FUNCTIONS FOR AUTOMATIC UPDATES
-- ===================================================================

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updatedAt updates
CREATE TRIGGER update_ReportTemplate_updated_at BEFORE UPDATE ON "ReportTemplate"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ScheduledReport_updated_at BEFORE UPDATE ON "ScheduledReport"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- CREATE HELPER FUNCTIONS
-- ===================================================================

-- Function to get user's company reports
CREATE OR REPLACE FUNCTION get_user_company_reports(user_id TEXT)
RETURNS TABLE (
    template_id TEXT,
    template_name TEXT,
    template_type "ReportType",
    scheduled_reports_count BIGINT,
    last_execution TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rt.id as template_id,
        rt.name as template_name,
        rt.type as template_type,
        COUNT(sr.id) as scheduled_reports_count,
        MAX(rh."sentAt") as last_execution
    FROM "ReportTemplate" rt
    LEFT JOIN "ScheduledReport" sr ON rt.id = sr."templateId"
    LEFT JOIN "ReportHistory" rh ON sr.id = rh."scheduledReportId" AND rh.status = 'SENT'
    WHERE rt."companyId" IN (
        SELECT "companyId" FROM "User" WHERE id = user_id
    )
    AND rt."isActive" = true
    GROUP BY rt.id, rt.name, rt.type
    ORDER BY rt."createdAt" DESC;
END;
$$;

-- Function to create report execution history
CREATE OR REPLACE FUNCTION create_report_execution(
    scheduled_report_id TEXT,
    report_content TEXT,
    report_recipients TEXT[],
    report_format "ReportFormat",
    execution_time_ms INTEGER DEFAULT NULL,
    content_size_bytes INTEGER DEFAULT NULL,
    triggered_by_source TEXT DEFAULT 'scheduled'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    history_id TEXT;
BEGIN
    INSERT INTO "ReportHistory" (
        "scheduledReportId",
        "content",
        "recipients", 
        "format",
        "status",
        "executionTime",
        "contentSize",
        "triggeredBy"
    ) VALUES (
        scheduled_report_id,
        report_content,
        report_recipients,
        report_format,
        'PROCESSING',
        execution_time_ms,
        content_size_bytes,
        triggered_by_source
    ) RETURNING id INTO history_id;
    
    RETURN history_id;
END;
$$;

-- Function to update report execution status
CREATE OR REPLACE FUNCTION update_report_execution_status(
    history_id TEXT,
    new_status "ReportStatus",
    sent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE "ReportHistory" 
    SET 
        "status" = new_status,
        "sentAt" = COALESCE(sent_timestamp, CASE WHEN new_status = 'SENT' THEN now() ELSE "sentAt" END),
        "error" = error_message
    WHERE id = history_id;
    
    -- Update the scheduled report's lastSentAt if status is SENT
    IF new_status = 'SENT' THEN
        UPDATE "ScheduledReport" 
        SET "lastSentAt" = COALESCE(sent_timestamp, now())
        WHERE id = (
            SELECT "scheduledReportId" FROM "ReportHistory" WHERE id = history_id
        );
    END IF;
    
    RETURN FOUND;
END;
$$;

-- ===================================================================
-- GRANT PERMISSIONS
-- ===================================================================

-- Grant usage on custom types to authenticated users
GRANT USAGE ON TYPE "ReportType" TO authenticated;
GRANT USAGE ON TYPE "ReportFormat" TO authenticated;
GRANT USAGE ON TYPE "ReportStatus" TO authenticated;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON "ReportTemplate" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "ScheduledReport" TO authenticated;
GRANT SELECT, INSERT ON "ReportHistory" TO authenticated;

-- Grant permissions on helper functions
GRANT EXECUTE ON FUNCTION get_user_company_reports(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_report_execution(TEXT, TEXT, TEXT[], "ReportFormat", INTEGER, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_report_execution_status(TEXT, "ReportStatus", TIMESTAMP WITH TIME ZONE, TEXT) TO authenticated;

-- ===================================================================
-- COMMENTS
-- ===================================================================

COMMENT ON TABLE "ReportTemplate" IS 'Templates for generating various types of reports';
COMMENT ON TABLE "ScheduledReport" IS 'Scheduled reports with cron expressions and recipients';
COMMENT ON TABLE "ReportHistory" IS 'History of executed reports with status and metrics';