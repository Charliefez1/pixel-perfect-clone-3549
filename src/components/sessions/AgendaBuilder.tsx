import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useSessionAgenda,
  useCreateAgendaItem,
  useUpdateAgendaItem,
  useDeleteAgendaItem,
  useReorderAgendaItems,
  SessionAgendaItem,
} from "@/hooks/useSessionAgenda";
import { toast } from "sonner";
import {
  Plus, GripVertical, Trash2, Clock, Play, Pause, RotateCcw,
  ChevronUp, ChevronDown, Coffee, Lightbulb, Users, Mic, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

const agendaTypes = [
  { value: "intro", label: "Introduction", icon: Mic, color: "bg-blue-500/10 text-blue-600" },
  { value: "activity", label: "Activity", icon: Users, color: "bg-green-500/10 text-green-600" },
  { value: "break", label: "Break", icon: Coffee, color: "bg-amber-500/10 text-amber-600" },
  { value: "debrief", label: "Debrief", icon: BookOpen, color: "bg-purple-500/10 text-purple-600" },
  { value: "energiser", label: "Energiser", icon: Lightbulb, color: "bg-pink-500/10 text-pink-600" },
];

const typeConfig = Object.fromEntries(agendaTypes.map((t) => [t.value, t]));

interface AgendaBuilderProps {
  sessionId: string;
  sessionDuration?: number | null;
}

export function AgendaBuilder({ sessionId, sessionDuration }: AgendaBuilderProps) {
  const { data: items, isLoading } = useSessionAgenda(sessionId);
  const createItem = useCreateAgendaItem();
  const updateItem = useUpdateAgendaItem();
  const deleteItem = useDeleteAgendaItem();
  const reorder = useReorderAgendaItems();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New item form
  const [title, setTitle] = useState("");
  const [type, setType] = useState("activity");
  const [duration, setDuration] = useState("15");
  const [method, setMethod] = useState("");
  const [description, setDescription] = useState("");

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerItemIdx, setTimerItemIdx] = useState(0);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup timer on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const totalPlanned = items?.reduce((s, i) => s + i.duration_minutes, 0) || 0;
  const remaining = (sessionDuration || 0) - totalPlanned;

  const handleAdd = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    const position = items?.length || 0;
    createItem.mutate(
      {
        session_id: sessionId,
        title: title.trim(),
        type,
        duration_minutes: parseInt(duration) || 15,
        position,
        method: method || null,
        description: description || null,
      },
      {
        onSuccess: () => {
          toast.success("Activity added");
          setTitle(""); setType("activity"); setDuration("15"); setMethod(""); setDescription("");
          setAdding(false);
        },
      }
    );
  };

  const handleMove = (idx: number, dir: -1 | 1) => {
    if (!items) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    const reordered = items.map((item, i) => ({
      id: item.id,
      position: i === idx ? newIdx : i === newIdx ? idx : i,
    }));
    reorder.mutate({ items: reordered, session_id: sessionId });
  };

  const handleDelete = (id: string) => {
    deleteItem.mutate({ id, session_id: sessionId }, {
      onSuccess: () => toast.success("Removed"),
    });
  };

  // Timer functions
  const startTimer = () => {
    if (!items || items.length === 0) return;
    setTimerRunning(true);
    setTimerItemIdx(0);
    setTimerElapsed(0);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => setTimerElapsed((e) => e + 1), 1000);
  };

  const stopTimer = () => {
    setTimerRunning(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const resetTimer = () => {
    stopTimer();
    setTimerItemIdx(0);
    setTimerElapsed(0);
  };

  const advanceTimer = () => {
    if (!items) return;
    if (timerItemIdx < items.length - 1) {
      setTimerItemIdx((i) => i + 1);
      setTimerElapsed(0);
    } else {
      stopTimer();
      toast.success("Session complete!");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Cumulative timeline
  let cumulative = 0;

  return (
    <div className="space-y-4">
      {/* Timeline header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold">Session Agenda</h3>
          <Badge variant="secondary" className="text-xs">
            {totalPlanned}m planned
            {sessionDuration ? ` / ${sessionDuration}m total` : ""}
          </Badge>
          {remaining < 0 && sessionDuration && (
            <Badge className="bg-red-500/10 text-red-600 text-xs">{Math.abs(remaining)}m over</Badge>
          )}
          {remaining > 0 && sessionDuration && (
            <Badge className="bg-green-500/10 text-green-600 text-xs">{remaining}m unallocated</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!timerRunning ? (
            <Button variant="outline" size="sm" onClick={startTimer} disabled={!items?.length}>
              <Play className="h-3.5 w-3.5 mr-1" /> Live Mode
            </Button>
          ) : (
            <>
              <span className="text-sm font-mono font-bold text-primary">{formatTime(timerElapsed)}</span>
              <Button variant="outline" size="sm" onClick={advanceTimer}>Next</Button>
              <Button variant="outline" size="sm" onClick={stopTimer}><Pause className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" onClick={resetTimer}><RotateCcw className="h-3.5 w-3.5" /></Button>
            </>
          )}
        </div>
      </div>

      {/* Agenda items */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !items?.length ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No agenda items yet. Build your session timeline.</p>
          <Button size="sm" className="mt-3" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add First Activity
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => {
            const config = typeConfig[item.type] || typeConfig.activity;
            const Icon = config.icon;
            const startMin = cumulative;
            cumulative += item.duration_minutes;
            const isActive = timerRunning && timerItemIdx === idx;
            const isPastItem = timerRunning && idx < timerItemIdx;

            return (
              <Card
                key={item.id}
                className={cn(
                  "transition-all",
                  isActive && "ring-2 ring-primary shadow-md",
                  isPastItem && "opacity-50"
                )}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleMove(idx, -1)} disabled={idx === 0} aria-label="Move item up">
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleMove(idx, 1)} disabled={idx === items.length - 1} aria-label="Move item down">
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", config.color)}>
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.method && (
                        <Badge variant="outline" className="text-[10px]">{item.method}</Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-medium">{item.duration_minutes}m</p>
                    <p className="text-[10px] text-muted-foreground">
                      {Math.floor(startMin / 60)}:{(startMin % 60).toString().padStart(2, "0")} –{" "}
                      {Math.floor(cumulative / 60)}:{(cumulative % 60).toString().padStart(2, "0")}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(item.id)}
                    aria-label="Delete item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add form */}
      {adding ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Input
                placeholder="Activity title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-2"
              />
              <Input
                type="number"
                placeholder="Minutes"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {agendaTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Method (optional, e.g. Think-Pair-Share)"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              />
            </div>
            <Textarea
              placeholder="Description / facilitator notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={createItem.isPending}>
                {createItem.isPending ? "Adding..." : "Add Activity"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)} className="w-full border-dashed">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Activity
        </Button>
      )}
    </div>
  );
}
