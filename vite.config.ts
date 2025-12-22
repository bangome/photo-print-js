import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PhotoPrintJS',
      formats: ['es', 'cjs', 'umd', 'iife'],
      fileName: (format) => {
        const formatMap: Record<string, string> = {
          es: 'photo-print.es.js',
          cjs: 'photo-print.cjs.js',
          umd: 'photo-print.umd.js',
          iife: 'photo-print.iife.js'
        };
        return formatMap[format] || `photo-print.${format}.js`;
      }
    },
    rollupOptions: {
      external: ['jspdf'],
      output: {
        globals: {
          jspdf: 'jspdf'
        }
      }
    },
    sourcemap: true,
    minify: 'esbuild'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
