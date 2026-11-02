import { defineConfig } from "vite";

// O nome do repositório faz parte do caminho público no GitHub Pages.
export default defineConfig({
  base: "/bingo/",
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
