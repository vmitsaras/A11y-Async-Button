import { afterEach, describe, expect, it, vi } from "vitest";
import {
  A11yAsyncButtonForm,
  createAsyncButtonForm,
  initAsyncButtonForms,
  type AsyncButtonFormContext,
  type AsyncButtonFormEventDetail
} from "../src/addons/form";

function getForm(selector = "form"): HTMLFormElement {
  const form = document.querySelector(selector);

  if (!(form instanceof HTMLFormElement)) {
    throw new Error(`Missing test form for selector "${selector}".`);
  }

  return form;
}

function getButton(selector = "button"): HTMLButtonElement {
  const button = document.querySelector(selector);

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Missing test button for selector "${selector}".`);
  }

  return button;
}

function submit(form: HTMLFormElement): boolean {
  return form.dispatchEvent(
    new SubmitEvent("submit", { bubbles: true, cancelable: true })
  );
}

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("A11y Async Button form addon", () => {
  it("exports the addon-specific creation API", () => {
    expect(A11yAsyncButtonForm).toBeTypeOf("function");
    expect(createAsyncButtonForm).toBeTypeOf("function");
    expect(initAsyncButtonForms).toBeTypeOf("function");
  });

  it("runs a valid form submit through loading and success states", async () => {
    document.body.innerHTML = `
      <form data-a11y-async-form>
        <label>
          Email
          <input name="email" value="ada@example.com" />
        </label>
        <button
          type="submit"
          data-a11y-async-button
          data-loading-text="Saving"
          data-success-text="Saved"
        >
          Save profile
        </button>
        <p data-a11y-async-form-status>Ready.</p>
      </form>
    `;

    const form = getForm();
    const button = getButton();
    const contexts: AsyncButtonFormContext[] = [];
    const successEvents: Array<CustomEvent<AsyncButtonFormEventDetail>> = [];
    const onSubmit = vi.fn((nextContext: AsyncButtonFormContext) => {
      contexts.push(nextContext);
    });

    form.addEventListener("a11y-async-button-form:success", (event) => {
      successEvents.push(event as CustomEvent<AsyncButtonFormEventDetail>);
    });

    const instance = createAsyncButtonForm(form, { onSubmit });
    const status = instance.statusElement;

    expect(status?.getAttribute("role")).toBe("status");
    expect(status?.getAttribute("aria-live")).toBe("polite");

    expect(submit(form)).toBe(false);

    expect(instance.asyncButton.getState()).toBe("loading");
    expect(button.textContent).toBe("Saving");
    expect(status?.textContent).toBe("Submitting...");

    await Promise.resolve();
    await Promise.resolve();

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(contexts[0]?.formData.get("email")).toBe("ada@example.com");
    expect(instance.asyncButton.getState()).toBe("success");
    expect(button.textContent).toBe("Saved");
    expect(status?.textContent).toBe("Submitted successfully.");
    expect(status?.getAttribute("data-state")).toBe("success");
    expect(successEvents).toHaveLength(1);
    expect(successEvents[0]?.detail.instance).toBe(instance);
  });

  it("uses native validation before starting async work", () => {
    document.body.innerHTML = `
      <form data-a11y-async-form>
        <label>
          Email
          <input name="email" required />
        </label>
        <button type="submit" data-a11y-async-button>Save profile</button>
        <p data-a11y-async-form-status>Ready.</p>
      </form>
    `;

    const form = getForm();
    const reportValidity = vi.spyOn(form, "reportValidity").mockReturnValue(false);
    const onSubmit = vi.fn();
    const invalidEvents: Array<CustomEvent<AsyncButtonFormEventDetail>> = [];

    form.addEventListener("a11y-async-button-form:invalid", (event) => {
      invalidEvents.push(event as CustomEvent<AsyncButtonFormEventDetail>);
    });

    const instance = createAsyncButtonForm(form, { onSubmit });

    expect(submit(form)).toBe(false);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(reportValidity).toHaveBeenCalledTimes(1);
    expect(instance.asyncButton.getState()).toBe("idle");
    expect(instance.statusElement?.textContent).toBe(
      "Check the highlighted fields before submitting."
    );
    expect(instance.statusElement?.getAttribute("data-state")).toBe("invalid");
    expect(invalidEvents).toHaveLength(1);
  });

  it("moves to error state when onSubmit rejects", async () => {
    document.body.innerHTML = `
      <form data-a11y-async-form data-a11y-async-form-error-text="Could not save the profile.">
        <button
          type="submit"
          data-a11y-async-button
          data-error-text="Could not save"
        >
          Save profile
        </button>
        <p data-a11y-async-form-status>Ready.</p>
      </form>
    `;

    const form = getForm();
    const onSubmit = vi.fn().mockRejectedValue(new Error("Network offline"));
    const instance = createAsyncButtonForm(form, { onSubmit });

    submit(form);
    await Promise.resolve();
    await Promise.resolve();

    expect(instance.asyncButton.getState()).toBe("error");
    expect(instance.button.textContent).toBe("Could not save");
    expect(instance.statusElement?.textContent).toBe(
      "Could not save the profile."
    );
    expect(instance.statusElement?.getAttribute("data-state")).toBe("error");
  });

  it("reuses the existing instance on duplicate initialization", () => {
    document.body.innerHTML = `
      <form data-a11y-async-form>
        <button type="submit" data-a11y-async-button>Save profile</button>
      </form>
    `;

    const form = getForm();
    const firstInstance = createAsyncButtonForm(form, { onSubmit: vi.fn() });
    const secondInstance = createAsyncButtonForm(form, { onSubmit: vi.fn() });

    expect(secondInstance).toBe(firstInstance);
  });

  it("initializes all data-marked forms in a root", () => {
    document.body.innerHTML = `
      <section>
        <form data-a11y-async-form>
          <button type="submit" data-a11y-async-button>One</button>
        </form>
        <form data-a11y-async-form>
          <button type="submit" data-a11y-async-button>Two</button>
        </form>
        <form>
          <button type="submit">Ignored</button>
        </form>
      </section>
    `;

    const instances = initAsyncButtonForms({ onSubmit: vi.fn() });

    expect(instances).toHaveLength(2);
    expect(instances.map((instance) => instance.button.textContent)).toEqual([
      "One",
      "Two"
    ]);
  });

  it("destroy removes submit handling and restores status attributes", () => {
    document.body.innerHTML = `
      <form data-a11y-async-form>
        <button type="submit" data-a11y-async-button>Save profile</button>
        <p
          data-a11y-async-form-status
          data-state="custom"
          role="note"
          aria-live="off"
        >Ready.</p>
      </form>
    `;

    const form = getForm();
    const onSubmit = vi.fn();
    const instance = createAsyncButtonForm(form, { onSubmit });

    instance.setStatus("Saving", "loading");
    instance.destroy();
    submit(form);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(instance.statusElement?.textContent).toBe("Ready.");
    expect(instance.statusElement?.getAttribute("data-state")).toBe("custom");
    expect(instance.statusElement?.getAttribute("role")).toBe("note");
    expect(instance.statusElement?.getAttribute("aria-live")).toBe("off");
    expect(instance.button.classList.contains("is-initialized")).toBe(false);
  });
});
