
import { PageTemplate } from "@/components/common/PageTemplate";
import { GitBranch } from "lucide-react";

const Pipeline = () => {
  return (
    <PageTemplate
      title="Pipeline"
      description="Acompanhe o funil de vendas e oportunidades"
      icon={GitBranch}
      content="Dashboard do pipeline será implementado aqui com estágios de vendas, conversões e métricas de performance."
    />
  );
};

export default Pipeline;
