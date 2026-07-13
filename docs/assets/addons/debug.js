//#region src/addons/debug.ts
const COMPONENT_NAME = "a11y-async-button-debug";
const SELECTORS = Object.freeze({
	button: "[data-a11y-async-button]",
	text: "[data-a11y-async-button-text]",
	form: "[data-a11y-async-form]",
	formButton: "[data-a11y-async-form-button], [data-a11y-async-button], button[type='submit'], button:not([type])",
	formStatus: "[data-a11y-async-form-status]",
	id: "[id]"
});
const ATTRIBUTES = Object.freeze({
	loadingText: "data-loading-text",
	successText: "data-success-text",
	errorText: "data-error-text",
	resetDelay: "data-reset-delay",
	announce: "data-announce",
	liveRegion: "data-live-region",
	liveRegionPoliteness: "data-live-region-politeness",
	ariaLabel: "aria-label",
	ariaDescribedBy: "aria-describedby",
	type: "type",
	formValidate: "data-a11y-async-form-validate"
});
const VALID_BOOLEAN_VALUES = /* @__PURE__ */ new Set([
	"",
	"true",
	"false"
]);
const VALID_POLITENESS_VALUES = /* @__PURE__ */ new Set([
	"polite",
	"assertive",
	"off"
]);
function isElement(value) {
	return typeof Element !== "undefined" && value instanceof Element;
}
function isParentNode(value) {
	return value !== null && typeof value === "object" && typeof value.querySelectorAll === "function";
}
function isButtonElement(value) {
	return typeof HTMLButtonElement !== "undefined" && value instanceof HTMLButtonElement;
}
function isFormElement(value) {
	return typeof HTMLFormElement !== "undefined" && value instanceof HTMLFormElement;
}
function getDefaultRoot() {
	return typeof document === "undefined" ? null : document;
}
function querySelectorSafely(root, selector) {
	try {
		return root.querySelector(selector);
	} catch {
		return null;
	}
}
function querySelectorAllSafely(root, selector) {
	try {
		return Array.from(root.querySelectorAll(selector));
	} catch {
		return [];
	}
}
function collectMatches(root, selector) {
	return [...isElement(root) && root.matches(selector) ? [root] : [], ...querySelectorAllSafely(root, selector)];
}
function getAttributeText(element, attribute) {
	return (element.getAttribute(attribute) ?? "").trim();
}
function hasAttributeText(element, attribute) {
	return getAttributeText(element, attribute).length > 0;
}
function getElementText(element) {
	return (querySelectorSafely(element, SELECTORS.text)?.textContent ?? element.textContent ?? "").trim();
}
function hasAccessibleName(element) {
	return getElementText(element).length > 0 || hasAttributeText(element, ATTRIBUTES.ariaLabel) || hasAttributeText(element, "title");
}
function describeElement(element) {
	const tag = element.tagName.toLowerCase();
	const id = getAttributeText(element, "id");
	const dataName = Object.values(ATTRIBUTES).find((attribute) => element.hasAttribute(attribute));
	if (id.length > 0) return `${tag}#${id}`;
	if (dataName) return `${tag}[${dataName}]`;
	return tag;
}
function createFinding(code, severity, element, message, recommendation) {
	return {
		code,
		severity,
		message,
		recommendation,
		selector: describeElement(element),
		element
	};
}
function createReport(findings) {
	const errorCount = findings.filter((finding) => finding.severity === "error").length;
	const warningCount = findings.filter((finding) => finding.severity === "warning").length;
	return {
		findings,
		errorCount,
		warningCount,
		infoCount: findings.filter((finding) => finding.severity === "info").length,
		hasIssues: errorCount + warningCount > 0
	};
}
function addBooleanAttributeFinding(findings, element, attribute) {
	if (!element.hasAttribute(attribute)) return;
	const value = getAttributeText(element, attribute).toLowerCase();
	if (VALID_BOOLEAN_VALUES.has(value)) return;
	findings.push(createFinding("invalid-boolean-attribute", "warning", element, `${attribute} should be true, false, or empty.`, `Use ${attribute}="false" to disable the behavior, or remove the attribute to use the default.`));
}
function addMissingStateTextFindings(findings, button) {
	const stateAttributes = [
		ATTRIBUTES.loadingText,
		ATTRIBUTES.successText,
		ATTRIBUTES.errorText
	];
	for (const attribute of stateAttributes) {
		if (hasAttributeText(button, attribute)) continue;
		findings.push(createFinding("missing-state-text", "info", button, `${attribute} is not set.`, `Add ${attribute} or pass the matching text option in JavaScript so users get action-specific feedback.`));
	}
}
function addResetDelayFinding(findings, button) {
	if (!button.hasAttribute(ATTRIBUTES.resetDelay)) return;
	const value = getAttributeText(button, ATTRIBUTES.resetDelay);
	const parsed = Number.parseInt(value, 10);
	if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 6e5) return;
	findings.push(createFinding("invalid-reset-delay", "warning", button, `${ATTRIBUTES.resetDelay} should be a number from 0 to 600000.`, "Use a non-negative millisecond value, such as data-reset-delay=\"2000\"."));
}
function addLiveRegionFindings(findings, root, button) {
	const selector = getAttributeText(button, ATTRIBUTES.liveRegion);
	if (selector.length > 0 && !querySelectorSafely(root, selector)) findings.push(createFinding("invalid-live-region-selector", "warning", button, `${ATTRIBUTES.liveRegion} points to "${selector}", but no matching element was found.`, "Update the selector, add the target live region, or remove the attribute to let the plugin create one."));
	const politeness = getAttributeText(button, ATTRIBUTES.liveRegionPoliteness);
	if (politeness.length > 0 && !VALID_POLITENESS_VALUES.has(politeness.toLowerCase())) findings.push(createFinding("invalid-live-region-politeness", "warning", button, `${ATTRIBUTES.liveRegionPoliteness} should be polite, assertive, or off.`, "Use polite for most async button updates and assertive only for urgent failures."));
}
function addDescribedByFindings(findings, button) {
	const describedBy = getAttributeText(button, ATTRIBUTES.ariaDescribedBy);
	if (describedBy.length === 0 || typeof document === "undefined") return;
	for (const id of describedBy.split(/\s+/)) {
		if (document.getElementById(id)) continue;
		findings.push(createFinding("missing-describedby-target", "warning", button, `aria-describedby references "${id}", but that id was not found.`, "Add the referenced description/status element or remove the stale id."));
	}
}
function auditButton(findings, root, element, includeInfo) {
	if (!isButtonElement(element)) {
		findings.push(createFinding("invalid-button-element", "error", element, "data-a11y-async-button must be used on a real <button>.", "Move the attribute to a semantic <button> element so native keyboard and form behavior stay intact."));
		return;
	}
	if (!element.hasAttribute(ATTRIBUTES.type)) findings.push(createFinding("missing-button-type", "warning", element, "Button has no explicit type attribute.", "Add type=\"button\" for standalone actions or type=\"submit\" for form submits."));
	if (!hasAccessibleName(element)) findings.push(createFinding("missing-accessible-name", "error", element, "Button has no visible text or accessible label.", "Add text content, a [data-a11y-async-button-text] child, or an aria-label."));
	if (includeInfo) addMissingStateTextFindings(findings, element);
	addResetDelayFinding(findings, element);
	addBooleanAttributeFinding(findings, element, ATTRIBUTES.announce);
	addLiveRegionFindings(findings, root, element);
	addDescribedByFindings(findings, element);
}
function auditForm(findings, element) {
	if (!isFormElement(element)) {
		findings.push(createFinding("invalid-form-element", "error", element, "data-a11y-async-form must be used on a real <form>.", "Move the attribute to a semantic <form> element so native validation and submit behavior stay intact."));
		return;
	}
	if (!querySelectorSafely(element, SELECTORS.formButton)) findings.push(createFinding("missing-form-submit-button", "error", element, "Form addon markup has no submit button candidate.", "Add a submit button with data-a11y-async-button or data-a11y-async-form-button."));
	if (!querySelectorSafely(element, SELECTORS.formStatus)) findings.push(createFinding("missing-form-status", "warning", element, "Form addon markup has no visible status element.", "Add an element with data-a11y-async-form-status so submit progress and errors are visible."));
	if (!element.hasAttribute(ATTRIBUTES.formValidate)) return;
	const value = getAttributeText(element, ATTRIBUTES.formValidate).toLowerCase();
	if (VALID_BOOLEAN_VALUES.has(value)) return;
	findings.push(createFinding("invalid-form-validate", "warning", element, `${ATTRIBUTES.formValidate} should be true, false, or empty.`, "Use data-a11y-async-form-validate=\"false\" only when a custom validation flow replaces native validation."));
}
function addDuplicateIdFindings(findings, root) {
	const elementsById = /* @__PURE__ */ new Map();
	for (const element of collectMatches(root, SELECTORS.id)) {
		const id = getAttributeText(element, "id");
		if (id.length === 0) continue;
		const existing = elementsById.get(id) ?? [];
		existing.push(element);
		elementsById.set(id, existing);
	}
	for (const [id, elements] of elementsById) {
		if (elements.length < 2) continue;
		const element = elements[1] ?? elements[0];
		findings.push(createFinding("duplicate-id", "warning", element, `The id "${id}" appears ${elements.length} times.`, "Use unique ids so labels, descriptions, and live-region references resolve predictably."));
	}
}
function normalizeArguments(rootOrOptions, maybeOptions = {}) {
	if (isParentNode(rootOrOptions)) return {
		root: rootOrOptions,
		options: maybeOptions
	};
	return {
		root: getDefaultRoot(),
		options: rootOrOptions ?? maybeOptions
	};
}
function createAsyncButtonDebugReport(rootOrOptions, maybeOptions = {}) {
	const { root, options } = normalizeArguments(rootOrOptions, maybeOptions);
	if (!root) return createReport([]);
	const findings = [];
	const includeInfo = options.includeInfo === true;
	for (const element of collectMatches(root, SELECTORS.button)) auditButton(findings, root, element, includeInfo);
	for (const element of collectMatches(root, SELECTORS.form)) auditForm(findings, element);
	addDuplicateIdFindings(findings, root);
	const report = createReport(findings);
	if (options.log) logAsyncButtonDebugReport(report, { logger: options.logger });
	return report;
}
function logAsyncButtonDebugReport(report, options = {}) {
	const logger = options.logger ?? (typeof console === "undefined" ? null : console);
	if (!logger) return;
	for (const finding of report.findings) {
		const method = finding.severity === "error" ? logger.error : finding.severity === "warning" ? logger.warn : logger.info;
		const message = `[${COMPONENT_NAME}:${finding.severity}:${finding.code}] ${finding.message} ${finding.recommendation}`;
		if (options.includeElement && finding.element) method?.call(logger, message, finding.element);
		else method?.call(logger, message);
	}
}
//#endregion
export { createAsyncButtonDebugReport, logAsyncButtonDebugReport };

//# sourceMappingURL=debug.js.map