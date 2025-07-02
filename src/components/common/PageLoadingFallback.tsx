import LoadingSpinner from "./LoadingSpinner";

const PageLoadingFallback = () => {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <LoadingSpinner 
        size="lg" 
        text="Carregando página..." 
        className="py-12"
      />
    </div>
  );
};

export default PageLoadingFallback; 