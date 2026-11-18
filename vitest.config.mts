import path from "node:path";
import { defineConfig } from "vitest/config";

// Cùng quy ước alias với metro.config.js.
const src = path.resolve(import.meta.dirname, "src");
export default defineConfig({
  resolve: {
    alias: [
      { find: /^~\/(.*)$/, replacement: `${src}/$1` },
      { find: /^@\/modules\/([^/]+)$/, replacement: `${src}/core/modules/$1/core.ts` },
      { find: /^@\/shared\/(.*)$/, replacement: `${src}/core/shared/$1` },
    ],
  },
  test: { include: ["src/**/__tests__/**/*.test.ts"], environment: "node" },
});
