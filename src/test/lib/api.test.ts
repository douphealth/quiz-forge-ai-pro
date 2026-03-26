import { describe, it, expect } from "vitest";
import { EdgeFunctionError } from "@/lib/api";

describe("EdgeFunctionError", () => {
  it("creates error with message and status", () => {
    const err = new EdgeFunctionError("Test error", 400);
    expect(err.message).toBe("Test error");
    expect(err.status).toBe(400);
    expect(err.name).toBe("EdgeFunctionError");
    expect(err instanceof Error).toBe(true);
  });

  it("creates error without status", () => {
    const err = new EdgeFunctionError("No status");
    expect(err.message).toBe("No status");
    expect(err.status).toBeUndefined();
  });
});
