import { useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';

// -----------------------------------------------------------
// Hook de Upload de Imagem para Supabase Storage
// -----------------------------------------------------------

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface DeleteResult {
  success: boolean;
  error?: string;
}

export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadImage = useCallback(async (
    file: File, 
    bucket: string = 'avatars', 
    folder?: string
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // Validar arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Arquivo deve ser uma imagem');
      }

      // Limite de 5MB
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Máximo 5MB');
      }

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;
      
      // Construir caminho do arquivo
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        success: true,
        url: urlData.publicUrl
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer upload da imagem';
      setUploadError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsUploading(false);
    }
  }, []);

  const deleteImage = useCallback(async (
    url: string, 
    bucket: string = 'avatars'
  ): Promise<DeleteResult> => {
    try {
      // Extrair caminho do arquivo da URL
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === bucket);
      
      if (bucketIndex === -1) {
        throw new Error('URL de imagem inválida');
      }
      
      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar imagem';
      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  return {
    uploadImage,
    deleteImage,
    isUploading,
    uploadError
  };
}; 