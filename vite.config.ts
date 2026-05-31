import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    basicSsl(),
    {
      name: "spa-fallback",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const pathname = req.url?.split("?")[0] || "";
          // Only rewrite if it doesn't have a file extension
          if (pathname && !pathname.includes(".") && !pathname.startsWith("/@")) {
            req.url = "/index.html" + (req.url?.includes("?") ? req.url.substring(req.url.indexOf("?")) : "");
          }
          next();
        });
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 8080,
    open: true,
  },
});
