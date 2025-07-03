import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Search, Plus, Phone, Mail, MessageSquare } from "lucide-react";

const Contatos = () => {
  const contacts = [
    {
      id: 1,
      name: "João Silva",
      email: "joao.silva@email.com",
      phone: "(11) 99999-9999",
      type: "Cliente",
      status: "Ativo",
      lastContact: "2 dias atrás",
      avatar: "JS"
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria.santos@email.com",
      phone: "(11) 88888-8888",
      type: "Lead",
      status: "Novo",
      lastContact: "1 hora atrás",
      avatar: "MS"
    },
    {
      id: 3,
      name: "Pedro Oliveira",
      email: "pedro.oliveira@email.com",
      phone: "(11) 77777-7777",
      type: "Cliente",
      status: "Inativo",
      lastContact: "1 semana atrás",
      avatar: "PO"
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo":
        return "bg-imobipro-success/20 text-imobipro-success border-imobipro-success/30";
      case "Novo":
        return "bg-imobipro-blue/20 text-imobipro-blue border-imobipro-blue/30";
      case "Inativo":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Cliente":
        return "bg-purple-400/20 text-purple-400 border-purple-400/30";
      case "Lead":
        return "bg-imobipro-warning/20 text-imobipro-warning border-imobipro-warning/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contatos</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus clientes e leads</p>
        </div>
        <Button className="bg-imobipro-blue hover:bg-imobipro-blue-dark">
          <Plus className="w-4 h-4 mr-2" />
          Novo Contato
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2 imobipro-card">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar contatos por nome, email ou telefone..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {[
          { label: "Total", value: "1,234", icon: Users },
          { label: "Ativos", value: "987", icon: Users },
        ].map((stat, index) => (
          <Card key={index} className="imobipro-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-imobipro-blue/10 p-2 rounded-lg">
                <stat.icon className="w-5 h-5 text-imobipro-blue" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contacts List */}
      <Card className="imobipro-card">
        <CardHeader>
          <CardTitle>Lista de Contatos</CardTitle>
          <CardDescription>Todos os seus contatos organizados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-md hover:bg-muted/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`/api/placeholder/48/48`} />
                    <AvatarFallback className="bg-imobipro-blue text-white">
                      {contact.avatar}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{contact.name}</h3>
                      <Badge className={`${getTypeColor(contact.type)} border`}>
                        {contact.type}
                      </Badge>
                      <Badge className={`${getStatusColor(contact.status)} border`}>
                        {contact.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {contact.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {contact.phone}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Último contato: {contact.lastContact}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="w-4 h-4 mr-1" />
                    Ligar
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Chat
                  </Button>
                  <Button size="sm" className="bg-imobipro-blue hover:bg-imobipro-blue-dark">
                    Ver Perfil
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Contatos;
