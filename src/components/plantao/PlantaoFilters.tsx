// Componente de filtros para o módulo Plantão
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays,
  CalendarClock,
  CalendarRange,
  List,
  Users,
  X
} from "lucide-react";
import { PlantaoUser } from "@/types/plantao";
import { View } from "react-big-calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PlantaoFiltersProps {
  currentDate: Date;
  currentView: View;
  corretores: PlantaoUser[];
  selectedCorretorId?: string;
  isAdmin: boolean;
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
  onViewChange: (view: View) => void;
  onCorretorChange: (corretorId?: string) => void;
  onNewEvent: () => void;
}

export function PlantaoFilters({
  currentDate,
  currentView,
  corretores,
  selectedCorretorId,
  isAdmin,
  onNavigate,
  onViewChange,
  onCorretorChange,
  onNewEvent,
}: PlantaoFiltersProps) {
  // Formatar título baseado na view atual
  const getTitle = () => {
    switch (currentView) {
      case "month":
        return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
      case "week":
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${format(weekStart, "dd")} - ${format(weekEnd, "dd 'de' MMMM", { locale: ptBR })}`;
      case "day":
        return format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR });
      case "agenda":
        return "Agenda";
      default:
        return "";
    }
  };

  const viewIcons = {
    month: <CalendarDays className="h-4 w-4" />,
    week: <CalendarRange className="h-4 w-4" />,
    day: <CalendarClock className="h-4 w-4" />,
    agenda: <List className="h-4 w-4" />,
  };

  const viewLabels = {
    month: "Mês",
    week: "Semana",
    day: "Dia",
    agenda: "Lista",
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Linha superior - Navegação e Título */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Botões de navegação */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate("PREV")}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("TODAY")}
              className="px-3"
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate("NEXT")}
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Título do período */}
          <h2 className="text-xl font-semibold capitalize">
            {getTitle()}
          </h2>
        </div>

        {/* Botão de novo evento */}
        <Button onClick={onNewEvent} size="sm" className="gap-2">
          <Calendar className="h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      {/* Linha inferior - Filtros e Views */}
      <div className="flex items-center justify-between gap-4">
        {/* Filtro de corretor (apenas para admin) */}
        {isAdmin && (
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Select 
              value={selectedCorretorId || "all"} 
              onValueChange={(value) => onCorretorChange(value === "all" ? undefined : value)}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
                    Todos os Corretores
                  </div>
                </SelectItem>
                {corretores
                  .filter(c => c.role === "AGENT")
                  .map((corretor) => (
                    <SelectItem key={corretor.id} value={corretor.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: corretor.color }}
                        />
                        {corretor.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {selectedCorretorId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCorretorChange(undefined)}
                className="h-8 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {/* Seletor de visualização */}
        <div className="flex items-center gap-2">
          {(["month", "week", "day", "agenda"] as View[]).map((view) => (
            <Button
              key={view}
              variant={currentView === view ? "default" : "outline"}
              size="sm"
              onClick={() => onViewChange(view)}
              className="gap-2"
            >
              {viewIcons[view]}
              <span className="hidden sm:inline">{viewLabels[view]}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Legenda de cores para admin */}
      {isAdmin && !selectedCorretorId && (
        <div className="flex items-center gap-4 pt-2">
          <span className="text-sm text-muted-foreground">Legenda:</span>
          <div className="flex flex-wrap gap-3">
            {corretores
              .filter(c => c.role === "AGENT")
              .map((corretor) => (
                <Badge
                  key={corretor.id}
                  variant="outline"
                  className="gap-2 px-3 py-1"
                >
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: corretor.color }}
                  />
                  <span className="text-xs">{corretor.name}</span>
                </Badge>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}