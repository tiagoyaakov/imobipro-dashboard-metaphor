
import { PageTemplate } from "@/components/common/PageTemplate";
import { HeadphonesIcon } from "lucide-react";

const CRM = () => {
  return (
    <PageTemplate
      title="CRM"
      description="Sistema de gestão de relacionamento com clientes"
      icon={HeadphonesIcon}
      content="Módulo CRM será implementado aqui com automações, campanhas de marketing e gestão de leads."
    />
  );
};

export default CRM;
