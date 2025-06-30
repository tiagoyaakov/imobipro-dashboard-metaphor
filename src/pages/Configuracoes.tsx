
import { PageTemplate } from "@/components/common/PageTemplate";
import { Settings } from "lucide-react";

const Configuracoes = () => {
  return (
    <PageTemplate
      title="Configurações"
      description="Configurações gerais do sistema"
      icon={Settings}
      content="Painel de configurações será implementado aqui com preferências, integrações e personalização da interface."
    />
  );
};

export default Configuracoes;
