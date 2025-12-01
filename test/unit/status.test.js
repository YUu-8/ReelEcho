/**
 * Unit tests for src/utils/status.js.
 * Covers all branches for good branch coverage.
 */
import { describe, it, expect } from "vitest";
import { formatStatus } from "../../src/utils/status.js";

describe("formatStatus", () => {
  it("returns 'warming-up' for invalid or negative input", () => {
    expect(formatStatus(-1)).toBe("warming-up");
    expect(formatStatus(NaN)).toBe("warming-up");
    expect(formatStatus("not-a-number")).toBe("warming-up");
  });

  it("returns 'warming-up' when uptime is less than 60s", () => {
    expect(formatStatus(0)).toBe("warming-up");
    expect(formatStatus(10)).toBe("warming-up");
    expect(formatStatus(59)).toBe("warming-up");
  });

  it("returns 'healthy' when uptime is between 60s and 3600s", () => {
    expect(formatStatus(60)).toBe("healthy");
    expect(formatStatus(3599)).toBe("healthy");
  });

  it("returns 'steady' when uptime is at or after 3600s", () => {
    expect(formatStatus(3600)).toBe("steady");
    expect(formatStatus(7200)).toBe("steady");
  });
});
