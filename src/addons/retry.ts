import {
  createAsyncButton,
  type AsyncButtonInstance,
  type AsyncButtonOptions
} from "../index";

const RETRY_COMPONENT_NAME = "a11y-async-button-retry";

const SELECTORS = Object.freeze({
  root: "[data-a11y-async-retry]"
});

const ATTRIBUTES = Object.freeze({
  maxAttempts: "data-max-attempts",
  retryText: "data-retry-text",
  finalErrorText: "data-final-error-text"
});

const EVENTS = Object.freeze({
  attempt: `${RETRY_COMPONENT_NAME}:attempt`,
  retry: `${RETRY_COMPONENT_NAME}:retry`,
  success: `${RETRY_COMPONENT_NAME}:success`,
  exhausted: `${RETRY_COMPONENT_NAME}:exhausted`,
  reset: `${RETRY_COMPONENT_NAME}:reset`,
  destroy: `${RETRY_COMPONENT_NAME}:destroy`
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
  "renderText"
] as const satisfies ReadonlyArray<keyof Omit<AsyncButtonOptions, "onAction">>;

export type AsyncButtonRetryMessage =
  | string
  | null
  | ((context: AsyncButtonRetryContext) => string);

export interface AsyncButtonRetryContext {
  readonly instance: AsyncButtonRetryInstance;
  readonly button: HTMLButtonElement;
  readonly asyncButton: AsyncButtonInstance;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly previousError: unknown;
  readonly remainingAttempts: number;
}

export interface AsyncButtonRetryEventDetail {
  instance: AsyncButtonRetryInstance;
  attempt: number;
  maxAttempts: number;
  remainingAttempts: number;
  canRetry: boolean;
  error?: unknown;
}

export interface AsyncButtonRetryInstance {
  readonly button: HTMLButtonElement;
  readonly asyncButton: AsyncButtonInstance;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly previousError: unknown;
  run(): void;
  reset(): void;
  destroy(): void;
}

export interface AsyncButtonRetryOptions
  extends Omit<AsyncButtonOptions, "onAction"> {
  maxAttempts?: number | string;
  retryText?: AsyncButtonRetryMessage;
  finalErrorText?: AsyncButtonRetryMessage;
  onAttempt: (context: AsyncButtonRetryContext) => Promise<unknown> | unknown;
}

interface NormalizedAsyncButtonRetryOptions {
  maxAttempts: number;
  retryText: AsyncButtonRetryMessage;
  finalErrorText: AsyncButtonRetryMessage;
  onAttempt: (context: AsyncButtonRetryContext) => Promise<unknown> | unknown;
}

const DEFAULT_RETRY_OPTIONS = Object.freeze({
  maxAttempts: 3,
  retryText: "Try again",
  finalErrorText: "Could not complete. Try again later."
} satisfies Omit<NormalizedAsyncButtonRetryOptions, "onAttempt">);

function isButtonElement(value: unknown): value is HTMLButtonElement {
  return (
    typeof HTMLButtonElement !== "undefined" &&
    value instanceof HTMLButtonElement
  );
}

function getAttributeValue(
  element: HTMLElement,
  attribute: string
): string | undefined {
  return element.hasAttribute(attribute)
    ? (element.getAttribute(attribute) ?? "")
    : undefined;
}

function toSafeInteger(
  value: unknown,
  fallback: number,
  options: { min?: number; max?: number } = {}
): number {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed)) return fallback;
  if (options.min !== undefined && parsed < options.min) return fallback;
  if (options.max !== undefined && parsed > options.max) return fallback;

  return parsed;
}

function toNullableMessage(
  value: unknown,
  fallback: AsyncButtonRetryMessage
): AsyncButtonRetryMessage {
  if (value === null) return null;
  if (typeof value === "function") {
    return value as (context: AsyncButtonRetryContext) => string;
  }
  if (typeof value !== "string") return fallback;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

function toSafeCallback<TCallback>(value: unknown): TCallback | null {
  return typeof value === "function" ? (value as TCallback) : null;
}

function definedOptions(options: AsyncButtonRetryOptions): Record<string, unknown> {
  const filteredOptions: Record<string, unknown> = {};

  for (const key of Object.keys(options) as Array<keyof AsyncButtonRetryOptions>) {
    const value = options[key];

    if (value !== undefined) {
      filteredOptions[key] = value;
    }
  }

  return filteredOptions;
}

function readDataOptions(element: HTMLButtonElement): Record<string, unknown> {
  return {
    maxAttempts: getAttributeValue(element, ATTRIBUTES.maxAttempts),
    retryText: getAttributeValue(element, ATTRIBUTES.retryText),
    finalErrorText: getAttributeValue(element, ATTRIBUTES.finalErrorText)
  };
}

function normalizeOptions(
  rawOptions: Record<string, unknown>
): NormalizedAsyncButtonRetryOptions {
  const onAttempt =
    toSafeCallback<NormalizedAsyncButtonRetryOptions["onAttempt"]>(
      rawOptions.onAttempt
    );

  if (!onAttempt) {
    throw new Error("createAsyncButtonRetry requires an onAttempt handler.");
  }

  return {
    maxAttempts: toSafeInteger(
      rawOptions.maxAttempts,
      DEFAULT_RETRY_OPTIONS.maxAttempts,
      { min: 1, max: 20 }
    ),
    retryText: toNullableMessage(
      rawOptions.retryText,
      DEFAULT_RETRY_OPTIONS.retryText
    ),
    finalErrorText: toNullableMessage(
      rawOptions.finalErrorText,
      DEFAULT_RETRY_OPTIONS.finalErrorText
    ),
    onAttempt
  };
}

function getAsyncButtonOptions(
  options: AsyncButtonRetryOptions
): AsyncButtonOptions {
  const asyncButtonOptions: AsyncButtonOptions = {};

  for (const key of ASYNC_BUTTON_OPTION_KEYS) {
    const value = options[key];

    if (value !== undefined) {
      (asyncButtonOptions as Record<string, unknown>)[key] = value;
    }
  }

  return asyncButtonOptions;
}

function resolveMessage(
  message: AsyncButtonRetryMessage,
  context: AsyncButtonRetryContext
): string | undefined {
  if (message === null) return undefined;
  if (typeof message === "function") return message(context);

  return message;
}

export class A11yAsyncButtonRetry implements AsyncButtonRetryInstance {
  private static readonly instances = new WeakMap<
    HTMLButtonElement,
    A11yAsyncButtonRetry
  >();

  public readonly button!: HTMLButtonElement;
  public readonly asyncButton!: AsyncButtonInstance;

  private readonly options!: NormalizedAsyncButtonRetryOptions;
  private readonly handleClick!: (event: MouseEvent) => void;
  private readonly handleCoreReset!: () => void;
  private currentAttempt = 0;
  private lastError: unknown = null;
  private isDestroyed = false;
  private isRunning = false;
  private isExhausted = false;

  constructor(button: HTMLButtonElement, options: AsyncButtonRetryOptions) {
    if (!isButtonElement(button)) {
      throw new Error("A11yAsyncButtonRetry requires a <button> element.");
    }

    const existingInstance = A11yAsyncButtonRetry.instances.get(button);

    if (existingInstance) {
      return existingInstance;
    }

    this.button = button;
    this.options = normalizeOptions({
      ...readDataOptions(button),
      ...definedOptions(options)
    });
    this.asyncButton = createAsyncButton(button, getAsyncButtonOptions(options));
    this.handleClick = this.onClick.bind(this);
    this.handleCoreReset = this.onCoreReset.bind(this);

    this.button.addEventListener("click", this.handleClick, true);
    this.button.addEventListener("a11y-async-button:reset", this.handleCoreReset);
    A11yAsyncButtonRetry.instances.set(button, this);
  }

  get attempt(): number {
    return this.currentAttempt;
  }

  get maxAttempts(): number {
    return this.options.maxAttempts;
  }

  get previousError(): unknown {
    return this.lastError;
  }

  run(): void {
    if (!this.canStartAttempt()) return;

    void this.runAttempt();
  }

  reset(): void {
    if (this.isDestroyed) return;

    this.resetRetryState();
    this.asyncButton.reset();
    this.dispatchRetryEvent(EVENTS.reset);
  }

  destroy(): void {
    if (this.isDestroyed) return;

    this.button.removeEventListener("click", this.handleClick, true);
    this.button.removeEventListener(
      "a11y-async-button:reset",
      this.handleCoreReset
    );
    this.asyncButton.destroy();
    this.resetRetryState();
    this.isDestroyed = true;
    A11yAsyncButtonRetry.instances.delete(this.button);
    this.dispatchRetryEvent(EVENTS.destroy);
  }

  private onClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (!this.canStartAttempt()) {
      if (this.isExhausted) {
        this.dispatchRetryEvent(EVENTS.exhausted, this.lastError);
      }
      return;
    }

    void this.runAttempt();
  }

  private onCoreReset(): void {
    this.resetRetryState();
  }

  private canStartAttempt(): boolean {
    if (this.isDestroyed || this.isRunning || this.isExhausted) return false;

    const state = this.asyncButton.getState();
    return state === "idle" || state === "error";
  }

  private async runAttempt(): Promise<void> {
    if (!this.canStartAttempt()) return;

    this.isRunning = true;
    this.currentAttempt += 1;

    const context = this.createContext();

    this.asyncButton.loading();
    this.dispatchRetryEvent(EVENTS.attempt);

    try {
      await this.options.onAttempt(context);

      if (this.isDestroyed) return;

      this.lastError = null;
      this.isExhausted = false;
      this.asyncButton.success();
      this.dispatchRetryEvent(EVENTS.success);
    } catch (error) {
      if (this.isDestroyed) return;

      this.lastError = error;

      if (this.currentAttempt >= this.options.maxAttempts) {
        this.isExhausted = true;
        this.asyncButton.error(
          resolveMessage(this.options.finalErrorText, this.createContext())
        );
        this.dispatchRetryEvent(EVENTS.exhausted, error);
      } else {
        this.asyncButton.error(
          resolveMessage(this.options.retryText, this.createContext())
        );
        this.dispatchRetryEvent(EVENTS.retry, error);
      }
    } finally {
      this.isRunning = false;
    }
  }

  private createContext(): AsyncButtonRetryContext {
    return {
      instance: this,
      button: this.button,
      asyncButton: this.asyncButton,
      attempt: this.currentAttempt,
      maxAttempts: this.options.maxAttempts,
      previousError: this.lastError,
      remainingAttempts: Math.max(
        this.options.maxAttempts - this.currentAttempt,
        0
      )
    };
  }

  private resetRetryState(): void {
    this.currentAttempt = 0;
    this.lastError = null;
    this.isRunning = false;
    this.isExhausted = false;
  }

  private dispatchRetryEvent(type: string, error?: unknown): void {
    this.button.dispatchEvent(
      new CustomEvent<AsyncButtonRetryEventDetail>(type, {
        bubbles: true,
        detail: {
          instance: this,
          attempt: this.currentAttempt,
          maxAttempts: this.options.maxAttempts,
          remainingAttempts: Math.max(
            this.options.maxAttempts - this.currentAttempt,
            0
          ),
          canRetry:
            !this.isDestroyed &&
            !this.isExhausted &&
            this.currentAttempt < this.options.maxAttempts,
          error
        }
      })
    );
  }
}

export function createAsyncButtonRetry(
  button: HTMLButtonElement,
  options: AsyncButtonRetryOptions
): AsyncButtonRetryInstance {
  return new A11yAsyncButtonRetry(button, options);
}

export function initAsyncButtonRetries(
  options: AsyncButtonRetryOptions,
  root?: ParentNode
): AsyncButtonRetryInstance[] {
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
  ].map((button) => createAsyncButtonRetry(button, options));
}
