import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Injects Jinja boot data script into the built HTML
function jinjaBootDataPlugin() {
  return {
    name: "jinja-boot-data",
    enforce: "post",
    transformIndexHtml(html) {
      const bootScript = `
    <script>
      {% for key in boot %}
      window["{{ key }}"] = {{ boot[key] | tojson }};
      {% endfor %}
    </script>`;
      return html.replace("</body>", `${bootScript}\n  </body>`);
    },
  };
}

export default defineConfig({
  plugins: [react(), jinjaBootDataPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "../license_management/public/frontend",
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 8090,
    proxy: {
      "^/(api|assets|files|private)": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
