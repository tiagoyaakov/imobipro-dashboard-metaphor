import React from 'react';
import { X, UserPlus } from 'lucide-react';

// Components
import { AddUserForm } from './AddUserForm';

// Components UI
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// -----------------------------------------------------------
// Interface para as props do modal
// -----------------------------------------------------------

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// -----------------------------------------------------------
// Componente Modal para Adicionar Usuário
// -----------------------------------------------------------

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // -----------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------

  const handleSuccess = () => {
    // Fechar modal
    onClose();
    
    // Chamar callback de sucesso se fornecido
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleClose = () => {
    // Fechar modal
    onClose();
  };

  // -----------------------------------------------------------
  // Render
  // -----------------------------------------------------------

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">
                  Adicionar Novo Usuário
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Preencha os dados para criar um novo usuário no sistema
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Form */}
        <div className="mt-6">
          <AddUserForm onSuccess={handleSuccess} onCancel={handleClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}; 