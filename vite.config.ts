import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import path from "node:path";
// import devtools from 'solid-devtools/vite';

export default defineConfig({
  plugins: [
    /* 
    Uncomment the following line to enable solid-devtools.
    For more info see https://github.com/thetarnav/solid-devtools/tree/main/packages/extension#readme
    */
    // devtools(),
    solidPlugin(),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
  },
  base: "/solid-draggable-docs/",
  resolve: {
    alias: [
      {
        find: "@",
        replacement: path.resolve(__dirname, "src"),
      },
    ],
  },
  test: {
    include: ["**/tests/**/*.spec.*", "**/tests/**/*.test.*"],
    globals: true,
    setupFiles: "./vitest-setup.ts",
    environment: "jsdom",
  },
});
