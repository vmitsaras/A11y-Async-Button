const COMPONENT_NAME = "a11y-async-button";

const STATES = Object.freeze({
  idle: "idle",
  loading: "loading",
  success: "success",
  error: "error",
  disabled: "disabled"
} as const);

const SELECTORS = Object.freeze({
  root: "[data-a11y-async-button]",
  text: "[data-a11y-async-button-text]"
});

const CLASSES = Object.freeze({
  initialized: "is-initialized",
  loading: "is-loading",
  success: "is-success",
  error: "is-error",
  disabled: "is-disabled",
  preserveWidth: "a11y-async-button--preserve-width",
  status: "a11y-async-button__status"
});

const ATTRIBUTES = Object.freeze({
  state: "data-state",
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
  liveRegionPoliteness: "data-live-region-politeness",
  ariaBusy: "aria-busy",
  ariaDisabled: "aria-disabled",
  ariaLabel: "aria-label",
  ariaDescribedBy: "aria-describedby",
  ariaLive: "aria-live",
  ariaAtomic: "aria-atomic"
});

const EVENTS = Object.freeze({
  init: `${COMPONENT_NAME}:init`,
  loading: `${COMPONENT_NAME}:loading`,
  success: `${COMPONENT_NAME}:success`,
  error: `${COMPONENT_NAME}:error`,
  reset: `${COMPONENT_NAME}:reset`,
  stateChange: `${COMPONENT_NAME}:state-change`,
  lock: `${COMPONENT_NAME}:lock`,
  unlock: `${COMPONENT_NAME}:unlock`,
  destroy: `${COMPONENT_NAME}:destroy`
});

type AsyncButtonActionState =
  | typeof STATES.idle
  | typeof STATES.loading
  | typeof STATES.success
  | typeof STATES.error;

export type AsyncButtonState =
  | AsyncButtonActionState
  | typeof STATES.disabled;

export type AsyncButtonLiveRegionPoliteness = "polite" | "assertive" | "off";

export interface AsyncButtonEventDetail {
  instance: AsyncButtonInstance;
  state: AsyncButtonState;
  previousState?: AsyncButtonState;
  message?: string;
}

export interface AsyncButtonInstance {
  readonly element: HTMLButtonElement;
  readonly state: AsyncButtonState;
  loading(message?: string): void;
  success(message?: string): void;
  error(message?: string): void;
  reset(): void;
  getState(): AsyncButtonState;
  setState(state: AsyncButtonState, message?: string): void;
  lock(): void;
  unlock(): void;
  prefersReducedMotion(): boolean;
  destroy(): void;
}

export interface AsyncButtonOptions {
  loadingText?: string | null;
  successText?: string | null;
  errorText?: string | null;
  idleText?: string | null;
  resetDelay?: number | string;
  preventDoubleClick?: boolean | string;
  preserveWidth?: boolean | string;
  useNativeDisabled?: boolean | string;
  announce?: boolean | string;
  announceLoading?: boolean | string;
  liveRegionPoliteness?: AsyncButtonLiveRegionPoliteness | string;
  liveRegion?: string | HTMLElement | null;
  loadingClass?: string;
  successClass?: string;
  errorClass?: string;
  disabledClass?: string;
  stateAttribute?: string;
  onLoading?: (instance: AsyncButtonInstance, message: string) => void;
  onSuccess?: (instance: AsyncButtonInstance, message: string) => void;
  onError?: (instance: AsyncButtonInstance, message: string) => void;
  onReset?: (instance: AsyncButtonInstance, message: string) => void;
  onStateChange?: (
    instance: AsyncButtonInstance,
    state: AsyncButtonState,
    previousState: AsyncButtonState,
    message: string
  ) => void;
  renderText?: (
    button: HTMLButtonElement,
    text: string,
    state: AsyncButtonState
  ) => void;
  onAction?: (instance: AsyncButtonInstance) => Promise<unknown> | unknown;
}

interface NormalizedAsyncButtonOptions {
  loadingText: string | null;
  successText: string | null;
  errorText: string | null;
  idleText: string | null;
  resetDelay: number;
  preventDoubleClick: boolean;
  preserveWidth: boolean;
  useNativeDisabled: boolean;
  announce: boolean;
  announceLoading: boolean;
  liveRegionPoliteness: AsyncButtonLiveRegionPoliteness;
  liveRegion: string | HTMLElement | null;
  loadingClass: string;
  successClass: string;
  errorClass: string;
  disabledClass: string;
  stateAttribute: string;
  onLoading: ((instance: AsyncButtonInstance, message: string) => void) | null;
  onSuccess: ((instance: AsyncButtonInstance, message: string) => void) | null;
  onError: ((instance: AsyncButtonInstance, message: string) => void) | null;
  onReset: ((instance: AsyncButtonInstance, message: string) => void) | null;
  onStateChange:
    | ((
        instance: AsyncButtonInstance,
        state: AsyncButtonState,
        previousState: AsyncButtonState,
        message: string
      ) => void)
    | null;
  renderText:
    | ((
        button: HTMLButtonElement,
        text: string,
        state: AsyncButtonState
      ) => void)
    | null;
  onAction:
    | ((instance: AsyncButtonInstance) => Promise<unknown> | unknown)
    | null;
}

const DEFAULT_OPTIONS = Object.freeze({
  loadingText: null,
  successText: null,
  errorText: null,
  idleText: null,
  resetDelay: 0,
  preventDoubleClick: true,
  preserveWidth: false,
  useNativeDisabled: false,
  announce: true,
  announceLoading: true,
  liveRegionPoliteness: "polite",
  liveRegion: null,
  loadingClass: CLASSES.loading,
  successClass: CLASSES.success,
  errorClass: CLASSES.error,
  disabledClass: CLASSES.disabled,
  stateAttribute: ATTRIBUTES.state,
  onLoading: null,
  onSuccess: null,
  onError: null,
  onReset: null,
  onStateChange: null,
  renderText: null,
  onAction: null
} satisfies NormalizedAsyncButtonOptions);

interface LiveRegionOriginalAttributes {
  ariaLive: string | null;
  ariaAtomic: string | null;
}

interface SharedLiveRegionRecord extends LiveRegionOriginalAttributes {
  references: number;
}

function isHTMLElement(value: unknown): value is HTMLElement {
  return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}

function isButtonElement(value: unknown): value is HTMLButtonElement {
  return (
    typeof HTMLButtonElement !== "undefined" &&
    value instanceof HTMLButtonElement
  );
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

function toNullableString(value: unknown, fallback: string | null): string | null {
  if (value === null) return null;
  if (typeof value !== "string") return fallback;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

function toSafeString(value: unknown, fallback: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized.length > 0 ? normalized : fallback;
}

function toSafeClassName(value: unknown, fallback: string): string {
  const normalized = toSafeString(value, fallback);
  return /\s/.test(normalized) ? fallback : normalized;
}

function toSafeAttributeName(value: unknown, fallback: string): string {
  const normalized = toSafeString(value, fallback);
  return /^[A-Za-z_][A-Za-z0-9_.:-]*$/.test(normalized)
    ? normalized
    : fallback;
}

function toSafePoliteness(
  value: unknown,
  fallback: AsyncButtonLiveRegionPoliteness
): AsyncButtonLiveRegionPoliteness {
  if (value === "polite" || value === "assertive" || value === "off") {
    return value;
  }

  return fallback;
}

function toSafeLiveRegion(
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

function toSafeCallback<TCallback>(value: unknown): TCallback | null {
  return typeof value === "function" ? (value as TCallback) : null;
}

function getAttributeValue(
  element: HTMLElement,
  attribute: string
): string | undefined {
  return element.hasAttribute(attribute)
    ? (element.getAttribute(attribute) ?? "")
    : undefined;
}

function getBooleanAttributeValue(
  element: HTMLElement,
  attribute: string
): string | boolean | undefined {
  if (!element.hasAttribute(attribute)) return undefined;

  const value = element.getAttribute(attribute);
  return value === "" || value === null ? true : value;
}

function definedOptions(options: AsyncButtonOptions): Record<string, unknown> {
  const filteredOptions: Record<string, unknown> = {};

  for (const key of Object.keys(options) as Array<keyof AsyncButtonOptions>) {
    const value = options[key];

    if (value !== undefined) {
      filteredOptions[key] = value;
    }
  }

  return filteredOptions;
}

function normalizeOptions(
  rawOptions: Record<string, unknown>
): NormalizedAsyncButtonOptions {
  return {
    loadingText: toNullableString(
      rawOptions.loadingText,
      DEFAULT_OPTIONS.loadingText
    ),
    successText: toNullableString(
      rawOptions.successText,
      DEFAULT_OPTIONS.successText
    ),
    errorText: toNullableString(rawOptions.errorText, DEFAULT_OPTIONS.errorText),
    idleText: toNullableString(rawOptions.idleText, DEFAULT_OPTIONS.idleText),
    resetDelay: toSafeInteger(rawOptions.resetDelay, DEFAULT_OPTIONS.resetDelay, {
      min: 0,
      max: 600000
    }),
    preventDoubleClick: toSafeBoolean(
      rawOptions.preventDoubleClick,
      DEFAULT_OPTIONS.preventDoubleClick
    ),
    preserveWidth: toSafeBoolean(
      rawOptions.preserveWidth,
      DEFAULT_OPTIONS.preserveWidth
    ),
    useNativeDisabled: toSafeBoolean(
      rawOptions.useNativeDisabled,
      DEFAULT_OPTIONS.useNativeDisabled
    ),
    announce: toSafeBoolean(rawOptions.announce, DEFAULT_OPTIONS.announce),
    announceLoading: toSafeBoolean(
      rawOptions.announceLoading,
      DEFAULT_OPTIONS.announceLoading
    ),
    liveRegionPoliteness: toSafePoliteness(
      rawOptions.liveRegionPoliteness,
      DEFAULT_OPTIONS.liveRegionPoliteness
    ),
    liveRegion: toSafeLiveRegion(
      rawOptions.liveRegion,
      DEFAULT_OPTIONS.liveRegion
    ),
    loadingClass: toSafeClassName(
      rawOptions.loadingClass,
      DEFAULT_OPTIONS.loadingClass
    ),
    successClass: toSafeClassName(
      rawOptions.successClass,
      DEFAULT_OPTIONS.successClass
    ),
    errorClass: toSafeClassName(
      rawOptions.errorClass,
      DEFAULT_OPTIONS.errorClass
    ),
    disabledClass: toSafeClassName(
      rawOptions.disabledClass,
      DEFAULT_OPTIONS.disabledClass
    ),
    stateAttribute: toSafeAttributeName(
      rawOptions.stateAttribute,
      DEFAULT_OPTIONS.stateAttribute
    ),
    onLoading: toSafeCallback<NormalizedAsyncButtonOptions["onLoading"]>(
      rawOptions.onLoading
    ),
    onSuccess: toSafeCallback<NormalizedAsyncButtonOptions["onSuccess"]>(
      rawOptions.onSuccess
    ),
    onError: toSafeCallback<NormalizedAsyncButtonOptions["onError"]>(
      rawOptions.onError
    ),
    onReset: toSafeCallback<NormalizedAsyncButtonOptions["onReset"]>(
      rawOptions.onReset
    ),
    onStateChange: toSafeCallback<
      NormalizedAsyncButtonOptions["onStateChange"]
    >(rawOptions.onStateChange),
    renderText: toSafeCallback<NormalizedAsyncButtonOptions["renderText"]>(
      rawOptions.renderText
    ),
    onAction: toSafeCallback<NormalizedAsyncButtonOptions["onAction"]>(
      rawOptions.onAction
    )
  };
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

function querySelectorSafely(selector: string): Element | null {
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}

export class A11yAsyncButton implements AsyncButtonInstance {
  private static readonly instances = new WeakMap<
    HTMLButtonElement,
    A11yAsyncButton
  >();
  private static readonly sharedLiveRegions = new WeakMap<
    HTMLElement,
    SharedLiveRegionRecord
  >();

  public readonly element!: HTMLButtonElement;
  public state: AsyncButtonState = STATES.idle;

  private readonly options!: NormalizedAsyncButtonOptions;
  private readonly originalText!: string;
  private readonly originalAriaBusy!: string | null;
  private readonly originalAriaDisabled!: string | null;
  private readonly originalAriaLabel!: string | null;
  private readonly originalStateAttribute!: string | null;
  private readonly originalDisabled!: boolean;
  private readonly originalMinWidth!: string;
  private readonly handleClick!: (event: MouseEvent) => void;
  private readonly handleKeydown!: (event: KeyboardEvent) => void;

  private isLocked = false;
  private isActionRunning = false;
  private isDestroyed = false;
  private resetTimer: ReturnType<typeof setTimeout> | null = null;
  private announceTimer: ReturnType<typeof setTimeout> | null = null;
  private ownsLiveRegion = false;
  private liveRegionElement: HTMLElement | null = null;

  constructor(element: HTMLButtonElement, options: AsyncButtonOptions = {}) {
    if (!isButtonElement(element)) {
      throw new Error("A11yAsyncButton requires a <button> element.");
    }

    const existingInstance = A11yAsyncButton.instances.get(element);

    if (existingInstance) {
      return existingInstance;
    }

    this.element = element;
    this.options = this.mergeOptions(options);
    this.originalText = this.getButtonText();
    this.originalAriaBusy = element.getAttribute(ATTRIBUTES.ariaBusy);
    this.originalAriaDisabled = element.getAttribute(ATTRIBUTES.ariaDisabled);
    this.originalAriaLabel = element.getAttribute(ATTRIBUTES.ariaLabel);
    this.originalStateAttribute = element.getAttribute(this.options.stateAttribute);
    this.originalDisabled = element.disabled;
    this.originalMinWidth = element.style.minWidth;
    this.handleClick = this.onClick.bind(this);
    this.handleKeydown = this.onKeydown.bind(this);

    A11yAsyncButton.instances.set(element, this);

    this.setupLiveRegion();

    if (this.options.preserveWidth) {
      this.storeWidth();
      this.element.classList.add(CLASSES.preserveWidth);
    }

    this.element.classList.add(CLASSES.initialized);
    this.element.setAttribute(this.options.stateAttribute, STATES.idle);
    this.element.addEventListener("click", this.handleClick, true);
    this.element.addEventListener("keydown", this.handleKeydown, true);

    this.dispatchLifecycleEvent(EVENTS.init, {
      state: this.state,
      message: this.originalText
    });
  }

  loading(message?: string): void {
    if (this.isDestroyed) return;

    if (
      this.isLocked &&
      this.options.preventDoubleClick &&
      this.state === STATES.loading
    ) {
      return;
    }

    this.clearResetTimer();

    const text = this.resolveStateText(STATES.loading, message, "Loading...");

    this.transition(STATES.loading, text);
    this.element.setAttribute(ATTRIBUTES.ariaBusy, "true");
    this.applyLockedState();

    if (this.options.announceLoading) {
      this.announce(text);
    }

    this.options.onLoading?.(this, text);

    if (this.options.onAction) {
      void this.runAction();
    }
  }

  success(message?: string): void {
    if (this.isDestroyed) return;

    const text = this.resolveStateText(STATES.success, message, "Done");

    this.transition(STATES.success, text);
    this.element.setAttribute(ATTRIBUTES.ariaBusy, "false");
    this.removeLockedState();
    this.announce(text);
    this.options.onSuccess?.(this, text);
    this.scheduleResetIfNeeded();
  }

  error(message?: string): void {
    if (this.isDestroyed) return;

    const text = this.resolveStateText(STATES.error, message, this.originalText);

    this.transition(STATES.error, text);
    this.element.setAttribute(ATTRIBUTES.ariaBusy, "false");
    this.removeLockedState();
    this.announce(text);
    this.options.onError?.(this, text);
    this.scheduleResetIfNeeded();
  }

  reset(): void {
    if (this.isDestroyed) return;

    this.clearResetTimer();

    const previousState = this.state;
    const text = this.resolveStateText(STATES.idle, undefined, this.originalText);

    this.setButtonText(text, STATES.idle);
    this.removeStateClasses();
    this.state = STATES.idle;
    this.element.setAttribute(this.options.stateAttribute, STATES.idle);
    restoreAttribute(this.element, ATTRIBUTES.ariaBusy, this.originalAriaBusy);
    this.removeLockedState();

    this.dispatchLifecycleEvent(EVENTS.reset, {
      state: this.state,
      previousState,
      message: text
    });
    this.dispatchStateChange(this.state, previousState, text);
    this.options.onReset?.(this, text);
  }

  getState(): AsyncButtonState {
    return this.state;
  }

  setState(state: AsyncButtonState, message?: string): void {
    switch (state) {
      case STATES.loading:
        this.loading(message);
        break;
      case STATES.success:
        this.success(message);
        break;
      case STATES.error:
        this.error(message);
        break;
      case STATES.idle:
        this.reset();
        break;
      case STATES.disabled:
        this.lock();
        break;
      default:
        throw new Error(`Unknown async button state: "${String(state)}".`);
    }
  }

  lock(): void {
    if (this.isDestroyed) return;

    const previousState = this.state;

    this.clearResetTimer();
    this.clearAnnounceTimer();
    this.removeStateClasses();
    this.state = STATES.disabled;
    restoreAttribute(this.element, ATTRIBUTES.ariaBusy, this.originalAriaBusy);
    this.applyLockedState();
    this.element.classList.add(this.options.disabledClass);
    this.element.setAttribute(this.options.stateAttribute, STATES.disabled);

    this.dispatchLifecycleEvent(EVENTS.lock, {
      state: this.state,
      previousState,
      message: this.getButtonText()
    });
    this.dispatchStateChange(this.state, previousState, this.getButtonText());
  }

  unlock(): void {
    if (this.isDestroyed) return;

    const previousState = this.state;
    const text = this.resolveStateText(STATES.idle, undefined, this.originalText);

    this.clearAnnounceTimer();
    this.removeLockedState();
    this.removeStateClasses();
    this.setButtonText(text, STATES.idle);
    this.state = STATES.idle;
    restoreAttribute(this.element, ATTRIBUTES.ariaBusy, this.originalAriaBusy);
    this.element.setAttribute(this.options.stateAttribute, STATES.idle);

    this.dispatchLifecycleEvent(EVENTS.unlock, {
      state: this.state,
      previousState,
      message: text
    });
    this.dispatchStateChange(this.state, previousState, text);
  }

  prefersReducedMotion(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  destroy(): void {
    if (this.isDestroyed) return;

    const previousState = this.state;

    this.clearResetTimer();
    this.clearAnnounceTimer();
    this.element.removeEventListener("click", this.handleClick, true);
    this.element.removeEventListener("keydown", this.handleKeydown, true);
    this.setButtonText(this.originalText, STATES.idle);
    this.removeStateClasses();
    this.element.classList.remove(CLASSES.initialized, CLASSES.preserveWidth);
    restoreAttribute(this.element, ATTRIBUTES.ariaBusy, this.originalAriaBusy);
    restoreAttribute(
      this.element,
      ATTRIBUTES.ariaDisabled,
      this.originalAriaDisabled
    );
    restoreAttribute(this.element, ATTRIBUTES.ariaLabel, this.originalAriaLabel);
    restoreAttribute(
      this.element,
      this.options.stateAttribute,
      this.originalStateAttribute
    );
    this.element.disabled = this.originalDisabled;
    this.element.style.minWidth = this.originalMinWidth;
    this.restoreLiveRegion();
    this.isLocked = false;
    this.isActionRunning = false;
    this.state = STATES.idle;
    this.isDestroyed = true;
    A11yAsyncButton.instances.delete(this.element);

    this.dispatchLifecycleEvent(EVENTS.destroy, {
      state: this.state,
      previousState,
      message: this.originalText
    });
  }

  private mergeOptions(options: AsyncButtonOptions): NormalizedAsyncButtonOptions {
    return normalizeOptions({
      ...this.readDataOptions(),
      ...definedOptions(options)
    });
  }

  private readDataOptions(): Record<string, unknown> {
    return {
      loadingText: getAttributeValue(this.element, ATTRIBUTES.loadingText),
      successText: getAttributeValue(this.element, ATTRIBUTES.successText),
      errorText: getAttributeValue(this.element, ATTRIBUTES.errorText),
      idleText: getAttributeValue(this.element, ATTRIBUTES.idleText),
      resetDelay: getAttributeValue(this.element, ATTRIBUTES.resetDelay),
      preserveWidth: getBooleanAttributeValue(
        this.element,
        ATTRIBUTES.preserveWidth
      ),
      useNativeDisabled: getBooleanAttributeValue(
        this.element,
        ATTRIBUTES.useNativeDisabled
      ),
      preventDoubleClick: getBooleanAttributeValue(
        this.element,
        ATTRIBUTES.preventDoubleClick
      ),
      announce: getBooleanAttributeValue(this.element, ATTRIBUTES.announce),
      announceLoading: getBooleanAttributeValue(
        this.element,
        ATTRIBUTES.announceLoading
      ),
      liveRegion: getAttributeValue(this.element, ATTRIBUTES.liveRegion),
      liveRegionPoliteness: getAttributeValue(
        this.element,
        ATTRIBUTES.liveRegionPoliteness
      )
    };
  }

  private resolveStateText(
    state: AsyncButtonActionState,
    message: string | undefined,
    fallback: string
  ): string {
    if (message !== undefined) return message;

    const optionText = this.getOptionText(state);
    if (optionText !== null) return optionText;

    const attribute = this.getStateTextAttribute(state);
    const attributeText = attribute
      ? this.element.getAttribute(attribute)
      : null;

    return attributeText ?? fallback;
  }

  private getOptionText(state: AsyncButtonActionState): string | null {
    switch (state) {
      case STATES.loading:
        return this.options.loadingText;
      case STATES.success:
        return this.options.successText;
      case STATES.error:
        return this.options.errorText;
      case STATES.idle:
        return this.options.idleText;
    }
  }

  private getStateTextAttribute(state: AsyncButtonActionState): string | null {
    switch (state) {
      case STATES.loading:
        return ATTRIBUTES.loadingText;
      case STATES.success:
        return ATTRIBUTES.successText;
      case STATES.error:
        return ATTRIBUTES.errorText;
      case STATES.idle:
        return ATTRIBUTES.idleText;
    }
  }

  private transition(state: Exclude<AsyncButtonActionState, "idle">, text: string): void {
    const previousState = this.state;

    this.removeStateClasses();
    this.setButtonText(text, state);
    this.state = state;
    this.element.classList.add(this.getStateClass(state));
    this.element.setAttribute(this.options.stateAttribute, state);

    this.dispatchLifecycleEvent(EVENTS[state], {
      state,
      previousState,
      message: text
    });
    this.dispatchStateChange(state, previousState, text);
  }

  private getStateClass(state: Exclude<AsyncButtonActionState, "idle">): string {
    switch (state) {
      case STATES.loading:
        return this.options.loadingClass;
      case STATES.success:
        return this.options.successClass;
      case STATES.error:
        return this.options.errorClass;
    }
  }

  private applyLockedState(): void {
    this.isLocked = true;

    if (this.options.useNativeDisabled) {
      this.element.disabled = true;
      return;
    }

    this.element.setAttribute(ATTRIBUTES.ariaDisabled, "true");
  }

  private removeLockedState(): void {
    this.isLocked = false;

    if (this.options.useNativeDisabled) {
      this.element.disabled = this.originalDisabled;
      return;
    }

    restoreAttribute(
      this.element,
      ATTRIBUTES.ariaDisabled,
      this.originalAriaDisabled
    );
  }

  private scheduleResetIfNeeded(): void {
    if (this.options.resetDelay <= 0) return;

    this.clearResetTimer();
    this.resetTimer = setTimeout(() => {
      this.reset();
    }, this.options.resetDelay);
  }

  private clearResetTimer(): void {
    if (this.resetTimer === null) return;

    clearTimeout(this.resetTimer);
    this.resetTimer = null;
  }

  private clearAnnounceTimer(): void {
    if (this.announceTimer === null) return;

    clearTimeout(this.announceTimer);
    this.announceTimer = null;
  }

  private announce(message: string): void {
    if (!this.options.announce || !this.liveRegionElement || message.length === 0) {
      return;
    }

    this.clearAnnounceTimer();
    this.liveRegionElement.textContent = "";

    const region = this.liveRegionElement;

    this.announceTimer = setTimeout(() => {
      region.textContent = message;
      this.announceTimer = null;
    }, 50);
  }

  private setupLiveRegion(): void {
    if (!this.options.announce) return;

    const configuredRegion = this.resolveConfiguredLiveRegion();

    if (configuredRegion) {
      this.liveRegionElement = configuredRegion;
      this.acquireSharedLiveRegion(configuredRegion);
      return;
    }

    const describedRegion = this.resolveDescribedLiveRegion();

    if (describedRegion) {
      this.liveRegionElement = describedRegion;
      this.acquireSharedLiveRegion(describedRegion);
      return;
    }

    const region = document.createElement("span");
    region.className = CLASSES.status;
    this.prepareOwnedLiveRegion(region);

    if (this.element.parentNode) {
      this.element.parentNode.insertBefore(region, this.element.nextSibling);
    } else {
      document.body.appendChild(region);
    }

    this.liveRegionElement = region;
    this.ownsLiveRegion = true;
  }

  private resolveConfiguredLiveRegion(): HTMLElement | null {
    if (!this.options.liveRegion) return null;

    if (typeof this.options.liveRegion === "string") {
      const region = querySelectorSafely(this.options.liveRegion);
      return isHTMLElement(region) ? region : null;
    }

    return this.options.liveRegion;
  }

  private resolveDescribedLiveRegion(): HTMLElement | null {
    const describedBy = this.element.getAttribute(ATTRIBUTES.ariaDescribedBy);
    if (!describedBy) return null;

    for (const id of describedBy.trim().split(/\s+/)) {
      const target = document.getElementById(id);

      if (isHTMLElement(target)) {
        return target;
      }
    }

    return null;
  }

  private prepareOwnedLiveRegion(region: HTMLElement): void {
    if (!region.hasAttribute(ATTRIBUTES.ariaLive)) {
      region.setAttribute(ATTRIBUTES.ariaLive, this.options.liveRegionPoliteness);
    }

    if (!region.hasAttribute(ATTRIBUTES.ariaAtomic)) {
      region.setAttribute(ATTRIBUTES.ariaAtomic, "true");
    }
  }

  private acquireSharedLiveRegion(region: HTMLElement): void {
    const existingRecord = A11yAsyncButton.sharedLiveRegions.get(region);

    if (existingRecord) {
      existingRecord.references += 1;
    } else {
      A11yAsyncButton.sharedLiveRegions.set(region, {
        references: 1,
        ariaLive: region.getAttribute(ATTRIBUTES.ariaLive),
        ariaAtomic: region.getAttribute(ATTRIBUTES.ariaAtomic)
      });
    }

    if (!region.hasAttribute(ATTRIBUTES.ariaLive)) {
      region.setAttribute(ATTRIBUTES.ariaLive, this.options.liveRegionPoliteness);
    }

    if (!region.hasAttribute(ATTRIBUTES.ariaAtomic)) {
      region.setAttribute(ATTRIBUTES.ariaAtomic, "true");
    }
  }

  private releaseSharedLiveRegion(region: HTMLElement): void {
    const record = A11yAsyncButton.sharedLiveRegions.get(region);

    if (!record) return;

    if (record.references > 1) {
      record.references -= 1;
      return;
    }

    restoreAttribute(region, ATTRIBUTES.ariaLive, record.ariaLive);
    restoreAttribute(region, ATTRIBUTES.ariaAtomic, record.ariaAtomic);
    A11yAsyncButton.sharedLiveRegions.delete(region);
  }

  private restoreLiveRegion(): void {
    if (!this.liveRegionElement) return;

    if (this.ownsLiveRegion) {
      this.liveRegionElement.remove();
    } else {
      this.releaseSharedLiveRegion(this.liveRegionElement);
    }

    this.liveRegionElement = null;
    this.ownsLiveRegion = false;
  }

  private storeWidth(): void {
    const width = this.element.getBoundingClientRect().width;

    if (width > 0) {
      this.element.style.minWidth = `${width}px`;
    }
  }

  private getButtonText(): string {
    const textNode = this.element.querySelector(SELECTORS.text);
    return (textNode?.textContent ?? this.element.textContent ?? "").trim();
  }

  private setButtonText(text: string, state: AsyncButtonState = this.state): void {
    if (this.options.renderText) {
      this.options.renderText(this.element, text, state);
      return;
    }

    const textNode = this.element.querySelector(SELECTORS.text);

    if (textNode) {
      textNode.textContent = text;
      return;
    }

    this.element.textContent = text;
  }

  private removeStateClasses(): void {
    this.element.classList.remove(
      this.options.loadingClass,
      this.options.successClass,
      this.options.errorClass,
      this.options.disabledClass
    );
  }

  private dispatchLifecycleEvent(
    name: string,
    detail: Omit<AsyncButtonEventDetail, "instance">
  ): void {
    this.element.dispatchEvent(
      new CustomEvent<AsyncButtonEventDetail>(name, {
        bubbles: true,
        detail: {
          instance: this,
          ...detail
        }
      })
    );
  }

  private dispatchStateChange(
    state: AsyncButtonState,
    previousState: AsyncButtonState,
    message: string
  ): void {
    this.element.dispatchEvent(
      new CustomEvent<AsyncButtonEventDetail>(EVENTS.stateChange, {
        bubbles: true,
        detail: {
          instance: this,
          state,
          previousState,
          message
        }
      })
    );

    this.options.onStateChange?.(this, state, previousState, message);
  }

  private onClick(event: MouseEvent): void {
    if (this.isLocked && this.options.preventDoubleClick) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    if (this.options.onAction) {
      event.preventDefault();
      this.loading();
    }
  }

  private onKeydown(event: KeyboardEvent): void {
    if (!this.isLocked || !this.options.preventDoubleClick) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  private async runAction(): Promise<void> {
    if (!this.options.onAction || this.isActionRunning) return;

    this.isActionRunning = true;

    try {
      await this.options.onAction(this);

      if (!this.isDestroyed) {
        this.success();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;

      if (!this.isDestroyed) {
        this.error(message);
      }
    } finally {
      this.isActionRunning = false;
    }
  }
}

export function createAsyncButton(
  element: HTMLButtonElement,
  options: AsyncButtonOptions = {}
): AsyncButtonInstance {
  return new A11yAsyncButton(element, options);
}

export function initAsyncButtons(
  options: AsyncButtonOptions = {},
  root?: ParentNode
): AsyncButtonInstance[] {
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
  ]
    .map((element) => createAsyncButton(element, options));
}
