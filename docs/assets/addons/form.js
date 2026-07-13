import { createAsyncButton } from "../index.js";
//#region src/addons/form.ts
const FORM_COMPONENT_NAME = "a11y-async-button-form";
const SELECTORS = Object.freeze({
	root: "[data-a11y-async-form]",
	button: "[data-a11y-async-form-button], [data-a11y-async-button], button[type='submit'], button:not([type])",
	status: "[data-a11y-async-form-status]"
});
const ATTRIBUTES = Object.freeze({
	validate: "data-a11y-async-form-validate",
	idleStatusText: "data-a11y-async-form-idle-text",
	loadingStatusText: "data-a11y-async-form-loading-text",
	successStatusText: "data-a11y-async-form-success-text",
	errorStatusText: "data-a11y-async-form-error-text",
	invalidStatusText: "data-a11y-async-form-invalid-text",
	state: "data-state",
	role: "role",
	ariaLive: "aria-live",
	ariaAtomic: "aria-atomic"
});
const EVENTS = Object.freeze({
	submit: `${FORM_COMPONENT_NAME}:submit`,
	success: `${FORM_COMPONENT_NAME}:success`,
	error: `${FORM_COMPONENT_NAME}:error`,
	invalid: `${FORM_COMPONENT_NAME}:invalid`,
	destroy: `${FORM_COMPONENT_NAME}:destroy`
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
const DEFAULT_FORM_OPTIONS = Object.freeze({
	button: null,
	status: null,
	validate: true,
	idleStatusText: null,
	loadingStatusText: "Submitting...",
	successStatusText: "Submitted successfully.",
	errorStatusText: "The form could not be submitted. Try again.",
	invalidStatusText: "Check the highlighted fields before submitting."
});
function isHTMLElement(value) {
	return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}
function isFormElement(value) {
	return typeof HTMLFormElement !== "undefined" && value instanceof HTMLFormElement;
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
function toNullableString(value, fallback) {
	if (value === null) return null;
	if (typeof value !== "string") return fallback;
	const normalized = value.trim();
	return normalized.length > 0 ? normalized : fallback;
}
function toSafeTarget(value, fallback) {
	if (typeof value === "string") {
		const selector = value.trim();
		return selector.length > 0 ? selector : fallback;
	}
	if (isHTMLElement(value)) return value;
	return fallback;
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
function readDataOptions(form) {
	return {
		validate: getAttributeValue(form, ATTRIBUTES.validate),
		idleStatusText: getAttributeValue(form, ATTRIBUTES.idleStatusText),
		loadingStatusText: getAttributeValue(form, ATTRIBUTES.loadingStatusText),
		successStatusText: getAttributeValue(form, ATTRIBUTES.successStatusText),
		errorStatusText: getAttributeValue(form, ATTRIBUTES.errorStatusText),
		invalidStatusText: getAttributeValue(form, ATTRIBUTES.invalidStatusText)
	};
}
function normalizeOptions(rawOptions) {
	const onSubmit = toSafeCallback(rawOptions.onSubmit);
	if (!onSubmit) throw new Error("createAsyncButtonForm requires an onSubmit handler.");
	return {
		button: toSafeTarget(rawOptions.button, DEFAULT_FORM_OPTIONS.button),
		status: toSafeTarget(rawOptions.status, DEFAULT_FORM_OPTIONS.status),
		validate: toSafeBoolean(rawOptions.validate, DEFAULT_FORM_OPTIONS.validate),
		idleStatusText: toNullableString(rawOptions.idleStatusText, DEFAULT_FORM_OPTIONS.idleStatusText),
		loadingStatusText: toNullableString(rawOptions.loadingStatusText, DEFAULT_FORM_OPTIONS.loadingStatusText),
		successStatusText: toNullableString(rawOptions.successStatusText, DEFAULT_FORM_OPTIONS.successStatusText),
		errorStatusText: toNullableString(rawOptions.errorStatusText, DEFAULT_FORM_OPTIONS.errorStatusText),
		invalidStatusText: toNullableString(rawOptions.invalidStatusText, DEFAULT_FORM_OPTIONS.invalidStatusText),
		onSubmit
	};
}
var A11yAsyncButtonForm = class A11yAsyncButtonForm {
	static instances = /* @__PURE__ */ new WeakMap();
	form;
	button;
	asyncButton;
	statusElement;
	options;
	originalStatus;
	handleSubmit;
	isDestroyed = false;
	isSubmitting = false;
	constructor(form, options) {
		if (!isFormElement(form)) throw new Error("A11yAsyncButtonForm requires a <form> element.");
		const existingInstance = A11yAsyncButtonForm.instances.get(form);
		if (existingInstance) return existingInstance;
		this.form = form;
		this.options = normalizeOptions({
			...readDataOptions(form),
			...definedOptions(options)
		});
		this.button = this.resolveButton();
		this.asyncButton = createAsyncButton(this.button, getAsyncButtonOptions(options));
		this.statusElement = this.resolveStatusElement();
		this.originalStatus = this.statusElement ? {
			text: this.statusElement.textContent ?? "",
			state: this.statusElement.getAttribute(ATTRIBUTES.state),
			role: this.statusElement.getAttribute(ATTRIBUTES.role),
			ariaLive: this.statusElement.getAttribute(ATTRIBUTES.ariaLive),
			ariaAtomic: this.statusElement.getAttribute(ATTRIBUTES.ariaAtomic)
		} : null;
		this.handleSubmit = this.onSubmit.bind(this);
		this.prepareStatusElement();
		this.setStatus(this.options.idleStatusText, "idle");
		this.form.addEventListener("submit", this.handleSubmit);
		A11yAsyncButtonForm.instances.set(form, this);
	}
	setStatus(message, state = "idle") {
		if (!this.statusElement || message === null) return;
		this.statusElement.textContent = message;
		this.statusElement.setAttribute(ATTRIBUTES.state, state);
	}
	destroy() {
		if (this.isDestroyed) return;
		this.form.removeEventListener("submit", this.handleSubmit);
		this.asyncButton.destroy();
		this.restoreStatusElement();
		this.isSubmitting = false;
		this.isDestroyed = true;
		A11yAsyncButtonForm.instances.delete(this.form);
		this.dispatchLifecycleEvent(EVENTS.destroy, { state: "idle" });
	}
	resolveButton() {
		const configuredButton = this.options.button;
		if (typeof configuredButton === "string") {
			const button = querySelectorSafely(this.form, configuredButton);
			if (isButtonElement(button)) return button;
		}
		if (isButtonElement(configuredButton)) return configuredButton;
		const button = querySelectorSafely(this.form, SELECTORS.button);
		if (isButtonElement(button)) return button;
		throw new Error("A11yAsyncButtonForm requires a submit button in the form or a button option.");
	}
	resolveStatusElement() {
		const configuredStatus = this.options.status;
		if (typeof configuredStatus === "string") {
			const documentStatus = querySelectorSafely(this.form, configuredStatus) ?? (typeof document === "undefined" ? null : querySelectorSafely(document, configuredStatus));
			return isHTMLElement(documentStatus) ? documentStatus : null;
		}
		if (isHTMLElement(configuredStatus)) return configuredStatus;
		const status = querySelectorSafely(this.form, SELECTORS.status);
		return isHTMLElement(status) ? status : null;
	}
	prepareStatusElement() {
		if (!this.statusElement) return;
		if (!this.statusElement.hasAttribute(ATTRIBUTES.role)) this.statusElement.setAttribute(ATTRIBUTES.role, "status");
		if (!this.statusElement.hasAttribute(ATTRIBUTES.ariaLive)) this.statusElement.setAttribute(ATTRIBUTES.ariaLive, "polite");
		if (!this.statusElement.hasAttribute(ATTRIBUTES.ariaAtomic)) this.statusElement.setAttribute(ATTRIBUTES.ariaAtomic, "true");
	}
	restoreStatusElement() {
		if (!this.statusElement || !this.originalStatus) return;
		this.statusElement.textContent = this.originalStatus.text;
		restoreAttribute(this.statusElement, ATTRIBUTES.state, this.originalStatus.state);
		restoreAttribute(this.statusElement, ATTRIBUTES.role, this.originalStatus.role);
		restoreAttribute(this.statusElement, ATTRIBUTES.ariaLive, this.originalStatus.ariaLive);
		restoreAttribute(this.statusElement, ATTRIBUTES.ariaAtomic, this.originalStatus.ariaAtomic);
	}
	onSubmit(event) {
		event.preventDefault();
		if (this.isDestroyed || this.isSubmitting || this.asyncButton.getState() !== "idle") return;
		if (this.options.validate && !this.form.checkValidity()) {
			this.reportInvalid(event);
			return;
		}
		this.runSubmit(event);
	}
	reportInvalid(event) {
		this.setStatus(this.options.invalidStatusText, "invalid");
		if (typeof this.form.reportValidity === "function") this.form.reportValidity();
		this.dispatchLifecycleEvent(EVENTS.invalid, { state: "invalid" });
	}
	async runSubmit(event) {
		this.isSubmitting = true;
		this.setStatus(this.options.loadingStatusText, "loading");
		this.asyncButton.loading();
		this.dispatchLifecycleEvent(EVENTS.submit, { state: "loading" });
		try {
			await this.options.onSubmit(this.createContext(event));
			if (this.isDestroyed) return;
			this.asyncButton.success();
			this.setStatus(this.options.successStatusText, "success");
			this.dispatchLifecycleEvent(EVENTS.success, { state: "success" });
		} catch (error) {
			if (this.isDestroyed) return;
			this.asyncButton.error();
			this.setStatus(this.options.errorStatusText, "error");
			this.dispatchLifecycleEvent(EVENTS.error, {
				state: "error",
				error
			});
		} finally {
			this.isSubmitting = false;
		}
	}
	createContext(event) {
		const submitter = "submitter" in event && isHTMLElement(event.submitter) ? event.submitter : null;
		return {
			form: this.form,
			button: this.button,
			asyncButton: this.asyncButton,
			event,
			submitter,
			formData: new FormData(this.form),
			setStatus: (message, state = "loading") => {
				this.setStatus(message, state);
			}
		};
	}
	dispatchLifecycleEvent(type, detail) {
		this.form.dispatchEvent(new CustomEvent(type, {
			bubbles: true,
			detail: {
				instance: this,
				...detail
			}
		}));
	}
};
function createAsyncButtonForm(form, options) {
	return new A11yAsyncButtonForm(form, options);
}
function initAsyncButtonForms(options, root) {
	if (!root && typeof document === "undefined") return [];
	const scope = root ?? document;
	return [...isFormElement(scope) && scope.matches(SELECTORS.root) ? [scope] : [], ...Array.from(scope.querySelectorAll(SELECTORS.root)).filter(isFormElement)].map((form) => createAsyncButtonForm(form, options));
}
//#endregion
export { A11yAsyncButtonForm, createAsyncButtonForm, initAsyncButtonForms };

//# sourceMappingURL=form.js.map