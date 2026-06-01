import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget =
    env.VITE_APP_API_TARGET || "https://api.dev.rateandreact.com/";
  return {
    base: env.VITE_APP_BASE_URL || "/",
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api-proxy": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api-proxy\//, ""),
        },
      },
    },
  };
});
