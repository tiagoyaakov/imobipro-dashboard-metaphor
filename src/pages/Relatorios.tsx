
import { PageTemplate } from "@/components/common/PageTemplate";
import { FileText } from "lucide-react";

const Relatorios = () => {
  return (
    <PageTemplate
      title="Relatórios"
      description="Análises e relatórios detalhados do seu negócio"
      icon={FileText}
      content="Central de relatórios será implementada aqui com dashboards personalizáveis, exportação de dados e análises preditivas."
    />
  );
};

export default Relatorios;
