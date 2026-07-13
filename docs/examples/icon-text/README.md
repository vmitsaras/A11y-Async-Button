# Icon and Text Button Example

This example demonstrates a core `a11y-async-button` integration where the
button icon and visible label change together for each async state.

## What this example shows

- A semantic button with separate decorative icon and text spans.
- `renderText(button, text, state)` updating both icon and text.
- Loading, success, error, and manual reset states.
- Repeat-click prevention, width preservation, and polite status output.

## How to run

Build the package first:

```bash
npm run build
```

Then open or serve `docs/examples/icon-text/index.html`.

## What to try

- Activate the button and watch the icon and text both change during loading.
- Leave Simulated result on Success and confirm the success state.
- Switch Simulated result to Error and confirm the error state is not color-only.
- Use `Tab`, `Enter`, and `Space` to test native keyboard behavior.
- Use Reset to return the icon, label, badge, and status text to idle.

## Accessibility notes

- The root is a real `<button>` with `data-a11y-async-button`.
- The icon is decorative and marked `aria-hidden="true"`.
- The text span remains the accessible button name.
- The visible status element is reused as the plugin live region.
- The default CSS preserves focus visibility and respects reduced motion.
- The demo keeps the text visible because the icon alone is not an accessible
  name.

## Files

- `index.html`
