/**
 * Utilitários de criptografia para o cache
 * Usa Web Crypto API para criptografia simétrica
 */

// Chave de criptografia derivada (deve ser configurável em produção)
const ENCRYPTION_KEY = import.meta.env.VITE_CACHE_ENCRYPTION_KEY || 'imobipro-cache-key-2024';

/**
 * Gera uma chave criptográfica a partir de uma senha
 */
async function deriveKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('imobipro-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Criptografa dados usando AES-GCM
 */
export async function encrypt(data: any): Promise<string> {
  try {
    // Verificar se Web Crypto está disponível
    if (!crypto.subtle) {
      console.warn('Web Crypto API not available, skipping encryption');
      return typeof data === 'string' ? data : JSON.stringify(data);
    }

    const text = typeof data === 'string' ? data : JSON.stringify(data);
    const encoder = new TextEncoder();
    const key = await deriveKey(ENCRYPTION_KEY);
    
    // Gerar IV aleatório
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Criptografar
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encoder.encode(text)
    );
    
    // Combinar IV + dados criptografados
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Retornar como base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    // Fallback: retornar dados sem criptografia
    return typeof data === 'string' ? data : JSON.stringify(data);
  }
}

/**
 * Descriptografa dados
 */
export async function decrypt(encrypted: string): Promise<any> {
  try {
    // Verificar se é JSON não criptografado (retrocompatibilidade)
    try {
      return JSON.parse(encrypted);
    } catch {
      // Continuar com descriptografia
    }

    // Verificar se Web Crypto está disponível
    if (!crypto.subtle) {
      console.warn('Web Crypto API not available, returning as-is');
      return encrypted;
    }

    const key = await deriveKey(ENCRYPTION_KEY);
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    
    // Extrair IV e dados criptografados
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    // Descriptografar
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );
    
    const decoder = new TextDecoder();
    const text = decoder.decode(decrypted);
    
    // Tentar parse JSON
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (error) {
    console.error('Decryption failed:', error);
    // Fallback: retornar como está
    return encrypted;
  }
}

/**
 * Hash de dados para comparação segura
 */
export async function hashData(data: any): Promise<string> {
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Gera um salt aleatório
 */
export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Verifica se o ambiente suporta criptografia
 */
export function isEncryptionSupported(): boolean {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.getRandomValues !== 'undefined';
}