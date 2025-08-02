/**
 * Utilitários de compressão para o cache
 * Usa Compression Streams API quando disponível
 */

/**
 * Comprime dados usando CompressionStream ou fallback
 */
export async function compress(data: any): Promise<string> {
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  
  // Verificar se CompressionStream está disponível
  if (typeof CompressionStream !== 'undefined') {
    try {
      const encoder = new TextEncoder();
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      
      writer.write(encoder.encode(text));
      writer.close();
      
      const compressed = await new Response(stream.readable).arrayBuffer();
      return btoa(String.fromCharCode(...new Uint8Array(compressed)));
    } catch (error) {
      console.warn('CompressionStream failed, using fallback:', error);
    }
  }
  
  // Fallback: compressão simples baseada em LZ-string
  return simpleLZCompress(text);
}

/**
 * Descomprime dados
 */
export async function decompress(compressed: string): Promise<any> {
  // Verificar se é JSON não comprimido (retrocompatibilidade)
  try {
    return JSON.parse(compressed);
  } catch {
    // Continuar com descompressão
  }
  
  // Verificar se DecompressionStream está disponível
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const compressed_array = Uint8Array.from(atob(compressed), c => c.charCodeAt(0));
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      
      writer.write(compressed_array);
      writer.close();
      
      const decompressed = await new Response(stream.readable).text();
      
      try {
        return JSON.parse(decompressed);
      } catch {
        return decompressed;
      }
    } catch (error) {
      console.warn('DecompressionStream failed, using fallback:', error);
    }
  }
  
  // Fallback
  const decompressed = simpleLZDecompress(compressed);
  try {
    return JSON.parse(decompressed);
  } catch {
    return decompressed;
  }
}

/**
 * Implementação simples de compressão LZ
 * Baseada em LZ-string mas simplificada
 */
function simpleLZCompress(uncompressed: string): string {
  if (!uncompressed) return '';
  
  const dictionary = new Map<string, number>();
  const output: string[] = [];
  let dictSize = 256;
  let w = '';
  
  for (let i = 0; i < uncompressed.length; i++) {
    const c = uncompressed.charAt(i);
    const wc = w + c;
    
    if (dictionary.has(wc)) {
      w = wc;
    } else {
      const code = dictionary.has(w) ? dictionary.get(w)! : w.charCodeAt(0);
      output.push(String.fromCharCode(code));
      
      if (dictSize < 65536) {
        dictionary.set(wc, dictSize++);
      }
      
      w = c;
    }
  }
  
  if (w !== '') {
    const code = dictionary.has(w) ? dictionary.get(w)! : w.charCodeAt(0);
    output.push(String.fromCharCode(code));
  }
  
  return btoa(output.join(''));
}

/**
 * Descompressão LZ simples
 */
function simpleLZDecompress(compressed: string): string {
  if (!compressed) return '';
  
  try {
    const data = atob(compressed);
    const dictionary = new Map<number, string>();
    let dictSize = 256;
    let w = String.fromCharCode(data.charCodeAt(0));
    let result = w;
    
    for (let i = 1; i < data.length; i++) {
      const k = data.charCodeAt(i);
      let entry: string;
      
      if (k < 256) {
        entry = String.fromCharCode(k);
      } else if (dictionary.has(k)) {
        entry = dictionary.get(k)!;
      } else if (k === dictSize) {
        entry = w + w.charAt(0);
      } else {
        throw new Error('Invalid compressed data');
      }
      
      result += entry;
      
      if (dictSize < 65536) {
        dictionary.set(dictSize++, w + entry.charAt(0));
      }
      
      w = entry;
    }
    
    return result;
  } catch {
    // Se falhar, retornar como está (pode não estar comprimido)
    return compressed;
  }
}

/**
 * Estima a taxa de compressão
 */
export function estimateCompressionRatio(original: string, compressed: string): number {
  const originalSize = new Blob([original]).size;
  const compressedSize = new Blob([compressed]).size;
  
  return compressedSize / originalSize;
}