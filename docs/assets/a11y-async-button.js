//#region src/index.ts
const COMPONENT_NAME = "a11y-async-button";
const STATES = Object.freeze({
	idle: "idle",
	loading: "loading",
	success: "success",
	error: "error",
	disabled: "disabled"
});
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
});
function isHTMLElement(value) {
	return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}
function isButtonElement(value) {
	return typeof HTMLButtonElement !== "undefined" && value instanceof HTMLButtonElement;
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
function toSafeInteger(value, fallback, options = {}) {
	const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
	if (!Number.isFinite(parsed)) return fallback;
	if (options.min !== void 0 && parsed < options.min) return fallback;
	if (options.max !== void 0 && parsed > options.max) return fallback;
	return parsed;
}
function toNullableString(value, fallback) {
	if (value === null) return null;
	if (typeof value !== "string") return fallback;
	const normalized = value.trim();
	return normalized.length > 0 ? normalized : fallback;
}
function toSafeString(value, fallback) {
	const normalized = typeof value === "string" ? value.trim() : "";
	return normalized.length > 0 ? normalized : fallback;
}
function toSafeClassName(value, fallback) {
	const normalized = toSafeString(value, fallback);
	return /\s/.test(normalized) ? fallback : normalized;
}
function toSafeAttributeName(value, fallback) {
	const normalized = toSafeString(value, fallback);
	return /^[A-Za-z_][A-Za-z0-9_.:-]*$/.test(normalized) ? normalized : fallback;
}
function toSafePoliteness(value, fallback) {
	if (value === "polite" || value === "assertive" || value === "off") return value;
	return fallback;
}
function toSafeLiveRegion(value, fallback) {
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
function getAttributeValue(element, attribute) {
	return element.hasAttribute(attribute) ? element.getAttribute(attribute) ?? "" : void 0;
}
function getBooleanAttributeValue(element, attribute) {
	if (!element.hasAttribute(attribute)) return void 0;
	const value = element.getAttribute(attribute);
	return value === "" || value === null ? true : value;
}
function definedOptions(options) {
	const filteredOptions = {};
	for (const key of Object.keys(options)) {
		const value = options[key];
		if (value !== void 0) filteredOptions[key] = value;
	}
	return filteredOptions;
}
function normalizeOptions(rawOptions) {
	return {
		loadingText: toNullableString(rawOptions.loadingText, DEFAULT_OPTIONS.loadingText),
		successText: toNullableString(rawOptions.successText, DEFAULT_OPTIONS.successText),
		errorText: toNullableString(rawOptions.errorText, DEFAULT_OPTIONS.errorText),
		idleText: toNullableString(rawOptions.idleText, DEFAULT_OPTIONS.idleText),
		resetDelay: toSafeInteger(rawOptions.resetDelay, DEFAULT_OPTIONS.resetDelay, {
			min: 0,
			max: 6e5
		}),
		preventDoubleClick: toSafeBoolean(rawOptions.preventDoubleClick, DEFAULT_OPTIONS.preventDoubleClick),
		preserveWidth: toSafeBoolean(rawOptions.preserveWidth, DEFAULT_OPTIONS.preserveWidth),
		useNativeDisabled: toSafeBoolean(rawOptions.useNativeDisabled, DEFAULT_OPTIONS.useNativeDisabled),
		announce: toSafeBoolean(rawOptions.announce, DEFAULT_OPTIONS.announce),
		announceLoading: toSafeBoolean(rawOptions.announceLoading, DEFAULT_OPTIONS.announceLoading),
		liveRegionPoliteness: toSafePoliteness(rawOptions.liveRegionPoliteness, DEFAULT_OPTIONS.liveRegionPoliteness),
		liveRegion: toSafeLiveRegion(rawOptions.liveRegion, DEFAULT_OPTIONS.liveRegion),
		loadingClass: toSafeClassName(rawOptions.loadingClass, DEFAULT_OPTIONS.loadingClass),
		successClass: toSafeClassName(rawOptions.successClass, DEFAULT_OPTIONS.successClass),
		errorClass: toSafeClassName(rawOptions.errorClass, DEFAULT_OPTIONS.errorClass),
		disabledClass: toSafeClassName(rawOptions.disabledClass, DEFAULT_OPTIONS.disabledClass),
		stateAttribute: toSafeAttributeName(rawOptions.stateAttribute, DEFAULT_OPTIONS.stateAttribute),
		onLoading: toSafeCallback(rawOptions.onLoading),
		onSuccess: toSafeCallback(rawOptions.onSuccess),
		onError: toSafeCallback(rawOptions.onError),
		onReset: toSafeCallback(rawOptions.onReset),
		onStateChange: toSafeCallback(rawOptions.onStateChange),
		renderText: toSafeCallback(rawOptions.renderText),
		onAction: toSafeCallback(rawOptions.onAction)
	};
}
function restoreAttribute(element, attribute, value) {
	if (value === null) {
		element.removeAttribute(attribute);
		return;
	}
	element.setAttribute(attribute, value);
}
function querySelectorSafely(selector) {
	try {
		return document.querySelector(selector);
	} catch {
		return null;
	}
}
var A11yAsyncButton = class A11yAsyncButton {
	static instances = /* @__PURE__ */ new WeakMap();
	static sharedLiveRegions = /* @__PURE__ */ new WeakMap();
	element;
	state = STATES.idle;
	options;
	originalText;
	originalAriaBusy;
	originalAriaDisabled;
	originalAriaLabel;
	originalStateAttribute;
	originalDisabled;
	originalMinWidth;
	handleClick;
	handleKeydown;
	isLocked = false;
	isActionRunning = false;
	isDestroyed = false;
	resetTimer = null;
	announceTimer = null;
	ownsLiveRegion = false;
	liveRegionElement = null;
	constructor(element, options = {}) {
		if (!isButtonElement(element)) throw new Error("A11yAsyncButton requires a <button> element.");
		const existingInstance = A11yAsyncButton.instances.get(element);
		if (existingInstance) return existingInstance;
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
	loading(message) {
		if (this.isDestroyed) return;
		if (this.isLocked && this.options.preventDoubleClick && this.state === STATES.loading) return;
		this.clearResetTimer();
		const text = this.resolveStateText(STATES.loading, message, "Loading...");
		this.transition(STATES.loading, text);
		this.element.setAttribute(ATTRIBUTES.ariaBusy, "true");
		this.applyLockedState();
		if (this.options.announceLoading) this.announce(text);
		this.options.onLoading?.(this, text);
		if (this.options.onAction) this.runAction();
	}
	success(message) {
		if (this.isDestroyed) return;
		const text = this.resolveStateText(STATES.success, message, "Done");
		this.transition(STATES.success, text);
		this.element.setAttribute(ATTRIBUTES.ariaBusy, "false");
		this.removeLockedState();
		this.announce(text);
		this.options.onSuccess?.(this, text);
		this.scheduleResetIfNeeded();
	}
	error(message) {
		if (this.isDestroyed) return;
		const text = this.resolveStateText(STATES.error, message, this.originalText);
		this.transition(STATES.error, text);
		this.element.setAttribute(ATTRIBUTES.ariaBusy, "false");
		this.removeLockedState();
		this.announce(text);
		this.options.onError?.(this, text);
		this.scheduleResetIfNeeded();
	}
	reset() {
		if (this.isDestroyed) return;
		this.clearResetTimer();
		const previousState = this.state;
		const text = this.resolveStateText(STATES.idle, void 0, this.originalText);
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
	getState() {
		return this.state;
	}
	setState(state, message) {
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
			default: throw new Error(`Unknown async button state: "${String(state)}".`);
		}
	}
	lock() {
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
	unlock() {
		if (this.isDestroyed) return;
		const previousState = this.state;
		const text = this.resolveStateText(STATES.idle, void 0, this.originalText);
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
	prefersReducedMotion() {
		return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	}
	destroy() {
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
		restoreAttribute(this.element, ATTRIBUTES.ariaDisabled, this.originalAriaDisabled);
		restoreAttribute(this.element, ATTRIBUTES.ariaLabel, this.originalAriaLabel);
		restoreAttribute(this.element, this.options.stateAttribute, this.originalStateAttribute);
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
	mergeOptions(options) {
		return normalizeOptions({
			...this.readDataOptions(),
			...definedOptions(options)
		});
	}
	readDataOptions() {
		return {
			loadingText: getAttributeValue(this.element, ATTRIBUTES.loadingText),
			successText: getAttributeValue(this.element, ATTRIBUTES.successText),
			errorText: getAttributeValue(this.element, ATTRIBUTES.errorText),
			idleText: getAttributeValue(this.element, ATTRIBUTES.idleText),
			resetDelay: getAttributeValue(this.element, ATTRIBUTES.resetDelay),
			preserveWidth: getBooleanAttributeValue(this.element, ATTRIBUTES.preserveWidth),
			useNativeDisabled: getBooleanAttributeValue(this.element, ATTRIBUTES.useNativeDisabled),
			preventDoubleClick: getBooleanAttributeValue(this.element, ATTRIBUTES.preventDoubleClick),
			announce: getBooleanAttributeValue(this.element, ATTRIBUTES.announce),
			announceLoading: getBooleanAttributeValue(this.element, ATTRIBUTES.announceLoading),
			liveRegion: getAttributeValue(this.element, ATTRIBUTES.liveRegion),
			liveRegionPoliteness: getAttributeValue(this.element, ATTRIBUTES.liveRegionPoliteness)
		};
	}
	resolveStateText(state, message, fallback) {
		if (message !== void 0) return message;
		const optionText = this.getOptionText(state);
		if (optionText !== null) return optionText;
		const attribute = this.getStateTextAttribute(state);
		return (attribute ? this.element.getAttribute(attribute) : null) ?? fallback;
	}
	getOptionText(state) {
		switch (state) {
			case STATES.loading: return this.options.loadingText;
			case STATES.success: return this.options.successText;
			case STATES.error: return this.options.errorText;
			case STATES.idle: return this.options.idleText;
		}
	}
	getStateTextAttribute(state) {
		switch (state) {
			case STATES.loading: return ATTRIBUTES.loadingText;
			case STATES.success: return ATTRIBUTES.successText;
			case STATES.error: return ATTRIBUTES.errorText;
			case STATES.idle: return ATTRIBUTES.idleText;
		}
	}
	transition(state, text) {
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
	getStateClass(state) {
		switch (state) {
			case STATES.loading: return this.options.loadingClass;
			case STATES.success: return this.options.successClass;
			case STATES.error: return this.options.errorClass;
		}
	}
	applyLockedState() {
		this.isLocked = true;
		if (this.options.useNativeDisabled) {
			this.element.disabled = true;
			return;
		}
		this.element.setAttribute(ATTRIBUTES.ariaDisabled, "true");
	}
	removeLockedState() {
		this.isLocked = false;
		if (this.options.useNativeDisabled) {
			this.element.disabled = this.originalDisabled;
			return;
		}
		restoreAttribute(this.element, ATTRIBUTES.ariaDisabled, this.originalAriaDisabled);
	}
	scheduleResetIfNeeded() {
		if (this.options.resetDelay <= 0) return;
		this.clearResetTimer();
		this.resetTimer = setTimeout(() => {
			this.reset();
		}, this.options.resetDelay);
	}
	clearResetTimer() {
		if (this.resetTimer === null) return;
		clearTimeout(this.resetTimer);
		this.resetTimer = null;
	}
	clearAnnounceTimer() {
		if (this.announceTimer === null) return;
		clearTimeout(this.announceTimer);
		this.announceTimer = null;
	}
	announce(message) {
		if (!this.options.announce || !this.liveRegionElement || message.length === 0) return;
		this.clearAnnounceTimer();
		this.liveRegionElement.textContent = "";
		const region = this.liveRegionElement;
		this.announceTimer = setTimeout(() => {
			region.textContent = message;
			this.announceTimer = null;
		}, 50);
	}
	setupLiveRegion() {
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
		if (this.element.parentNode) this.element.parentNode.insertBefore(region, this.element.nextSibling);
		else document.body.appendChild(region);
		this.liveRegionElement = region;
		this.ownsLiveRegion = true;
	}
	resolveConfiguredLiveRegion() {
		if (!this.options.liveRegion) return null;
		if (typeof this.options.liveRegion === "string") {
			const region = querySelectorSafely(this.options.liveRegion);
			return isHTMLElement(region) ? region : null;
		}
		return this.options.liveRegion;
	}
	resolveDescribedLiveRegion() {
		const describedBy = this.element.getAttribute(ATTRIBUTES.ariaDescribedBy);
		if (!describedBy) return null;
		for (const id of describedBy.trim().split(/\s+/)) {
			const target = document.getElementById(id);
			if (isHTMLElement(target)) return target;
		}
		return null;
	}
	prepareOwnedLiveRegion(region) {
		if (!region.hasAttribute(ATTRIBUTES.ariaLive)) region.setAttribute(ATTRIBUTES.ariaLive, this.options.liveRegionPoliteness);
		if (!region.hasAttribute(ATTRIBUTES.ariaAtomic)) region.setAttribute(ATTRIBUTES.ariaAtomic, "true");
	}
	acquireSharedLiveRegion(region) {
		const existingRecord = A11yAsyncButton.sharedLiveRegions.get(region);
		if (existingRecord) existingRecord.references += 1;
		else A11yAsyncButton.sharedLiveRegions.set(region, {
			references: 1,
			ariaLive: region.getAttribute(ATTRIBUTES.ariaLive),
			ariaAtomic: region.getAttribute(ATTRIBUTES.ariaAtomic)
		});
		if (!region.hasAttribute(ATTRIBUTES.ariaLive)) region.setAttribute(ATTRIBUTES.ariaLive, this.options.liveRegionPoliteness);
		if (!region.hasAttribute(ATTRIBUTES.ariaAtomic)) region.setAttribute(ATTRIBUTES.ariaAtomic, "true");
	}
	releaseSharedLiveRegion(region) {
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
	restoreLiveRegion() {
		if (!this.liveRegionElement) return;
		if (this.ownsLiveRegion) this.liveRegionElement.remove();
		else this.releaseSharedLiveRegion(this.liveRegionElement);
		this.liveRegionElement = null;
		this.ownsLiveRegion = false;
	}
	storeWidth() {
		const width = this.element.getBoundingClientRect().width;
		if (width > 0) this.element.style.minWidth = `${width}px`;
	}
	getButtonText() {
		return (this.element.querySelector(SELECTORS.text)?.textContent ?? this.element.textContent ?? "").trim();
	}
	setButtonText(text, state = this.state) {
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
	removeStateClasses() {
		this.element.classList.remove(this.options.loadingClass, this.options.successClass, this.options.errorClass, this.options.disabledClass);
	}
	dispatchLifecycleEvent(name, detail) {
		this.element.dispatchEvent(new CustomEvent(name, {
			bubbles: true,
			detail: {
				instance: this,
				...detail
			}
		}));
	}
	dispatchStateChange(state, previousState, message) {
		this.element.dispatchEvent(new CustomEvent(EVENTS.stateChange, {
			bubbles: true,
			detail: {
				instance: this,
				state,
				previousState,
				message
			}
		}));
		this.options.onStateChange?.(this, state, previousState, message);
	}
	onClick(event) {
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
	onKeydown(event) {
		if (!this.isLocked || !this.options.preventDoubleClick) return;
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	}
	async runAction() {
		if (!this.options.onAction || this.isActionRunning) return;
		this.isActionRunning = true;
		try {
			await this.options.onAction(this);
			if (!this.isDestroyed) this.success();
		} catch (error) {
			const message = error instanceof Error ? error.message : void 0;
			if (!this.isDestroyed) this.error(message);
		} finally {
			this.isActionRunning = false;
		}
	}
};
function createAsyncButton(element, options = {}) {
	return new A11yAsyncButton(element, options);
}
function initAsyncButtons(options = {}, root) {
	if (!root && typeof document === "undefined") return [];
	const scope = root ?? document;
	return [...isButtonElement(scope) && scope.matches(SELECTORS.root) ? [scope] : [], ...Array.from(scope.querySelectorAll(SELECTORS.root)).filter(isButtonElement)].map((element) => createAsyncButton(element, options));
}
//#endregion
export { A11yAsyncButton, createAsyncButton, initAsyncButtons };

//# sourceMappingURL=index.js.map