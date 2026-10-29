import { defineConfig } from 'vite';

export default defineConfig({
  // Caminhos relativos: funcionam em https://<usuario>.github.io/<repositorio>/
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
});
