import { afterEach, describe, expect, it, vi } from "vitest";
import {
  A11yAsyncButtonStatus,
  createAsyncButtonStatus,
  initAsyncButtonStatuses,
  type AsyncButtonStatusContext,
  type AsyncButtonStatusEventDetail
} from "../src/addons/status";

function getButton(selector = "button"): HTMLButtonElement {
  const button = document.querySelector(selector);

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Missing test button for selector "${selector}".`);
  }

  return button;
}

function getStatus(selector = "[data-a11y-async-status]"): HTMLElement {
  const status = document.querySelector(selector);

  if (!(status instanceof HTMLElement)) {
    throw new Error(`Missing test status for selector "${selector}".`);
  }

  return status;
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

describe("A11y Async Button status addon", () => {
  it("exports the addon-specific creation API", () => {
    expect(A11yAsyncButtonStatus).toBeTypeOf("function");
    expect(createAsyncButtonStatus).toBeTypeOf("function");
    expect(initAsyncButtonStatuses).toBeTypeOf("function");
  });

  it("prepares an existing status target and preserves idle text on init", () => {
    document.body.innerHTML = `
      <button
        type="button"
        data-a11y-async-button
        data-a11y-async-status-button
        data-status-target="#save-status"
      >
        Save settings
      </button>
      <p id="save-status" data-a11y-async-status>Ready to save.</p>
    `;

    const instance = createAsyncButtonStatus(getButton());
    const status = instance.statusElement;

    expect(status.textContent).toBe("Ready to save.");
    expect(status.getAttribute("role")).toBe("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.getAttribute("aria-atomic")).toBe("true");
    expect(status.getAttribute("data-state")).toBe("idle");
  });

  it("mirrors core state changes into visible status text", () => {
    document.body.innerHTML = `
      <button
        type="button"
        data-a11y-async-button
        data-a11y-async-status-button
        data-status-target="#save-status"
      >
        Save settings
      </button>
      <p id="save-status" data-a11y-async-status>Ready to save.</p>
    `;

    const instance = createAsyncButtonStatus(getButton());
    const updates: Array<CustomEvent<AsyncButtonStatusEventDetail>> = [];

    instance.statusElement.addEventListener("a11y-async-button-status:update", (event) => {
      updates.push(event as CustomEvent<AsyncButtonStatusEventDetail>);
    });

    instance.asyncButton.loading("Saving settings...");

    expect(instance.statusElement.textContent).toBe("Saving settings...");
    expect(instance.statusElement.getAttribute("data-state")).toBe("loading");
    expect(updates).toHaveLength(1);
    expect(updates[0]?.detail.state).toBe("loading");
    expect(updates[0]?.detail.statusText).toBe("Saving settings...");

    instance.asyncButton.success("Settings saved.");

    expect(instance.statusElement.textContent).toBe("Settings saved.");
    expect(instance.statusElement.getAttribute("data-state")).toBe("success");

    instance.asyncButton.reset();

    expect(instance.statusElement.textContent).toBe("Ready to save.");
    expect(instance.statusElement.getAttribute("data-state")).toBe("idle");
  });

  it("uses custom message options and status data attributes", () => {
    document.body.innerHTML = `
      <button
        type="button"
        data-a11y-async-button
        data-a11y-async-status-button
        data-status-target="#invite-status"
        data-status-loading-text="Sending invite..."
        data-status-success-text="Invite sent."
        data-status-role="alert"
        data-status-live="assertive"
        data-status-atomic="false"
      >
        Send invite
      </button>
      <p id="invite-status" data-a11y-async-status>Ready to invite.</p>
    `;

    const instance = createAsyncButtonStatus(getButton(), {
      messages: {
        error: (context: AsyncButtonStatusContext) =>
          `Invite failed: ${context.message}`
      }
    });

    expect(instance.statusElement.getAttribute("role")).toBe("alert");
    expect(instance.statusElement.getAttribute("aria-live")).toBe("assertive");
    expect(instance.statusElement.getAttribute("aria-atomic")).toBe("false");

    instance.asyncButton.loading();
    expect(instance.statusElement.textContent).toBe("Sending invite...");

    instance.asyncButton.success();
    expect(instance.statusElement.textContent).toBe("Invite sent.");

    instance.asyncButton.error("Email bounced");
    expect(instance.statusElement.textContent).toBe("Invite failed: Email bounced");
  });

  it("passes onAction through to the core async button", async () => {
    document.body.innerHTML = `
      <button
        type="button"
        data-a11y-async-button
        data-a11y-async-status-button
        data-status-target="#save-status"
        data-status-loading-text="Saving preferences..."
        data-status-success-text="Preferences saved."
      >
        Save preferences
      </button>
      <p id="save-status" data-a11y-async-status>Ready.</p>
    `;

    const onAction = vi.fn();
    const instance = createAsyncButtonStatus(getButton(), { onAction });

    expect(click(instance.button)).toBe(false);
    expect(instance.statusElement.textContent).toBe("Saving preferences...");

    await settle();

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(instance.asyncButton.getState()).toBe("success");
    expect(instance.statusElement.textContent).toBe("Preferences saved.");
  });

  it("resolves targets from data attributes, aria-describedby, and parent status markup", () => {
    document.body.innerHTML = `
      <section>
        <button
          type="button"
          data-a11y-async-status-button
          data-status-target="#targeted-status"
        >One</button>
        <p id="targeted-status" data-a11y-async-status>One ready.</p>

        <button
          type="button"
          data-a11y-async-status-button
          aria-describedby="described-status"
        >Two</button>
        <p id="described-status">Two ready.</p>

        <div>
          <button type="button" data-a11y-async-status-button>Three</button>
          <p data-a11y-async-status>Three ready.</p>
        </div>
      </section>
    `;

    const instances = initAsyncButtonStatuses();

    expect(instances).toHaveLength(3);
    expect(instances.map((instance) => instance.statusElement.textContent)).toEqual([
      "One ready.",
      "Two ready.",
      "Three ready."
    ]);
  });

  it("reuses the existing instance on duplicate initialization", () => {
    document.body.innerHTML = `
      <button type="button" data-status-target="#status">Save</button>
      <p id="status" data-a11y-async-status>Ready.</p>
    `;

    const button = getButton();
    const firstInstance = createAsyncButtonStatus(button);
    const secondInstance = createAsyncButtonStatus(button);

    expect(secondInstance).toBe(firstInstance);
  });

  it("throws when no status target can be found", () => {
    document.body.innerHTML = `<button type="button">Save</button>`;

    expect(() => createAsyncButtonStatus(getButton())).toThrow(
      "A11yAsyncButtonStatus requires a status target element."
    );
  });

  it("restores status attributes on destroy without destroying the core button", () => {
    document.body.innerHTML = `
      <button
        type="button"
        data-a11y-async-button
        data-a11y-async-status-button
        data-status-target="#save-status"
      >
        Save settings
      </button>
      <p
        id="save-status"
        data-a11y-async-status
        data-state="custom"
        role="note"
        aria-live="off"
        aria-atomic="false"
      >Original status.</p>
    `;

    const instance = createAsyncButtonStatus(getButton());
    const status = getStatus("#save-status");
    const destroyEvents: Array<CustomEvent<AsyncButtonStatusEventDetail>> = [];

    status.addEventListener("a11y-async-button-status:destroy", (event) => {
      destroyEvents.push(event as CustomEvent<AsyncButtonStatusEventDetail>);
    });

    instance.asyncButton.loading("Saving...");

    expect(status.textContent).toBe("Saving...");
    expect(status.getAttribute("data-state")).toBe("loading");

    instance.destroy();

    expect(status.textContent).toBe("Original status.");
    expect(status.getAttribute("data-state")).toBe("custom");
    expect(status.getAttribute("role")).toBe("note");
    expect(status.getAttribute("aria-live")).toBe("off");
    expect(status.getAttribute("aria-atomic")).toBe("false");
    expect(destroyEvents).toHaveLength(1);

    instance.asyncButton.success("Core still works");

    expect(instance.button.classList.contains("is-initialized")).toBe(true);
    expect(instance.asyncButton.getState()).toBe("success");
    expect(status.textContent).toBe("Original status.");
  });
});
