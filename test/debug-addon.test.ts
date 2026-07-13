import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAsyncButtonDebugReport,
  logAsyncButtonDebugReport
} from "../src/addons/debug";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("A11y Async Button debug addon", () => {
  it("returns an empty report for complete button and form markup", () => {
    document.body.innerHTML = `
      <form data-a11y-async-form>
        <label for="email">Email</label>
        <input id="email" name="email" required />
        <button
          type="submit"
          data-a11y-async-button
          data-loading-text="Saving"
          data-success-text="Saved"
          data-error-text="Could not save"
          data-reset-delay="2000"
        >
          Save profile
        </button>
        <p data-a11y-async-form-status>Ready.</p>
      </form>
    `;

    const report = createAsyncButtonDebugReport(document, { includeInfo: true });

    expect(report.findings).toHaveLength(0);
    expect(report.errorCount).toBe(0);
    expect(report.warningCount).toBe(0);
    expect(report.infoCount).toBe(0);
    expect(report.hasIssues).toBe(false);
  });

  it("reports actionable button and form markup issues", () => {
    document.body.innerHTML = `
      <a data-a11y-async-button href="#">Fake button</a>

      <button
        id="duplicate-id"
        data-a11y-async-button
        data-reset-delay="-1"
        data-announce="sometimes"
        data-live-region="#missing-status"
        data-live-region-politeness="loud"
        aria-describedby="missing-description"
      ></button>

      <span id="duplicate-id"></span>

      <div data-a11y-async-form></div>

      <form data-a11y-async-form data-a11y-async-form-validate="maybe">
        <p>No submit button or status.</p>
      </form>
    `;

    const report = createAsyncButtonDebugReport(document, { includeInfo: true });
    const codes = report.findings.map((finding) => finding.code);

    expect(codes).toEqual(
      expect.arrayContaining([
        "invalid-button-element",
        "missing-button-type",
        "missing-accessible-name",
        "missing-state-text",
        "invalid-reset-delay",
        "invalid-boolean-attribute",
        "invalid-live-region-selector",
        "invalid-live-region-politeness",
        "missing-describedby-target",
        "duplicate-id",
        "invalid-form-element",
        "missing-form-submit-button",
        "missing-form-status",
        "invalid-form-validate"
      ])
    );
    expect(report.errorCount).toBeGreaterThanOrEqual(3);
    expect(report.warningCount).toBeGreaterThanOrEqual(8);
    expect(report.infoCount).toBe(3);
    expect(report.hasIssues).toBe(true);
  });

  it("omits informational findings by default", () => {
    document.body.innerHTML = `
      <button type="button" data-a11y-async-button>
        Save profile
      </button>
    `;

    const report = createAsyncButtonDebugReport();

    expect(report.findings.map((finding) => finding.code)).not.toContain(
      "missing-state-text"
    );
  });

  it("logs findings when requested", () => {
    document.body.innerHTML = `
      <button data-a11y-async-button></button>
    `;

    const logger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn()
    };

    const report = createAsyncButtonDebugReport(document, {
      includeInfo: true,
      log: true,
      logger
    });

    expect(report.findings.length).toBeGreaterThan(0);
    expect(logger.error).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalled();
  });

  it("can log an existing report with element references", () => {
    document.body.innerHTML = `
      <button data-a11y-async-button></button>
    `;

    const logger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn()
    };
    const report = createAsyncButtonDebugReport(document, { includeInfo: true });

    logAsyncButtonDebugReport(report, {
      includeElement: true,
      logger
    });

    expect(logger.error.mock.calls[0]?.[1]).toBeInstanceOf(HTMLButtonElement);
  });
});
