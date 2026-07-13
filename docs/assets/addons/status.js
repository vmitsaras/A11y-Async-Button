import { createAsyncButton } from "../index.js";
//#region src/addons/status.ts
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
];
const DEFAULT_STATUS_OPTIONS = Object.freeze({
	target: null,
	messages: {},
	statusRole: "status",
	statusLiveRegionPoliteness: "polite",
	statusAtomic: true,
	statusStateAttribute: ATTRIBUTES.state,
	syncOnInit: true
});
function isHTMLElement(value) {
	return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}
function isButtonElement(value) {
	return typeof HTMLButtonElement !== "undefined" && value instanceof HTMLButtonElement;
}
function getAttributeValue(element, attribute) {
	return element.hasAttribute(attribute) ? element.getAttribute(attribute) ?? "" : void 0;
}
function toSafeBoolean(value, fallback) {
	if (value === true) return true;
	if (value === false) return false;
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (normalized === "true") return true;
		if (normalized === "false") return false;
	}
	return fallback;
}
function toSafeString(value, fallback) {
	const normalized = typeof value === "string" ? value.trim() : "";
	return normalized.length > 0 ? normalized : fallback;
}
function toSafeAttributeName(value, fallback) {
	const normalized = toSafeString(value, fallback);
	return /^[A-Za-z_][A-Za-z0-9_.:-]*$/.test(normalized) ? normalized : fallback;
}
function toSafeTarget(value, fallback) {
	if (typeof value === "string") {
		const selector = value.trim();
		return selector.length > 0 ? selector : fallback;
	}
	if (isHTMLElement(value)) return value;
	return fallback;
}
function toSafeMessage(value) {
	if (typeof value === "function") return value;
	if (typeof value !== "string") return void 0;
	const normalized = value.trim();
	return normalized.length > 0 ? normalized : void 0;
}
function definedOptions(options) {
	const filteredOptions = {};
	for (const key of Object.keys(options)) {
		const value = options[key];
		if (value !== void 0) filteredOptions[key] = value;
	}
	return filteredOptions;
}
function querySelectorSafely(root, selector) {
	try {
		return root.querySelector(selector);
	} catch {
		return null;
	}
}
function restoreAttribute(element, attribute, value) {
	if (value === null) {
		element.removeAttribute(attribute);
		return;
	}
	element.setAttribute(attribute, value);
}
function getAsyncButtonOptions(options) {
	const asyncButtonOptions = {};
	for (const key of ASYNC_BUTTON_OPTION_KEYS) {
		const value = options[key];
		if (value !== void 0) asyncButtonOptions[key] = value;
	}
	return asyncButtonOptions;
}
function readDataOptions(button) {
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
function mergeMessages(rawOptions) {
	const messages = { ...typeof rawOptions.messages === "object" && rawOptions.messages !== null ? rawOptions.messages : {} };
	const stateMessages = {
		idle: toSafeMessage(rawOptions.idleStatusText),
		loading: toSafeMessage(rawOptions.loadingStatusText),
		success: toSafeMessage(rawOptions.successStatusText),
		error: toSafeMessage(rawOptions.errorStatusText),
		disabled: toSafeMessage(rawOptions.disabledStatusText)
	};
	for (const [state, message] of Object.entries(stateMessages)) if (message !== void 0) messages[state] = message;
	return messages;
}
function normalizeOptions(rawOptions) {
	return {
		target: toSafeTarget(rawOptions.target, DEFAULT_STATUS_OPTIONS.target),
		messages: mergeMessages(rawOptions),
		statusRole: toSafeString(rawOptions.statusRole, DEFAULT_STATUS_OPTIONS.statusRole),
		statusLiveRegionPoliteness: toSafeString(rawOptions.statusLiveRegionPoliteness, DEFAULT_STATUS_OPTIONS.statusLiveRegionPoliteness),
		statusAtomic: toSafeBoolean(rawOptions.statusAtomic, DEFAULT_STATUS_OPTIONS.statusAtomic),
		statusStateAttribute: toSafeAttributeName(rawOptions.statusStateAttribute, DEFAULT_STATUS_OPTIONS.statusStateAttribute),
		syncOnInit: toSafeBoolean(rawOptions.syncOnInit, DEFAULT_STATUS_OPTIONS.syncOnInit)
	};
}
var A11yAsyncButtonStatus = class A11yAsyncButtonStatus {
	static instances = /* @__PURE__ */ new WeakMap();
	button;
	statusElement;
	asyncButton;
	options;
	originalStatus;
	handleStateChange;
	isDestroyed = false;
	constructor(button, options = {}) {
		if (!isButtonElement(button)) throw new Error("A11yAsyncButtonStatus requires a <button> element.");
		const existingInstance = A11yAsyncButtonStatus.instances.get(button);
		if (existingInstance) return existingInstance;
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
		this.button.addEventListener("a11y-async-button:state-change", this.handleStateChange);
		if (this.options.syncOnInit) this.sync(this.asyncButton.getState(), this.getButtonText());
		A11yAsyncButtonStatus.instances.set(button, this);
	}
	setStatus(message, state = "idle") {
		if (this.isDestroyed) return;
		this.statusElement.textContent = message;
		this.statusElement.setAttribute(this.options.statusStateAttribute, state);
		this.dispatchStatusEvent(state, void 0, message, message);
	}
	sync(state = this.asyncButton.getState(), message = "") {
		if (this.isDestroyed) return;
		const statusText = this.resolveStatusText(state, void 0, message);
		this.statusElement.textContent = statusText;
		this.statusElement.setAttribute(this.options.statusStateAttribute, state);
		this.dispatchStatusEvent(state, void 0, message, statusText);
	}
	destroy() {
		if (this.isDestroyed) return;
		this.button.removeEventListener("a11y-async-button:state-change", this.handleStateChange);
		this.restoreStatusElement();
		this.isDestroyed = true;
		A11yAsyncButtonStatus.instances.delete(this.button);
		this.dispatchStatusEvent(this.asyncButton.getState(), void 0, this.getButtonText(), this.originalStatus.text, EVENTS.destroy);
	}
	resolveStatusElement() {
		const configuredTarget = this.options.target;
		if (typeof configuredTarget === "string") {
			const target = typeof document === "undefined" ? null : querySelectorSafely(document, configuredTarget);
			if (isHTMLElement(target)) return target;
		}
		if (isHTMLElement(configuredTarget)) return configuredTarget;
		const describedTarget = this.resolveDescribedByStatusElement();
		if (describedTarget) return describedTarget;
		const parentTarget = this.button.parentElement ? querySelectorSafely(this.button.parentElement, SELECTORS.status) : null;
		if (isHTMLElement(parentTarget)) return parentTarget;
		throw new Error("A11yAsyncButtonStatus requires a status target element.");
	}
	resolveDescribedByStatusElement() {
		const describedBy = this.button.getAttribute(ATTRIBUTES.ariaDescribedBy);
		if (!describedBy || typeof document === "undefined") return null;
		for (const id of describedBy.trim().split(/\s+/)) {
			const target = document.getElementById(id);
			if (isHTMLElement(target)) return target;
		}
		return null;
	}
	prepareStatusElement() {
		if (this.options.statusRole !== "none" && !this.statusElement.hasAttribute("role")) this.statusElement.setAttribute("role", this.options.statusRole);
		if (!this.statusElement.hasAttribute(ATTRIBUTES.ariaLive)) this.statusElement.setAttribute(ATTRIBUTES.ariaLive, this.options.statusLiveRegionPoliteness);
		if (!this.statusElement.hasAttribute(ATTRIBUTES.ariaAtomic)) this.statusElement.setAttribute(ATTRIBUTES.ariaAtomic, String(this.options.statusAtomic));
	}
	restoreStatusElement() {
		this.statusElement.textContent = this.originalStatus.text;
		restoreAttribute(this.statusElement, "role", this.originalStatus.role);
		restoreAttribute(this.statusElement, ATTRIBUTES.ariaLive, this.originalStatus.ariaLive);
		restoreAttribute(this.statusElement, ATTRIBUTES.ariaAtomic, this.originalStatus.ariaAtomic);
		restoreAttribute(this.statusElement, this.options.statusStateAttribute, this.originalStatus.state);
	}
	onStateChange(event) {
		if (!(event instanceof CustomEvent)) return;
		const detail = event.detail;
		const message = detail.message ?? "";
		const statusText = this.resolveStatusText(detail.state, detail.previousState, message);
		this.statusElement.textContent = statusText;
		this.statusElement.setAttribute(this.options.statusStateAttribute, detail.state);
		this.dispatchStatusEvent(detail.state, detail.previousState, message, statusText);
	}
	resolveStatusText(state, previousState, message) {
		const configuredMessage = this.options.messages[state];
		const context = this.createContext(state, previousState, message);
		if (typeof configuredMessage === "function") return configuredMessage(context);
		if (typeof configuredMessage === "string") return configuredMessage;
		if (state === "idle") return this.originalStatus.text;
		return message.length > 0 ? message : this.originalStatus.text;
	}
	createContext(state, previousState, message) {
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
	getButtonText() {
		return (this.button.textContent ?? "").trim();
	}
	dispatchStatusEvent(state, previousState, message, statusText, type = EVENTS.update) {
		this.statusElement.dispatchEvent(new CustomEvent(type, {
			bubbles: true,
			detail: {
				instance: this,
				state,
				previousState,
				message,
				statusText
			}
		}));
	}
};
function createAsyncButtonStatus(button, options = {}) {
	return new A11yAsyncButtonStatus(button, options);
}
function initAsyncButtonStatuses(options = {}, root) {
	if (!root && typeof document === "undefined") return [];
	const scope = root ?? document;
	return [...isButtonElement(scope) && scope.matches(SELECTORS.root) ? [scope] : [], ...Array.from(scope.querySelectorAll(SELECTORS.root)).filter(isButtonElement)].map((button) => createAsyncButtonStatus(button, options));
}
//#endregion
export { A11yAsyncButtonStatus, createAsyncButtonStatus, initAsyncButtonStatuses };

//# sourceMappingURL=status.js.map