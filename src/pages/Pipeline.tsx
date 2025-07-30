
// ===================================================================
// PIPELINE PAGE - ImobiPRO Dashboard
// ===================================================================
// Página principal do módulo Pipeline com visualização Kanban completa,
// métricas em tempo real e gestão avançada do funil de vendas

import React from 'react';
import { PipelineKanban } from '@/components/pipeline/PipelineKanban';

const Pipeline = () => {
  return (
    <div className="container mx-auto p-6">
      <PipelineKanban />
    </div>
  );
};

export default Pipeline;
