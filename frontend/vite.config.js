import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true, // <-- add this line to auto-open browser on `npm run dev`
    proxy: {
      "/api": {
        target: "https://homzon-live-api.onrender.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
