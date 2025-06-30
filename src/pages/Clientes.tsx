
import { PageTemplate } from "@/components/common/PageTemplate";
import { UserCheck } from "lucide-react";

const Clientes = () => {
  return (
    <PageTemplate
      title="Clientes"
      description="Gerencie seus clientes e histórico de relacionamento"
      icon={UserCheck}
      content="Lista de clientes será implementada aqui com filtros avançados, histórico de interações e análise de perfil."
    />
  );
};

export default Clientes;
