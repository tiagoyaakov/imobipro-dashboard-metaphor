import { defineConfig, mergeConfig, UserConfig } from 'vitest/config';
import viteConfigFn from './vite.config';

// Chame a função de configuração do Vite com um modo de teste para obter o objeto de configuração
const viteConfig = viteConfigFn({ mode: 'test', command: 'serve' }) as UserConfig;

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test-utils/setup-tests.ts',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.ts', 'src/**/*.tsx'],
        exclude: [
          'src/main.tsx',
          'src/vite-env.d.ts',
          'src/**/types.ts',
          'src/**/constants.ts',
          'src/**/*.stories.tsx',
          'src/test-utils/**',
        ],
      },
    },
  })
); 