import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Resolve the `@/*` path alias (see tsconfig.json) so tests can import source
// modules the same way the app does.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
