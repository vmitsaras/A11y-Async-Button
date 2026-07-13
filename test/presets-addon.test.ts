import { afterEach, describe, expect, it, vi } from "vitest";
import {
  A11yAsyncButtonPreset,
  asyncButtonPresets,
  createAsyncButtonPreset,
  getAsyncButtonPresetOptions,
  initAsyncButtonPresets,
  type AsyncButtonPresetEventDetail
} from "../src/addons/presets";

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

describe("A11y Async Button presets addon", () => {
  it("exports the addon-specific creation API and built-in presets", () => {
    expect(A11yAsyncButtonPreset).toBeTypeOf("function");
    expect(asyncButtonPresets.save.loadingText).toBe("Saving...");
    expect(asyncButtonPresets.send.successText).toBe("Sent");
    expect(createAsyncButtonPreset).toBeTypeOf("function");
    expect(getAsyncButtonPresetOptions).toBeTypeOf("function");
    expect(initAsyncButtonPresets).toBeTypeOf("function");
  });

  it("returns core async button options for named presets with overrides", () => {
    const options = getAsyncButtonPresetOptions("delete", {
      successText: "Removed",
      resetDelay: 100
    });

    expect(options.loadingText).toBe("Deleting...");
    expect(options.successText).toBe("Removed");
    expect(options.errorText).toBe("Could not delete");
    expect(options.liveRegionPoliteness).toBe("assertive");
    expect(options.resetDelay).toBe(100);
  });

  it("initializes a data-marked preset button and passes onAction to core", async () => {
    document.body.innerHTML = `
      <button type="button" data-a11y-async-preset="save">
        Save profile
      </button>
    `;

    const button = getButton();
    const initEvents: Array<CustomEvent<AsyncButtonPresetEventDetail>> = [];
    const onAction = vi.fn();

    button.addEventListener("a11y-async-button-preset:init", (event) => {
      initEvents.push(event as CustomEvent<AsyncButtonPresetEventDetail>);
    });

    const instance = createAsyncButtonPreset(button, { onAction });

    expect(instance.presetName).toBe("save");
    expect(instance.getOptions().loadingText).toBe("Saving...");
    expect(button.classList.contains("is-initialized")).toBe(true);
    expect(button.classList.contains("a11y-async-button--preserve-width")).toBe(
      true
    );
    expect(initEvents).toHaveLength(1);
    expect(initEvents[0]?.detail.instance).toBe(instance);

    expect(click(button)).toBe(false);
    expect(button.textContent).toBe("Saving...");

    await settle();

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(instance.asyncButton.getState()).toBe("success");
    expect(button.textContent).toBe("Saved");
  });

  it("lets data attributes and programmatic options override preset defaults", () => {
    document.body.innerHTML = `
      <button
        type="button"
        data-a11y-async-preset="send"
        data-loading-text="Sending invite..."
        data-error-text="Invite failed"
      >
        Send invite
      </button>
    `;

    const instance = createAsyncButtonPreset(getButton(), {
      successText: "Invite sent"
    });

    expect(instance.getOptions().loadingText).toBe("Sending invite...");
    expect(instance.getOptions().successText).toBe("Invite sent");
    expect(instance.getOptions().errorText).toBe("Invite failed");

    instance.asyncButton.loading();
    expect(instance.button.textContent).toBe("Sending invite...");

    instance.asyncButton.success();
    expect(instance.button.textContent).toBe("Invite sent");
  });

  it("supports project-defined presets by name", () => {
    document.body.innerHTML = `
      <button type="button" data-a11y-async-preset="archive">
        Archive report
      </button>
    `;

    const instance = createAsyncButtonPreset(getButton(), {
      presets: {
        archive: {
          loadingText: "Archiving...",
          successText: "Archived",
          errorText: "Could not archive",
          resetDelay: 50,
          preserveWidth: true
        }
      }
    });

    expect(instance.presetName).toBe("archive");
    expect(instance.getOptions().loadingText).toBe("Archiving...");
    expect(instance.getOptions().resetDelay).toBe(50);

    instance.asyncButton.error();
    expect(instance.button.textContent).toBe("Could not archive");
  });

  it("supports inline custom preset definitions", () => {
    document.body.innerHTML = `
      <button type="button">
        Sync record
      </button>
    `;

    const instance = createAsyncButtonPreset(getButton(), {
      preset: {
        name: "sync-record",
        loadingText: "Syncing...",
        successText: "Synced",
        errorText: "Sync failed"
      }
    });

    expect(instance.presetName).toBe("sync-record");

    instance.asyncButton.loading();
    expect(instance.button.textContent).toBe("Syncing...");
  });

  it("initializes all preset-marked buttons in a root", () => {
    document.body.innerHTML = `
      <section>
        <button type="button" data-a11y-async-preset="save">One</button>
        <button type="button" data-a11y-async-preset="upload">Two</button>
        <button type="button">Ignored</button>
      </section>
    `;

    const section = document.querySelector("section");
    const instances = initAsyncButtonPresets({}, section ?? undefined);

    expect(instances).toHaveLength(2);
    expect(instances.map((instance) => instance.presetName)).toEqual([
      "save",
      "upload"
    ]);
  });

  it("reuses the existing instance on duplicate initialization", () => {
    document.body.innerHTML = `
      <button type="button" data-a11y-async-preset="copy">Copy key</button>
    `;

    const button = getButton();
    const firstInstance = createAsyncButtonPreset(button);
    const secondInstance = createAsyncButtonPreset(button, { preset: "save" });

    expect(secondInstance).toBe(firstInstance);
    expect(secondInstance.presetName).toBe("copy");
  });

  it("throws for unknown preset names", () => {
    document.body.innerHTML = `
      <button type="button" data-a11y-async-preset="teleport">Go</button>
    `;

    expect(() => createAsyncButtonPreset(getButton())).toThrow(
      'Unknown async button preset: "teleport".'
    );
  });

  it("destroy removes preset tracking and restores core button state", () => {
    document.body.innerHTML = `
      <button
        type="button"
        data-a11y-async-preset="refresh"
        data-state="custom"
      >
        Refresh data
      </button>
    `;

    const button = getButton();
    const destroyEvents: Array<CustomEvent<AsyncButtonPresetEventDetail>> = [];
    const instance = createAsyncButtonPreset(button);

    button.addEventListener("a11y-async-button-preset:destroy", (event) => {
      destroyEvents.push(event as CustomEvent<AsyncButtonPresetEventDetail>);
    });

    instance.asyncButton.loading();
    expect(button.textContent).toBe("Refreshing...");

    instance.destroy();

    expect(button.textContent).toBe("Refresh data");
    expect(button.getAttribute("data-state")).toBe("custom");
    expect(button.classList.contains("is-initialized")).toBe(false);
    expect(destroyEvents).toHaveLength(1);

    const nextInstance = createAsyncButtonPreset(button, { preset: "copy" });
    expect(nextInstance).not.toBe(instance);
    expect(nextInstance.presetName).toBe("copy");
  });
});
