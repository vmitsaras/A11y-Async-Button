# A11y Form Validator Submit Example

This example demonstrates `a11y-async-button/addons/form` working with
`vmitsaras/A11y-Form-Validator`.

## What this example shows

- A validation gate that runs A11y Form Validator before async submission starts.
- Inline field errors, async workspace availability, and focused error summary behavior.
- A11y Async Button loading, success, retry/error text, and status-region feedback.
- Local simulated responses for success, server field errors, and network timeout.
- A compact second form using native validation without A11y Form Validator.
- Form-addon options for reset timing, width preservation, duplicate-submit prevention, and state-specific status text.

## How to run

Build this package first:

```bash
npm run build
```

Then serve the repository:

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/docs/examples/form/`.

## What to try

- Change the workspace slug to `admin`, then submit.
- Choose server field errors and submit a valid form.
- Choose network timeout and retry after the button resets.
- Use `Tab`, `Enter`, and `Space` to test native form controls and button activation.
- In the compact example, submit an empty email field and compare its success and error responses.

## Accessibility notes

- The form keeps real labels, inputs, textarea, radio buttons, checkbox, select, and submit button semantics.
- A11y Form Validator associates inline errors with controls and focuses the summary after blocked submits or server errors.
- The async form addon updates a visible polite status region for loading, success, invalid, and error states.
- The simulated network response is local only; no data leaves the page.
- The compact example relies on native constraint validation and keeps focus on the invalid field or submit button according to browser behavior.

## Developer notes

- Async button import: `../../assets/addons/form.js` in this docs build, equivalent to `a11y-async-button/addons/form` in package usage.
- Validator import: `../../assets/vendor/a11y-form-validator/index.min.js`, a vendored browser build for static demo hosting.
- Root selectors: `[data-a11y-async-form]`, `[data-a11y-form-validator]`, `[data-a11y-async-button]`, and `[data-a11y-async-form-status]`.
- The form addon uses `validate: false` because the demo validates with A11y Form Validator before forwarding a validated submit to the async addon.
- The compact `[data-native-async-form]` example uses `validate: true` and does not initialize A11y Form Validator.

## Files

- `index.html`
- shared docs styles from `docs/assets/demo-page.css`
- vendored A11y Form Validator JavaScript, CSS, and license under `docs/assets/vendor/a11y-form-validator/`
