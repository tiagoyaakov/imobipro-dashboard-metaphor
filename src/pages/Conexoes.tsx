
import { PageTemplate } from "@/components/common/PageTemplate";
import { Link } from "lucide-react";

const Conexoes = () => {
  return (
    <PageTemplate
      title="Conexões"
      description="Integrações e conexões externas"
      icon={Link}
      content="Central de integrações será implementada aqui com APIs, webhooks e conectores para portais imobiliários."
    />
  );
};

export default Conexoes;
