
import { PageTemplate } from "@/components/common/PageTemplate";
import { MessageSquare } from "lucide-react";

const Chats = () => {
  return (
    <PageTemplate
      title="Chats"
      description="Central de mensagens e comunicação"
      icon={MessageSquare}
      content="Sistema de chat será implementado aqui com integração WhatsApp, histórico de conversas e chatbots."
    />
  );
};

export default Chats;
