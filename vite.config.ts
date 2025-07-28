import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  // Carregar variáveis de ambiente baseadas no modo
  const env = loadEnv(mode, process.cwd(), '');
  
  // Verificar se está em produção
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';

  return {
    // Configurações do servidor de desenvolvimento
    server: {
      host: "::",
      port: parseInt(env.VITE_DEV_PORT) || 8080,
      open: false,
      cors: true,
    },

    // Configurações de preview
    preview: {
      port: 4173,
      host: true,
    },

    // Plugins otimizados por ambiente
    plugins: [
      react({
        // Configurações específicas do SWC para React
        plugins: [],
      }),
      // Componente tagger apenas em desenvolvimento
      isDevelopment && componentTagger(),
    ].filter(Boolean),

    // Configurações de resolução de módulos
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@pages": path.resolve(__dirname, "./src/pages"),
        "@hooks": path.resolve(__dirname, "./src/hooks"),
        "@lib": path.resolve(__dirname, "./src/lib"),
        "@integrations": path.resolve(__dirname, "./src/integrations"),
      },
    },

    // Definir variáveis globais
    define: {
      // Expor variáveis Vercel para o frontend
      __VERCEL_ENV__: JSON.stringify(env.VITE_VERCEL_ENV || 'development'),
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },

    // Configurações de CSS
    css: {
      devSourcemap: isDevelopment,
    },

    // Configurações de build otimizadas
    build: {
      target: 'esnext',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: isProduction ? 'hidden' : true,
      minify: isProduction ? 'esbuild' : false,
      
      // Configurações de chunks para otimização
      rollupOptions: {
        output: {
          // Code splitting estratégico
          manualChunks: {
            // Vendor chunks separados
            'react-vendor': ['react', 'react-dom'],
            'router-vendor': ['react-router-dom'],
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
              '@radix-ui/react-tooltip',
            ],
            'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'query-vendor': ['@tanstack/react-query'],
            'supabase-vendor': ['@supabase/supabase-js'],
            'chart-vendor': ['recharts'],
            'date-vendor': ['date-fns'],
            'utils-vendor': ['clsx', 'class-variance-authority', 'tailwind-merge'],
          },
          
          // Naming conventions para assets
          chunkFileNames: 'assets/chunks/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name!.split('.');
            const ext = info[info.length - 1];
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name!)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/\.(css)$/.test(assetInfo.name!)) {
              return `assets/styles/[name]-[hash][extname]`;
            }
            if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name!)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[ext]/[name]-[hash][extname]`;
          },
        },
        
        // External dependencies (se necessário)
        external: [],
      },

      // Configurações de performance
      chunkSizeWarningLimit: 1000,
      
      // Configurações específicas para Vercel
      reportCompressedSize: false, // Desabilita relatório de tamanho comprimido para builds mais rápidos
      
      // Configurações removidas - esbuild é usado como minificador
    },

    // Configurações de otimização de dependências
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        '@supabase/supabase-js',
        'lucide-react',
        'recharts',
        'date-fns',
        'zod',
        'react-hook-form',
      ],
      exclude: [
        'lovable-tagger', // Apenas em desenvolvimento
      ],
    },

    // Configurações do worker
    worker: {
      format: 'es',
    },

    // Configurações experimentais para melhor performance
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        if (hostType === 'js') {
          // Otimizar URLs para assets JS
          return { js: `/${filename}` };
        } else {
          // URLs padrão para outros assets
          return { relative: true };
        }
      },
    },

    // Configurações específicas para diferentes ambientes
    ...(isProduction && {
      // Configurações extras apenas para produção
      esbuild: {
        drop: ['console', 'debugger'],
        legalComments: 'none',
      },
    }),

    ...(isDevelopment && {
      // Configurações extras apenas para desenvolvimento
      esbuild: {
        define: {
          this: 'globalThis',
        },
      },
    }),
  };
});
