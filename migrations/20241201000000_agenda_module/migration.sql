-- =====================================================
-- MIGRAÇÃO: MÓDULO DE AGENDA - IMOBIPRO DASHBOARD
-- =====================================================
-- Data: Dezembro 2024
-- Descrição: Implementação do sistema de agenda com integração Google Calendar

-- =====================================================
-- 1. EXTENSÕES DO MODELO USER
-- =====================================================

-- Adicionar campos para integração Google Calendar ao modelo User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleRefreshToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleAccessToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleTokenExpiry" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleCalendarId" TEXT;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS "User_googleRefreshToken_idx" ON "User"("googleRefreshToken");
CREATE INDEX IF NOT EXISTS "User_googleCalendarId_idx" ON "User"("googleCalendarId");

-- =====================================================
-- 2. MODELO AGENT SCHEDULE (HORÁRIOS DE TRABALHO)
-- =====================================================

-- Criar tabela para horários de trabalho dos corretores
CREATE TABLE IF NOT EXISTS "AgentSchedule" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "monday" JSONB,
    "tuesday" JSONB,
    "wednesday" JSONB,
    "thursday" JSONB,
    "friday" JSONB,
    "saturday" JSONB,
    "sunday" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentSchedule_pkey" PRIMARY KEY ("id")
);

-- Criar índices
CREATE INDEX IF NOT EXISTS "AgentSchedule_agentId_idx" ON "AgentSchedule"("agentId");
CREATE INDEX IF NOT EXISTS "AgentSchedule_createdAt_idx" ON "AgentSchedule"("createdAt");

-- Adicionar foreign key
ALTER TABLE "AgentSchedule" ADD CONSTRAINT "AgentSchedule_agentId_fkey" 
    FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================
-- 3. MODELO AVAILABILITY SLOT (SLOTS DE DISPONIBILIDADE)
-- =====================================================

-- Criar tabela para slots de disponibilidade
CREATE TABLE IF NOT EXISTS "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL, -- "09:00"
    "endTime" TEXT NOT NULL,   -- "18:00"
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "appointmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- Criar índices
CREATE INDEX IF NOT EXISTS "AvailabilitySlot_agentId_idx" ON "AvailabilitySlot"("agentId");
CREATE INDEX IF NOT EXISTS "AvailabilitySlot_date_idx" ON "AvailabilitySlot"("date");
CREATE INDEX IF NOT EXISTS "AvailabilitySlot_appointmentId_idx" ON "AvailabilitySlot"("appointmentId");
CREATE INDEX IF NOT EXISTS "AvailabilitySlot_isAvailable_idx" ON "AvailabilitySlot"("isAvailable");
CREATE INDEX IF NOT EXISTS "AvailabilitySlot_isBooked_idx" ON "AvailabilitySlot"("isBooked");

-- Adicionar foreign keys
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_agentId_fkey" 
    FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================
-- 4. EXTENSÕES DO MODELO APPOINTMENT
-- =====================================================

-- Adicionar campos para integração Google Calendar e automação
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "googleCalendarEventId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "n8nWorkflowId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "autoAssigned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "availabilitySlotId" TEXT;

-- Criar índices
CREATE INDEX IF NOT EXISTS "Appointment_googleCalendarEventId_idx" ON "Appointment"("googleCalendarEventId");
CREATE INDEX IF NOT EXISTS "Appointment_n8nWorkflowId_idx" ON "Appointment"("n8nWorkflowId");
CREATE INDEX IF NOT EXISTS "Appointment_autoAssigned_idx" ON "Appointment"("autoAssigned");
CREATE INDEX IF NOT EXISTS "Appointment_availabilitySlotId_idx" ON "Appointment"("availabilitySlotId");

-- Adicionar foreign key para AvailabilitySlot
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_availabilitySlotId_fkey" 
    FOREIGN KEY ("availabilitySlotId") REFERENCES "AvailabilitySlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Adicionar foreign key reversa para AvailabilitySlot
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_appointmentId_fkey" 
    FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================
-- 5. MODELO GOOGLE CALENDAR WEBHOOK
-- =====================================================

-- Criar tabela para webhooks do Google Calendar
CREATE TABLE IF NOT EXISTS "GoogleCalendarWebhook" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleCalendarWebhook_pkey" PRIMARY KEY ("id")
);

-- Criar índices
CREATE INDEX IF NOT EXISTS "GoogleCalendarWebhook_calendarId_idx" ON "GoogleCalendarWebhook"("calendarId");
CREATE INDEX IF NOT EXISTS "GoogleCalendarWebhook_resourceId_idx" ON "GoogleCalendarWebhook"("resourceId");
CREATE INDEX IF NOT EXISTS "GoogleCalendarWebhook_expiration_idx" ON "GoogleCalendarWebhook"("expiration");

-- =====================================================
-- 6. ENUMS E CONSTRAINTS
-- =====================================================

-- Adicionar constraints para garantir integridade dos dados
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_status_check" 
    CHECK ("status" IN ('SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'RESCHEDULED'));

ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_type_check" 
    CHECK ("type" IN ('PROPERTY_VIEWING', 'CLIENT_MEETING', 'NEGOTIATION', 'DOCUMENT_SIGNING', 'FOLLOW_UP', 'OTHER'));

-- Constraint para garantir que startTime < endTime
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_time_check" 
    CHECK ("startTime" < "endTime");

-- Constraint para garantir que startTime < endTime nos slots
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_time_check" 
    CHECK ("startTime" < "endTime");

-- =====================================================
-- 7. FUNÇÕES AUXILIARES
-- =====================================================

-- Função para atualizar updatedAt automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updatedAt
CREATE TRIGGER update_AgentSchedule_updated_at 
    BEFORE UPDATE ON "AgentSchedule" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_AvailabilitySlot_updated_at 
    BEFORE UPDATE ON "AvailabilitySlot" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_GoogleCalendarWebhook_updated_at 
    BEFORE UPDATE ON "GoogleCalendarWebhook" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. FUNÇÕES DE VALIDAÇÃO
-- =====================================================

-- Função para validar formato de horário (HH:MM)
CREATE OR REPLACE FUNCTION validate_time_format(time_str TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN time_str ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$';
END;
$$ LANGUAGE plpgsql;

-- Função para verificar conflitos de agendamento
CREATE OR REPLACE FUNCTION check_appointment_conflict(
    p_agent_id TEXT,
    p_start_time TIMESTAMP(3),
    p_end_time TIMESTAMP(3),
    p_appointment_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO conflict_count
    FROM "Appointment"
    WHERE "agentId" = p_agent_id
      AND "status" NOT IN ('CANCELLED', 'NO_SHOW')
      AND (
          (p_start_time < "endTime" AND p_end_time > "startTime")
          OR ("startTime" < p_end_time AND "endTime" > p_start_time)
      )
      AND (p_appointment_id IS NULL OR "id" != p_appointment_id);
    
    RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE "AgentSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AvailabilitySlot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GoogleCalendarWebhook" ENABLE ROW LEVEL SECURITY;

-- Políticas para AgentSchedule
CREATE POLICY "AgentSchedule_select_policy" ON "AgentSchedule"
    FOR SELECT USING (
        "agentId" = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "id" = auth.uid() AND "role" IN ('CREATOR', 'ADMIN')
        )
    );

CREATE POLICY "AgentSchedule_insert_policy" ON "AgentSchedule"
    FOR INSERT WITH CHECK (
        "agentId" = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "id" = auth.uid() AND "role" IN ('CREATOR', 'ADMIN')
        )
    );

CREATE POLICY "AgentSchedule_update_policy" ON "AgentSchedule"
    FOR UPDATE USING (
        "agentId" = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "id" = auth.uid() AND "role" IN ('CREATOR', 'ADMIN')
        )
    );

CREATE POLICY "AgentSchedule_delete_policy" ON "AgentSchedule"
    FOR DELETE USING (
        "agentId" = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "id" = auth.uid() AND "role" IN ('CREATOR', 'ADMIN')
        )
    );

-- Políticas para AvailabilitySlot
CREATE POLICY "AvailabilitySlot_select_policy" ON "AvailabilitySlot"
    FOR SELECT USING (
        "agentId" = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "id" = auth.uid() AND "role" IN ('CREATOR', 'ADMIN')
        )
    );

CREATE POLICY "AvailabilitySlot_insert_policy" ON "AvailabilitySlot"
    FOR INSERT WITH CHECK (
        "agentId" = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "id" = auth.uid() AND "role" IN ('CREATOR', 'ADMIN')
        )
    );

CREATE POLICY "AvailabilitySlot_update_policy" ON "AvailabilitySlot"
    FOR UPDATE USING (
        "agentId" = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "id" = auth.uid() AND "role" IN ('CREATOR', 'ADMIN')
        )
    );

CREATE POLICY "AvailabilitySlot_delete_policy" ON "AvailabilitySlot"
    FOR DELETE USING (
        "agentId" = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "id" = auth.uid() AND "role" IN ('CREATOR', 'ADMIN')
        )
    );

-- Políticas para GoogleCalendarWebhook (apenas admins)
CREATE POLICY "GoogleCalendarWebhook_select_policy" ON "GoogleCalendarWebhook"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "id" = auth.uid() AND "role" IN ('CREATOR', 'ADMIN')
        )
    );

CREATE POLICY "GoogleCalendarWebhook_insert_policy" ON "GoogleCalendarWebhook"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "id" = auth.uid() AND "role" IN ('CREATOR', 'ADMIN')
        )
    );

CREATE POLICY "GoogleCalendarWebhook_update_policy" ON "GoogleCalendarWebhook"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "id" = auth.uid() AND "role" IN ('CREATOR', 'ADMIN')
        )
    );

CREATE POLICY "GoogleCalendarWebhook_delete_policy" ON "GoogleCalendarWebhook"
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE "id" = auth.uid() AND "role" IN ('CREATOR', 'ADMIN')
        )
    );

-- =====================================================
-- 10. DADOS INICIAIS (SEED)
-- =====================================================

-- Inserir configurações padrão de horário para usuários existentes
INSERT INTO "AgentSchedule" ("id", "agentId", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")
SELECT 
    gen_random_uuid()::TEXT,
    u."id",
    '{"start": "09:00", "end": "18:00", "available": true}'::JSONB,
    '{"start": "09:00", "end": "18:00", "available": true}'::JSONB,
    '{"start": "09:00", "end": "18:00", "available": true}'::JSONB,
    '{"start": "09:00", "end": "18:00", "available": true}'::JSONB,
    '{"start": "09:00", "end": "18:00", "available": true}'::JSONB,
    '{"start": "09:00", "end": "17:00", "available": true}'::JSONB,
    '{"start": "10:00", "end": "16:00", "available": false}'::JSONB
FROM "User" u
WHERE u."role" = 'AGENT'
  AND NOT EXISTS (
      SELECT 1 FROM "AgentSchedule" WHERE "agentId" = u."id"
  );

-- =====================================================
-- 11. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE "AgentSchedule" IS 'Horários de trabalho dos corretores por dia da semana';
COMMENT ON TABLE "AvailabilitySlot" IS 'Slots de disponibilidade para agendamentos';
COMMENT ON TABLE "GoogleCalendarWebhook" IS 'Webhooks para sincronização com Google Calendar';

COMMENT ON COLUMN "AgentSchedule"."monday" IS 'Configuração JSON: {"start": "09:00", "end": "18:00", "available": true, "breakStart": "12:00", "breakEnd": "13:00"}';
COMMENT ON COLUMN "AvailabilitySlot"."startTime" IS 'Horário de início no formato HH:MM';
COMMENT ON COLUMN "AvailabilitySlot"."endTime" IS 'Horário de fim no formato HH:MM';
COMMENT ON COLUMN "Appointment"."googleCalendarEventId" IS 'ID do evento no Google Calendar para sincronização';
COMMENT ON COLUMN "Appointment"."n8nWorkflowId" IS 'ID do workflow n8n para automação';
COMMENT ON COLUMN "Appointment"."autoAssigned" IS 'Indica se o agendamento foi atribuído automaticamente';

-- =====================================================
-- MIGRAÇÃO CONCLUÍDA
-- ===================================================== 