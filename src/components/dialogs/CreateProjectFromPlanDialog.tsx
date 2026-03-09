import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, Check, X, FolderKanban, CheckSquare, Package, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AIGeneratedPlan {
  project: {
    name: string;
    description: string;
    service_type: string;
    neuro_phase: string;
    status: string;
    budget: number;
    start_date: string;
    end_date: string;
  };
  client_name: string;
  tasks: Array<{
    title: string;
    description: string;
    priority: string;
    status: string;
    due_date: string;
  }>;
  deliveries: Array<{
    title: string;
    delivery_date: string;
    status: string;
    notes: string;
  }>;
  milestones: Array<{
    title: string;
    target_date: string;
    description: string;
  }>;
}

type Step = "input" | "generating" | "preview" | "creating";

export function CreateProjectFromPlanDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("input");
  const [planText, setPlanText] = useState("");
  const [plan, setPlan] = useState<AIGeneratedPlan | null>(null);
  const [error, setError] = useState("");

  const reset = () => {
    setStep("input");
    setPlanText("");
    setPlan(null);
    setError("");
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const generatePlan = async () => {
    if (!planText.trim()) return;
    setStep("generating");
    setError("");

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Parse the following project plan and return ONLY valid JSON:\n\n${planText}`,
            },
          ],
          agent: "setup",
        }),
      });

      if (!resp.ok) throw new Error("Failed to generate plan");

      let text = "";
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) text += content;
            } catch {}
          }
        }
      }

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
      const jsonText = jsonMatch[1]?.trim() || text.trim();
      const generated = JSON.parse(jsonText) as AIGeneratedPlan;
      setPlan(generated);
      setStep("preview");
    } catch (e: any) {
      setError(e.message || "Failed to parse AI response");
      setStep("input");
    }
  };

  const createProject = async () => {
    if (!plan) return;
    setStep("creating");

    try {
      // Find or create organisation
      let orgId: string | null = null;
      if (plan.client_name) {
        const { data: existingOrg } = await supabase
          .from("organisations")
          .select("id")
          .ilike("name", plan.client_name)
          .maybeSingle();

        if (existingOrg) {
          orgId = existingOrg.id;
        } else {
          const { data: newOrg, error: orgError } = await supabase
            .from("organisations")
            .insert({ name: plan.client_name })
            .select("id")
            .single();
          if (orgError) throw orgError;
          orgId = newOrg.id;
        }
      }

      // Create project
      const { data: project, error: projError } = await supabase
        .from("projects")
        .insert({
          name: plan.project.name,
          description: plan.project.description,
          organisation_id: orgId,
          budget: plan.project.budget,
          neuro_phase: plan.project.neuro_phase as any,
          status: plan.project.status as any,
          start_date: plan.project.start_date,
          end_date: plan.project.end_date,
          service_type: plan.project.service_type as any,
        })
        .select()
        .single();
      if (projError) throw projError;

      // Batch insert tasks
      if (plan.tasks.length > 0) {
        const tasks = plan.tasks.map((t) => ({
          title: t.title,
          description: t.description,
          priority: t.priority as any,
          status: t.status as any,
          due_date: t.due_date,
          project_id: project.id,
        }));
        const { error: taskError } = await supabase.from("tasks").insert(tasks);
        if (taskError) throw taskError;
      }

      // Batch insert deliveries
      if (plan.deliveries.length > 0) {
        const deliveries = plan.deliveries.map((d) => ({
          title: d.title,
          delivery_date: d.delivery_date,
          status: d.status,
          notes: d.notes,
          project_id: project.id,
          organisation_id: orgId,
        }));
        const { error: delError } = await supabase.from("deliveries").insert(deliveries);
        if (delError) throw delError;
      }

      // Batch insert milestones
      if (plan.milestones.length > 0) {
        const milestones = plan.milestones.map((m, i) => ({
          label: m.title,
          milestone_key: m.title.toLowerCase().replace(/\s+/g, "_").slice(0, 50),
          sort_order: i,
          project_id: project.id,
        }));
        const { error: msError } = await supabase.from("project_milestones").insert(milestones);
        if (msError) throw msError;
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["project_milestones"] });
      queryClient.invalidateQueries({ queryKey: ["organisations"] });

      toast.success("Project created from plan");
      handleClose(false);
      navigate(`/projects/${project.id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to create project");
      setStep("preview");
    }
  };

  const removePlanItem = (type: "tasks" | "deliveries" | "milestones", index: number) => {
    if (!plan) return;
    setPlan({
      ...plan,
      [type]: plan[type].filter((_, i) => i !== index),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Project from Plan
          </DialogTitle>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Paste your project plan, proposal, or scope document below. The AI will extract a complete project structure.
            </p>
            <Textarea
              placeholder="Paste your project plan here...&#10;&#10;Example:&#10;Deliver a 3-workshop Neurodiversity Aware programme for Acme Corp in Q2 2026. Budget £12,000. First workshop 15th April, second 29th April, third 13th May. Include pre-session surveys and impact reports."
              value={planText}
              onChange={(e) => setPlanText(e.target.value)}
              rows={10}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end">
              <Button onClick={generatePlan} disabled={!planText.trim()}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Project
              </Button>
            </div>
          </div>
        )}

        {step === "generating" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analysing your plan and generating project structure...</p>
          </div>
        )}

        {step === "preview" && plan && (
          <div className="space-y-4">
            {/* Project details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FolderKanban className="h-4 w-4" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{plan.project.name}</p>
                <p className="text-sm text-muted-foreground">{plan.project.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="capitalize">{plan.project.service_type}</Badge>
                  <Badge variant="secondary">£{plan.project.budget?.toLocaleString()}</Badge>
                  {plan.client_name && <Badge variant="outline">{plan.client_name}</Badge>}
                  {plan.project.start_date && <Badge variant="outline">{plan.project.start_date}</Badge>}
                  {plan.project.end_date && <Badge variant="outline">to {plan.project.end_date}</Badge>}
                </div>
              </CardContent>
            </Card>

            {/* Tasks */}
            {plan.tasks.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Tasks ({plan.tasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {plan.tasks.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-md border text-sm">
                        <span className="flex-1 truncate">{t.title}</span>
                        <Badge variant="secondary" className="text-[9px] capitalize">{t.priority}</Badge>
                        {t.due_date && <span className="text-[10px] text-muted-foreground">{t.due_date}</span>}
                        <button onClick={() => removePlanItem("tasks", i)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deliveries */}
            {plan.deliveries.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Deliveries ({plan.deliveries.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {plan.deliveries.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-md border text-sm">
                        <span className="flex-1 truncate">{d.title}</span>
                        {d.delivery_date && <span className="text-[10px] text-muted-foreground">{d.delivery_date}</span>}
                        <button onClick={() => removePlanItem("deliveries", i)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Milestones */}
            {plan.milestones.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Milestones ({plan.milestones.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {plan.milestones.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-md border text-sm">
                        <span className="flex-1 truncate">{m.title}</span>
                        {m.target_date && <span className="text-[10px] text-muted-foreground">{m.target_date}</span>}
                        <button onClick={() => removePlanItem("milestones", i)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("input")}>Back</Button>
              <Button onClick={createProject}>
                <Check className="h-4 w-4 mr-2" />
                Create All
              </Button>
            </div>
          </div>
        )}

        {step === "creating" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Creating project, tasks, deliveries, and milestones...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
