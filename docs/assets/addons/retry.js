import { createAsyncButton } from "../index.js";
//#region src/addons/retry.ts
const RETRY_COMPONENT_NAME = "a11y-async-button-retry";
const SELECTORS = Object.freeze({ root: "[data-a11y-async-retry]" });
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
];
const DEFAULT_RETRY_OPTIONS = Object.freeze({
	maxAttempts: 3,
	retryText: "Try again",
	finalErrorText: "Could not complete. Try again later."
});
function isButtonElement(value) {
	return typeof HTMLButtonElement !== "undefined" && value instanceof HTMLButtonElement;
}
function getAttributeValue(element, attribute) {
	return element.hasAttribute(attribute) ? element.getAttribute(attribute) ?? "" : void 0;
}
function toSafeInteger(value, fallback, options = {}) {
	const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
	if (!Number.isFinite(parsed)) return fallback;
	if (options.min !== void 0 && parsed < options.min) return fallback;
	if (options.max !== void 0 && parsed > options.max) return fallback;
	return parsed;
}
function toNullableMessage(value, fallback) {
	if (value === null) return null;
	if (typeof value === "function") return value;
	if (typeof value !== "string") return fallback;
	const normalized = value.trim();
	return normalized.length > 0 ? normalized : fallback;
}
function toSafeCallback(value) {
	return typeof value === "function" ? value : null;
}
function definedOptions(options) {
	const filteredOptions = {};
	for (const key of Object.keys(options)) {
		const value = options[key];
		if (value !== void 0) filteredOptions[key] = value;
	}
	return filteredOptions;
}
function readDataOptions(element) {
	return {
		maxAttempts: getAttributeValue(element, ATTRIBUTES.maxAttempts),
		retryText: getAttributeValue(element, ATTRIBUTES.retryText),
		finalErrorText: getAttributeValue(element, ATTRIBUTES.finalErrorText)
	};
}
function normalizeOptions(rawOptions) {
	const onAttempt = toSafeCallback(rawOptions.onAttempt);
	if (!onAttempt) throw new Error("createAsyncButtonRetry requires an onAttempt handler.");
	return {
		maxAttempts: toSafeInteger(rawOptions.maxAttempts, DEFAULT_RETRY_OPTIONS.maxAttempts, {
			min: 1,
			max: 20
		}),
		retryText: toNullableMessage(rawOptions.retryText, DEFAULT_RETRY_OPTIONS.retryText),
		finalErrorText: toNullableMessage(rawOptions.finalErrorText, DEFAULT_RETRY_OPTIONS.finalErrorText),
		onAttempt
	};
}
function getAsyncButtonOptions(options) {
	const asyncButtonOptions = {};
	for (const key of ASYNC_BUTTON_OPTION_KEYS) {
		const value = options[key];
		if (value !== void 0) asyncButtonOptions[key] = value;
	}
	return asyncButtonOptions;
}
function resolveMessage(message, context) {
	if (message === null) return void 0;
	if (typeof message === "function") return message(context);
	return message;
}
var A11yAsyncButtonRetry = class A11yAsyncButtonRetry {
	static instances = /* @__PURE__ */ new WeakMap();
	button;
	asyncButton;
	options;
	handleClick;
	handleCoreReset;
	currentAttempt = 0;
	lastError = null;
	isDestroyed = false;
	isRunning = false;
	isExhausted = false;
	constructor(button, options) {
		if (!isButtonElement(button)) throw new Error("A11yAsyncButtonRetry requires a <button> element.");
		const existingInstance = A11yAsyncButtonRetry.instances.get(button);
		if (existingInstance) return existingInstance;
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
	get attempt() {
		return this.currentAttempt;
	}
	get maxAttempts() {
		return this.options.maxAttempts;
	}
	get previousError() {
		return this.lastError;
	}
	run() {
		if (!this.canStartAttempt()) return;
		this.runAttempt();
	}
	reset() {
		if (this.isDestroyed) return;
		this.resetRetryState();
		this.asyncButton.reset();
		this.dispatchRetryEvent(EVENTS.reset);
	}
	destroy() {
		if (this.isDestroyed) return;
		this.button.removeEventListener("click", this.handleClick, true);
		this.button.removeEventListener("a11y-async-button:reset", this.handleCoreReset);
		this.asyncButton.destroy();
		this.resetRetryState();
		this.isDestroyed = true;
		A11yAsyncButtonRetry.instances.delete(this.button);
		this.dispatchRetryEvent(EVENTS.destroy);
	}
	onClick(event) {
		event.preventDefault();
		event.stopImmediatePropagation();
		if (!this.canStartAttempt()) {
			if (this.isExhausted) this.dispatchRetryEvent(EVENTS.exhausted, this.lastError);
			return;
		}
		this.runAttempt();
	}
	onCoreReset() {
		this.resetRetryState();
	}
	canStartAttempt() {
		if (this.isDestroyed || this.isRunning || this.isExhausted) return false;
		const state = this.asyncButton.getState();
		return state === "idle" || state === "error";
	}
	async runAttempt() {
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
				this.asyncButton.error(resolveMessage(this.options.finalErrorText, this.createContext()));
				this.dispatchRetryEvent(EVENTS.exhausted, error);
			} else {
				this.asyncButton.error(resolveMessage(this.options.retryText, this.createContext()));
				this.dispatchRetryEvent(EVENTS.retry, error);
			}
		} finally {
			this.isRunning = false;
		}
	}
	createContext() {
		return {
			instance: this,
			button: this.button,
			asyncButton: this.asyncButton,
			attempt: this.currentAttempt,
			maxAttempts: this.options.maxAttempts,
			previousError: this.lastError,
			remainingAttempts: Math.max(this.options.maxAttempts - this.currentAttempt, 0)
		};
	}
	resetRetryState() {
		this.currentAttempt = 0;
		this.lastError = null;
		this.isRunning = false;
		this.isExhausted = false;
	}
	dispatchRetryEvent(type, error) {
		this.button.dispatchEvent(new CustomEvent(type, {
			bubbles: true,
			detail: {
				instance: this,
				attempt: this.currentAttempt,
				maxAttempts: this.options.maxAttempts,
				remainingAttempts: Math.max(this.options.maxAttempts - this.currentAttempt, 0),
				canRetry: !this.isDestroyed && !this.isExhausted && this.currentAttempt < this.options.maxAttempts,
				error
			}
		}));
	}
};
function createAsyncButtonRetry(button, options) {
	return new A11yAsyncButtonRetry(button, options);
}
function initAsyncButtonRetries(options, root) {
	if (!root && typeof document === "undefined") return [];
	const scope = root ?? document;
	return [...isButtonElement(scope) && scope.matches(SELECTORS.root) ? [scope] : [], ...Array.from(scope.querySelectorAll(SELECTORS.root)).filter(isButtonElement)].map((button) => createAsyncButtonRetry(button, options));
}
//#endregion
export { A11yAsyncButtonRetry, createAsyncButtonRetry, initAsyncButtonRetries };

//# sourceMappingURL=retry.js.map