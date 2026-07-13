import { afterEach, describe, expect, it, vi } from "vitest";
import {
  A11yAsyncButtonRetry,
  createAsyncButtonRetry,
  initAsyncButtonRetries,
  type AsyncButtonRetryContext,
  type AsyncButtonRetryEventDetail
} from "../src/addons/retry";

function getButton(selector = "button"): HTMLButtonElement {
  const button = document.querySelector(selector);

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Missing test button for selector "${selector}".`);
  }

  return button;
}

function click(button: HTMLButtonElement): boolean {
  return button.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true })
  );
}

async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("A11y Async Button retry addon", () => {
  it("exports the addon-specific creation API", () => {
    expect(A11yAsyncButtonRetry).toBeTypeOf("function");
    expect(createAsyncButtonRetry).toBeTypeOf("function");
    expect(initAsyncButtonRetries).toBeTypeOf("function");
  });

  it("runs a first attempt through loading and success states", async () => {
    document.body.innerHTML = `
      <button
        type="button"
        data-a11y-async-button
        data-a11y-async-retry
        data-loading-text="Saving"
        data-success-text="Saved"
      >
        Save profile
      </button>
    `;

    const button = getButton();
    const contexts: AsyncButtonRetryContext[] = [];
    const successEvents: Array<CustomEvent<AsyncButtonRetryEventDetail>> = [];
    const onAttempt = vi.fn((context: AsyncButtonRetryContext) => {
      contexts.push(context);
    });

    button.addEventListener("a11y-async-button-retry:success", (event) => {
      successEvents.push(event as CustomEvent<AsyncButtonRetryEventDetail>);
    });

    const instance = createAsyncButtonRetry(button, { onAttempt });

    expect(click(button)).toBe(false);
    expect(instance.asyncButton.getState()).toBe("loading");
    expect(button.textContent).toBe("Saving");

    await settle();

    expect(onAttempt).toHaveBeenCalledTimes(1);
    expect(contexts[0]?.attempt).toBe(1);
    expect(contexts[0]?.remainingAttempts).toBe(2);
    expect(instance.asyncButton.getState()).toBe("success");
    expect(button.textContent).toBe("Saved");
    expect(successEvents).toHaveLength(1);
    expect(successEvents[0]?.detail.attempt).toBe(1);
  });

  it("shows retry text after a failed attempt and succeeds on retry", async () => {
    document.body.innerHTML = `
      <button
        type="button"
        data-a11y-async-button
        data-a11y-async-retry
        data-loading-text="Saving"
        data-success-text="Saved"
      >
        Save profile
      </button>
    `;

    const button = getButton();
    const retryEvents: Array<CustomEvent<AsyncButtonRetryEventDetail>> = [];
    const onAttempt = vi.fn(async () => {
      if (onAttempt.mock.calls.length === 1) {
        throw new Error("Offline");
      }
    });

    button.addEventListener("a11y-async-button-retry:retry", (event) => {
      retryEvents.push(event as CustomEvent<AsyncButtonRetryEventDetail>);
    });

    const instance = createAsyncButtonRetry(button, {
      retryText: "Retry save",
      onAttempt
    });

    click(button);
    await settle();

    expect(onAttempt).toHaveBeenCalledTimes(1);
    expect(instance.asyncButton.getState()).toBe("error");
    expect(button.textContent).toBe("Retry save");
    expect(retryEvents).toHaveLength(1);
    expect(retryEvents[0]?.detail.canRetry).toBe(true);

    click(button);
    expect(instance.asyncButton.getState()).toBe("loading");
    await settle();

    expect(onAttempt).toHaveBeenCalledTimes(2);
    expect(instance.attempt).toBe(2);
    expect(instance.asyncButton.getState()).toBe("success");
    expect(button.textContent).toBe("Saved");
  });

  it("uses final error text and stops attempts after max attempts", async () => {
    document.body.innerHTML = `
      <button
        type="button"
        data-a11y-async-button
        data-a11y-async-retry
        data-max-attempts="2"
        data-retry-text="Retry upload"
        data-final-error-text="Upload failed"
      >
        Upload file
      </button>
    `;

    const button = getButton();
    const exhaustedEvents: Array<CustomEvent<AsyncButtonRetryEventDetail>> = [];
    const onAttempt = vi.fn().mockRejectedValue(new Error("Timeout"));

    button.addEventListener("a11y-async-button-retry:exhausted", (event) => {
      exhaustedEvents.push(event as CustomEvent<AsyncButtonRetryEventDetail>);
    });

    const instance = createAsyncButtonRetry(button, { onAttempt });

    click(button);
    await settle();

    expect(button.textContent).toBe("Retry upload");
    expect(exhaustedEvents).toHaveLength(0);

    click(button);
    await settle();

    expect(onAttempt).toHaveBeenCalledTimes(2);
    expect(instance.attempt).toBe(2);
    expect(instance.previousError).toBeInstanceOf(Error);
    expect(instance.asyncButton.getState()).toBe("error");
    expect(button.textContent).toBe("Upload failed");
    expect(exhaustedEvents).toHaveLength(1);
    expect(exhaustedEvents[0]?.detail.canRetry).toBe(false);

    click(button);
    await settle();

    expect(onAttempt).toHaveBeenCalledTimes(2);
    expect(exhaustedEvents).toHaveLength(2);
  });

  it("supports function-based retry and final messages", async () => {
    document.body.innerHTML = `
      <button type="button" data-a11y-async-button data-a11y-async-retry>
        Send invite
      </button>
    `;

    const button = getButton();
    const onAttempt = vi.fn().mockRejectedValue(new Error("No route"));

    const instance = createAsyncButtonRetry(button, {
      maxAttempts: 2,
      retryText: (context) => `Retry ${context.remainingAttempts} more time`,
      finalErrorText: (context) => `Stopped after ${context.attempt} attempts`,
      onAttempt
    });

    click(button);
    await settle();
    expect(button.textContent).toBe("Retry 1 more time");

    click(button);
    await settle();
    expect(instance.attempt).toBe(2);
    expect(button.textContent).toBe("Stopped after 2 attempts");
  });

  it("initializes all retry-marked buttons in a root", () => {
    document.body.innerHTML = `
      <section>
        <button type="button" data-a11y-async-button data-a11y-async-retry data-max-attempts="4">One</button>
        <button type="button" data-a11y-async-button data-a11y-async-retry>Two</button>
        <button type="button" data-a11y-async-button>Ignored</button>
      </section>
    `;

    const instances = initAsyncButtonRetries({ onAttempt: vi.fn() });

    expect(instances).toHaveLength(2);
    expect(instances[0]?.maxAttempts).toBe(4);
    expect(instances.map((instance) => instance.button.textContent)).toEqual([
      "One",
      "Two"
    ]);
  });

  it("reuses the existing instance on duplicate initialization", () => {
    document.body.innerHTML = `
      <button type="button" data-a11y-async-button data-a11y-async-retry>
        Save profile
      </button>
    `;

    const button = getButton();
    const firstInstance = createAsyncButtonRetry(button, { onAttempt: vi.fn() });
    const secondInstance = createAsyncButtonRetry(button, { onAttempt: vi.fn() });

    expect(secondInstance).toBe(firstInstance);
  });

  it("reset clears retry state and destroy removes retry handling", async () => {
    document.body.innerHTML = `
      <button
        type="button"
        data-a11y-async-button
        data-a11y-async-retry
        data-retry-text="Try again"
      >
        Save profile
      </button>
    `;

    const button = getButton();
    const onAttempt = vi.fn().mockRejectedValue(new Error("Offline"));
    const instance = createAsyncButtonRetry(button, { onAttempt });

    click(button);
    await settle();

    expect(instance.attempt).toBe(1);
    expect(instance.previousError).toBeInstanceOf(Error);
    expect(button.textContent).toBe("Try again");

    instance.reset();

    expect(instance.attempt).toBe(0);
    expect(instance.previousError).toBeNull();
    expect(instance.asyncButton.getState()).toBe("idle");
    expect(button.textContent).toBe("Save profile");

    instance.destroy();
    expect(click(button)).toBe(true);
    await settle();

    expect(onAttempt).toHaveBeenCalledTimes(1);
    expect(button.classList.contains("is-initialized")).toBe(false);
  });
});
