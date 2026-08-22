import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": rootDir },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(rootDir, "index.html"),
        platform: path.resolve(rootDir, "platform.html"),
        industries: path.resolve(rootDir, "industries.html"),
        security: path.resolve(rootDir, "security.html"),
        resources: path.resolve(rootDir, "resources.html"),
        privacy: path.resolve(rootDir, "privacy.html"),
        terms: path.resolve(rootDir, "terms.html"),
        applicantPrivacy: path.resolve(rootDir, "applicant-privacy.html"),
        careers: path.resolve(rootDir, "careers.html"),
      },
    },
  },
});
