
import { PageTemplate } from "@/components/common/PageTemplate";
import { User } from "lucide-react";

const Usuarios = () => {
  return (
    <PageTemplate
      title="Usuários"
      description="Gestão de usuários e permissões"
      icon={User}
      content="Painel de usuários será implementado aqui com gestão de perfis, permissões e auditoria de ações."
    />
  );
};

export default Usuarios;
