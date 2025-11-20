import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Port को लोकल डेवलपमेंट के लिए 3000 पर सेट करें (यह ठीक है)
    port: 3000,
    open: true, 
    proxy: {
      // यह प्रॉक्सी केवल लोकल डेवलपमेंट के लिए है
      "/api": {
        target: "https://homzon-live-api.onrender.com", 
        changeOrigin: true,
        secure: false, 
      },
    },
  },
  // Production Build के लिए Base URL सेट करने की आवश्यकता नहीं है
});