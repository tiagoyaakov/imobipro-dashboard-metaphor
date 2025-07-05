import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface PageTemplateProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const PageTemplate = ({
  title,
  description,
  children,
  className,
}: PageTemplateProps) => {
  // Atualiza o título do documento
  React.useEffect(() => {
    document.title = `${title} - ImobiPRO Dashboard`;
  }, [title]);

  return (
    <div className={cn("flex-1 space-y-4 p-4 pt-6 md:p-8", className)}>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};

export default PageTemplate;
