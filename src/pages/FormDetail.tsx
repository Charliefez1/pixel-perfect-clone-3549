import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForms, useUpdateForm, Form } from "@/hooks/useForms";
import { useFormResponses, FormResponse } from "@/hooks/useFormResponses";
import { FormField } from "@/lib/formTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Pencil,
  Copy,
  Download,
  QrCode,
  Link2,
  Mail,
  Code,
  BarChart3,
  Star,
  TrendingUp,
  Users,
  Gauge,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function FormDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: forms, isLoading } = useForms();
  const { data: responses, isLoading: responsesLoading } = useFormResponses(id);
  const updateForm = useUpdateForm();

  const form = forms?.find((f) => f.id === id);
  const fields: FormField[] = (form?.fields_json as FormField[]) || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Form not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/forms")}>
          Back to Forms
        </Button>
      </div>
    );
  }

  const responseCount = responses?.length || 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-background-elevated px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/forms")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{form.title}</h1>
                <Badge
                  className={
                    form.active
                      ? "bg-[hsl(var(--stage-won))]/20 text-[hsl(var(--stage-won))]"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {form.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              {form.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{form.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-3">
              <span className="text-xs text-muted-foreground">Active</span>
              <Switch
                checked={form.active ?? true}
                onCheckedChange={(checked) =>
                  updateForm.mutate(
                    { id: form.id, active: checked },
                    { onSuccess: () => toast.success(checked ? "Form activated" : "Form deactivated") }
                  )
                }
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(`/forms/${id}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Form
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="responses" className="h-full">
          <div className="border-b border-border px-6">
            <TabsList className="bg-transparent h-12 p-0 gap-4">
              <TabsTrigger
                value="responses"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-12 px-1"
              >
                Responses ({responseCount})
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-12 px-1"
              >
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="share"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-12 px-1"
              >
                Share
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="responses" className="p-6 mt-0">
            <ResponsesTab
              responses={responses || []}
              fields={fields}
              isLoading={responsesLoading}
              formId={form.id}
            />
          </TabsContent>

          <TabsContent value="analytics" className="p-6 mt-0">
            <AnalyticsTab responses={responses || []} fields={fields} />
          </TabsContent>

          <TabsContent value="share" className="p-6 mt-0">
            <ShareTab formId={form.id} formTitle={form.title} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ── Responses Tab ── */
function ResponsesTab({
  responses,
  fields,
  isLoading,
  formId,
}: {
  responses: FormResponse[];
  fields: FormField[];
  isLoading: boolean;
  formId: string;
}) {
  const exportCSV = () => {
    if (!responses.length) return;
    const headers = ["Respondent", "Email", "Submitted", ...fields.map((f) => f.label)];
    const rows = responses.map((r) => [
      r.respondent_name || "",
      r.respondent_email || "",
      format(new Date(r.submitted_at), "dd/MM/yyyy HH:mm"),
      ...fields.map((f) => {
        const val = r.answers?.[f.id];
        return Array.isArray(val) ? val.join("; ") : String(val ?? "");
      }),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `form-responses-${formId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {responses.length} response{responses.length !== 1 ? "s" : ""}
        </p>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={!responses.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {responses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <p>No responses yet. Share your form to start collecting feedback.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Respondent</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Submitted</TableHead>
                {fields.slice(0, 3).map((f) => (
                  <TableHead key={f.id} className="max-w-[200px]">
                    {f.label.length > 30 ? f.label.slice(0, 30) + "..." : f.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="pl-6 font-medium">
                    {r.respondent_name || "Anonymous"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.respondent_email || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(r.submitted_at), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  {fields.slice(0, 3).map((f) => {
                    const val = r.answers?.[f.id];
                    const display = Array.isArray(val) ? val.join(", ") : String(val ?? "—");
                    return (
                      <TableCell key={f.id} className="max-w-[200px] truncate text-muted-foreground">
                        {display}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

/* ── Analytics Tab ── */
function AnalyticsTab({
  responses,
  fields,
}: {
  responses: FormResponse[];
  fields: FormField[];
}) {
  if (!responses.length) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <p>No responses to analyse yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall stats
  const ratingFields = fields.filter((f) => f.type === "rating" || f.type === "likert");
  const npsFields = fields.filter((f) => f.type === "nps");

  const avgRating =
    ratingFields.length > 0
      ? (() => {
          let total = 0;
          let count = 0;
          ratingFields.forEach((f) => {
            responses.forEach((r) => {
              const v = r.answers?.[f.id];
              if (typeof v === "number") {
                total += v;
                count++;
              }
            });
          });
          return count > 0 ? (total / count).toFixed(1) : "—";
        })()
      : "—";

  const npsScore =
    npsFields.length > 0
      ? (() => {
          let promoters = 0;
          let detractors = 0;
          let total = 0;
          npsFields.forEach((f) => {
            responses.forEach((r) => {
              const v = r.answers?.[f.id];
              if (typeof v === "number") {
                total++;
                if (v >= 9) promoters++;
                else if (v <= 6) detractors++;
              }
            });
          });
          return total > 0 ? Math.round(((promoters - detractors) / total) * 100) : null;
        })()
      : null;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total Responses</p>
            </div>
            <p className="text-2xl font-bold">{responses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Average Rating</p>
            </div>
            <p className="text-2xl font-bold">{avgRating}</p>
          </CardContent>
        </Card>
        {npsScore !== null && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">NPS Score</p>
              </div>
              <p className={`text-2xl font-bold ${npsScore >= 0 ? "text-green-600" : "text-red-600"}`}>
                {npsScore > 0 ? "+" : ""}
                {npsScore}
              </p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Completion Rate</p>
            </div>
            <p className="text-2xl font-bold">
              {(() => {
                if (!fields.length) return "—";
                const requiredFields = fields.filter((f) => f.required);
                if (!requiredFields.length) return "100%";
                const completeCount = responses.filter((r) =>
                  requiredFields.every((f) => {
                    const v = r.answers?.[f.id];
                    return v !== undefined && v !== null && v !== "";
                  })
                ).length;
                return Math.round((completeCount / responses.length) * 100) + "%";
              })()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-field analytics */}
      <div className="space-y-4">
        {fields.map((field) => (
          <FieldAnalytics key={field.id} field={field} responses={responses} />
        ))}
      </div>
    </div>
  );
}

function FieldAnalytics({
  field,
  responses,
}: {
  field: FormField;
  responses: FormResponse[];
}) {
  const values = responses
    .map((r) => r.answers?.[field.id])
    .filter((v) => v !== undefined && v !== null && v !== "");

  if (!values.length) return null;

  if (field.type === "rating" || field.type === "likert") {
    const min = field.options?.min ?? 1;
    const max = field.options?.max ?? 5;
    const distribution: Record<number, number> = {};
    for (let i = min; i <= max; i++) distribution[i] = 0;
    values.forEach((v) => {
      if (typeof v === "number" && distribution[v] !== undefined) distribution[v]++;
    });
    const maxCount = Math.max(...Object.values(distribution), 1);
    const avg = values.reduce((s: number, v: any) => s + (typeof v === "number" ? v : 0), 0) / values.length;

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{field.label}</CardTitle>
            <Badge variant="secondary">Avg: {avg.toFixed(1)}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {Object.entries(distribution).map(([val, count]) => (
              <div key={val} className="flex items-center gap-3 text-sm">
                <span className="w-6 text-right text-muted-foreground">{val}</span>
                <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right text-muted-foreground text-xs">{count}</span>
              </div>
            ))}
          </div>
          {field.options?.labels && (
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-9">
              <span>{field.options.labels[0]}</span>
              <span>{field.options.labels[1]}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (field.type === "nps") {
    let promoters = 0,
      passives = 0,
      detractors = 0;
    values.forEach((v) => {
      if (typeof v === "number") {
        if (v >= 9) promoters++;
        else if (v >= 7) passives++;
        else detractors++;
      }
    });
    const total = promoters + passives + detractors;
    const score = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{field.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className={`text-3xl font-bold ${score >= 0 ? "text-green-600" : "text-red-600"}`}>
                {score > 0 ? "+" : ""}{score}
              </p>
              <p className="text-xs text-muted-foreground">NPS Score</p>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-20">Promoters (9-10)</div>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: `${total ? (promoters / total) * 100 : 0}%` }} />
                </div>
                <span className="w-8 text-right">{promoters}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-20">Passives (7-8)</div>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${total ? (passives / total) * 100 : 0}%` }} />
                </div>
                <span className="w-8 text-right">{passives}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-20">Detractors (0-6)</div>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: `${total ? (detractors / total) * 100 : 0}%` }} />
                </div>
                <span className="w-8 text-right">{detractors}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (field.type === "single_choice" || field.type === "multiple_choice") {
    const counts: Record<string, number> = {};
    values.forEach((v) => {
      const items = Array.isArray(v) ? v : [v];
      items.forEach((item) => {
        counts[String(item)] = (counts[String(item)] || 0) + 1;
      });
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const maxCount = Math.max(...sorted.map(([, c]) => c), 1);

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{field.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {sorted.map(([label, count]) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <span className="w-40 truncate text-muted-foreground">{label}</span>
                <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right text-muted-foreground text-xs">
                  {count} ({Math.round((count / values.length) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Text fields — list responses
  if (field.type === "long_text" || field.type === "short_text") {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{field.label}</CardTitle>
            <Badge variant="secondary">{values.length} responses</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {values.slice(0, 20).map((v, i) => (
              <p key={i} className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                {String(v)}
              </p>
            ))}
            {values.length > 20 && (
              <p className="text-xs text-muted-foreground text-center">
                + {values.length - 20} more responses
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

/* ── Share Tab ── */
function ShareTab({ formId, formTitle }: { formId: string; formTitle: string }) {
  const formUrl = `${window.location.origin}/form/${formId}`;
  const embedCode = `<iframe src="${formUrl}" width="100%" height="700" frameborder="0"></iframe>`;
  const emailSubject = encodeURIComponent(`Please complete: ${formTitle}`);
  const emailBody = encodeURIComponent(
    `Hi,\n\nPlease complete the following form:\n${formUrl}\n\nThank you!`
  );

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Direct link */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <p className="font-medium text-sm">Direct Link</p>
          </div>
          <div className="flex items-center gap-2">
            <Input value={formUrl} readOnly className="flex-1 text-sm bg-muted/50" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(formUrl, "Link")}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary" />
            <p className="font-medium text-sm">QR Code</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center border">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(formUrl)}`}
                alt="QR Code"
                className="w-28 h-28"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Scan this QR code to open the form on a mobile device.</p>
              <p className="mt-1">Perfect for in-person workshops — attendees can scan to give feedback instantly.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embed code */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-primary" />
            <p className="font-medium text-sm">Embed Code</p>
          </div>
          <div className="space-y-2">
            <pre className="bg-muted/50 p-3 rounded-md text-xs overflow-x-auto">{embedCode}</pre>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(embedCode, "Embed code")}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email link */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <p className="font-medium text-sm">Email Link</p>
          </div>
          <a
            href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
            className="inline-block"
          >
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Compose Email with Form Link
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
