import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: [],
  },
  resolve: {
    alias: {
      "@cartsuna/types": path.resolve(__dirname, "packages/types/src/index.ts"),
      "@cartsuna/utils": path.resolve(__dirname, "packages/utils/src/index.ts"),
      "@cartsuna/specs": path.resolve(__dirname, "packages/specs/src/index.ts"),
    },
  },
});
