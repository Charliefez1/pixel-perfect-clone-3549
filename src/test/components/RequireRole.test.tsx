import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RequireRole } from "@/components/auth/RequireRole";

// Mock useAuth
const mockUseAuth = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Helper to capture Navigate redirects
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    Navigate: (props: any) => {
      mockNavigate(props.to);
      return null;
    },
  };
});

describe("RequireRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children when role matches", () => {
    mockUseAuth.mockReturnValue({
      profile: { role: "admin" },
      loading: false,
    });

    render(
      <MemoryRouter>
        <RequireRole roles={["admin"]}>
          <div data-testid="protected">Secret Content</div>
        </RequireRole>
      </MemoryRouter>
    );

    expect(screen.getByTestId("protected")).toBeInTheDocument();
    expect(screen.getByText("Secret Content")).toBeInTheDocument();
  });

  it("renders children when role is one of multiple allowed roles", () => {
    mockUseAuth.mockReturnValue({
      profile: { role: "user" },
      loading: false,
    });

    render(
      <MemoryRouter>
        <RequireRole roles={["admin", "user"]}>
          <div data-testid="protected">Team Content</div>
        </RequireRole>
      </MemoryRouter>
    );

    expect(screen.getByTestId("protected")).toBeInTheDocument();
  });

  it("redirects when role does not match", () => {
    mockUseAuth.mockReturnValue({
      profile: { role: "client" },
      loading: false,
    });

    render(
      <MemoryRouter>
        <RequireRole roles={["admin"]}>
          <div data-testid="protected">Secret</div>
        </RequireRole>
      </MemoryRouter>
    );

    expect(screen.queryByTestId("protected")).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("redirects to custom path when specified", () => {
    mockUseAuth.mockReturnValue({
      profile: { role: "client" },
      loading: false,
    });

    render(
      <MemoryRouter>
        <RequireRole roles={["admin"]} redirectTo="/unauthorized">
          <div>Secret</div>
        </RequireRole>
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith("/unauthorized");
  });

  it("redirects when profile is null (not logged in)", () => {
    mockUseAuth.mockReturnValue({
      profile: null,
      loading: false,
    });

    render(
      <MemoryRouter>
        <RequireRole roles={["admin"]}>
          <div data-testid="protected">Secret</div>
        </RequireRole>
      </MemoryRouter>
    );

    expect(screen.queryByTestId("protected")).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("shows loading spinner when loading=true", () => {
    mockUseAuth.mockReturnValue({
      profile: null,
      loading: true,
    });

    const { container } = render(
      <MemoryRouter>
        <RequireRole roles={["admin"]}>
          <div data-testid="protected">Secret</div>
        </RequireRole>
      </MemoryRouter>
    );

    // Should not render children
    expect(screen.queryByTestId("protected")).not.toBeInTheDocument();
    // Should not redirect
    expect(mockNavigate).not.toHaveBeenCalled();
    // Should show loading indicator (the pulsing N element)
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
