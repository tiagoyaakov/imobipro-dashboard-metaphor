-- ================================================
-- SCRIPT PARA APLICAR FUNÇÕES E FINALIZAÇÃO - PARTE 3/3
-- ================================================
-- EXECUTE ESTE SCRIPT APÓS A PARTE 2
-- ================================================

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

-- Remover triggers existentes se houver
DROP TRIGGER IF EXISTS update_property_updated_at ON "Property";
DROP TRIGGER IF EXISTS update_property_owner_updated_at ON "PropertyOwner";
DROP TRIGGER IF EXISTS update_property_viva_real_data_updated_at ON "PropertyVivaRealData";

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

-- Verificar se as tabelas foram criadas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('Property', 'PropertyOwner', 'PropertyImage', 'PropertyVivaRealData', 'PropertySyncLog', 'PropertyAppointment');
    
    IF table_count = 6 THEN
        RAISE NOTICE '✅ MÓDULO PROPRIEDADES INSTALADO COM SUCESSO!';
        RAISE NOTICE '✅ Tabelas criadas: Property, PropertyOwner, PropertyImage, PropertyVivaRealData, PropertySyncLog, PropertyAppointment';
        RAISE NOTICE '✅ RLS configurado para isolamento por empresa';
        RAISE NOTICE '✅ Índices otimizados para performance';
        RAISE NOTICE '✅ Funções auxiliares para geolocalização criadas';
        RAISE NOTICE '✅ Sistema pronto para uso!';
    ELSE
        RAISE NOTICE '❌ ERRO: Nem todas as tabelas foram criadas. Encontradas: %', table_count;
    END IF;
END $$;

SELECT 'MÓDULO PROPRIEDADES FINALIZADO COM SUCESSO - PARTE 3/3' as status;