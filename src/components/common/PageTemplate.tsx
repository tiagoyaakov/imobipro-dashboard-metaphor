
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, Plus } from "lucide-react";

interface PageTemplateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  content: string;
  showAddButton?: boolean;
}

export const PageTemplate = ({ 
  title, 
  description, 
  icon: Icon, 
  content, 
  showAddButton = true 
}: PageTemplateProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-imobipro-blue/10 rounded-lg">
            <Icon className="w-6 h-6 text-imobipro-blue" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 mt-1">{description}</p>
          </div>
        </div>
        {showAddButton && (
          <Button className="bg-imobipro-blue hover:bg-imobipro-blue-dark">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        )}
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-orange-600 border-orange-200">
          Em Desenvolvimento
        </Badge>
        <Badge variant="secondary">
          Funcionalidade será implementada em breve
        </Badge>
      </div>

      {/* Main Content */}
      <Card className="imobipro-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-imobipro-blue" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Icon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Módulo em Desenvolvimento
              </h3>
              <p className="text-gray-600 mb-6">{content}</p>
              <Button className="bg-imobipro-blue hover:bg-imobipro-blue-dark">
                Solicitar Demonstração
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
