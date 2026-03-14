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

import { useDelivery } from "@/hooks/useDeliveries";

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

describe("useDelivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns data when delivery exists", async () => {
    const fakeDelivery = {
      id: "del-1",
      title: "Workshop Delivery",
      status: "scheduled",
      deal_id: null,
      organisation_id: null,
      project_id: null,
      organisations: { name: "Acme" },
      deals: null,
      forms: null,
    };

    const builder = createBuilder(fakeDelivery, null);
    mockSupabase.from.mockReturnValue(builder);

    const { result } = renderHook(() => useDelivery("del-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify the data is returned (not undefined/null) - the return data bug should be fixed
    expect(result.current.data).toBeTruthy();
    expect(result.current.data?.title).toBe("Workshop Delivery");
    expect(result.current.data?.id).toBe("del-1");
  });

  it("returns null when id is undefined", async () => {
    const { result } = renderHook(() => useDelivery(undefined), {
      wrapper: createWrapper(),
    });

    // Query should be disabled when id is undefined
    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });
});
