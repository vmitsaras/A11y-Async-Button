export interface PluginDocs {
  slug: string;
  name: string;
  packageName: string;
  description: string;
  repo?: string;
  npm?: string;
  install: {
    npm: string;
    pnpm: string;
    yarn: string;
  };
  usage: string;
  selectors?: string[];
  keyboard?: Array<{
    key: string;
    description: string;
  }>;
  api: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  examples?: Array<{
    name: string;
    description: string;
    path: string;
  }>;
}

export const docs = {
  slug: "a11y-async-button",
  name: "A11y Async Button",
  packageName: "a11y-async-button",
  description:
    "Accessible async state management for semantic button elements.",
  repo: "https://github.com/vmitsaras/a11y-async-button",
  npm: "https://www.npmjs.com/package/a11y-async-button",
  install: {
    npm: "npm install a11y-async-button",
    pnpm: "pnpm add a11y-async-button",
    yarn: "yarn add a11y-async-button"
  },
  usage: `import { createAsyncButton } from "a11y-async-button";
import "a11y-async-button/styles.css";

const button = document.querySelector("[data-a11y-async-button]");

if (button instanceof HTMLButtonElement) {
  const asyncButton = createAsyncButton(button);

  button.addEventListener("click", async () => {
    if (asyncButton.getState() !== "idle") return;

    asyncButton.loading();

    try {
      await saveChanges();
      asyncButton.success();
    } catch {
      asyncButton.error();
    }
  });
}`,
  selectors: [
    "[data-a11y-async-button]",
    "[data-a11y-async-button-text]",
    "[data-loading-text]",
    "[data-success-text]",
    "[data-error-text]",
    "[data-idle-text]",
    "[data-reset-delay]",
    "[data-preserve-width]",
    "[data-use-native-disabled]",
    "[data-prevent-double-click]",
    "[data-announce]",
    "[data-announce-loading]",
    "[data-live-region]",
    "[data-live-region-politeness]",
    "[data-a11y-async-form]",
    "[data-a11y-async-form-button]",
    "[data-a11y-async-form-status]",
    "[data-a11y-async-retry]",
    "[data-max-attempts]",
    "[data-retry-text]",
    "[data-final-error-text]",
    "[data-a11y-async-status-button]",
    "[data-a11y-async-status]",
    "[data-status-target]",
    "[data-a11y-async-preset]"
  ],
  keyboard: [
    {
      key: "Enter / Space",
      description:
        "Uses native button activation and blocks repeat activation while loading or locked."
    }
  ],
  api: [
    {
      name: "createAsyncButton(element, options)",
      type:
        "(element: HTMLButtonElement, options?: AsyncButtonOptions) => AsyncButtonInstance",
      description: "Initializes async state behavior on one button."
    },
    {
      name: "initAsyncButtons(options, root)",
      type:
        "(options?: AsyncButtonOptions, root?: ParentNode) => AsyncButtonInstance[]",
      description:
        "Initializes all [data-a11y-async-button] buttons in the given root."
    },
    {
      name: "A11yAsyncButton",
      type: "class",
      description:
        "Plugin-specific class used by createAsyncButton with duplicate initialization protection."
    },
    {
      name: "loading(message)",
      type: "(message?: string) => void",
      description: "Moves the button to the loading state."
    },
    {
      name: "success(message)",
      type: "(message?: string) => void",
      description: "Moves the button to the success state."
    },
    {
      name: "error(message)",
      type: "(message?: string) => void",
      description: "Moves the button to the error state."
    },
    {
      name: "reset()",
      type: "() => void",
      description: "Restores the idle state and original accessibility state."
    },
    {
      name: "lock() / unlock()",
      type: "() => void",
      description:
        "Manually blocks activation, then restores idle state without leaving stale busy semantics."
    },
    {
      name: "destroy()",
      type: "() => void",
      description:
        "Removes event listeners, timers, live region changes, state classes, and instance tracking."
    },
    {
      name: "createAsyncButtonForm(form, options)",
      type:
        "(form: HTMLFormElement, options: AsyncButtonFormOptions) => AsyncButtonFormInstance",
      description:
        "Initializes the optional form addon for validation handoff, async submit state, and visible status feedback."
    },
    {
      name: "initAsyncButtonForms(options, root)",
      type:
        "(options: AsyncButtonFormOptions, root?: ParentNode) => AsyncButtonFormInstance[]",
      description:
        "Initializes all [data-a11y-async-form] forms in the given root."
    },
    {
      name: "createAsyncButtonRetry(button, options)",
      type:
        "(button: HTMLButtonElement, options: AsyncButtonRetryOptions) => AsyncButtonRetryInstance",
      description:
        "Initializes the optional retry addon for recoverable async action failures."
    },
    {
      name: "initAsyncButtonRetries(options, root)",
      type:
        "(options: AsyncButtonRetryOptions, root?: ParentNode) => AsyncButtonRetryInstance[]",
      description:
        "Initializes all [data-a11y-async-retry] buttons in the given root."
    },
    {
      name: "createAsyncButtonStatus(button, options)",
      type:
        "(button: HTMLButtonElement, options?: AsyncButtonStatusOptions) => AsyncButtonStatusInstance",
      description:
        "Initializes the optional status addon for mirroring async button state into an existing visible status element."
    },
    {
      name: "initAsyncButtonStatuses(options, root)",
      type:
        "(options?: AsyncButtonStatusOptions, root?: ParentNode) => AsyncButtonStatusInstance[]",
      description:
        "Initializes all [data-a11y-async-status-button] buttons in the given root."
    },
    {
      name: "createAsyncButtonPreset(button, options)",
      type:
        "(button: HTMLButtonElement, options?: AsyncButtonPresetOptions) => AsyncButtonPresetInstance",
      description:
        "Initializes the optional presets addon with named or custom async button defaults."
    },
    {
      name: "initAsyncButtonPresets(options, root)",
      type:
        "(options?: AsyncButtonPresetOptions, root?: ParentNode) => AsyncButtonPresetInstance[]",
      description:
        "Initializes all [data-a11y-async-preset] buttons in the given root."
    },
    {
      name: "getAsyncButtonPresetOptions(preset, options)",
      type:
        "(preset: string | AsyncButtonPresetDefinition, options?: AsyncButtonPresetOptions) => AsyncButtonOptions",
      description:
        "Returns the core async button options for a named or custom preset."
    },
    {
      name: "createAsyncButtonDebugReport(root, options)",
      type:
        "(root?: ParentNode, options?: AsyncButtonDebugOptions) => AsyncButtonDebugReport",
      description:
        "Scans async button and form-addon markup for setup issues and returns structured findings."
    },
    {
      name: "logAsyncButtonDebugReport(report, options)",
      type: "(report: AsyncButtonDebugReport, options?: AsyncButtonDebugLogOptions) => void",
      description:
        "Logs an existing debug report with severity-specific console methods."
    }
  ],
  examples: [
    {
      name: "Basic",
      description:
        "Demonstrates loading, success, error, auto-reset, and live announcement behavior.",
      path: "docs/examples/basic"
    },
    {
      name: "Icon and text",
      description:
        "Demonstrates changing a decorative icon and visible button label together with the renderText option.",
      path: "docs/examples/icon-text"
    },
    {
      name: "Form addon",
      description:
        "Demonstrates A11y Form Validator integration, simulated server responses, visible status feedback, and error recovery.",
      path: "docs/examples/form"
    },
    {
      name: "Retry addon",
      description:
        "Demonstrates recoverable async failures, retry text, max attempts, and final failure messaging.",
      path: "docs/examples/retry"
    },
    {
      name: "Status addon",
      description:
        "Demonstrates visible status feedback synced from async button state changes.",
      path: "docs/examples/status"
    },
    {
      name: "Presets addon",
      description:
        "Demonstrates common action presets and custom async button copy defaults.",
      path: "docs/examples/presets"
    },
    {
      name: "Debug addon",
      description:
        "Demonstrates markup diagnostics, structured findings, and actionable setup recommendations.",
      path: "docs/examples/debug"
    }
  ]
} satisfies PluginDocs;
