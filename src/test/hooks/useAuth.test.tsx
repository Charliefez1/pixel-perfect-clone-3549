import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { createMockSupabaseClient } from "../mocks/supabase";

// Create the mock client before vi.mock so the factory can reference it
const mockSupabase = createMockSupabaseClient();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
  logWarning: vi.fn(),
  logEvent: vi.fn(),
}));

import { AuthProvider, useAuth } from "@/hooks/useAuth";

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default auth mocks
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it("returns loading=true initially", () => {
    // Make getSession hang so loading stays true
    mockSupabase.auth.getSession.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.profile).toBeNull();
  });

  it("sets profile after session loads", async () => {
    const fakeSession = {
      user: { id: "user-123", email: "test@example.com" },
      access_token: "token",
    };
    const fakeProfile = {
      id: "profile-1",
      user_id: "user-123",
      display_name: "Test User",
      email: "test@example.com",
      avatar_url: null,
      role: "admin",
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    });

    // Mock profile query: from("profiles").select("*").eq("user_id", ...).single()
    const profileBuilder: Record<string, any> = {};
    profileBuilder.select = vi.fn().mockReturnValue(profileBuilder);
    profileBuilder.eq = vi.fn().mockReturnValue(profileBuilder);
    profileBuilder.single = vi.fn().mockResolvedValue({
      data: fakeProfile,
      error: null,
    });
    profileBuilder.maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") return profileBuilder;
      // user_roles fallback
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBeTruthy();
    expect(result.current.profile?.display_name).toBe("Test User");
    expect(result.current.isAdmin).toBe(true);
  });

  it("role detection reads from profiles.role first", async () => {
    const fakeSession = {
      user: { id: "user-456" },
      access_token: "token",
    };
    const fakeProfile = {
      id: "profile-2",
      user_id: "user-456",
      display_name: "Team Member",
      email: "team@example.com",
      avatar_url: null,
      role: "user", // role set on profile
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    });

    const profileBuilder: Record<string, any> = {};
    profileBuilder.select = vi.fn().mockReturnValue(profileBuilder);
    profileBuilder.eq = vi.fn().mockReturnValue(profileBuilder);
    profileBuilder.single = vi.fn().mockResolvedValue({
      data: fakeProfile,
      error: null,
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") return profileBuilder;
      // user_roles should NOT be called when profile.role exists
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
          }),
        }),
      };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should use "user" from profiles, not "admin" from user_roles
    expect(result.current.profile?.role).toBe("user");
    expect(result.current.isTeam).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it("signOut clears profile", async () => {
    const fakeSession = {
      user: { id: "user-789" },
      access_token: "token",
    };
    const fakeProfile = {
      id: "profile-3",
      user_id: "user-789",
      display_name: "To Sign Out",
      email: "signout@example.com",
      avatar_url: null,
      role: "client",
    };

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    });

    const profileBuilder: Record<string, any> = {};
    profileBuilder.select = vi.fn().mockReturnValue(profileBuilder);
    profileBuilder.eq = vi.fn().mockReturnValue(profileBuilder);
    profileBuilder.single = vi.fn().mockResolvedValue({
      data: fakeProfile,
      error: null,
    });

    mockSupabase.from.mockReturnValue(profileBuilder);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBeTruthy();

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.profile).toBeNull();
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });
});
