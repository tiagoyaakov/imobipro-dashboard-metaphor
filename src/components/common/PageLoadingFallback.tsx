import LoadingSpinner from "./LoadingSpinner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PageLoadingFallbackProps {
  className?: string;
  variant?: "spinner" | "skeleton" | "auth";
  title?: string;
  description?: string;
}

const PageLoadingFallback = ({ 
  className = "", 
  variant = "spinner",
  title = "Carregando página...",
  description
}: PageLoadingFallbackProps) => {
  
  const renderAuthSkeleton = () => (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-11 w-full" />
        </div>
        
        <Skeleton className="h-11 w-full" />
        
        <div className="flex items-center gap-4">
          <Skeleton className="h-px flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-px flex-1" />
        </div>
        
        <Skeleton className="h-11 w-full" />
        
        <div className="text-center">
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>
      </div>
    </div>
  );

  const renderPageSkeleton = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (variant) {
      case "auth":
        return renderAuthSkeleton();
      
      case "skeleton":
        return renderPageSkeleton();
      
      default:
        return (
          <LoadingSpinner 
            size="lg" 
            text={title}
            className="py-12"
            variant="spinner"
          />
        );
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-center min-h-[400px] w-full animate-fade-in",
      className
    )}>
      <div className="w-full max-w-4xl px-6">
        {renderContent()}
        {description && variant !== "auth" && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default PageLoadingFallback; 