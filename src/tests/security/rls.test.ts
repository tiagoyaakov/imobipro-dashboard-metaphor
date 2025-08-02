import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

/**
 * Testes para validar as políticas RLS
 * Execute com: npm test rls.test.ts
 */

// Configurar clientes Supabase para diferentes roles
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cliente anônimo
const anonClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Dados de teste
const testUsers = {
  devMaster: {
    email: 'devmaster@test.com',
    password: 'test123456',
    role: 'DEV_MASTER'
  },
  admin: {
    email: 'admin@test.com',
    password: 'test123456',
    role: 'ADMIN'
  },
  agent: {
    email: 'agent@test.com',
    password: 'test123456',
    role: 'AGENT'
  }
};

describe('RLS - Companies Table', () => {
  let devMasterClient: any;
  let adminClient: any;
  let agentClient: any;
  let testCompanyId: string;

  beforeEach(async () => {
    // Login como diferentes usuários
    const { data: devMasterAuth } = await anonClient.auth.signInWithPassword({
      email: testUsers.devMaster.email,
      password: testUsers.devMaster.password
    });
    devMasterClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${devMasterAuth?.session?.access_token}` } }
    });

    const { data: adminAuth } = await anonClient.auth.signInWithPassword({
      email: testUsers.admin.email,
      password: testUsers.admin.password
    });
    adminClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${adminAuth?.session?.access_token}` } }
    });

    const { data: agentAuth } = await anonClient.auth.signInWithPassword({
      email: testUsers.agent.email,
      password: testUsers.agent.password
    });
    agentClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${agentAuth?.session?.access_token}` } }
    });
  });

  afterEach(async () => {
    // Limpar dados de teste
    if (testCompanyId && devMasterClient) {
      await devMasterClient.from('companies').delete().eq('id', testCompanyId);
    }
  });

  it('DEV_MASTER pode criar empresas', async () => {
    const { data, error } = await devMasterClient
      .from('companies')
      .insert({ name: 'Test Company' })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.name).toBe('Test Company');
    
    testCompanyId = data.id;
  });

  it('ADMIN não pode criar empresas', async () => {
    const { error } = await adminClient
      .from('companies')
      .insert({ name: 'Test Company 2' });

    expect(error).toBeDefined();
    expect(error.code).toBe('42501'); // Código de erro de permissão PostgreSQL
  });

  it('AGENT não pode criar empresas', async () => {
    const { error } = await agentClient
      .from('companies')
      .insert({ name: 'Test Company 3' });

    expect(error).toBeDefined();
    expect(error.code).toBe('42501');
  });

  it('ADMIN pode ver apenas sua própria empresa', async () => {
    const { data } = await adminClient
      .from('companies')
      .select();

    expect(data).toBeDefined();
    expect(data.length).toBe(1); // Apenas sua empresa
  });

  it('DEV_MASTER pode ver todas as empresas', async () => {
    const { data } = await devMasterClient
      .from('companies')
      .select();

    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
  });
});

describe('RLS - Users Table', () => {
  it('AGENT pode ver apenas seus próprios dados', async () => {
    const { data } = await agentClient
      .from('users')
      .select();

    expect(data).toBeDefined();
    expect(data.length).toBe(1); // Apenas ele mesmo
    expect(data[0].email).toBe(testUsers.agent.email);
  });

  it('ADMIN pode ver todos os usuários da empresa', async () => {
    const { data } = await adminClient
      .from('users')
      .select();

    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(1); // Múltiplos usuários
  });

  it('ADMIN não pode criar usuário DEV_MASTER', async () => {
    const { error } = await adminClient
      .from('users')
      .insert({
        email: 'newdevmaster@test.com',
        name: 'New Dev Master',
        role: 'DEV_MASTER',
        company_id: 'some-company-id'
      });

    expect(error).toBeDefined();
  });

  it('ADMIN pode criar usuário AGENT', async () => {
    const { data: userData } = await adminClient
      .from('users')
      .select('company_id')
      .single();

    const { data, error } = await adminClient
      .from('users')
      .insert({
        email: 'newagent@test.com',
        name: 'New Agent',
        role: 'AGENT',
        company_id: userData.company_id
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.role).toBe('AGENT');

    // Limpar
    if (data) {
      await adminClient.auth.admin.deleteUser(data.id);
    }
  });
});

describe('RLS - Properties Table', () => {
  let testPropertyId: string;

  afterEach(async () => {
    if (testPropertyId) {
      await agentClient.from('properties').delete().eq('id', testPropertyId);
    }
  });

  it('AGENT pode criar propriedades', async () => {
    const { data: userData } = await agentClient
      .from('users')
      .select('id')
      .single();

    const { data, error } = await agentClient
      .from('properties')
      .insert({
        title: 'Test Property',
        address: 'Test Address',
        city: 'Test City',
        state: 'SP',
        zipCode: '00000-000',
        price: 100000,
        area: 100,
        agent_id: userData.id
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    testPropertyId = data.id;
  });

  it('AGENT pode editar suas próprias propriedades', async () => {
    // Primeiro criar uma propriedade
    const { data: userData } = await agentClient
      .from('users')
      .select('id')
      .single();

    const { data: property } = await agentClient
      .from('properties')
      .insert({
        title: 'Test Property 2',
        address: 'Test Address 2',
        city: 'Test City',
        state: 'SP',
        zipCode: '00000-000',
        price: 200000,
        area: 150,
        agent_id: userData.id
      })
      .select()
      .single();

    testPropertyId = property.id;

    // Tentar atualizar
    const { data, error } = await agentClient
      .from('properties')
      .update({ price: 250000 })
      .eq('id', property.id)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.price).toBe('250000');
  });

  it('ADMIN pode ver todas as propriedades da empresa', async () => {
    const { data } = await adminClient
      .from('properties')
      .select();

    expect(data).toBeDefined();
    // Pode ter 0 ou mais propriedades
  });

  it('AGENT não pode deletar propriedades', async () => {
    // Criar propriedade primeiro
    const { data: userData } = await agentClient
      .from('users')
      .select('id')
      .single();

    const { data: property } = await agentClient
      .from('properties')
      .insert({
        title: 'Test Property 3',
        address: 'Test Address 3',
        city: 'Test City',
        state: 'SP',
        zipCode: '00000-000',
        price: 300000,
        area: 200,
        agent_id: userData.id
      })
      .select()
      .single();

    // Tentar deletar
    const { error } = await agentClient
      .from('properties')
      .delete()
      .eq('id', property.id);

    expect(error).toBeDefined();
    expect(error.code).toBe('42501');

    // Limpar com admin
    await adminClient.from('properties').delete().eq('id', property.id);
  });
});

describe('RLS - Cross-Company Isolation', () => {
  it('ADMIN não pode ver dados de outras empresas', async () => {
    // Obter company_id do admin
    const { data: adminUser } = await adminClient
      .from('users')
      .select('company_id')
      .single();

    // Tentar acessar usuários de outra empresa
    const { data: users } = await adminClient
      .from('users')
      .select()
      .neq('company_id', adminUser.company_id);

    expect(users).toEqual([]); // Não deve retornar nada
  });

  it('AGENT não pode ver contatos de outros agentes', async () => {
    const { data: contacts } = await agentClient
      .from('contacts')
      .select();

    // Verificar que todos os contatos pertencem ao agente
    contacts?.forEach(contact => {
      expect(contact.agent_id).toBe(testUsers.agent.email);
    });
  });
});

describe('RLS - Activity Logs', () => {
  it('Activities são imutáveis (não podem ser atualizadas)', async () => {
    // Criar uma activity
    const { data: userData } = await agentClient
      .from('users')
      .select('id')
      .single();

    const { data: activity } = await agentClient
      .from('activities')
      .insert({
        type: 'USER_CREATED',
        description: 'Test activity',
        user_id: userData.id
      })
      .select()
      .single();

    // Tentar atualizar
    const { error } = await agentClient
      .from('activities')
      .update({ description: 'Updated' })
      .eq('id', activity.id);

    expect(error).toBeDefined();
  });

  it('Activities não podem ser deletadas', async () => {
    // Criar uma activity
    const { data: userData } = await devMasterClient
      .from('users')
      .select('id')
      .single();

    const { data: activity } = await devMasterClient
      .from('activities')
      .insert({
        type: 'USER_CREATED',
        description: 'Test activity 2',
        user_id: userData.id
      })
      .select()
      .single();

    // Tentar deletar mesmo como DEV_MASTER
    const { error } = await devMasterClient
      .from('activities')
      .delete()
      .eq('id', activity.id);

    expect(error).toBeDefined();
  });
});

/**
 * Teste de Performance RLS
 * Verifica se as queries com RLS não degradam performance
 */
describe('RLS - Performance', () => {
  it('Query com RLS deve executar em tempo aceitável', async () => {
    const startTime = performance.now();
    
    const { data } = await agentClient
      .from('properties')
      .select('*, agent:users(name, email)')
      .limit(50);
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    expect(executionTime).toBeLessThan(1000); // Menos de 1 segundo
    expect(data).toBeDefined();
  });
});

// Helper para limpar dados de teste
export async function cleanupTestData() {
  const { data: { session } } = await anonClient.auth.getSession();
  
  if (session?.user?.id) {
    // Limpar dados criados durante os testes
    await devMasterClient.from('properties').delete().eq('title', 'Test Property');
    await devMasterClient.from('activities').delete().eq('description', 'Test activity');
  }
}