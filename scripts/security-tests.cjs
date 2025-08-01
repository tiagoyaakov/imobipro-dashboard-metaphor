#!/usr/bin/env node

/**
 * Script de Testes de Segurança - ImobiPRO Dashboard
 * Executa validações automáticas das correções implementadas
 */

const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Contadores
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let warnings = 0;

function log(message, type = 'info') {
  const prefix = {
    error: `${colors.red}✗ ERROR:${colors.reset}`,
    success: `${colors.green}✓ SUCCESS:${colors.reset}`,
    warning: `${colors.yellow}⚠ WARNING:${colors.reset}`,
    info: `${colors.blue}ℹ INFO:${colors.reset}`,
    test: `${colors.cyan}🧪 TEST:${colors.reset}`
  };
  
  console.log(`${prefix[type] || prefix.info} ${message}`);
}

function testResult(testName, passed, message = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    log(`${testName} - PASSED ${message}`, 'success');
  } else {
    failedTests++;
    log(`${testName} - FAILED ${message}`, 'error');
  }
}

// Teste 1: Verificar se .env não está commitado
function testEnvNotCommitted() {
  log('Verificando se .env não está no repositório...', 'test');
  
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const envPath = path.join(process.cwd(), '.env');
  
  try {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    const hasEnvInGitignore = gitignore.includes('.env');
    const envExists = fs.existsSync(envPath);
    
    if (!hasEnvInGitignore) {
      testResult('Arquivo .env no .gitignore', false, '.env não está no .gitignore!');
    } else {
      testResult('Arquivo .env no .gitignore', true);
    }
    
    // Verificar se .env.example existe
    const envExampleExists = fs.existsSync(path.join(process.cwd(), '.env.example'));
    testResult('Arquivo .env.example existe', envExampleExists);
    
  } catch (error) {
    testResult('Verificação de .env', false, error.message);
  }
}

// Teste 2: Verificar IDs hardcoded
function testNoHardcodedIds() {
  log('Procurando por IDs hardcoded no código...', 'test');
  
  const srcDir = path.join(process.cwd(), 'src');
  const hardcodedPatterns = [
    /['"]\w{8}-\w{4}-\w{4}-\w{4}-\w{12}['"]/g, // UUIDs
    /company_id:\s*['"]\w{8}-/g,
    /workflow_id:\s*['"]\w+['"]/g,
    /webhookUrl:\s*['"]https?:\/\/[^'"]+['"]/g
  ];
  
  let foundHardcoded = false;
  const findings = [];
  
  function searchDir(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        searchDir(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        for (const pattern of hardcodedPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            // Ignorar IDs em arquivos de teste ou mock
            if (!filePath.includes('mock') && !filePath.includes('test')) {
              foundHardcoded = true;
              findings.push({
                file: filePath.replace(process.cwd(), '.'),
                matches: matches.slice(0, 3) // Primeiras 3 ocorrências
              });
            }
          }
        }
      }
    }
  }
  
  try {
    searchDir(srcDir);
    
    if (foundHardcoded) {
      testResult('Sem IDs hardcoded', false);
      findings.forEach(f => {
        log(`  Arquivo: ${f.file}`, 'warning');
        f.matches.forEach(m => log(`    Match: ${m}`, 'warning'));
      });
      warnings += findings.length;
    } else {
      testResult('Sem IDs hardcoded', true);
    }
  } catch (error) {
    testResult('Verificação de IDs hardcoded', false, error.message);
  }
}

// Teste 3: Verificar SecurityValidator
function testSecurityValidator() {
  log('Verificando implementação do SecurityValidator...', 'test');
  
  const validatorPath = path.join(process.cwd(), 'src/utils/security-validator.ts');
  
  try {
    const exists = fs.existsSync(validatorPath);
    testResult('SecurityValidator existe', exists);
    
    if (exists) {
      const content = fs.readFileSync(validatorPath, 'utf8');
      
      // Verificar métodos essenciais
      const hasValidateEnv = content.includes('validateEnvironment');
      const hasValidateUrl = content.includes('isValidUrl');
      const hasValidateJWT = content.includes('isValidJWT');
      const hasValidateProd = content.includes('import.meta.env.PROD');
      
      testResult('Método validateEnvironment', hasValidateEnv);
      testResult('Método isValidUrl', hasValidateUrl);
      testResult('Método isValidJWT', hasValidateJWT);
      testResult('Validação de produção', hasValidateProd);
    }
  } catch (error) {
    testResult('SecurityValidator', false, error.message);
  }
}

// Teste 4: Verificar AuthContext
function testAuthContext() {
  log('Verificando correções no AuthContext...', 'test');
  
  const authProviderPath = path.join(process.cwd(), 'src/contexts/AuthProvider.tsx');
  
  try {
    const content = fs.readFileSync(authProviderPath, 'utf8');
    
    // Verificar remoção de fallbacks inseguros
    const hasAdminFallback = content.includes("role: 'ADMIN' as UserRole");
    const hasRoleValidation = content.includes('getUserRole') || content.includes('validateRole');
    const hasErrorHandling = content.includes('throw') && content.includes('role');
    
    testResult('Sem fallback ADMIN', !hasAdminFallback);
    testResult('Validação de role implementada', hasRoleValidation);
    testResult('Tratamento de erros para roles', hasErrorHandling);
    
  } catch (error) {
    testResult('Verificação AuthContext', false, error.message);
  }
}

// Teste 5: Verificar proteção contra mock em produção
function testMockProtection() {
  log('Verificando proteção contra mock em produção...', 'test');
  
  const mockContextPath = path.join(process.cwd(), 'src/contexts/AuthContextMock.tsx');
  
  try {
    if (fs.existsSync(mockContextPath)) {
      const content = fs.readFileSync(mockContextPath, 'utf8');
      
      const hasProdCheck = content.includes('import.meta.env.PROD');
      const hasErrorThrow = content.includes('throw new Error') && content.includes('production');
      
      testResult('Verificação de produção no mock', hasProdCheck);
      testResult('Erro lançado em produção', hasErrorThrow);
    } else {
      log('AuthContextMock não encontrado - OK se não estiver usando mock', 'warning');
      warnings++;
    }
  } catch (error) {
    testResult('Verificação de mock', false, error.message);
  }
}

// Teste 6: Verificar scripts de build seguros
function testSecureBuildScripts() {
  log('Verificando scripts de build seguros...', 'test');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const scripts = packageJson.scripts || {};
    
    const hasSecurityCheck = scripts['security-check'] !== undefined;
    const hasBuildSafe = scripts['build:safe'] !== undefined;
    const hasPreDeploy = scripts['pre-deploy-checks'] !== undefined;
    
    testResult('Script security-check', hasSecurityCheck);
    testResult('Script build:safe', hasBuildSafe);
    testResult('Script pre-deploy-checks', hasPreDeploy);
    
  } catch (error) {
    testResult('Scripts de build', false, error.message);
  }
}

// Teste 7: Verificar configuração de ambiente
function testEnvConfiguration() {
  log('Verificando configuração de ambiente...', 'test');
  
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  try {
    if (fs.existsSync(envExamplePath)) {
      const content = fs.readFileSync(envExamplePath, 'utf8');
      
      // Verificar variáveis essenciais
      const hasSupabaseUrl = content.includes('VITE_SUPABASE_URL');
      const hasSupabaseKey = content.includes('VITE_SUPABASE_ANON_KEY');
      const hasUseRealAuth = content.includes('VITE_USE_REAL_AUTH');
      const hasSecurityComments = content.includes('SECURITY') || content.includes('IMPORTANT');
      
      testResult('VITE_SUPABASE_URL definida', hasSupabaseUrl);
      testResult('VITE_SUPABASE_ANON_KEY definida', hasSupabaseKey);
      testResult('VITE_USE_REAL_AUTH definida', hasUseRealAuth);
      testResult('Comentários de segurança', hasSecurityComments);
    } else {
      testResult('.env.example existe', false);
    }
  } catch (error) {
    testResult('Configuração de ambiente', false, error.message);
  }
}

// Executar todos os testes
function runAllTests() {
  console.log(colors.cyan + '\n========================================');
  console.log('🔒 TESTES DE SEGURANÇA - ImobiPRO Dashboard');
  console.log('========================================' + colors.reset + '\n');
  
  testEnvNotCommitted();
  console.log('');
  
  testNoHardcodedIds();
  console.log('');
  
  testSecurityValidator();
  console.log('');
  
  testAuthContext();
  console.log('');
  
  testMockProtection();
  console.log('');
  
  testSecureBuildScripts();
  console.log('');
  
  testEnvConfiguration();
  console.log('');
  
  // Relatório final
  console.log(colors.cyan + '========================================');
  console.log('📊 RELATÓRIO FINAL');
  console.log('========================================' + colors.reset);
  console.log(`Total de testes: ${totalTests}`);
  console.log(`${colors.green}Passou: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Falhou: ${failedTests}${colors.reset}`);
  console.log(`${colors.yellow}Avisos: ${warnings}${colors.reset}`);
  
  const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;
  console.log(`\nTaxa de sucesso: ${successRate}%`);
  
  if (failedTests === 0 && warnings === 0) {
    console.log(colors.green + '\n✅ Todos os testes de segurança passaram!' + colors.reset);
    process.exit(0);
  } else if (failedTests > 0) {
    console.log(colors.red + '\n❌ Falhas críticas de segurança detectadas!' + colors.reset);
    process.exit(1);
  } else {
    console.log(colors.yellow + '\n⚠️  Avisos de segurança detectados - revisar recomendado' + colors.reset);
    process.exit(0);
  }
}

// Executar
runAllTests();