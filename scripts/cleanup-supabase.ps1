# 🧹 Script de Limpeza Completa - Resquícios Supabase
# ImobiPRO Dashboard - Migração para Clerk

Write-Host "🚀 Iniciando limpeza completa dos resquícios do Supabase..." -ForegroundColor Green
Write-Host "📋 Este script irá verificar e remover todos os vestígios do Supabase Auth" -ForegroundColor Yellow
Write-Host ""

# Função para verificar se um comando existe
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script a partir da raiz do projeto" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Verificando estrutura do projeto..." -ForegroundColor Cyan

# ========================================
# ETAPA 1: Verificar e Remover Arquivos
# ========================================

Write-Host "`n🔍 ETAPA 1: Verificando arquivos relacionados ao Supabase..." -ForegroundColor Magenta

$supabaseFiles = @(
    "src/integrations/supabase",
    "src/contexts/AuthContext.tsx",
    "src/contexts/AuthContextMock.tsx",
    "src/types/supabase.ts",
    "src/types/database.ts",
    "supabase/config.toml",
    "supabase/migrations",
    ".env.local.example"
)

foreach ($file in $supabaseFiles) {
    if (Test-Path $file) {
        Write-Host "🗑️  Removendo: $file" -ForegroundColor Yellow
        if (Test-Path $file -PathType Container) {
            Remove-Item $file -Recurse -Force
        } else {
            Remove-Item $file -Force
        }
        Write-Host "✅ Removido com sucesso" -ForegroundColor Green
    } else {
        Write-Host "✅ Já removido ou não existe: $file" -ForegroundColor DarkGreen
    }
}

# ========================================
# ETAPA 2: Verificar package.json
# ========================================

Write-Host "`n🔍 ETAPA 2: Verificando dependências no package.json..." -ForegroundColor Magenta

if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    
    $supabaseDeps = @()
    
    # Verificar dependencies
    if ($packageJson.dependencies) {
        foreach ($dep in $packageJson.dependencies.PSObject.Properties) {
            if ($dep.Name -like "*supabase*") {
                $supabaseDeps += $dep.Name
            }
        }
    }
    
    # Verificar devDependencies
    if ($packageJson.devDependencies) {
        foreach ($dep in $packageJson.devDependencies.PSObject.Properties) {
            if ($dep.Name -like "*supabase*") {
                $supabaseDeps += $dep.Name
            }
        }
    }
    
    if ($supabaseDeps.Count -gt 0) {
        Write-Host "🗑️  Dependências Supabase encontradas:" -ForegroundColor Yellow
        foreach ($dep in $supabaseDeps) {
            Write-Host "   - $dep" -ForegroundColor Yellow
        }
        
        Write-Host "🔧 Removendo dependências..." -ForegroundColor Cyan
        if (Test-Command "pnpm") {
            foreach ($dep in $supabaseDeps) {
                pnpm remove $dep
            }
        } elseif (Test-Command "npm") {
            foreach ($dep in $supabaseDeps) {
                npm uninstall $dep
            }
        } else {
            Write-Host "⚠️  Nenhum gerenciador de pacotes encontrado (pnpm/npm)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✅ Nenhuma dependência Supabase encontrada" -ForegroundColor Green
    }
}

# ========================================
# ETAPA 3: Verificar Imports e Referências
# ========================================

Write-Host "`n🔍 ETAPA 3: Verificando imports e referências..." -ForegroundColor Magenta

# Procurar por imports do Supabase
$supabaseImports = Select-String -Path "src\**\*.ts*" -Pattern "from.*supabase|import.*supabase" -ErrorAction SilentlyContinue

if ($supabaseImports) {
    Write-Host "⚠️  Imports do Supabase encontrados:" -ForegroundColor Yellow
    foreach ($import in $supabaseImports) {
        Write-Host "   📄 $($import.Filename):$($import.LineNumber) - $($import.Line.Trim())" -ForegroundColor Yellow
    }
    Write-Host "🔧 Estes imports precisam ser removidos manualmente" -ForegroundColor Red
} else {
    Write-Host "✅ Nenhum import do Supabase encontrado" -ForegroundColor Green
}

# Procurar por createClient do Supabase
$createClientRefs = Select-String -Path "src\**\*.ts*" -Pattern "createClient" -ErrorAction SilentlyContinue | Where-Object { $_.Line -notmatch "QueryClient" }

if ($createClientRefs) {
    Write-Host "⚠️  Referências ao createClient encontradas:" -ForegroundColor Yellow
    foreach ($ref in $createClientRefs) {
        Write-Host "   📄 $($ref.Filename):$($ref.LineNumber) - $($ref.Line.Trim())" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Nenhuma referência ao createClient do Supabase encontrada" -ForegroundColor Green
}

# Procurar por AuthContext em uso
$authContextRefs = Select-String -Path "src\**\*.ts*" -Pattern "AuthContext" -ErrorAction SilentlyContinue

if ($authContextRefs) {
    Write-Host "⚠️  Referências ao AuthContext encontradas:" -ForegroundColor Yellow
    foreach ($ref in $authContextRefs) {
        Write-Host "   📄 $($ref.Filename):$($ref.LineNumber) - $($ref.Line.Trim())" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Nenhuma referência ao AuthContext encontrada" -ForegroundColor Green
}

# ========================================
# ETAPA 4: Verificar Variáveis de Ambiente
# ========================================

Write-Host "`n🔍 ETAPA 4: Verificando variáveis de ambiente..." -ForegroundColor Magenta

$envFiles = @(".env", ".env.local", ".env.example")
$supabaseEnvVars = @()

foreach ($envFile in $envFiles) {
    if (Test-Path $envFile) {
        $envContent = Get-Content $envFile -ErrorAction SilentlyContinue
        $supabaseLines = $envContent | Select-String -Pattern "SUPABASE" -ErrorAction SilentlyContinue
        
        if ($supabaseLines) {
            Write-Host "⚠️  Variáveis Supabase encontradas em $envFile`:" -ForegroundColor Yellow
            foreach ($line in $supabaseLines) {
                Write-Host "   - $($line.Line)" -ForegroundColor Yellow
                $supabaseEnvVars += @{File = $envFile; Line = $line.Line}
            }
        }
    }
}

if ($supabaseEnvVars.Count -eq 0) {
    Write-Host "✅ Nenhuma variável de ambiente Supabase encontrada" -ForegroundColor Green
} else {
    Write-Host "🔧 Recomenda-se remover essas variáveis manualmente" -ForegroundColor Red
}

# ========================================
# ETAPA 5: Verificar Types e Schemas
# ========================================

Write-Host "`n🔍 ETAPA 5: Verificando types e schemas..." -ForegroundColor Magenta

# Procurar por types relacionados ao Supabase
$supabaseTypes = Select-String -Path "src\**\*.ts" -Pattern "Database|SupabaseClient|AuthSession" -ErrorAction SilentlyContinue

if ($supabaseTypes) {
    Write-Host "⚠️  Types do Supabase encontrados:" -ForegroundColor Yellow
    foreach ($type in $supabaseTypes) {
        Write-Host "   📄 $($type.Filename):$($type.LineNumber) - $($type.Line.Trim())" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Nenhum type do Supabase encontrado" -ForegroundColor Green
}

# Verificar schema.prisma por referências antigas
if (Test-Path "schema.prisma") {
    $schemaSupabase = Select-String -Path "schema.prisma" -Pattern "supabase" -ErrorAction SilentlyContinue
    if ($schemaSupabase) {
        Write-Host "⚠️  Referências ao Supabase encontradas no schema.prisma:" -ForegroundColor Yellow
        foreach ($ref in $schemaSupabase) {
            Write-Host "   📄 Linha $($ref.LineNumber): $($ref.Line.Trim())" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✅ Nenhuma referência ao Supabase no schema.prisma" -ForegroundColor Green
    }
}

# ========================================
# ETAPA 6: Verificar Build do Projeto
# ========================================

Write-Host "`n🔍 ETAPA 6: Verificando build do projeto..." -ForegroundColor Magenta

if (Test-Command "pnpm") {
    Write-Host "🔧 Executando build com pnpm..." -ForegroundColor Cyan
    $buildResult = pnpm build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build executado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Build falhou. Verifique os erros acima." -ForegroundColor Red
        Write-Host $buildResult -ForegroundColor Red
    }
} elseif (Test-Command "npm") {
    Write-Host "🔧 Executando build com npm..." -ForegroundColor Cyan
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build executado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Build falhou. Verifique os erros acima." -ForegroundColor Red
        Write-Host $buildResult -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Nenhum gerenciador de pacotes encontrado para executar build" -ForegroundColor Yellow
}

# ========================================
# ETAPA 7: Instalar Dependências do Clerk
# ========================================

Write-Host "`n🔍 ETAPA 7: Verificando dependências do Clerk..." -ForegroundColor Magenta

if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    
    $hasClerkReact = $packageJson.dependencies.'@clerk/clerk-react' -ne $null
    $hasClerkReactRouter = $packageJson.dependencies.'@clerk/react-router' -ne $null
    
    if ($hasClerkReact -and -not $hasClerkReactRouter) {
        Write-Host "🔧 Migração necessária: @clerk/clerk-react → @clerk/react-router" -ForegroundColor Yellow
        
        if (Test-Command "pnpm") {
            Write-Host "📦 Removendo @clerk/clerk-react..." -ForegroundColor Cyan
            pnpm remove @clerk/clerk-react
            Write-Host "📦 Instalando @clerk/react-router..." -ForegroundColor Cyan
            pnpm add @clerk/react-router
        } elseif (Test-Command "npm") {
            Write-Host "📦 Removendo @clerk/clerk-react..." -ForegroundColor Cyan
            npm uninstall @clerk/clerk-react
            Write-Host "📦 Instalando @clerk/react-router..." -ForegroundColor Cyan
            npm install @clerk/react-router
        }
        
        Write-Host "✅ Migração de dependência concluída!" -ForegroundColor Green
    } elseif ($hasClerkReactRouter) {
        Write-Host "✅ @clerk/react-router já está instalado" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Nenhuma dependência do Clerk encontrada" -ForegroundColor Yellow
        Write-Host "📦 Instalando @clerk/react-router..." -ForegroundColor Cyan
        
        if (Test-Command "pnpm") {
            pnpm add @clerk/react-router
        } elseif (Test-Command "npm") {
            npm install @clerk/react-router
        }
    }
}

# ========================================
# RESUMO FINAL
# ========================================

Write-Host "`n📋 RESUMO FINAL DA LIMPEZA" -ForegroundColor Magenta
Write-Host "=================================" -ForegroundColor Magenta

Write-Host "✅ Arquivos removidos automaticamente" -ForegroundColor Green
Write-Host "✅ Dependências verificadas e limpas" -ForegroundColor Green
Write-Host "✅ Build testado" -ForegroundColor Green
Write-Host "✅ Dependências do Clerk verificadas" -ForegroundColor Green

Write-Host "`n🔍 AÇÕES MANUAIS NECESSÁRIAS:" -ForegroundColor Yellow
Write-Host "1. Revisar e remover imports do Supabase encontrados" -ForegroundColor Yellow
Write-Host "2. Remover variáveis de ambiente do Supabase encontradas" -ForegroundColor Yellow
Write-Host "3. Atualizar componentes que ainda referenciam AuthContext" -ForegroundColor Yellow
Write-Host "4. Testar todas as funcionalidades de autenticação" -ForegroundColor Yellow

Write-Host "`n🚀 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Configurar variáveis de ambiente do Clerk" -ForegroundColor Cyan
Write-Host "2. Atualizar main.tsx para usar @clerk/react-router" -ForegroundColor Cyan
Write-Host "3. Migrar componentes para hooks do Clerk" -ForegroundColor Cyan
Write-Host "4. Executar testes de integração" -ForegroundColor Cyan

Write-Host "`n🎉 Limpeza concluída! Verifique os itens acima e prossiga com a implementação do Clerk." -ForegroundColor Green
Write-Host "📖 Consulte o arquivo CLERK_IMPLEMENTATION.md para instruções detalhadas." -ForegroundColor Green 