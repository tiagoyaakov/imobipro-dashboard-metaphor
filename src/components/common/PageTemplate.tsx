import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PageTemplateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  content?: string;
  children?: React.ReactNode;
  className?: string;
}

const PageTemplate: React.FC<PageTemplateProps> = ({
  title,
  description,
  icon: Icon,
  content,
  children,
  className,
}) => {
  // Atualiza o título do documento
  React.useEffect(() => {
    document.title = `${title} - ImobiPRO Dashboard`;
  }, [title]);

  return (
    <div className={cn("flex-1 space-y-4 p-4 pt-6 md:p-8", className)}>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {Icon && <Icon className="h-8 w-8" />}
            {title}
          </h2>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
      </div>
      
      {content && (
        <Card>
          <CardHeader>
            <CardTitle>Em Desenvolvimento</CardTitle>
            <CardDescription>Esta funcionalidade será implementada em breve</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{content}</p>
          </CardContent>
        </Card>
      )}
      
      {children && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

// Exportações explícitas para garantir compatibilidade
export { PageTemplate };
export default PageTemplate;
