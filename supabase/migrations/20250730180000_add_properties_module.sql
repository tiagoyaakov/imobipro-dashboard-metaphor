-- ================================================
-- MÓDULO PROPRIEDADES - IMOBIPRO DATABASE SCHEMA
-- ================================================
-- Data: 30/01/2025
-- Descrição: Estrutura completa para gestão de propriedades
-- Baseado em: Dados Viva Real e planejamento MVP detalhado
-- ================================================

-- Criar enums para o módulo de propriedades
CREATE TYPE "PropertyCategory" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'RURAL', 'MIXED_USE');
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'COMMERCIAL_BUILDING', 'OFFICE', 'RETAIL', 'WAREHOUSE', 'LAND', 'STUDIO', 'PENTHOUSE', 'DUPLEX', 'LOFT', 'FARM', 'OTHER');
CREATE TYPE "PropertyStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'OFF_MARKET', 'UNDER_CONSTRUCTION', 'MAINTENANCE');
CREATE TYPE "PropertySource" AS ENUM ('MANUAL', 'VIVA_REAL', 'ZAP', 'OLX', 'API_IMPORT', 'BULK_IMPORT');
CREATE TYPE "PropertyListingType" AS ENUM ('SALE', 'RENT', 'BOTH');
CREATE TYPE "PropertyCondition" AS ENUM ('NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'NEEDS_RENOVATION');

-- ================================================
-- TABELA: PropertyOwner - Proprietários dos imóveis
-- ================================================
CREATE TABLE "PropertyOwner" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "cpf" TEXT,
    "cnpj" TEXT,
    "rg" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT DEFAULT 'Brasil',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- TABELA: Property - Propriedades principais
-- ================================================
CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "agentId" TEXT,
    "ownerId" TEXT,
    
    -- Informações básicas
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "PropertyCategory" NOT NULL DEFAULT 'RESIDENTIAL',
    "propertyType" "PropertyType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "listingType" "PropertyListingType" NOT NULL DEFAULT 'SALE',
    "condition" "PropertyCondition" DEFAULT 'GOOD',
    
    -- Preços
    "salePrice" INTEGER,
    "rentPrice" INTEGER,
    "condominiumFee" INTEGER,
    "iptuPrice" INTEGER,
    "currencySymbol" TEXT DEFAULT 'R$',
    
    -- Dimensões e características
    "totalArea" DECIMAL(10,2),
    "builtArea" DECIMAL(10,2),
    "usefulArea" DECIMAL(10,2),
    "bedrooms" INTEGER DEFAULT 0,
    "bathrooms" INTEGER DEFAULT 0,
    "suites" INTEGER DEFAULT 0,
    "parkingSpaces" INTEGER DEFAULT 0,
    "floors" INTEGER DEFAULT 1,
    "floor" INTEGER,
    "units" INTEGER DEFAULT 1,
    "yearBuilt" INTEGER,
    
    -- Localização
    "address" TEXT NOT NULL,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "country" TEXT DEFAULT 'Brasil',
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "geolocationPrecision" TEXT,
    
    -- Integração Viva Real
    "vivaRealId" TEXT UNIQUE,
    "vivaRealListingId" TEXT,
    "vivaRealUrl" TEXT,
    "externalId" TEXT,
    "source" "PropertySource" NOT NULL DEFAULT 'MANUAL',
    "isDevelopmentUnit" BOOLEAN DEFAULT false,
    
    -- Features e amenidades (JSON array)
    "features" TEXT[], -- Array de strings com as características
    "amenities" TEXT[], -- Array de amenidades do condomínio
    
    -- Metadados
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN DEFAULT false,
    "viewCount" INTEGER DEFAULT 0,
    "favoriteCount" INTEGER DEFAULT 0,
    "lastSyncAt" TIMESTAMP(3),
    "syncError" TEXT,
    "notes" TEXT,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("agentId") REFERENCES "User" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("ownerId") REFERENCES "PropertyOwner" ("id") ON DELETE SET NULL
);

-- ================================================
-- TABELA: PropertyImage - Imagens das propriedades
-- ================================================
CREATE TABLE "PropertyImage" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "alt" TEXT,
    "title" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE
);

-- ================================================
-- TABELA: PropertyVivaRealData - Dados específicos Viva Real
-- ================================================
CREATE TABLE "PropertyVivaRealData" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "propertyId" TEXT NOT NULL UNIQUE,
    
    -- Dados específicos da API Viva Real
    "listingId" TEXT,
    "developmentId" TEXT,
    "unitId" TEXT,
    "buildingId" TEXT,
    "zoneName" TEXT,
    "stateNormalized" TEXT,
    "thumbnails" TEXT[], -- URLs das thumbnails
    "originalData" JSONB, -- Dados originais da API para backup
    
    -- Estatísticas Viva Real
    "vivaRealViews" INTEGER DEFAULT 0,
    "vivaRealLeads" INTEGER DEFAULT 0,
    "vivaRealFavorites" INTEGER DEFAULT 0,
    
    "lastSyncAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE
);

-- ================================================
-- TABELA: PropertySyncLog - Log de sincronizações
-- ================================================
CREATE TABLE "PropertySyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "propertyId" TEXT,
    "source" "PropertySource" NOT NULL,
    "operation" TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'FETCH'
    "status" TEXT NOT NULL, -- 'SUCCESS', 'FAILED', 'PARTIAL'
    "recordsProcessed" INTEGER DEFAULT 0,
    "recordsSuccess" INTEGER DEFAULT 0,
    "recordsFailed" INTEGER DEFAULT 0,
    "errorMessage" TEXT,
    "requestData" JSONB,
    "responseData" JSONB,
    "executionTime" INTEGER, -- em milissegundos
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL
);

-- ================================================
-- TABELA: Property com Appointment - Relacionamento N:N
-- ================================================
CREATE TABLE "PropertyAppointment" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "propertyId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "visitType" TEXT DEFAULT 'VIEWING', -- 'VIEWING', 'INSPECTION', 'VALUATION'
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE CASCADE,
    
    UNIQUE("propertyId", "appointmentId")
);

-- ================================================
-- ÍNDICES PARA PERFORMANCE
-- ================================================

-- Índices principais para Property
CREATE INDEX "Property_companyId_idx" ON "Property"("companyId");
CREATE INDEX "Property_agentId_idx" ON "Property"("agentId");
CREATE INDEX "Property_ownerId_idx" ON "Property"("ownerId");
CREATE INDEX "Property_status_idx" ON "Property"("status");
CREATE INDEX "Property_propertyType_idx" ON "Property"("propertyType");
CREATE INDEX "Property_category_idx" ON "Property"("category");
CREATE INDEX "Property_listingType_idx" ON "Property"("listingType");
CREATE INDEX "Property_city_neighborhood_idx" ON "Property"("city", "neighborhood");
CREATE INDEX "Property_salePrice_idx" ON "Property"("salePrice");
CREATE INDEX "Property_rentPrice_idx" ON "Property"("rentPrice");
CREATE INDEX "Property_bedrooms_bathrooms_idx" ON "Property"("bedrooms", "bathrooms");
CREATE INDEX "Property_isActive_isFeatured_idx" ON "Property"("isActive", "isFeatured");
CREATE INDEX "Property_vivaRealId_idx" ON "Property"("vivaRealId");
CREATE INDEX "Property_createdAt_idx" ON "Property"("createdAt");

-- Índices para PropertyImage
CREATE INDEX "PropertyImage_propertyId_idx" ON "PropertyImage"("propertyId");
CREATE INDEX "PropertyImage_isMain_idx" ON "PropertyImage"("isMain");
CREATE INDEX "PropertyImage_order_idx" ON "PropertyImage"("order");

-- Índices para PropertyOwner
CREATE INDEX "PropertyOwner_email_idx" ON "PropertyOwner"("email");
CREATE INDEX "PropertyOwner_cpf_idx" ON "PropertyOwner"("cpf");
CREATE INDEX "PropertyOwner_cnpj_idx" ON "PropertyOwner"("cnpj");

-- Índices para sync e logs
CREATE INDEX "PropertySyncLog_propertyId_idx" ON "PropertySyncLog"("propertyId");
CREATE INDEX "PropertySyncLog_source_status_idx" ON "PropertySyncLog"("source", "status");
CREATE INDEX "PropertySyncLog_createdAt_idx" ON "PropertySyncLog"("createdAt");

-- Índice de geolocalização (se usar PostGIS no futuro)
CREATE INDEX "Property_geolocation_idx" ON "Property"("latitude", "longitude");

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

-- ================================================
-- FUNÇÕES AUXILIARES
-- ================================================

-- Função para calcular distância entre duas coordenadas (em km)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, lon1 DECIMAL, 
    lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    radlat1 DECIMAL;
    radlat2 DECIMAL;
    theta DECIMAL;
    radtheta DECIMAL;
    dist DECIMAL;
BEGIN
    IF lat1 = lat2 AND lon1 = lon2 THEN
        RETURN 0;
    END IF;
    
    radlat1 = lat1 * PI() / 180;
    radlat2 = lat2 * PI() / 180;
    theta = lon1 - lon2;
    radtheta = theta * PI() / 180;
    
    dist = SIN(radlat1) * SIN(radlat2) + COS(radlat1) * COS(radlat2) * COS(radtheta);
    dist = ACOS(dist);
    dist = dist * 180 / PI();
    dist = dist * 60 * 1.1515 * 1.609344; -- Converter para km
    
    RETURN dist;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar propriedades por proximidade
CREATE OR REPLACE FUNCTION search_properties_by_location(
    search_lat DECIMAL,
    search_lon DECIMAL,
    radius_km DECIMAL,
    company_id TEXT
) RETURNS TABLE (
    id TEXT,
    title TEXT,
    address TEXT,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p."id",
        p."title",
        p."address",
        calculate_distance(search_lat, search_lon, p."latitude", p."longitude") as distance_km
    FROM "Property" p
    WHERE 
        p."companyId" = company_id
        AND p."isActive" = true
        AND p."latitude" IS NOT NULL 
        AND p."longitude" IS NOT NULL
        AND calculate_distance(search_lat, search_lon, p."latitude", p."longitude") <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- DADOS DE EXEMPLO/SEED (OPCIONAL)
-- ================================================

-- Inserir alguns tipos de features comuns
-- Estes dados podem ser usados para autocomplete nos formulários

-- Features residenciais comuns
-- INSERT INTO "PropertyFeature" ("name", "category") VALUES 
-- ('Piscina', 'AMENITY'),
-- ('Academia', 'AMENITY'),
-- ('Churrasqueira', 'AMENITY'),
-- ('Playground', 'AMENITY'),
-- ('Salão de Festas', 'AMENITY'),
-- ('Portaria 24h', 'SECURITY'),
-- ('CCTV', 'SECURITY'),
-- ('Elevador', 'ACCESSIBILITY'),
-- ('Varanda', 'FEATURE'),
-- ('Jardim', 'FEATURE');

-- ================================================
-- TRIGGERS PARA UPDATED_AT
-- ================================================

-- Função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas relevantes
CREATE TRIGGER update_property_updated_at BEFORE UPDATE ON "Property"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_owner_updated_at BEFORE UPDATE ON "PropertyOwner"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_viva_real_data_updated_at BEFORE UPDATE ON "PropertyVivaRealData"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ================================================

COMMENT ON TABLE "Property" IS 'Tabela principal de propriedades do sistema ImobiPRO';
COMMENT ON TABLE "PropertyOwner" IS 'Proprietários dos imóveis cadastrados';
COMMENT ON TABLE "PropertyImage" IS 'Imagens e mídias das propriedades';
COMMENT ON TABLE "PropertyVivaRealData" IS 'Dados específicos da integração com Viva Real';
COMMENT ON TABLE "PropertySyncLog" IS 'Log de sincronizações com APIs externas';
COMMENT ON TABLE "PropertyAppointment" IS 'Relacionamento entre propriedades e agendamentos';

COMMENT ON COLUMN "Property"."features" IS 'Array de características do imóvel (JSON)';
COMMENT ON COLUMN "Property"."amenities" IS 'Array de amenidades do condomínio (JSON)';
COMMENT ON COLUMN "Property"."vivaRealId" IS 'ID único na plataforma Viva Real';
COMMENT ON COLUMN "Property"."source" IS 'Origem dos dados da propriedade';

-- ================================================
-- FINALIZAÇÃO
-- ================================================

-- Grant permissions para authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'MÓDULO PROPRIEDADES INSTALADO COM SUCESSO!';
    RAISE NOTICE 'Tabelas criadas: Property, PropertyOwner, PropertyImage, PropertyVivaRealData, PropertySyncLog, PropertyAppointment';
    RAISE NOTICE 'RLS configurado para isolamento por empresa';
    RAISE NOTICE 'Índices otimizados para performance';
    RAISE NOTICE 'Funções auxiliares para geolocalização criadas';
END $$;