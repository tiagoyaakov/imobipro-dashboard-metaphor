-- ================================================
-- SCRIPT PARA APLICAR MIGRAÇÃO DO MÓDULO PROPRIEDADES
-- ================================================
-- EXECUTE ESTE SCRIPT NO SUPABASE SQL EDITOR
-- URL: https://app.supabase.com/project/eeceyvenrnyyqvilezgr/sql
-- ================================================

-- Primeiro, vamos verificar se os tipos já existem para evitar erros
DO $$
BEGIN
    -- Criar enums apenas se não existirem
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PropertyCategory') THEN
        CREATE TYPE "PropertyCategory" AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'RURAL', 'MIXED_USE');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PropertyType') THEN
        CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'COMMERCIAL_BUILDING', 'OFFICE', 'RETAIL', 'WAREHOUSE', 'LAND', 'STUDIO', 'PENTHOUSE', 'DUPLEX', 'LOFT', 'FARM', 'OTHER');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PropertyStatus') THEN
        CREATE TYPE "PropertyStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'OFF_MARKET', 'UNDER_CONSTRUCTION', 'MAINTENANCE');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PropertySource') THEN
        CREATE TYPE "PropertySource" AS ENUM ('MANUAL', 'VIVA_REAL', 'ZAP', 'OLX', 'API_IMPORT', 'BULK_IMPORT');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PropertyListingType') THEN
        CREATE TYPE "PropertyListingType" AS ENUM ('SALE', 'RENT', 'BOTH');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PropertyCondition') THEN
        CREATE TYPE "PropertyCondition" AS ENUM ('NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'NEEDS_RENOVATION');
    END IF;
END $$;

-- ================================================
-- TABELA: PropertyOwner - Proprietários dos imóveis
-- ================================================
CREATE TABLE IF NOT EXISTS "PropertyOwner" (
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
CREATE TABLE IF NOT EXISTS "Property" (
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
CREATE TABLE IF NOT EXISTS "PropertyImage" (
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
CREATE TABLE IF NOT EXISTS "PropertyVivaRealData" (
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
CREATE TABLE IF NOT EXISTS "PropertySyncLog" (
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
CREATE TABLE IF NOT EXISTS "PropertyAppointment" (
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
-- FINALIZAÇÃO PRIMEIRA PARTE
-- ================================================
SELECT 'TABELAS CRIADAS COM SUCESSO - PARTE 1/3' as status;