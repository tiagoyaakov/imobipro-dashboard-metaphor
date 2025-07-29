/**
 * 🔲 ImobiPRO - Botão Adicionar Lead
 * 
 * Componente de botão flutuante para adicionar novos leads rapidamente.
 * Inclui atalhos de teclado e estados visuais.
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Plus, UserPlus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import NewLeadForm from './NewLeadForm';

// ============================================================================
// INTERFACE
// ============================================================================

interface AddLeadButtonProps {
  /** ID do agente para atribuição automática */
  defaultAgentId?: string;
  /** Variante do botão */
  variant?: 'floating' | 'inline' | 'minimal';
  /** Tamanho do botão */
  size?: 'sm' | 'default' | 'lg';
  /** Callback quando lead é criado com sucesso */
  onLeadCreated?: (lead: any) => void;
  /** Texto customizado do botão */
  label?: string;
  /** Classe CSS adicional */
  className?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function AddLeadButton({
  defaultAgentId,
  variant = 'floating',
  size = 'default',
  onLeadCreated,
  label,
  className = ''
}: AddLeadButtonProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleOpenForm = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleLeadCreated = (lead: any) => {
    if (onLeadCreated) {
      onLeadCreated(lead);
    }
    setIsFormOpen(false);
  };

  // ============================================================================
  // RENDER VARIANTS
  // ============================================================================

  const renderFloatingButton = () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleOpenForm}
            size={size}
            className={`
              fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full 
              bg-imobipro-blue hover:bg-imobipro-blue/90 
              shadow-lg hover:shadow-xl transition-all duration-200
              group
              ${className}
            `}
          >
            <div className="relative">
              <Plus className="h-6 w-6 text-white transition-transform group-hover:rotate-90" />
              <Zap className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-gray-900 text-white">
          <p className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Lead
            <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-gray-700 rounded">
              Ctrl+N
            </kbd>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const renderInlineButton = () => (
    <Button
      onClick={handleOpenForm}
      size={size}
      className={`
        bg-imobipro-blue hover:bg-imobipro-blue/90
        ${className}
      `}
    >
      <Plus className="h-4 w-4 mr-2" />
      {label || 'Novo Lead'}
    </Button>
  );

  const renderMinimalButton = () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleOpenForm}
            variant="ghost"
            size={size}
            className={`
              text-imobipro-blue hover:text-imobipro-blue/90 
              hover:bg-imobipro-blue/10
              ${className}
            `}
          >
            <Plus className="h-4 w-4" />
            {label && <span className="ml-2">{label}</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Adicionar novo lead</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+N para abrir formulário de novo lead
      if (event.ctrlKey && event.key === 'n' && variant === 'floating') {
        event.preventDefault();
        handleOpenForm();
      }

      // Escape para fechar formulário
      if (event.key === 'Escape' && isFormOpen) {
        handleCloseForm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [variant, isFormOpen]);

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  const renderButton = () => {
    switch (variant) {
      case 'floating':
        return renderFloatingButton();
      case 'inline':
        return renderInlineButton();
      case 'minimal':
        return renderMinimalButton();
      default:
        return renderInlineButton();
    }
  };

  return (
    <>
      {renderButton()}
      
      <NewLeadForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        defaultAgentId={defaultAgentId}
        onSuccess={handleLeadCreated}
      />
    </>
  );
}

// ============================================================================
// VARIANTES PRÉ-CONFIGURADAS
// ============================================================================

/**
 * Botão flutuante fixo no canto da tela
 */
export const FloatingAddLeadButton = (props: Omit<AddLeadButtonProps, 'variant'>) => (
  <AddLeadButton {...props} variant="floating" />
);

/**
 * Botão inline para toolbars e headers
 */
export const InlineAddLeadButton = (props: Omit<AddLeadButtonProps, 'variant'>) => (
  <AddLeadButton {...props} variant="inline" />
);

/**
 * Botão minimalista para espaços reduzidos
 */
export const MinimalAddLeadButton = (props: Omit<AddLeadButtonProps, 'variant'>) => (
  <AddLeadButton {...props} variant="minimal" />
);