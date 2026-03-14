import { useState, useRef, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Send, Sparkles, Users, FolderKanban, BarChart3, Briefcase } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

const agents = [
  { id: "pm", label: "Project Mgmt", icon: FolderKanban, color: "text-green-500" },
  { id: "insights", label: "Insights", icon: BarChart3, color: "text-amber-500" },
  { id: "clients", label: "Client Mgr", icon: Users, color: "text-cyan-500" },
  { id: "business", label: "Business Mgr", icon: Briefcase, color: "text-purple-500" },
];

type Msg = { role: "user" | "assistant"; content: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: Record<string, any>;
}

export function AIChatPanel({ open, onOpenChange, context }: Props) {
  const [agent, setAgent] = useState("pm");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any in-flight stream when panel closes or component unmounts
  useEffect(() => {
    if (!open && abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // Abort any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userMsg: Msg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages, agent, context }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(errorData.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      try {
        while (true) {
          if (controller.signal.aborted) break;
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantSoFar += content;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant") {
                    return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                  }
                  return [...prev, { role: "assistant", content: assistantSoFar }];
                });
              }
            } catch {
              // Incomplete JSON chunk — re-buffer and wait for more data
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (e: any) {
      if (e.name === "AbortError") return; // Silently handle cancellation
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setIsLoading(false);
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [input, isLoading, messages, agent, context]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const currentAgent = agents.find((a) => a.id === agent) || agents[0];

  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isMobile ? "bottom" : "right"} className={`flex flex-col p-0 ${isMobile ? "h-[85vh] w-full max-w-full" : "w-[420px] sm:w-[480px]"}`}>
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              NDG AI Assistant
            </SheetTitle>
          </div>
          <div className="flex gap-1 mt-2">
            {agents.map((a) => (
              <Button
                key={a.id}
                variant={agent === a.id ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => { setAgent(a.id); setMessages([]); }}
                aria-label={`Select ${a.label} agent`}
              >
                <a.icon className={cn("h-3 w-3 mr-1", agent === a.id ? "" : a.color)} />
                {a.label}
              </Button>
            ))}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
          <div className="space-y-4" role="log" aria-live="polite">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <currentAgent.icon className={cn("h-8 w-8 mx-auto", currentAgent.color)} />
                <p className="text-sm font-medium">
                  {currentAgent.label} AI
                </p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  {agent === "pm" && "Ask about tasks, deadlines, resources, or NEURO phases."}
                  {agent === "insights" && "Ask about delivery metrics, trends, or forecasting."}
                  {agent === "clients" && "Ask about clients, contacts, sessions, or relationships."}
                  {agent === "business" && "Ask for strategic advice or business overview."}
                </p>
                {context?.page && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Context: {context.entityName ? `${context.entityName} (${context.entityType})` : context.page}
                  </p>
                )}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground animate-pulse">
                  Thinking…
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${currentAgent.label} AI…`}
              rows={2}
              className="text-sm resize-none"
            />
            <Button
              size="sm"
              className="h-auto px-3"
              onClick={send}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
