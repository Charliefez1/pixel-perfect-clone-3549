import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, ReactNode } from "react";

const { mockSupabase, createBuilder } = vi.hoisted(() => {
  const fn = vi.fn;

  function createBuilder(data: any = null, error: any = null) {
    const b: Record<string, any> = {};
    for (const m of ["select","insert","update","delete","eq","neq","order","limit","single","maybeSingle","filter","match","range","not","or"]) {
      b[m] = fn().mockReturnValue(b);
    }
    Object.defineProperty(b, "then", {
      value: (resolve: any) => Promise.resolve({ data, error }).then(resolve),
      writable: true, configurable: true,
    });
    return b;
  }

  return {
    mockSupabase: {
      from: fn().mockReturnValue(createBuilder()),
      auth: {
        getSession: fn().mockResolvedValue({ data: { session: null }, error: null }),
        getUser: fn().mockResolvedValue({ data: { user: null }, error: null }),
        onAuthStateChange: fn().mockReturnValue({ data: { subscription: { unsubscribe: fn() } } }),
        signOut: fn().mockResolvedValue({ error: null }),
      },
    },
    createBuilder,
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/lib/errors", () => ({
  handleSupabaseError: vi.fn(),
}));

import { useActivityLog } from "@/hooks/useActivityLog";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useActivityLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enabled is always true (tautology bug verification)", () => {
    // The hook has `enabled: true` which means it always fetches.
    // This test verifies the query runs even without entityType/entityId.
    const builder = createBuilder([], null);
    mockSupabase.from.mockReturnValue(builder);

    const { result } = renderHook(() => useActivityLog(), {
      wrapper: createWrapper(),
    });

    // The query should be enabled (not idle) even without params
    expect(result.current.fetchStatus).not.toBe("idle");
  });

  it("fetches activity log data successfully", async () => {
    const fakeActivities = [
      {
        id: "act-1",
        entity_type: "delivery",
        entity_id: "del-1",
        entity_title: "Workshop",
        action: "created",
        metadata: null,
        user_id: "user-1",
        created_at: "2025-01-01T00:00:00Z",
      },
    ];

    const builder = createBuilder(fakeActivities, null);
    mockSupabase.from.mockReturnValue(builder);

    const { result } = renderHook(() => useActivityLog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].action).toBe("created");
  });

  it("filters by entityType and entityId when provided", async () => {
    const builder = createBuilder([], null);
    mockSupabase.from.mockReturnValue(builder);

    const { result } = renderHook(
      () => useActivityLog("delivery", "del-42"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify .eq was called with the filter values
    expect(builder.eq).toHaveBeenCalledWith("entity_type", "delivery");
    expect(builder.eq).toHaveBeenCalledWith("entity_id", "del-42");
  });

  it("does not filter when entityType and entityId are not provided", async () => {
    const builder = createBuilder([], null);
    mockSupabase.from.mockReturnValue(builder);

    const { result } = renderHook(() => useActivityLog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // .eq should not be called for entity_type or entity_id
    expect(builder.eq).not.toHaveBeenCalledWith(
      "entity_type",
      expect.anything()
    );
  });
});
