import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, ReactNode } from "react";
import { createMockSupabaseClient, createMockQueryBuilder } from "../mocks/supabase";

const mockSupabase = createMockSupabaseClient();

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

    const builder = createMockQueryBuilder(fakeDelivery, null);
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
