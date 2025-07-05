import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
  variant?: "spinner" | "dots" | "pulse";
  showText?: boolean;
}

const LoadingSpinner = ({ 
  size = "md", 
  text = "Carregando...", 
  className = "",
  variant = "spinner",
  showText = true
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base", 
    xl: "text-lg"
  };

  const renderLoader = () => {
    switch (variant) {
      case "dots":
        return (
          <div className="flex space-x-1">
            <div className={cn(
              "rounded-full bg-imobipro-blue animate-bounce",
              size === "sm" ? "h-2 w-2" : 
              size === "md" ? "h-3 w-3" :
              size === "lg" ? "h-4 w-4" : "h-6 w-6"
            )}></div>
            <div className={cn(
              "rounded-full bg-imobipro-blue animate-bounce",
              size === "sm" ? "h-2 w-2" : 
              size === "md" ? "h-3 w-3" :
              size === "lg" ? "h-4 w-4" : "h-6 w-6"
            )} style={{ animationDelay: '0.1s' }}></div>
            <div className={cn(
              "rounded-full bg-imobipro-blue animate-bounce",
              size === "sm" ? "h-2 w-2" : 
              size === "md" ? "h-3 w-3" :
              size === "lg" ? "h-4 w-4" : "h-6 w-6"
            )} style={{ animationDelay: '0.2s' }}></div>
          </div>
        );
      
      case "pulse":
        return (
          <div className={cn(
            "rounded-full bg-imobipro-blue animate-pulse",
            sizeClasses[size]
          )}></div>
        );
      
      default:
        return (
          <Loader2 
            className={cn(
              sizeClasses[size],
              "animate-spin text-imobipro-blue drop-shadow-sm"
            )}
          />
        );
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-3 animate-fade-in",
      className
    )}>
      {renderLoader()}
      {showText && (
        <span className={cn(
          textSizeClasses[size],
          "text-muted-foreground font-medium tracking-wide"
        )}>
          {text}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
