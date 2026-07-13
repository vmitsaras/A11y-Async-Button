import {
  createAsyncButton,
  type AsyncButtonInstance,
  type AsyncButtonOptions
} from "../index";

const PRESET_COMPONENT_NAME = "a11y-async-button-preset";
const DEFAULT_PRESET_NAME = "save";

const SELECTORS = Object.freeze({
  root: "[data-a11y-async-preset]"
});

const ATTRIBUTES = Object.freeze({
  preset: "data-a11y-async-preset",
  loadingText: "data-loading-text",
  successText: "data-success-text",
  errorText: "data-error-text",
  idleText: "data-idle-text",
  resetDelay: "data-reset-delay",
  preserveWidth: "data-preserve-width",
  useNativeDisabled: "data-use-native-disabled",
  preventDoubleClick: "data-prevent-double-click",
  announce: "data-announce",
  announceLoading: "data-announce-loading",
  liveRegion: "data-live-region",
  liveRegionPoliteness: "data-live-region-politeness"
});

const EVENTS = Object.freeze({
  init: `${PRESET_COMPONENT_NAME}:init`,
  destroy: `${PRESET_COMPONENT_NAME}:destroy`
});

const ASYNC_BUTTON_OPTION_KEYS = [
  "loadingText",
  "successText",
  "errorText",
  "idleText",
  "resetDelay",
  "preventDoubleClick",
  "preserveWidth",
  "useNativeDisabled",
  "announce",
  "announceLoading",
  "liveRegionPoliteness",
  "liveRegion",
  "loadingClass",
  "successClass",
  "errorClass",
  "disabledClass",
  "stateAttribute",
  "onLoading",
  "onSuccess",
  "onError",
  "onReset",
  "onStateChange",
  "renderText",
  "onAction"
] as const satisfies ReadonlyArray<keyof AsyncButtonOptions>;

export type AsyncButtonPresetName =
  | "save"
  | "submit"
  | "send"
  | "delete"
  | "upload"
  | "download"
  | "copy"
  | "refresh";

export interface AsyncButtonPresetDefinition
  extends Partial<AsyncButtonOptions> {
  name?: string;
  description?: string;
}

export type AsyncButtonPresetMap = Record<
  string,
  AsyncButtonPresetDefinition
>;

export interface AsyncButtonPresetEventDetail {
  instance: AsyncButtonPresetInstance;
  presetName: string;
  preset: AsyncButtonPresetDefinition;
  options: AsyncButtonOptions;
}

export interface AsyncButtonPresetInstance {
  readonly button: HTMLButtonElement;
  readonly asyncButton: AsyncButtonInstance;
  readonly presetName: string;
  readonly preset: AsyncButtonPresetDefinition;
  getOptions(): AsyncButtonOptions;
  destroy(): void;
}

export interface AsyncButtonPresetOptions extends AsyncButtonOptions {
  preset?: AsyncButtonPresetName | string | AsyncButtonPresetDefinition | null;
  presets?: AsyncButtonPresetMap;
}

interface NormalizedAsyncButtonPresetOptions {
  presetName: string;
  preset: AsyncButtonPresetDefinition;
  asyncButtonOptions: AsyncButtonOptions;
}

export const asyncButtonPresets = Object.freeze({
  save: Object.freeze({
    name: "save",
    description: "Save changes, preferences, or drafts.",
    loadingText: "Saving...",
    successText: "Saved",
    errorText: "Could not save",
    resetDelay: 2000,
    preserveWidth: true
  }),
  submit: Object.freeze({
    name: "submit",
    description: "Submit a review, request, or form-like action.",
    loadingText: "Submitting...",
    successText: "Submitted",
    errorText: "Could not submit",
    resetDelay: 2000,
    preserveWidth: true
  }),
  send: Object.freeze({
    name: "send",
    description: "Send a message, invite, or notification.",
    loadingText: "Sending...",
    successText: "Sent",
    errorText: "Could not send",
    resetDelay: 2000,
    preserveWidth: true
  }),
  delete: Object.freeze({
    name: "delete",
    description: "Delete or remove an item.",
    loadingText: "Deleting...",
    successText: "Deleted",
    errorText: "Could not delete",
    resetDelay: 2400,
    preserveWidth: true,
    liveRegionPoliteness: "assertive"
  }),
  upload: Object.freeze({
    name: "upload",
    description: "Upload a file or attachment.",
    loadingText: "Uploading...",
    successText: "Uploaded",
    errorText: "Upload failed",
    resetDelay: 2400,
    preserveWidth: true
  }),
  download: Object.freeze({
    name: "download",
    description: "Prepare or download a file.",
    loadingText: "Preparing...",
    successText: "Download ready",
    errorText: "Could not prepare download",
    resetDelay: 2400,
    preserveWidth: true
  }),
  copy: Object.freeze({
    name: "copy",
    description: "Copy a value to the clipboard.",
    loadingText: "Copying...",
    successText: "Copied",
    errorText: "Could not copy",
    resetDelay: 1800,
    preserveWidth: true
  }),
  refresh: Object.freeze({
    name: "refresh",
    description: "Refresh data or sync the current view.",
    loadingText: "Refreshing...",
    successText: "Updated",
    errorText: "Could not refresh",
    resetDelay: 2000,
    preserveWidth: true
  })
} satisfies Record<AsyncButtonPresetName, AsyncButtonPresetDefinition>);

function isButtonElement(value: unknown): value is HTMLButtonElement {
  return (
    typeof HTMLButtonElement !== "undefined" &&
    value instanceof HTMLButtonElement
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPresetDefinition(
  value: unknown
): value is AsyncButtonPresetDefinition {
  return isRecord(value);
}

function getAttributeValue(
  element: HTMLElement,
  attribute: string
): string | undefined {
  return element.hasAttribute(attribute)
    ? (element.getAttribute(attribute) ?? "")
    : undefined;
}

function toSafeString(value: unknown, fallback: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized.length > 0 ? normalized : fallback;
}

function definedOptions(
  options: AsyncButtonPresetOptions
): Record<string, unknown> {
  const filteredOptions: Record<string, unknown> = {};

  for (const key of Object.keys(options) as Array<keyof AsyncButtonPresetOptions>) {
    const value = options[key];

    if (value !== undefined) {
      filteredOptions[key] = value;
    }
  }

  return filteredOptions;
}

function pickAsyncButtonOptions(options: object): AsyncButtonOptions {
  const asyncButtonOptions: AsyncButtonOptions = {};
  const optionRecord = options as Record<string, unknown>;

  for (const key of ASYNC_BUTTON_OPTION_KEYS) {
    const value = optionRecord[key];

    if (value !== undefined) {
      (asyncButtonOptions as Record<string, unknown>)[key] = value;
    }
  }

  return asyncButtonOptions;
}

function readDataOptions(button: HTMLButtonElement): Record<string, unknown> {
  return {
    preset: getAttributeValue(button, ATTRIBUTES.preset),
    loadingText: getAttributeValue(button, ATTRIBUTES.loadingText),
    successText: getAttributeValue(button, ATTRIBUTES.successText),
    errorText: getAttributeValue(button, ATTRIBUTES.errorText),
    idleText: getAttributeValue(button, ATTRIBUTES.idleText),
    resetDelay: getAttributeValue(button, ATTRIBUTES.resetDelay),
    preserveWidth: getAttributeValue(button, ATTRIBUTES.preserveWidth),
    useNativeDisabled: getAttributeValue(button, ATTRIBUTES.useNativeDisabled),
    preventDoubleClick: getAttributeValue(button, ATTRIBUTES.preventDoubleClick),
    announce: getAttributeValue(button, ATTRIBUTES.announce),
    announceLoading: getAttributeValue(button, ATTRIBUTES.announceLoading),
    liveRegion: getAttributeValue(button, ATTRIBUTES.liveRegion),
    liveRegionPoliteness: getAttributeValue(
      button,
      ATTRIBUTES.liveRegionPoliteness
    )
  };
}

function mergePresetMaps(
  presets: unknown
): Record<string, AsyncButtonPresetDefinition> {
  const customPresets: AsyncButtonPresetMap = {};

  if (isRecord(presets)) {
    for (const [name, preset] of Object.entries(presets)) {
      if (isPresetDefinition(preset)) {
        customPresets[name] = preset;
      }
    }
  }

  return {
    ...asyncButtonPresets,
    ...customPresets
  };
}

function normalizeOptions(
  rawOptions: Record<string, unknown>
): NormalizedAsyncButtonPresetOptions {
  const presetMap = mergePresetMaps(rawOptions.presets);
  const configuredPreset = rawOptions.preset;
  const presetName = isPresetDefinition(configuredPreset)
    ? toSafeString(configuredPreset.name, "custom")
    : toSafeString(configuredPreset, DEFAULT_PRESET_NAME);
  const preset = isPresetDefinition(configuredPreset)
    ? configuredPreset
    : presetMap[presetName];

  if (!preset) {
    throw new Error(`Unknown async button preset: "${presetName}".`);
  }

  return {
    presetName,
    preset,
    asyncButtonOptions: {
      ...pickAsyncButtonOptions(preset),
      ...pickAsyncButtonOptions(rawOptions)
    }
  };
}

export function getAsyncButtonPresetOptions(
  preset: AsyncButtonPresetName | string | AsyncButtonPresetDefinition,
  options: Omit<AsyncButtonPresetOptions, "preset"> = {}
): AsyncButtonOptions {
  return normalizeOptions({
    ...definedOptions(options),
    preset
  }).asyncButtonOptions;
}

export class A11yAsyncButtonPreset implements AsyncButtonPresetInstance {
  private static readonly instances = new WeakMap<
    HTMLButtonElement,
    A11yAsyncButtonPreset
  >();

  public readonly button!: HTMLButtonElement;
  public readonly asyncButton!: AsyncButtonInstance;
  public readonly presetName!: string;
  public readonly preset!: AsyncButtonPresetDefinition;

  private readonly asyncButtonOptions!: AsyncButtonOptions;
  private isDestroyed = false;

  constructor(button: HTMLButtonElement, options: AsyncButtonPresetOptions = {}) {
    if (!isButtonElement(button)) {
      throw new Error("A11yAsyncButtonPreset requires a <button> element.");
    }

    const existingInstance = A11yAsyncButtonPreset.instances.get(button);

    if (existingInstance) {
      return existingInstance;
    }

    const normalizedOptions = normalizeOptions({
      ...readDataOptions(button),
      ...definedOptions(options)
    });

    this.button = button;
    this.presetName = normalizedOptions.presetName;
    this.preset = normalizedOptions.preset;
    this.asyncButtonOptions = normalizedOptions.asyncButtonOptions;
    this.asyncButton = createAsyncButton(button, this.asyncButtonOptions);

    A11yAsyncButtonPreset.instances.set(button, this);
    this.dispatchPresetEvent(EVENTS.init);
  }

  getOptions(): AsyncButtonOptions {
    return { ...this.asyncButtonOptions };
  }

  destroy(): void {
    if (this.isDestroyed) return;

    this.asyncButton.destroy();
    this.isDestroyed = true;
    A11yAsyncButtonPreset.instances.delete(this.button);
    this.dispatchPresetEvent(EVENTS.destroy);
  }

  private dispatchPresetEvent(type: string): void {
    this.button.dispatchEvent(
      new CustomEvent<AsyncButtonPresetEventDetail>(type, {
        bubbles: true,
        detail: {
          instance: this,
          presetName: this.presetName,
          preset: this.preset,
          options: this.getOptions()
        }
      })
    );
  }
}

export function createAsyncButtonPreset(
  button: HTMLButtonElement,
  options: AsyncButtonPresetOptions = {}
): AsyncButtonPresetInstance {
  return new A11yAsyncButtonPreset(button, options);
}

export function initAsyncButtonPresets(
  options: AsyncButtonPresetOptions = {},
  root?: ParentNode
): AsyncButtonPresetInstance[] {
  if (!root && typeof document === "undefined") {
    return [];
  }

  const scope = root ?? document;
  const rootElement = isButtonElement(scope) && scope.matches(SELECTORS.root)
    ? [scope]
    : [];

  return [
    ...rootElement,
    ...Array.from(scope.querySelectorAll(SELECTORS.root)).filter(isButtonElement)
  ].map((button) => createAsyncButtonPreset(button, options));
}
