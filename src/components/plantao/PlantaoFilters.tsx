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
    <div className="mb-3 space-y-2">
      {/* Linha superior - Navegação e Título */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Botões de navegação */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate("PREV")}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("TODAY")}
              className="px-2 h-8"
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate("NEXT")}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Título do período */}
          <h2 className="text-base sm:text-lg font-semibold capitalize">
            {getTitle()}
          </h2>
        </div>

        {/* Botão de novo evento */}
        <Button onClick={onNewEvent} size="sm" className="gap-2 h-8 px-3">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Evento</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {/* Linha inferior - Filtros e Views */}
      <div className="flex items-center justify-between gap-3">
        {/* Filtro de corretor (apenas para admin) */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Select 
              value={selectedCorretorId || "all"} 
              onValueChange={(value) => onCorretorChange(value === "all" ? undefined : value)}
            >
              <SelectTrigger className="w-[220px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
                    Todos os Corretores
                  </div>
                </SelectItem>
                {corretores
                  .filter(c => c.role === "AGENT")
                  .map((corretor) => (
                    <SelectItem key={corretor.id} value={corretor.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2.5 h-2.5 rounded-full" 
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
                size="icon"
                onClick={() => onCorretorChange(undefined)}
                className="h-8 w-8"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}

        {/* Seletor de visualização */}
        <div className="flex items-center gap-1.5">
          {(["month", "week", "day", "agenda"] as View[]).map((view) => (
            <Button
              key={view}
              variant={currentView === view ? "default" : "outline"}
              size="sm"
              onClick={() => onViewChange(view)}
              className="gap-2 h-8 px-3"
            >
              {viewIcons[view]}
              <span className="hidden sm:inline">{viewLabels[view]}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Legenda de cores para admin */}
      {isAdmin && !selectedCorretorId && (
        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs text-muted-foreground">Legenda:</span>
          <div className="flex flex-wrap gap-2.5">
            {corretores
              .filter(c => c.role === "AGENT")
              .map((corretor) => (
                <Badge
                  key={corretor.id}
                  variant="outline"
                  className="gap-1.5 px-2.5 py-0.5 text-[11px]"
                >
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: corretor.color }}
                  />
                  <span>{corretor.name}</span>
                </Badge>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}