import { describe, it, expect, vi, beforeEach } from "vitest";
import { getErrorMessage, handleSupabaseError } from "@/lib/errors";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

import { toast } from "sonner";

describe("getErrorMessage", () => {
  it("returns mapped message for known error code 23505", () => {
    expect(getErrorMessage({ message: "duplicate", code: "23505" })).toBe(
      "This record already exists."
    );
  });

  it("returns mapped message for known error code 42501", () => {
    expect(getErrorMessage({ message: "forbidden", code: "42501" })).toBe(
      "You don't have permission to perform this action."
    );
  });

  it("returns mapped message for PGRST116", () => {
    expect(getErrorMessage({ message: "not found", code: "PGRST116" })).toBe(
      "The requested record was not found."
    );
  });

  it("returns generic message for unknown error code", () => {
    expect(getErrorMessage({ message: "oops", code: "99999" })).toBe(
      "Something went wrong. Please try again."
    );
  });

  it("returns generic message when no code is provided", () => {
    expect(getErrorMessage({ message: "oops" })).toBe(
      "Something went wrong. Please try again."
    );
  });
});

describe("handleSupabaseError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows toast with error message", () => {
    handleSupabaseError({ message: "duplicate", code: "23505" });
    expect(toast.error).toHaveBeenCalledWith("This record already exists.");
  });

  it("prepends context to the message when provided", () => {
    handleSupabaseError({ message: "duplicate", code: "23505" }, "Saving contact");
    expect(toast.error).toHaveBeenCalledWith(
      "Saving contact: This record already exists."
    );
  });

  it("shows generic message for unknown errors", () => {
    handleSupabaseError({ message: "something broke" });
    expect(toast.error).toHaveBeenCalledWith(
      "Something went wrong. Please try again."
    );
  });

  it("shows context with generic message for unknown errors", () => {
    handleSupabaseError({ message: "something broke" }, "Loading data");
    expect(toast.error).toHaveBeenCalledWith(
      "Loading data: Something went wrong. Please try again."
    );
  });
});
