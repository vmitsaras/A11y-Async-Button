# A11y Async Button

Accessible async state management for semantic button elements.

[Try the live demo](https://vmitsaras.github.io/A11y-Async-Button/)

- Zero runtime dependencies
- Preserves native button semantics
- Framework agnostic

## Installation

```bash
npm install a11y-async-button
pnpm add a11y-async-button
yarn add a11y-async-button
```

## Usage

```ts
import { createAsyncButton } from "a11y-async-button";
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
}
```

For compact promise-based integrations, pass `onAction`. The plugin moves to
loading on activation, waits for the returned value, then moves to success or
error.

```ts
createAsyncButton(button, {
  resetDelay: 2500,
  onAction: async () => {
    await saveChanges();
  }
});
```

## Examples

- [Basic](docs/examples/basic) demonstrates direct async button state changes.
- [Icon and text](docs/examples/icon-text) demonstrates changing a decorative icon and visible label together.
- [Form addon with A11y Form Validator](docs/examples/form) demonstrates validation handoff, simulated server responses, and status feedback.
- [Retry addon](docs/examples/retry) demonstrates recoverable async failures.
- [Status addon](docs/examples/status) demonstrates persistent visible feedback.
- [Presets addon](docs/examples/presets) demonstrates named action defaults.
- [Debug addon](docs/examples/debug) demonstrates markup diagnostics.

## Form addon

Use the optional form addon when a submit button should run validation first,
then show async loading, success, error, and visible status feedback. It can use
native constraint validation on its own, or sit behind a validator such as
A11y Form Validator when a project needs inline errors, summaries, async rules,
or server error rendering.

```ts
import { createAsyncButtonForm } from "a11y-async-button/addons/form";
import "a11y-async-button/styles.css";

const form = document.querySelector("[data-a11y-async-form]");

if (form instanceof HTMLFormElement) {
  createAsyncButtonForm(form, {
    onSubmit: async ({ formData, setStatus }) => {
      setStatus("Saving your profile...");
      await saveProfile(formData);
    }
  });
}
```

```html
<form data-a11y-async-form>
  <label>
    Email
    <input name="email" type="email" required />
  </label>

  <button
    class="a11y-async-button"
    type="submit"
    data-a11y-async-button
    data-loading-text="Saving..."
    data-success-text="Saved"
    data-error-text="Could not save"
  >
    <span class="a11y-async-button__text" data-a11y-async-button-text>
      Save profile
    </span>
  </button>

  <p data-a11y-async-form-status>Ready to save.</p>
</form>
```

Importing `a11y-async-button/addons/form` is opt-in. The main package entry does
not import or register the form addon.

## Retry addon

Use the optional retry addon when a recoverable async action should let users
try again after a failure without wiring retry state by hand.

```ts
import { createAsyncButtonRetry } from "a11y-async-button/addons/retry";
import "a11y-async-button/styles.css";

const button = document.querySelector("[data-a11y-async-retry]");

if (button instanceof HTMLButtonElement) {
  createAsyncButtonRetry(button, {
    maxAttempts: 3,
    retryText: "Try saving again",
    finalErrorText: "Save failed. Check your connection.",
    onAttempt: async () => {
      await saveChanges();
    }
  });
}
```

```html
<button
  class="a11y-async-button"
  type="button"
  data-a11y-async-button
  data-a11y-async-retry
  data-loading-text="Saving..."
  data-success-text="Saved"
  data-retry-text="Try again"
  data-final-error-text="Save failed"
  data-max-attempts="3"
>
  <span class="a11y-async-button__text" data-a11y-async-button-text>
    Save changes
  </span>
</button>
```

Importing `a11y-async-button/addons/retry` is opt-in. The main package entry does
not import or register the retry addon.

## Status addon

Use the optional status addon when button text alone is not enough and users
need persistent visible feedback near the action. It mirrors core button state
changes into an existing status element and keeps the target as a live region.

```ts
import { createAsyncButtonStatus } from "a11y-async-button/addons/status";
import "a11y-async-button/styles.css";

const button = document.querySelector("[data-a11y-async-status-button]");

if (button instanceof HTMLButtonElement) {
  createAsyncButtonStatus(button, {
    loadingStatusText: "Saving preferences...",
    successStatusText: "Preferences saved.",
    errorStatusText: "Preferences could not be saved.",
    onAction: async () => {
      await savePreferences();
    }
  });
}
```

```html
<button
  class="a11y-async-button"
  type="button"
  data-a11y-async-button
  data-a11y-async-status-button
  data-status-target="#save-status"
  data-loading-text="Saving..."
  data-success-text="Saved"
  data-error-text="Could not save"
>
  <span class="a11y-async-button__text" data-a11y-async-button-text>
    Save preferences
  </span>
</button>

<p id="save-status" data-a11y-async-status>Ready to save.</p>
```

Importing `a11y-async-button/addons/status` is opt-in. The main package entry
does not import or register the status addon.

## Presets addon

Use the optional presets addon when a project needs consistent loading, success,
error, reset, and width-preservation defaults for common actions. Built-in
presets include `save`, `submit`, `send`, `delete`, `upload`, `download`,
`copy`, and `refresh`.

```ts
import { initAsyncButtonPresets } from "a11y-async-button/addons/presets";
import "a11y-async-button/styles.css";

initAsyncButtonPresets({
  onAction: async (asyncButton) => {
    await runActionFor(asyncButton.element);
  }
});
```

```html
<button
  class="a11y-async-button"
  type="button"
  data-a11y-async-preset="save"
>
  <span class="a11y-async-button__text" data-a11y-async-button-text>
    Save preferences
  </span>
</button>
```

You can add project-specific presets without changing the core package:

```ts
initAsyncButtonPresets({
  presets: {
    archive: {
      loadingText: "Archiving...",
      successText: "Archived",
      errorText: "Could not archive",
      resetDelay: 2200,
      preserveWidth: true
    }
  },
  onAction: async (asyncButton) => {
    await runActionFor(asyncButton.element);
  }
});
```

Importing `a11y-async-button/addons/presets` is opt-in. The main package entry
does not import or register the presets addon.

## Debug addon

Use the optional debug addon in development to scan async button and form-addon
markup for common setup issues. It returns structured findings and can log
actionable recommendations without changing the DOM.

```ts
import { createAsyncButtonDebugReport } from "a11y-async-button/addons/debug";

const report = createAsyncButtonDebugReport(document, {
  includeInfo: true,
  log: true
});

if (report.hasIssues) {
  console.warn(`Found ${report.errorCount} errors and ${report.warningCount} warnings.`);
}
```

Importing `a11y-async-button/addons/debug` is opt-in. The main package entry does
not import or register the debug addon.

## CSS

Import the default CSS when you want baseline button layout, visible focus,
state colors, width preservation, and reduced-motion-safe transitions.

```ts
import "a11y-async-button/styles.css";
```

The CSS uses the `a11y-async-button` BEM block and public custom properties such
as `--a11y-async-button-idle-background`,
`--a11y-async-button-success-background`, and
`--a11y-async-button-focus-ring`.

## HTML structure

Start with a real `<button>`. The plugin progressively enhances existing
button semantics.

```html
<button
  class="a11y-async-button"
  type="button"
  data-a11y-async-button
  data-loading-text="Saving..."
  data-success-text="Saved"
  data-error-text="Could not save"
  data-reset-delay="2000"
>
  <span class="a11y-async-button__text" data-a11y-async-button-text>
    Save changes
  </span>
</button>
```

Useful data attributes:

| Attribute | Purpose |
| --- | --- |
| `data-a11y-async-button` | Marks a button for `initAsyncButtons()`. |
| `data-loading-text` | Text used while work is in progress. |
| `data-success-text` | Text used after successful completion. |
| `data-error-text` | Text used after a failure. |
| `data-idle-text` | Text restored by `reset()`. |
| `data-reset-delay` | Milliseconds before success/error resets. |
| `data-prevent-double-click` | Set to `false` to allow repeat activation while loading. |
| `data-preserve-width` | Preserves the initial rendered width. |
| `data-use-native-disabled` | Uses native `disabled` while locked. |
| `data-announce` | Set to `false` to disable live-region announcements. |
| `data-announce-loading` | Set to `false` to skip the loading announcement. |
| `data-live-region` | Selector for an external live region. |
| `data-live-region-politeness` | Uses `polite`, `assertive`, or `off` for managed live regions. |
| `data-a11y-async-retry` | Marks a button for `initAsyncButtonRetries()`. |
| `data-max-attempts` | Maximum retry attempts for the retry addon. |
| `data-retry-text` | Button text shown after a recoverable failed attempt. |
| `data-final-error-text` | Button text shown after retry attempts are exhausted. |
| `data-a11y-async-status-button` | Marks a button for `initAsyncButtonStatuses()`. |
| `data-a11y-async-status` | Marks an existing visible status target. |
| `data-status-target` | Selector for the status target controlled by the status addon. |
| `data-status-loading-text`, `data-status-success-text`, `data-status-error-text` | Visible status text for the matching state. |
| `data-a11y-async-preset` | Applies a named preset through `initAsyncButtonPresets()`. |

## API

```ts
import {
  A11yAsyncButton,
  createAsyncButton,
  initAsyncButtons,
  type AsyncButtonInstance,
  type AsyncButtonOptions,
  type AsyncButtonState
} from "a11y-async-button";
```

```ts
import {
  A11yAsyncButtonForm,
  createAsyncButtonForm,
  initAsyncButtonForms,
  type AsyncButtonFormInstance,
  type AsyncButtonFormOptions
} from "a11y-async-button/addons/form";
```

```ts
import {
  A11yAsyncButtonRetry,
  createAsyncButtonRetry,
  initAsyncButtonRetries,
  type AsyncButtonRetryInstance,
  type AsyncButtonRetryOptions
} from "a11y-async-button/addons/retry";
```

```ts
import {
  A11yAsyncButtonStatus,
  createAsyncButtonStatus,
  initAsyncButtonStatuses,
  type AsyncButtonStatusInstance,
  type AsyncButtonStatusOptions
} from "a11y-async-button/addons/status";
```

```ts
import {
  A11yAsyncButtonPreset,
  asyncButtonPresets,
  createAsyncButtonPreset,
  getAsyncButtonPresetOptions,
  initAsyncButtonPresets,
  type AsyncButtonPresetInstance,
  type AsyncButtonPresetOptions
} from "a11y-async-button/addons/presets";
```

```ts
import {
  createAsyncButtonDebugReport,
  logAsyncButtonDebugReport,
  type AsyncButtonDebugFinding,
  type AsyncButtonDebugReport
} from "a11y-async-button/addons/debug";
```

| API | Description |
| --- | --- |
| `createAsyncButton(element, options)` | Initializes one button and returns an instance. |
| `initAsyncButtons(options, root)` | Initializes all `[data-a11y-async-button]` buttons in a root. |
| `A11yAsyncButton` | Plugin-specific class used by the creation function. |
| `loading(message)` | Moves the button to loading. |
| `success(message)` | Moves the button to success. |
| `error(message)` | Moves the button to error. |
| `reset()` | Restores idle text, state, and lock attributes. |
| `lock()` / `unlock()` | Manually blocks activation, then restores idle state without stale busy semantics. |
| `getState()` | Returns `idle`, `loading`, `success`, `error`, or `disabled`. |
| `setState(state, message)` | Programmatically sets a state. |
| `destroy()` | Removes listeners, timers, state classes, live-region changes, and duplicate-init tracking. |
| `createAsyncButtonForm(form, options)` | Initializes an async form submit helper around one form and its submit button. |
| `initAsyncButtonForms(options, root)` | Initializes all `[data-a11y-async-form]` forms in a root. |
| `createAsyncButtonRetry(button, options)` | Initializes retry-aware async action handling around one button. |
| `initAsyncButtonRetries(options, root)` | Initializes all `[data-a11y-async-retry]` buttons in a root. |
| `createAsyncButtonStatus(button, options)` | Mirrors one async button state into an existing visible status element. |
| `initAsyncButtonStatuses(options, root)` | Initializes all `[data-a11y-async-status-button]` buttons in a root. |
| `createAsyncButtonPreset(button, options)` | Initializes one async button from a named or custom preset. |
| `initAsyncButtonPresets(options, root)` | Initializes all `[data-a11y-async-preset]` buttons in a root. |
| `getAsyncButtonPresetOptions(preset, options)` | Returns core async button options for a named or custom preset. |
| `createAsyncButtonDebugReport(root, options)` | Scans async button/form-addon markup and returns structured findings. |
| `logAsyncButtonDebugReport(report, options)` | Logs an existing debug report with severity-specific console methods. |

Options include text overrides, `resetDelay`, `preventDoubleClick`,
`preserveWidth`, `useNativeDisabled`, `announce`, `announceLoading`,
`liveRegion`, `liveRegionPoliteness`, state class overrides, lifecycle
callbacks, `renderText`, and `onAction`.

Form addon options include `button`, `status`, `validate`, status text
overrides, and the required `onSubmit` handler. The addon dispatches bubbling
`a11y-async-button-form:submit`, `:success`, `:error`, `:invalid`, and
`:destroy` events from the form.

Retry addon options include `maxAttempts`, `retryText`, `finalErrorText`, and
the required `onAttempt` handler. The addon dispatches bubbling
`a11y-async-button-retry:attempt`, `:retry`, `:success`, `:exhausted`,
`:reset`, and `:destroy` events from the button.

Status addon options include `target`, `messages`, state-specific status text,
`statusRole`, `statusLiveRegionPoliteness`, `statusAtomic`, `syncOnInit`, and
the core async button options such as `onAction`. The addon dispatches bubbling
`a11y-async-button-status:update` and `:destroy` events from the status element.

Presets addon options include `preset`, `presets`, and all core async button
options. The addon dispatches bubbling `a11y-async-button-preset:init` and
`:destroy` events from the button.

Debug addon options include `includeInfo`, `log`, and `logger`. Findings cover
invalid async button elements, missing button type/name/state text, invalid
reset delay, live-region selector mistakes, duplicate IDs, and incomplete form
addon markup.

The plugin dispatches bubbling lifecycle events:

```txt
a11y-async-button:init
a11y-async-button:loading
a11y-async-button:success
a11y-async-button:error
a11y-async-button:reset
a11y-async-button:state-change
a11y-async-button:lock
a11y-async-button:unlock
a11y-async-button:destroy
```

Each event includes `{ instance, state, previousState, message }` in `detail`
where applicable.

## Accessibility notes

- Requires a real `<button>` element.
- Uses native button keyboard behavior for Enter and Space.
- Blocks repeated activation while loading or locked.
- Sets `aria-busy` during async work.
- Uses `aria-disabled` by default so focus does not disappear after activation.
- Can use native `disabled` with `useNativeDisabled` when that behavior is desired.
- Announces loading, success, and error messages through a managed or external live region.
- Restores original ARIA state and removes owned live regions in `destroy()`.
- Respects `prefers-reduced-motion` in the default CSS.

## Docs metadata

```ts
import { docs } from "a11y-async-button/docs";
```

## Compatibility

- Browser runtime: Baseline Widely Available browsers with standard DOM,
  `CustomEvent`, `WeakMap`, and `matchMedia` support.
- Module format: ESM only. CommonJS consumers need an ESM-aware build step or
  dynamic `import()`.
- Node.js: version 22 or newer is supported for Node-based tooling and package
  consumption. The plugin itself requires a browser DOM when instances are
  created.
- Frameworks: the package is framework agnostic and can be used anywhere a
  semantic `HTMLButtonElement` is available.

Older browsers and embedded webviews outside Baseline Widely Available are not
part of the support target. Visual enhancements in the demo pages are
progressive; unsupported decorative CSS does not affect the plugin's core
behavior.

## Limitations

- The plugin enhances real `<button>` elements; it does not turn arbitrary
  elements into buttons.
- It manages UI state and announcements but does not perform network requests,
  retries, validation, or persistence unless the corresponding callback or
  opt-in addon is provided.
- Instantiating the plugin requires a browser DOM. Importing the package is
  side-effect free, but server-side rendering code must defer initialization
  until the relevant elements exist in the browser.
- The default stylesheet is optional. Projects that omit it must provide their
  own visible focus, state, contrast, and reduced-motion treatment.
- Accessibility behavior can vary by browser and assistive technology. The
  documented semantics and automated tests are not a claim of universal WCAG
  conformance for every integration.

## Development

Local development requires Node.js `^22.18.0` or `>=24.11.0`, matching the
current build tool requirements.

```bash
npm install
npm test
npm run typecheck
npm run build
npm run pack:check
```

To preview the documentation and examples locally, serve the repository root
and open `http://127.0.0.1:4173/docs/`:

```bash
python3 -m http.server 4173
```

The build writes package artifacts to `dist/` and refreshes the generated
JavaScript and CSS assets used by the documentation pages.

## Release process

This repository uses Changesets to record release intent, update versions and
the changelog, and publish the prepared package.

1. Add a changeset for each user-facing change:

   ```bash
   npm run changeset
   ```

2. Verify pending release intent and run the full release gate:

   ```bash
   npm run changeset:status
   npm run release:check
   ```

3. Apply pending version and changelog updates, then review and commit them:

   ```bash
   npm run version-packages
   ```

4. From the committed release revision, publish to npm and create the matching
   Git tag:

   ```bash
   npm run release
   git push --follow-tags
   ```

The final step changes npm and Git state. Run it only with the intended npm
account, a clean worktree, and the release commit already pushed or ready to
push.

## License

Released under the [MIT License](LICENSE).
