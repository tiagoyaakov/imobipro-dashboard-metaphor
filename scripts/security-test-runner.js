#!/usr/bin/env node

/**
 * 🔒 Security Test Runner - ImobiPRO Dashboard
 * 
 * Script especializado para executar e validar testes de segurança
 * Garante que todas as correções críticas de segurança estão funcionando
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Cores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Configuração dos testes de segurança
const SECURITY_TESTS = {
  'SecurityValidator': {
    pattern: 'src/utils/security-validator.test.ts',
    description: 'Validações críticas de segurança',
    weight: 40
  },
  'AuthContext': {
    pattern: 'src/contexts/AuthContext.test.tsx',
    description: 'Segurança do contexto de autenticação',
    weight: 35
  },
  'AuthConfig': {
    pattern: 'src/config/auth.test.ts',
    description: 'Configuração segura de autenticação',
    weight: 25
  }
};

// Verificações críticas que devem passar
const CRITICAL_CHECKS = [
  'should block mock auth in production',
  'should never use ADMIN as fallback role',
  'should use dynamic company ID',
  'should detect hardcoded IDs',
  'should reject HTTP URLs in production',
  'should validate JWT format correctly'
];

class SecurityTestRunner {
  constructor() {
    this.results = {};
    this.totalScore = 0;
    this.criticalFailures = [];
  }

  async run() {
    console.log(colors.bold + colors.cyan + '🔒 ImobiPRO Security Test Runner' + colors.reset);
    console.log('=====================================\n');

    try {
      // 1. Verificar configuração do ambiente
      await this.checkEnvironment();

      // 2. Executar testes de segurança
      await this.runSecurityTests();

      // 3. Analisar resultados
      await this.analyzeResults();

      // 4. Gerar relatório
      await this.generateReport();

      // 5. Verificar thresholds críticos
      await this.checkCriticalThresholds();

    } catch (error) {
      console.error(colors.red + '❌ Erro durante execução dos testes:' + colors.reset);
      console.error(error.message);
      process.exit(1);
    }
  }

  async checkEnvironment() {
    console.log(colors.blue + '🔍 Verificando ambiente de teste...' + colors.reset);

    // Verificar se Vitest está instalado
    try {
      execSync('npx vitest --version', { cwd: rootDir, stdio: 'pipe' });
      console.log(colors.green + '✅ Vitest configurado corretamente' + colors.reset);
    } catch {
      throw new Error('Vitest não encontrado. Execute: pnpm install');
    }

    // Verificar se arquivos de teste existem
    for (const [name, config] of Object.entries(SECURITY_TESTS)) {
      const testPath = path.join(rootDir, config.pattern);
      if (fs.existsSync(testPath)) {
        console.log(colors.green + `✅ ${name} - Arquivo de teste encontrado` + colors.reset);
      } else {
        throw new Error(`Arquivo de teste não encontrado: ${config.pattern}`);
      }
    }

    console.log();
  }

  async runSecurityTests() {
    console.log(colors.blue + '🧪 Executando testes de segurança...' + colors.reset);

    for (const [name, config] of Object.entries(SECURITY_TESTS)) {
      console.log(colors.cyan + `\n📋 Executando: ${name}` + colors.reset);
      console.log(`   Descrição: ${config.description}`);
      
      try {
        const output = execSync(
          `npx vitest run ${config.pattern} --reporter=verbose --no-coverage`,
          { 
            cwd: rootDir, 
            encoding: 'utf8',
            stdio: 'pipe'
          }
        );

        const result = this.parseTestOutput(output);
        this.results[name] = {
          ...result,
          weight: config.weight,
          description: config.description
        };

        const status = result.passed === result.total ? 
          colors.green + '✅ PASSOU' : 
          colors.red + '❌ FALHOU';
        
        console.log(`   Status: ${status}${colors.reset} (${result.passed}/${result.total})`);

      } catch (error) {
        console.error(colors.red + `   ❌ Erro na execução: ${error.message}` + colors.reset);
        this.results[name] = {
          passed: 0,
          total: 0,
          failed: [],
          weight: config.weight,
          error: error.message
        };
      }
    }

    console.log();
  }

  parseTestOutput(output) {
    const lines = output.split('\n');
    
    // Extrair estatísticas do Vitest
    const testResults = {
      passed: 0,
      total: 0,
      failed: [],
      criticalFailures: []
    };

    let inFailureSection = false;
    let currentFailure = '';

    for (const line of lines) {
      // Detectar resumo de testes
      if (line.includes('Test Files') && line.includes('passed')) {
        const match = line.match(/(\d+) passed/);
        if (match) testResults.passed = parseInt(match[1]);
      }

      if (line.includes('Tests') && line.includes('passed')) {
        const passedMatch = line.match(/(\d+) passed/);
        const failedMatch = line.match(/(\d+) failed/);
        
        if (passedMatch) testResults.passed = parseInt(passedMatch[1]);
        if (failedMatch) testResults.total = testResults.passed + parseInt(failedMatch[1]);
        else testResults.total = testResults.passed;
      }

      // Detectar falhas críticas
      if (line.includes('FAIL')) {
        inFailureSection = true;
        currentFailure = line;
      } else if (inFailureSection && line.trim()) {
        currentFailure += '\n' + line;
      } else if (inFailureSection && !line.trim()) {
        testResults.failed.push(currentFailure);
        
        // Verificar se é uma falha crítica
        for (const critical of CRITICAL_CHECKS) {
          if (currentFailure.includes(critical)) {
            testResults.criticalFailures.push(critical);
            break;
          }
        }
        
        inFailureSection = false;
        currentFailure = '';
      }
    }

    return testResults;
  }

  async analyzeResults() {
    console.log(colors.blue + '📊 Analisando resultados...' + colors.reset);

    let totalTests = 0;
    let totalPassed = 0;
    let weightedScore = 0;

    for (const [name, result] of Object.entries(this.results)) {
      if (result.error) {
        console.log(colors.red + `❌ ${name}: Erro na execução` + colors.reset);
        continue;
      }

      totalTests += result.total;
      totalPassed += result.passed;

      const successRate = result.total > 0 ? (result.passed / result.total) : 0;
      const weightedContribution = successRate * result.weight;
      weightedScore += weightedContribution;

      console.log(`   ${name}: ${result.passed}/${result.total} (${(successRate * 100).toFixed(1)}%) - Peso: ${result.weight}%`);

      // Coletar falhas críticas
      if (result.criticalFailures) {
        this.criticalFailures.push(...result.criticalFailures);
      }
    }

    this.totalScore = weightedScore;
    
    console.log();
    console.log(colors.bold + `📈 Score Total de Segurança: ${this.totalScore.toFixed(1)}%` + colors.reset);
    console.log(`📋 Testes Totais: ${totalPassed}/${totalTests}`);
    
    if (this.criticalFailures.length > 0) {
      console.log(colors.red + colors.bold + `🚨 Falhas Críticas Detectadas: ${this.criticalFailures.length}` + colors.reset);
    }

    console.log();
  }

  async generateReport() {
    console.log(colors.blue + '📄 Gerando relatório de segurança...' + colors.reset);

    const reportData = {
      timestamp: new Date().toISOString(),
      totalScore: this.totalScore,
      criticalFailures: this.criticalFailures,
      results: this.results,
      environment: {
        node: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    };

    const reportPath = path.join(rootDir, 'security-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    console.log(colors.green + `✅ Relatório salvo em: ${reportPath}` + colors.reset);

    // Gerar relatório em formato legível
    await this.generateHumanReadableReport(reportData);
  }

  async generateHumanReadableReport(data) {
    const reportLines = [
      '🔒 RELATÓRIO DE SEGURANÇA - ImobiPRO Dashboard',
      '='.repeat(50),
      '',
      `📅 Data: ${new Date(data.timestamp).toLocaleString('pt-BR')}`,
      `📊 Score Total: ${data.totalScore.toFixed(1)}%`,
      '',
      '📋 RESULTADOS POR MÓDULO:',
      '-'.repeat(30)
    ];

    for (const [name, result] of Object.entries(data.results)) {
      const status = result.error ? '❌ ERRO' : 
                    result.passed === result.total ? '✅ PASSOU' : '⚠️  FALHOU';
      
      reportLines.push(`${status} ${name}:`);
      reportLines.push(`   Descrição: ${result.description}`);
      
      if (result.error) {
        reportLines.push(`   Erro: ${result.error}`);
      } else {
        reportLines.push(`   Testes: ${result.passed}/${result.total}`);
        reportLines.push(`   Peso: ${result.weight}%`);
      }
      
      reportLines.push('');
    }

    if (data.criticalFailures.length > 0) {
      reportLines.push('🚨 FALHAS CRÍTICAS:');
      reportLines.push('-'.repeat(20));
      data.criticalFailures.forEach(failure => {
        reportLines.push(`❌ ${failure}`);
      });
      reportLines.push('');
    }

    reportLines.push('📈 AVALIAÇÃO:');
    reportLines.push('-'.repeat(15));
    
    if (data.totalScore >= 95) {
      reportLines.push('🟢 EXCELENTE - Segurança em alto nível');
    } else if (data.totalScore >= 85) {
      reportLines.push('🟡 BOM - Pequenos ajustes recomendados');
    } else if (data.totalScore >= 70) {
      reportLines.push('🟠 ATENÇÃO - Melhorias necessárias');
    } else {
      reportLines.push('🔴 CRÍTICO - Ação imediata necessária');
    }

    const readableReportPath = path.join(rootDir, 'security-test-report.txt');
    fs.writeFileSync(readableReportPath, reportLines.join('\n'));

    console.log(colors.green + `📄 Relatório legível salvo em: ${readableReportPath}` + colors.reset);
  }

  async checkCriticalThresholds() {
    console.log(colors.blue + '🎯 Verificando thresholds críticos...' + colors.reset);

    const issues = [];

    // Threshold de score mínimo
    if (this.totalScore < 85) {
      issues.push(`Score de segurança muito baixo: ${this.totalScore.toFixed(1)}% (mínimo: 85%)`);
    }

    // Falhas críticas
    if (this.criticalFailures.length > 0) {
      issues.push(`${this.criticalFailures.length} falhas críticas de segurança detectadas`);
    }

    // Verificar se todos os módulos passaram
    for (const [name, result] of Object.entries(this.results)) {
      if (result.error) {
        issues.push(`Módulo ${name} falhou na execução`);
      } else if (result.passed < result.total) {
        issues.push(`Módulo ${name} tem testes falhando (${result.passed}/${result.total})`);
      }
    }

    if (issues.length === 0) {
      console.log(colors.green + colors.bold + '🎉 TODOS OS THRESHOLDS CRÍTICOS FORAM ATENDIDOS!' + colors.reset);
      console.log(colors.green + '✅ Sistema aprovado para deploy de segurança' + colors.reset);
      process.exit(0);
    } else {
      console.log(colors.red + colors.bold + '🚨 THRESHOLDS CRÍTICOS NÃO ATENDIDOS:' + colors.reset);
      issues.forEach(issue => {
        console.log(colors.red + `❌ ${issue}` + colors.reset);
      });
      
      console.log();
      console.log(colors.yellow + '⚠️  CORRIJA OS PROBLEMAS ACIMA ANTES DO DEPLOY' + colors.reset);
      process.exit(1);
    }
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new SecurityTestRunner();
  runner.run().catch(error => {
    console.error(colors.red + '💥 Erro fatal:' + colors.reset, error);
    process.exit(1);
  });
}

export default SecurityTestRunner;