import { vi } from "vitest";

/**
 * Creates a chainable mock supabase query builder.
 * Each method returns the builder so calls like .from().select().eq().single() work.
 */
export function createMockQueryBuilder(resolvedData: any = null, resolvedError: any = null) {
  const builder: Record<string, any> = {};

  const chainMethods = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "like",
    "ilike",
    "in",
    "is",
    "order",
    "limit",
    "range",
    "single",
    "maybeSingle",
    "filter",
    "match",
    "not",
    "or",
    "contains",
    "containedBy",
    "textSearch",
  ];

  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }

  // Terminal methods that resolve to { data, error }
  builder.then = vi.fn((resolve: any) =>
    resolve({ data: resolvedData, error: resolvedError })
  );

  // Make the builder thenable so `await query` works
  Object.defineProperty(builder, "then", {
    value: (resolve: any) =>
      Promise.resolve({ data: resolvedData, error: resolvedError }).then(resolve),
    writable: true,
    configurable: true,
  });

  return builder;
}

export interface MockSupabaseClient {
  from: ReturnType<typeof vi.fn>;
  auth: {
    getSession: ReturnType<typeof vi.fn>;
    getUser: ReturnType<typeof vi.fn>;
    onAuthStateChange: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    signInWithPassword: ReturnType<typeof vi.fn>;
  };
  _queryBuilder: Record<string, any>;
}

/**
 * Creates a mock supabase client with sensible defaults.
 * Access `client._queryBuilder` to customize return values of chained queries.
 */
export function createMockSupabaseClient(
  queryData: any = null,
  queryError: any = null
): MockSupabaseClient {
  const queryBuilder = createMockQueryBuilder(queryData, queryError);

  const unsubscribe = vi.fn();
  const subscription = { unsubscribe };

  return {
    from: vi.fn().mockReturnValue(queryBuilder),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription },
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      }),
    },
    _queryBuilder: queryBuilder,
  };
}
