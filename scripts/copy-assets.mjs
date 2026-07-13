import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

function copyIfExists(source, destination) {
  if (!existsSync(source)) return;

  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
}

copyIfExists("src/styles.css", "dist/styles.css");
copyIfExists("src/styles.css", "docs/assets/a11y-async-button.css");
copyIfExists("dist/index.js", "docs/assets/a11y-async-button.js");
copyIfExists("dist/index.js", "docs/assets/index.js");
copyIfExists("dist/index.js.map", "docs/assets/index.js.map");
copyIfExists("dist/addons/form.js", "docs/assets/addons/form.js");
copyIfExists("dist/addons/form.js.map", "docs/assets/addons/form.js.map");
copyIfExists("dist/addons/debug.js", "docs/assets/addons/debug.js");
copyIfExists("dist/addons/debug.js.map", "docs/assets/addons/debug.js.map");
copyIfExists("dist/addons/retry.js", "docs/assets/addons/retry.js");
copyIfExists("dist/addons/retry.js.map", "docs/assets/addons/retry.js.map");
copyIfExists("dist/addons/status.js", "docs/assets/addons/status.js");
copyIfExists("dist/addons/status.js.map", "docs/assets/addons/status.js.map");
copyIfExists("dist/addons/presets.js", "docs/assets/addons/presets.js");
copyIfExists("dist/addons/presets.js.map", "docs/assets/addons/presets.js.map");
