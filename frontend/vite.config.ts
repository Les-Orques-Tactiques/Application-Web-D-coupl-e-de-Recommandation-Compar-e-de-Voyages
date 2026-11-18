import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Configuration de Vite, l'outil qui lance le site en développement et le compile pour la production.
export default defineConfig({
  // react() : comprend le JSX ; tailwindcss() : génère les classes CSS utilisées dans le code
  plugins: [react(), tailwindcss()],
  resolve: {
    // Permet d'écrire "@/components/..." au lieu de "../../../components/..."
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    // Pendant le développement, toute requête commençant par /api est envoyée au backend Flask.
    // Le navigateur croit parler au même serveur : pas de problème de CORS.
    proxy: { "/api": "http://localhost:8000" },
  },
});
