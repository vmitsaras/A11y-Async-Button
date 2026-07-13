import { afterEach, describe, expect, it, vi } from "vitest";
import {
  A11yAsyncButton,
  createAsyncButton,
  initAsyncButtons,
  type AsyncButtonState,
  type AsyncButtonEventDetail
} from "../src/index";

function getButton(selector = "button"): HTMLButtonElement {
  const button = document.querySelector(selector);

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Missing test button for selector "${selector}".`);
  }

  return button;
}

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("A11y Async Button", () => {
  it("exports the plugin-specific creation API", () => {
    expect(A11yAsyncButton).toBeTypeOf("function");
    expect(createAsyncButton).toBeTypeOf("function");
    expect(initAsyncButtons).toBeTypeOf("function");
  });

  it("initializes valid button markup", () => {
    document.body.innerHTML = `
      <button class="a11y-async-button" type="button" data-a11y-async-button>
        Save changes
      </button>
    `;

    const button = getButton();
    const instance = createAsyncButton(button);

    expect(instance.element).toBe(button);
    expect(instance.getState()).toBe("idle");
    expect(button.classList.contains("is-initialized")).toBe(true);
    expect(button.getAttribute("data-state")).toBe("idle");
    expect(document.querySelector(".a11y-async-button__status")).not.toBeNull();
  });

  it("reuses the existing instance on duplicate initialization", () => {
    document.body.innerHTML = `
      <button class="a11y-async-button" type="button" data-a11y-async-button>
        Save changes
      </button>
    `;

    const button = getButton();
    const firstInstance = createAsyncButton(button);
    const secondInstance = createAsyncButton(button, {
      loadingText: "Please wait"
    });

    expect(secondInstance).toBe(firstInstance);
  });

  it("dispatches bubbling lifecycle and state-change events", () => {
    document.body.innerHTML = `
      <div data-wrapper>
        <button class="a11y-async-button" type="button" data-a11y-async-button>
          Save changes
        </button>
      </div>
    `;

    const button = getButton();
    const wrapper = document.querySelector("[data-wrapper]");
    const initEvents: Array<CustomEvent<AsyncButtonEventDetail>> = [];
    const stateEvents: Array<CustomEvent<AsyncButtonEventDetail>> = [];

    wrapper?.addEventListener("a11y-async-button:init", (event) => {
      initEvents.push(event as CustomEvent<AsyncButtonEventDetail>);
    });
    wrapper?.addEventListener("a11y-async-button:state-change", (event) => {
      stateEvents.push(event as CustomEvent<AsyncButtonEventDetail>);
    });

    const instance = createAsyncButton(button);
    instance.loading("Saving");

    expect(initEvents).toHaveLength(1);
    expect(initEvents[0]?.detail.instance).toBe(instance);
    expect(stateEvents).toHaveLength(1);
    expect(stateEvents[0]?.detail.state).toBe("loading");
    expect(stateEvents[0]?.detail.previousState).toBe("idle");
  });

  it("updates ARIA, classes, text, and live announcements for state changes", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <button
        class="a11y-async-button"
        type="button"
        data-a11y-async-button
        data-loading-text="Saving"
        data-success-text="Saved"
      >
        Save changes
      </button>
    `;

    const button = getButton();
    const instance = createAsyncButton(button);

    instance.loading();

    expect(button.textContent).toBe("Saving");
    expect(button.classList.contains("is-loading")).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.getAttribute("aria-disabled")).toBe("true");

    await vi.advanceTimersByTimeAsync(50);
    expect(document.querySelector(".a11y-async-button__status")?.textContent).toBe(
      "Saving"
    );

    instance.success();

    expect(button.textContent).toBe("Saved");
    expect(button.classList.contains("is-success")).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("false");
    expect(button.hasAttribute("aria-disabled")).toBe(false);
  });

  it("passes the target state to custom renderText callbacks", () => {
    document.body.innerHTML = `
      <button
        class="a11y-async-button"
        type="button"
        data-a11y-async-button
        data-loading-text="Syncing"
        data-success-text="Synced"
        data-error-text="Needs review"
        data-idle-text="Sync"
      >
        <span data-a11y-async-button-text>Sync</span>
      </button>
    `;

    const button = getButton();
    const renderText = vi.fn(
      (element: HTMLButtonElement, text: string, _state: AsyncButtonState) => {
        const textNode = element.querySelector("[data-a11y-async-button-text]");
        if (textNode) textNode.textContent = text;
      }
    );
    const instance = createAsyncButton(button, { renderText });

    instance.loading();
    instance.success();
    instance.error();
    instance.reset();

    expect(renderText.mock.calls.map(([, , state]) => state)).toEqual([
      "loading",
      "success",
      "error",
      "idle"
    ]);
  });

  it("blocks repeated click activation while loading", () => {
    document.body.innerHTML = `
      <button class="a11y-async-button" type="button" data-a11y-async-button>
        Save changes
      </button>
    `;

    const button = getButton();
    const instance = createAsyncButton(button);
    const clickHandler = vi.fn();

    button.addEventListener("click", clickHandler);
    instance.loading();
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    expect(clickHandler).not.toHaveBeenCalled();
  });

  it("blocks Enter and Space repeat activation while loading", () => {
    document.body.innerHTML = `
      <button class="a11y-async-button" type="button" data-a11y-async-button>
        Save changes
      </button>
    `;

    const button = getButton();
    const instance = createAsyncButton(button);
    const keydownHandler = vi.fn();

    button.addEventListener("keydown", keydownHandler);
    instance.loading();

    for (const key of ["Enter", " "]) {
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key
      });
      const dispatched = button.dispatchEvent(event);

      expect(dispatched).toBe(false);
    }

    expect(keydownHandler).not.toHaveBeenCalled();
  });

  it("keeps lock and unlock semantic state aligned after loading", () => {
    document.body.innerHTML = `
      <button
        class="a11y-async-button"
        type="button"
        data-a11y-async-button
        data-loading-text="Saving"
      >
        Save changes
      </button>
    `;

    const button = getButton();
    const instance = createAsyncButton(button);

    instance.loading();
    instance.lock();

    expect(instance.getState()).toBe("disabled");
    expect(button.getAttribute("data-state")).toBe("disabled");
    expect(button.hasAttribute("aria-busy")).toBe(false);
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.classList.contains("is-loading")).toBe(false);
    expect(button.classList.contains("is-disabled")).toBe(true);

    instance.unlock();

    expect(instance.getState()).toBe("idle");
    expect(button.getAttribute("data-state")).toBe("idle");
    expect(button.textContent).toBe("Save changes");
    expect(button.hasAttribute("aria-busy")).toBe(false);
    expect(button.hasAttribute("aria-disabled")).toBe(false);
    expect(button.classList.contains("is-disabled")).toBe(false);
  });

  it("runs an onAction handler and resolves to success", async () => {
    document.body.innerHTML = `
      <button
        class="a11y-async-button"
        type="button"
        data-a11y-async-button
        data-loading-text="Saving"
        data-success-text="Saved"
      >
        Save changes
      </button>
    `;

    const button = getButton();
    const onAction = vi.fn().mockResolvedValue(undefined);
    const instance = createAsyncButton(button, { onAction });

    button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await Promise.resolve();
    await Promise.resolve();

    expect(onAction).toHaveBeenCalledWith(instance);
    expect(instance.getState()).toBe("success");
    expect(button.textContent).toBe("Saved");
  });

  it("resets after the configured delay", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <button
        class="a11y-async-button"
        type="button"
        data-a11y-async-button
        data-success-text="Saved"
        data-reset-delay="100"
      >
        Save changes
      </button>
    `;

    const button = getButton();
    const instance = createAsyncButton(button);

    instance.success();
    expect(instance.getState()).toBe("success");

    await vi.advanceTimersByTimeAsync(100);

    expect(instance.getState()).toBe("idle");
    expect(button.textContent).toBe("Save changes");
  });

  it("parses data booleans safely", () => {
    document.body.innerHTML = `
      <button
        class="a11y-async-button"
        type="button"
        data-a11y-async-button
        data-preserve-width="FALSE"
      >
        Save changes
      </button>
    `;

    const button = getButton();
    vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 120,
      height: 40,
      top: 0,
      right: 120,
      bottom: 40,
      left: 0,
      toJSON: () => ({})
    });

    createAsyncButton(button);

    expect(button.style.minWidth).toBe("");
  });

  it("falls back to an owned live region when a configured selector is invalid", () => {
    document.body.innerHTML = `
      <button class="a11y-async-button" type="button" data-a11y-async-button>
        Save changes
      </button>
    `;

    const button = getButton();

    expect(() =>
      createAsyncButton(button, {
        liveRegion: "["
      })
    ).not.toThrow();
    expect(document.querySelector(".a11y-async-button__status")).not.toBeNull();
  });

  it("keeps shared external live regions prepared until the last instance is destroyed", () => {
    document.body.innerHTML = `
      <div id="status"></div>
      <button type="button" data-a11y-async-button data-live-region="#status">One</button>
      <button type="button" data-a11y-async-button data-live-region="#status">Two</button>
    `;

    const [firstInstance, secondInstance] = initAsyncButtons();
    const status = document.querySelector("#status");

    expect(status?.getAttribute("aria-live")).toBe("polite");
    expect(status?.getAttribute("aria-atomic")).toBe("true");

    firstInstance?.destroy();

    expect(status?.getAttribute("aria-live")).toBe("polite");
    expect(status?.getAttribute("aria-atomic")).toBe("true");

    secondInstance?.destroy();

    expect(status?.hasAttribute("aria-live")).toBe(false);
    expect(status?.hasAttribute("aria-atomic")).toBe(false);
  });

  it("initializes all data-marked buttons in a root", () => {
    document.body.innerHTML = `
      <section>
        <button type="button" data-a11y-async-button>One</button>
        <button type="button" data-a11y-async-button>Two</button>
        <button type="button">Ignored</button>
      </section>
    `;

    const instances = initAsyncButtons();

    expect(instances).toHaveLength(2);
    expect(instances.map((instance) => instance.element.textContent)).toEqual([
      "One",
      "Two"
    ]);
  });

  it("initializes the root itself when it is a marked button", () => {
    document.body.innerHTML = `
      <button type="button" data-a11y-async-button>Root button</button>
    `;

    const instances = initAsyncButtons({}, getButton());

    expect(instances).toHaveLength(1);
    expect(instances[0]?.element.textContent).toBe("Root button");
  });

  it("destroy removes listeners, state, live region, and instance tracking", () => {
    document.body.innerHTML = `
      <button class="a11y-async-button" type="button" data-a11y-async-button>
        Save changes
      </button>
    `;

    const button = getButton();
    const instance = createAsyncButton(button);

    instance.loading();
    instance.destroy();

    expect(button.classList.contains("is-initialized")).toBe(false);
    expect(button.classList.contains("is-loading")).toBe(false);
    expect(button.hasAttribute("data-state")).toBe(false);
    expect(button.hasAttribute("aria-busy")).toBe(false);
    expect(button.hasAttribute("aria-disabled")).toBe(false);
    expect(document.querySelector(".a11y-async-button__status")).toBeNull();
    expect(createAsyncButton(button)).not.toBe(instance);
  });
});
