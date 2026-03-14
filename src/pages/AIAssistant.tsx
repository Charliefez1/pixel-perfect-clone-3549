import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Sparkles, Users, FolderKanban, BarChart3, Briefcase } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAIContext } from "@/hooks/useAIContext";
import ReactMarkdown from "react-markdown";

const agents = [
  { id: "pm", label: "Project Mgmt", icon: FolderKanban, color: "text-green-500", desc: "Ask about tasks, deadlines, resources, or NEURO phases." },
  { id: "insights", label: "Insights", icon: BarChart3, color: "text-amber-500", desc: "Ask about delivery metrics, trends, or forecasting." },
  { id: "clients", label: "Client Mgr", icon: Users, color: "text-cyan-500", desc: "Ask about clients, contacts, sessions, or relationships." },
  { id: "business", label: "Business Mgr", icon: Briefcase, color: "text-purple-500", desc: "Ask for strategic advice or business overview." },
];

type Msg = { role: "user" | "assistant"; content: string };

export default function AIAssistant() {
  const [agent, setAgent] = useState("pm");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { getContext } = useAIContext();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Msg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const context = getContext();
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
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(errorData.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
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
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${e.message}. Click "Retry" below to try again.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const currentAgent = agents.find((a) => a.id === agent) || agents[0];

  return (
    <>
      <PageHeader title="AI Assistant" />
      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
        {/* Agent selector */}
        <div className="flex gap-2 flex-wrap">
          {agents.map((a) => (
            <Button
              key={a.id}
              variant={agent === a.id ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => { setAgent(a.id); setMessages([]); }}
            >
              <a.icon className={cn("h-3.5 w-3.5 mr-1.5", agent === a.id ? "" : a.color)} />
              {a.label}
            </Button>
          ))}
        </div>

        {/* Chat area */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.length === 0 && (
                <div className="text-center py-16 space-y-3">
                  <currentAgent.icon className={cn("h-10 w-10 mx-auto", currentAgent.color)} />
                  <p className="text-base font-medium">{currentAgent.label} AI</p>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {currentAgent.desc}
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2.5 text-sm",
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
                  <div className="bg-muted rounded-lg px-4 py-2.5 text-sm text-muted-foreground animate-pulse">
                    Thinking…
                  </div>
                </div>
              )}
              {!isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content.startsWith("Error:") && (
                <div className="flex justify-start">
                  <Button variant="outline" size="sm" onClick={() => {
                    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
                    if (lastUserMsg) {
                      setMessages(prev => prev.filter((_, i) => i !== prev.length - 1));
                      setInput(lastUserMsg.content);
                    }
                  }}>
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2 max-w-3xl mx-auto">
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
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
