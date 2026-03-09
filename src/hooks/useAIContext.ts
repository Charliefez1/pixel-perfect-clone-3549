import { createContext, useContext, useCallback, useRef } from "react";

export interface AIPageContext {
  page: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  data?: Record<string, any>;
}

interface AIContextType {
  getContext: () => AIPageContext | null;
  setContext: (ctx: AIPageContext | null) => void;
}

export const AIContext = createContext<AIContextType>({
  getContext: () => null,
  setContext: () => {},
});

export function useAIContext() {
  return useContext(AIContext);
}

export function useAIContextProvider() {
  const contextRef = useRef<AIPageContext | null>(null);
  const getContext = useCallback(() => contextRef.current, []);
  const setContext = useCallback((ctx: AIPageContext | null) => {
    contextRef.current = ctx;
  }, []);
  return { getContext, setContext };
}
