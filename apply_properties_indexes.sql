-- ================================================
-- SCRIPT PARA APLICAR ÍNDICES E RLS - PARTE 2/3
-- ================================================
-- EXECUTE ESTE SCRIPT APÓS A PARTE 1
-- ================================================

-- ================================================
-- ÍNDICES PARA PERFORMANCE
-- ================================================

-- Índices principais para Property
CREATE INDEX IF NOT EXISTS "Property_companyId_idx" ON "Property"("companyId");
CREATE INDEX IF NOT EXISTS "Property_agentId_idx" ON "Property"("agentId");
CREATE INDEX IF NOT EXISTS "Property_ownerId_idx" ON "Property"("ownerId");
CREATE INDEX IF NOT EXISTS "Property_status_idx" ON "Property"("status");
CREATE INDEX IF NOT EXISTS "Property_propertyType_idx" ON "Property"("propertyType");
CREATE INDEX IF NOT EXISTS "Property_category_idx" ON "Property"("category");
CREATE INDEX IF NOT EXISTS "Property_listingType_idx" ON "Property"("listingType");
CREATE INDEX IF NOT EXISTS "Property_city_neighborhood_idx" ON "Property"("city", "neighborhood");
CREATE INDEX IF NOT EXISTS "Property_salePrice_idx" ON "Property"("salePrice");
CREATE INDEX IF NOT EXISTS "Property_rentPrice_idx" ON "Property"("rentPrice");
CREATE INDEX IF NOT EXISTS "Property_bedrooms_bathrooms_idx" ON "Property"("bedrooms", "bathrooms");
CREATE INDEX IF NOT EXISTS "Property_isActive_isFeatured_idx" ON "Property"("isActive", "isFeatured");
CREATE INDEX IF NOT EXISTS "Property_vivaRealId_idx" ON "Property"("vivaRealId");
CREATE INDEX IF NOT EXISTS "Property_createdAt_idx" ON "Property"("createdAt");

-- Índices para PropertyImage
CREATE INDEX IF NOT EXISTS "PropertyImage_propertyId_idx" ON "PropertyImage"("propertyId");
CREATE INDEX IF NOT EXISTS "PropertyImage_isMain_idx" ON "PropertyImage"("isMain");
CREATE INDEX IF NOT EXISTS "PropertyImage_order_idx" ON "PropertyImage"("order");

-- Índices para PropertyOwner
CREATE INDEX IF NOT EXISTS "PropertyOwner_email_idx" ON "PropertyOwner"("email");
CREATE INDEX IF NOT EXISTS "PropertyOwner_cpf_idx" ON "PropertyOwner"("cpf");
CREATE INDEX IF NOT EXISTS "PropertyOwner_cnpj_idx" ON "PropertyOwner"("cnpj");

-- Índices para sync e logs
CREATE INDEX IF NOT EXISTS "PropertySyncLog_propertyId_idx" ON "PropertySyncLog"("propertyId");
CREATE INDEX IF NOT EXISTS "PropertySyncLog_source_status_idx" ON "PropertySyncLog"("source", "status");
CREATE INDEX IF NOT EXISTS "PropertySyncLog_createdAt_idx" ON "PropertySyncLog"("createdAt");

-- Índice de geolocalização
CREATE INDEX IF NOT EXISTS "Property_geolocation_idx" ON "Property"("latitude", "longitude");

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Ativar RLS nas tabelas
ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PropertyOwner" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PropertyImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PropertyVivaRealData" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PropertySyncLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PropertyAppointment" ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver conflito
DROP POLICY IF EXISTS "Users can view properties from their company" ON "Property";
DROP POLICY IF EXISTS "Users can insert properties to their company" ON "Property";
DROP POLICY IF EXISTS "Users can update properties from their company" ON "Property";
DROP POLICY IF EXISTS "Users can delete properties from their company" ON "Property";

-- Políticas RLS para Property
CREATE POLICY "Users can view properties from their company" ON "Property"
    FOR SELECT USING (
        "companyId" IN (
            SELECT "companyId" FROM "User" WHERE "id" = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert properties to their company" ON "Property"
    FOR INSERT WITH CHECK (
        "companyId" IN (
            SELECT "companyId" FROM "User" WHERE "id" = auth.uid()::text
        )
    );

CREATE POLICY "Users can update properties from their company" ON "Property"
    FOR UPDATE USING (
        "companyId" IN (
            SELECT "companyId" FROM "User" WHERE "id" = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete properties from their company" ON "Property"
    FOR DELETE USING (
        "companyId" IN (
            SELECT "companyId" FROM "User" WHERE "id" = auth.uid()::text
        )
    );

-- Remover políticas existentes para outros objetos
DROP POLICY IF EXISTS "Company users can manage property owners" ON "PropertyOwner";
DROP POLICY IF EXISTS "Users can manage images of company properties" ON "PropertyImage";
DROP POLICY IF EXISTS "Users can manage viva real data for company properties" ON "PropertyVivaRealData";
DROP POLICY IF EXISTS "Users can view sync logs for company properties" ON "PropertySyncLog";
DROP POLICY IF EXISTS "Users can manage property appointments for their company" ON "PropertyAppointment";

-- Políticas para PropertyOwner (acessível por toda a empresa)
CREATE POLICY "Company users can manage property owners" ON "PropertyOwner"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "User" WHERE "id" = auth.uid()::text
        )
    );

-- Políticas para PropertyImage
CREATE POLICY "Users can manage images of company properties" ON "PropertyImage"
    FOR ALL USING (
        "propertyId" IN (
            SELECT "id" FROM "Property" WHERE "companyId" IN (
                SELECT "companyId" FROM "User" WHERE "id" = auth.uid()::text
            )
        )
    );

-- Políticas para PropertyVivaRealData
CREATE POLICY "Users can manage viva real data for company properties" ON "PropertyVivaRealData"
    FOR ALL USING (
        "propertyId" IN (
            SELECT "id" FROM "Property" WHERE "companyId" IN (
                SELECT "companyId" FROM "User" WHERE "id" = auth.uid()::text
            )
        )
    );

-- Políticas para PropertySyncLog
CREATE POLICY "Users can view sync logs for company properties" ON "PropertySyncLog"
    FOR SELECT USING (
        "propertyId" IN (
            SELECT "id" FROM "Property" WHERE "companyId" IN (
                SELECT "companyId" FROM "User" WHERE "id" = auth.uid()::text
            )
        ) OR "propertyId" IS NULL
    );

-- Políticas para PropertyAppointment
CREATE POLICY "Users can manage property appointments for their company" ON "PropertyAppointment"
    FOR ALL USING (
        "propertyId" IN (
            SELECT "id" FROM "Property" WHERE "companyId" IN (
                SELECT "companyId" FROM "User" WHERE "id" = auth.uid()::text
            )
        )
    );

SELECT 'ÍNDICES E RLS CONFIGURADOS COM SUCESSO - PARTE 2/3' as status;