import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    docs: "./src/docs.ts",
    "addons/form": "./src/addons/form.ts",
    "addons/debug": "./src/addons/debug.ts",
    "addons/retry": "./src/addons/retry.ts",
    "addons/status": "./src/addons/status.ts",
    "addons/presets": "./src/addons/presets.ts"
  },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "es2022",
  platform: "neutral",
  outDir: "dist"
});
