import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: [],
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-jwt-secret-for-vitest-do-not-use-in-prod",
      REFRESH_TOKEN_SECRET: "test-refresh-secret-for-vitest-do-not-use-in-prod",
      DATABASE_URL: "postgresql://cartsuna:cartsuna@localhost:5432/cartsuna_test",
      REDIS_URL: "redis://localhost:6379",
    },
  },
  resolve: {
    alias: {
      "@cartsuna/types": path.resolve(__dirname, "packages/types/src/index.ts"),
      "@cartsuna/utils": path.resolve(__dirname, "packages/utils/src/index.ts"),
      "@cartsuna/specs": path.resolve(__dirname, "packages/specs/src/index.ts"),
    },
  },
});
