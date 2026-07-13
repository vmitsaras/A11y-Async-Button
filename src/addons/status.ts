import {
  createAsyncButton,
  type AsyncButtonEventDetail,
  type AsyncButtonInstance,
  type AsyncButtonOptions,
  type AsyncButtonState
} from "../index";

const STATUS_COMPONENT_NAME = "a11y-async-button-status";

const SELECTORS = Object.freeze({
  root: "[data-a11y-async-status-button]",
  status: "[data-a11y-async-status]"
});

const ATTRIBUTES = Object.freeze({
  target: "data-status-target",
  idleText: "data-status-idle-text",
  loadingText: "data-status-loading-text",
  successText: "data-status-success-text",
  errorText: "data-status-error-text",
  disabledText: "data-status-disabled-text",
  role: "data-status-role",
  live: "data-status-live",
  atomic: "data-status-atomic",
  sync: "data-status-sync",
  state: "data-state",
  ariaDescribedBy: "aria-describedby",
  ariaLive: "aria-live",
  ariaAtomic: "aria-atomic"
});

const EVENTS = Object.freeze({
  update: `${STATUS_COMPONENT_NAME}:update`,
  destroy: `${STATUS_COMPONENT_NAME}:destroy`
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

export type AsyncButtonStatusMessage =
  | string
  | ((context: AsyncButtonStatusContext) => string);

export type AsyncButtonStatusRole = "status" | "alert" | "none" | string;

export type AsyncButtonStatusLive = "polite" | "assertive" | "off" | string;

export interface AsyncButtonStatusContext {
  readonly instance: AsyncButtonStatusInstance;
  readonly button: HTMLButtonElement;
  readonly statusElement: HTMLElement;
  readonly asyncButton: AsyncButtonInstance;
  readonly state: AsyncButtonState;
  readonly previousState?: AsyncButtonState;
  readonly message: string;
}

export interface AsyncButtonStatusEventDetail {
  instance: AsyncButtonStatusInstance;
  state: AsyncButtonState;
  previousState?: AsyncButtonState;
  message: string;
  statusText: string;
}

export interface AsyncButtonStatusInstance {
  readonly button: HTMLButtonElement;
  readonly statusElement: HTMLElement;
  readonly asyncButton: AsyncButtonInstance;
  setStatus(message: string, state?: AsyncButtonState): void;
  sync(state?: AsyncButtonState, message?: string): void;
  destroy(): void;
}

export interface AsyncButtonStatusOptions extends AsyncButtonOptions {
  target?: string | HTMLElement | null;
  messages?: Partial<Record<AsyncButtonState, AsyncButtonStatusMessage>>;
  idleStatusText?: AsyncButtonStatusMessage;
  loadingStatusText?: AsyncButtonStatusMessage;
  successStatusText?: AsyncButtonStatusMessage;
  errorStatusText?: AsyncButtonStatusMessage;
  disabledStatusText?: AsyncButtonStatusMessage;
  statusRole?: AsyncButtonStatusRole;
  statusLiveRegionPoliteness?: AsyncButtonStatusLive;
  statusAtomic?: boolean | string;
  statusStateAttribute?: string;
  syncOnInit?: boolean | string;
}

interface NormalizedAsyncButtonStatusOptions {
  target: string | HTMLElement | null;
  messages: Partial<Record<AsyncButtonState, AsyncButtonStatusMessage>>;
  statusRole: AsyncButtonStatusRole;
  statusLiveRegionPoliteness: AsyncButtonStatusLive;
  statusAtomic: boolean;
  statusStateAttribute: string;
  syncOnInit: boolean;
}

interface OriginalStatusState {
  text: string;
  role: string | null;
  ariaLive: string | null;
  ariaAtomic: string | null;
  state: string | null;
}

const DEFAULT_STATUS_OPTIONS = Object.freeze({
  target: null,
  messages: {},
  statusRole: "status",
  statusLiveRegionPoliteness: "polite",
  statusAtomic: true,
  statusStateAttribute: ATTRIBUTES.state,
  syncOnInit: true
} satisfies NormalizedAsyncButtonStatusOptions);

function isHTMLElement(value: unknown): value is HTMLElement {
  return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}

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

function toSafeBoolean(value: unknown, fallback: boolean): boolean {
  if (value === true) return true;
  if (value === false) return false;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return fallback;
}

function toSafeString(value: unknown, fallback: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized.length > 0 ? normalized : fallback;
}

function toSafeAttributeName(value: unknown, fallback: string): string {
  const normalized = toSafeString(value, fallback);
  return /^[A-Za-z_][A-Za-z0-9_.:-]*$/.test(normalized)
    ? normalized
    : fallback;
}

function toSafeTarget(
  value: unknown,
  fallback: string | HTMLElement | null
): string | HTMLElement | null {
  if (typeof value === "string") {
    const selector = value.trim();
    return selector.length > 0 ? selector : fallback;
  }

  if (isHTMLElement(value)) {
    return value;
  }

  return fallback;
}

function toSafeMessage(value: unknown): AsyncButtonStatusMessage | undefined {
  if (typeof value === "function") {
    return value as (context: AsyncButtonStatusContext) => string;
  }

  if (typeof value !== "string") return undefined;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function definedOptions(
  options: AsyncButtonStatusOptions
): Record<string, unknown> {
  const filteredOptions: Record<string, unknown> = {};

  for (const key of Object.keys(options) as Array<keyof AsyncButtonStatusOptions>) {
    const value = options[key];

    if (value !== undefined) {
      filteredOptions[key] = value;
    }
  }

  return filteredOptions;
}

function querySelectorSafely(root: ParentNode, selector: string): Element | null {
  try {
    return root.querySelector(selector);
  } catch {
    return null;
  }
}

function restoreAttribute(
  element: HTMLElement,
  attribute: string,
  value: string | null
): void {
  if (value === null) {
    element.removeAttribute(attribute);
    return;
  }

  element.setAttribute(attribute, value);
}

function getAsyncButtonOptions(
  options: AsyncButtonStatusOptions
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

function readDataOptions(
  button: HTMLButtonElement
): Record<string, unknown> {
  return {
    target: getAttributeValue(button, ATTRIBUTES.target),
    idleStatusText: getAttributeValue(button, ATTRIBUTES.idleText),
    loadingStatusText: getAttributeValue(button, ATTRIBUTES.loadingText),
    successStatusText: getAttributeValue(button, ATTRIBUTES.successText),
    errorStatusText: getAttributeValue(button, ATTRIBUTES.errorText),
    disabledStatusText: getAttributeValue(button, ATTRIBUTES.disabledText),
    statusRole: getAttributeValue(button, ATTRIBUTES.role),
    statusLiveRegionPoliteness: getAttributeValue(button, ATTRIBUTES.live),
    statusAtomic: getAttributeValue(button, ATTRIBUTES.atomic),
    syncOnInit: getAttributeValue(button, ATTRIBUTES.sync)
  };
}

function mergeMessages(
  rawOptions: Record<string, unknown>
): Partial<Record<AsyncButtonState, AsyncButtonStatusMessage>> {
  const messages: Partial<Record<AsyncButtonState, AsyncButtonStatusMessage>> = {
    ...(typeof rawOptions.messages === "object" && rawOptions.messages !== null
      ? rawOptions.messages
      : {})
  };
  const stateMessages = {
    idle: toSafeMessage(rawOptions.idleStatusText),
    loading: toSafeMessage(rawOptions.loadingStatusText),
    success: toSafeMessage(rawOptions.successStatusText),
    error: toSafeMessage(rawOptions.errorStatusText),
    disabled: toSafeMessage(rawOptions.disabledStatusText)
  } satisfies Partial<Record<AsyncButtonState, AsyncButtonStatusMessage>>;

  for (const [state, message] of Object.entries(stateMessages) as Array<
    [AsyncButtonState, AsyncButtonStatusMessage | undefined]
  >) {
    if (message !== undefined) {
      messages[state] = message;
    }
  }

  return messages;
}

function normalizeOptions(
  rawOptions: Record<string, unknown>
): NormalizedAsyncButtonStatusOptions {
  return {
    target: toSafeTarget(rawOptions.target, DEFAULT_STATUS_OPTIONS.target),
    messages: mergeMessages(rawOptions),
    statusRole: toSafeString(
      rawOptions.statusRole,
      DEFAULT_STATUS_OPTIONS.statusRole
    ),
    statusLiveRegionPoliteness: toSafeString(
      rawOptions.statusLiveRegionPoliteness,
      DEFAULT_STATUS_OPTIONS.statusLiveRegionPoliteness
    ),
    statusAtomic: toSafeBoolean(
      rawOptions.statusAtomic,
      DEFAULT_STATUS_OPTIONS.statusAtomic
    ),
    statusStateAttribute: toSafeAttributeName(
      rawOptions.statusStateAttribute,
      DEFAULT_STATUS_OPTIONS.statusStateAttribute
    ),
    syncOnInit: toSafeBoolean(
      rawOptions.syncOnInit,
      DEFAULT_STATUS_OPTIONS.syncOnInit
    )
  };
}

export class A11yAsyncButtonStatus implements AsyncButtonStatusInstance {
  private static readonly instances = new WeakMap<
    HTMLButtonElement,
    A11yAsyncButtonStatus
  >();

  public readonly button!: HTMLButtonElement;
  public readonly statusElement!: HTMLElement;
  public readonly asyncButton!: AsyncButtonInstance;

  private readonly options!: NormalizedAsyncButtonStatusOptions;
  private readonly originalStatus!: OriginalStatusState;
  private readonly handleStateChange!: (event: Event) => void;
  private isDestroyed = false;

  constructor(button: HTMLButtonElement, options: AsyncButtonStatusOptions = {}) {
    if (!isButtonElement(button)) {
      throw new Error("A11yAsyncButtonStatus requires a <button> element.");
    }

    const existingInstance = A11yAsyncButtonStatus.instances.get(button);

    if (existingInstance) {
      return existingInstance;
    }

    this.button = button;
    this.options = normalizeOptions({
      ...readDataOptions(button),
      ...definedOptions(options)
    });
    this.asyncButton = createAsyncButton(button, getAsyncButtonOptions(options));
    this.statusElement = this.resolveStatusElement();
    this.originalStatus = {
      text: this.statusElement.textContent ?? "",
      role: this.statusElement.getAttribute("role"),
      ariaLive: this.statusElement.getAttribute(ATTRIBUTES.ariaLive),
      ariaAtomic: this.statusElement.getAttribute(ATTRIBUTES.ariaAtomic),
      state: this.statusElement.getAttribute(this.options.statusStateAttribute)
    };
    this.handleStateChange = this.onStateChange.bind(this);

    this.prepareStatusElement();
    this.button.addEventListener(
      "a11y-async-button:state-change",
      this.handleStateChange
    );

    if (this.options.syncOnInit) {
      this.sync(this.asyncButton.getState(), this.getButtonText());
    }

    A11yAsyncButtonStatus.instances.set(button, this);
  }

  setStatus(message: string, state: AsyncButtonState = "idle"): void {
    if (this.isDestroyed) return;

    this.statusElement.textContent = message;
    this.statusElement.setAttribute(this.options.statusStateAttribute, state);

    this.dispatchStatusEvent(state, undefined, message, message);
  }

  sync(state: AsyncButtonState = this.asyncButton.getState(), message = ""): void {
    if (this.isDestroyed) return;

    const statusText = this.resolveStatusText(state, undefined, message);

    this.statusElement.textContent = statusText;
    this.statusElement.setAttribute(this.options.statusStateAttribute, state);

    this.dispatchStatusEvent(state, undefined, message, statusText);
  }

  destroy(): void {
    if (this.isDestroyed) return;

    this.button.removeEventListener(
      "a11y-async-button:state-change",
      this.handleStateChange
    );
    this.restoreStatusElement();
    this.isDestroyed = true;
    A11yAsyncButtonStatus.instances.delete(this.button);
    this.dispatchStatusEvent(
      this.asyncButton.getState(),
      undefined,
      this.getButtonText(),
      this.originalStatus.text,
      EVENTS.destroy
    );
  }

  private resolveStatusElement(): HTMLElement {
    const configuredTarget = this.options.target;

    if (typeof configuredTarget === "string") {
      const target = typeof document === "undefined"
        ? null
        : querySelectorSafely(document, configuredTarget);

      if (isHTMLElement(target)) {
        return target;
      }
    }

    if (isHTMLElement(configuredTarget)) {
      return configuredTarget;
    }

    const describedTarget = this.resolveDescribedByStatusElement();

    if (describedTarget) {
      return describedTarget;
    }

    const parentTarget = this.button.parentElement
      ? querySelectorSafely(this.button.parentElement, SELECTORS.status)
      : null;

    if (isHTMLElement(parentTarget)) {
      return parentTarget;
    }

    throw new Error(
      "A11yAsyncButtonStatus requires a status target element."
    );
  }

  private resolveDescribedByStatusElement(): HTMLElement | null {
    const describedBy = this.button.getAttribute(ATTRIBUTES.ariaDescribedBy);
    if (!describedBy || typeof document === "undefined") return null;

    for (const id of describedBy.trim().split(/\s+/)) {
      const target = document.getElementById(id);

      if (isHTMLElement(target)) {
        return target;
      }
    }

    return null;
  }

  private prepareStatusElement(): void {
    if (
      this.options.statusRole !== "none" &&
      !this.statusElement.hasAttribute("role")
    ) {
      this.statusElement.setAttribute("role", this.options.statusRole);
    }

    if (!this.statusElement.hasAttribute(ATTRIBUTES.ariaLive)) {
      this.statusElement.setAttribute(
        ATTRIBUTES.ariaLive,
        this.options.statusLiveRegionPoliteness
      );
    }

    if (!this.statusElement.hasAttribute(ATTRIBUTES.ariaAtomic)) {
      this.statusElement.setAttribute(
        ATTRIBUTES.ariaAtomic,
        String(this.options.statusAtomic)
      );
    }
  }

  private restoreStatusElement(): void {
    this.statusElement.textContent = this.originalStatus.text;
    restoreAttribute(this.statusElement, "role", this.originalStatus.role);
    restoreAttribute(
      this.statusElement,
      ATTRIBUTES.ariaLive,
      this.originalStatus.ariaLive
    );
    restoreAttribute(
      this.statusElement,
      ATTRIBUTES.ariaAtomic,
      this.originalStatus.ariaAtomic
    );
    restoreAttribute(
      this.statusElement,
      this.options.statusStateAttribute,
      this.originalStatus.state
    );
  }

  private onStateChange(event: Event): void {
    if (!(event instanceof CustomEvent)) return;

    const detail = event.detail as AsyncButtonEventDetail;
    const message = detail.message ?? "";
    const statusText = this.resolveStatusText(
      detail.state,
      detail.previousState,
      message
    );

    this.statusElement.textContent = statusText;
    this.statusElement.setAttribute(this.options.statusStateAttribute, detail.state);
    this.dispatchStatusEvent(
      detail.state,
      detail.previousState,
      message,
      statusText
    );
  }

  private resolveStatusText(
    state: AsyncButtonState,
    previousState: AsyncButtonState | undefined,
    message: string
  ): string {
    const configuredMessage = this.options.messages[state];
    const context = this.createContext(state, previousState, message);

    if (typeof configuredMessage === "function") {
      return configuredMessage(context);
    }

    if (typeof configuredMessage === "string") {
      return configuredMessage;
    }

    if (state === "idle") {
      return this.originalStatus.text;
    }

    return message.length > 0 ? message : this.originalStatus.text;
  }

  private createContext(
    state: AsyncButtonState,
    previousState: AsyncButtonState | undefined,
    message: string
  ): AsyncButtonStatusContext {
    return {
      instance: this,
      button: this.button,
      statusElement: this.statusElement,
      asyncButton: this.asyncButton,
      state,
      previousState,
      message
    };
  }

  private getButtonText(): string {
    return (this.button.textContent ?? "").trim();
  }

  private dispatchStatusEvent(
    state: AsyncButtonState,
    previousState: AsyncButtonState | undefined,
    message: string,
    statusText: string,
    type: string = EVENTS.update
  ): void {
    this.statusElement.dispatchEvent(
      new CustomEvent<AsyncButtonStatusEventDetail>(type, {
        bubbles: true,
        detail: {
          instance: this,
          state,
          previousState,
          message,
          statusText
        }
      })
    );
  }
}

export function createAsyncButtonStatus(
  button: HTMLButtonElement,
  options: AsyncButtonStatusOptions = {}
): AsyncButtonStatusInstance {
  return new A11yAsyncButtonStatus(button, options);
}

export function initAsyncButtonStatuses(
  options: AsyncButtonStatusOptions = {},
  root?: ParentNode
): AsyncButtonStatusInstance[] {
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
  ].map((button) => createAsyncButtonStatus(button, options));
}
