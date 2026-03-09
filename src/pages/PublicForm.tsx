import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FormField } from "@/lib/formTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicFormData {
  id: string;
  title: string;
  description: string | null;
  fields_json: FormField[];
  active: boolean | null;
}

export default function PublicForm() {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<PublicFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!formId) return;
    supabase
      .from("forms")
      .select("id, title, description, fields_json, active")
      .eq("id", formId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setForm(data as any);
        setLoading(false);
      });
  }, [formId]);

  const setAnswer = (fieldId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[fieldId];
      return copy;
    });
  };

  const validate = (): boolean => {
    const fields: FormField[] = form?.fields_json || [];
    const newErrors: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.required) {
        const v = answers[f.id];
        if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) {
          newErrors[f.id] = "This field is required";
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !formId) return;
    setSubmitting(true);
    const { error } = await supabase.from("form_responses").insert({
      form_id: formId,
      respondent_name: respondentName || null,
      respondent_email: respondentEmail || null,
      answers,
    });
    setSubmitting(false);
    if (error) {
      console.error(error);
      return;
    }
    // Increment responses_count
    await supabase.rpc("increment_form_responses", { form_id_param: formId }).catch(() => {
      // Fallback: just succeed even if the count doesn't update
    });
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-2xl px-4 space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!form || !form.active) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg mx-auto">
            N
          </div>
          <p className="text-lg font-medium">Form not available</p>
          <p className="text-sm text-muted-foreground">
            This form is no longer accepting responses.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">Thank you!</h1>
          <p className="text-muted-foreground max-w-md">
            Your response has been recorded. We appreciate you taking the time to provide your
            feedback.
          </p>
        </div>
      </div>
    );
  }

  const fields: FormField[] = form.fields_json || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm mx-auto">
            N
          </div>
          <h1 className="text-2xl font-bold">{form.title}</h1>
          {form.description && (
            <p className="text-muted-foreground">{form.description}</p>
          )}
        </div>

        {/* Respondent info */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Your name (optional)</Label>
                <Input
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <Label>Your email (optional)</Label>
                <Input
                  type="email"
                  value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fields */}
        {fields.map((field, index) => (
          <Card key={field.id} className={errors[field.id] ? "border-red-500" : ""}>
            <CardContent className="p-5 space-y-3">
              <div>
                <Label className="text-base">
                  {index + 1}. {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {field.description && (
                  <p className="text-sm text-muted-foreground mt-1">{field.description}</p>
                )}
              </div>

              <PublicFieldInput
                field={field}
                value={answers[field.id]}
                onChange={(v) => setAnswer(field.id, v)}
              />

              {errors[field.id] && (
                <p className="text-xs text-red-500">{errors[field.id]}</p>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Submit */}
        <div className="flex justify-center pb-8">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-12"
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-4">
          Powered by NDG Hub
        </p>
      </div>
    </div>
  );
}

function PublicFieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: any;
  onChange: (v: any) => void;
}) {
  switch (field.type) {
    case "short_text":
      return (
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || "Type your answer..."}
        />
      );

    case "long_text":
      return (
        <Textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || "Type your answer..."}
          rows={4}
        />
      );

    case "email":
      return (
        <Input
          type="email"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || "email@example.com"}
        />
      );

    case "number":
      return (
        <Input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
          placeholder={field.placeholder || "0"}
        />
      );

    case "date":
      return (
        <Input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "single_choice":
      return (
        <RadioGroup value={value || ""} onValueChange={onChange}>
          {(field.options?.choices || []).map((choice) => (
            <div key={choice} className="flex items-center space-x-2">
              <RadioGroupItem value={choice} id={`${field.id}-${choice}`} />
              <Label htmlFor={`${field.id}-${choice}`} className="font-normal cursor-pointer">
                {choice}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );

    case "multiple_choice": {
      const selected: string[] = value || [];
      return (
        <div className="space-y-2">
          {(field.options?.choices || []).map((choice) => (
            <div key={choice} className="flex items-center space-x-2">
              <Checkbox
                id={`${field.id}-${choice}`}
                checked={selected.includes(choice)}
                onCheckedChange={(checked) => {
                  onChange(
                    checked
                      ? [...selected, choice]
                      : selected.filter((c) => c !== choice)
                  );
                }}
              />
              <Label htmlFor={`${field.id}-${choice}`} className="font-normal cursor-pointer">
                {choice}
              </Label>
            </div>
          ))}
        </div>
      );
    }

    case "rating": {
      const min = field.options?.min ?? 1;
      const max = field.options?.max ?? 5;
      const stars = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      return (
        <div className="space-y-2">
          <div className="flex gap-1">
            {stars.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className="p-1 transition-colors"
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    value && n <= value
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  )}
                />
              </button>
            ))}
          </div>
          {field.options?.labels && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{field.options.labels[0]}</span>
              <span>{field.options.labels[1]}</span>
            </div>
          )}
        </div>
      );
    }

    case "likert": {
      const min = field.options?.min ?? 1;
      const max = field.options?.max ?? 5;
      const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            {values.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className={cn(
                  "flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors",
                  value === n
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted"
                )}
              >
                {n}
              </button>
            ))}
          </div>
          {field.options?.labels && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{field.options.labels[0]}</span>
              <span>{field.options.labels[1]}</span>
            </div>
          )}
        </div>
      );
    }

    case "nps": {
      const values = Array.from({ length: 11 }, (_, i) => i);
      return (
        <div className="space-y-2">
          <div className="flex gap-1">
            {values.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className={cn(
                  "flex-1 py-2 rounded-md border text-xs font-medium transition-colors",
                  value === n
                    ? n <= 6
                      ? "bg-red-500 text-white border-red-500"
                      : n <= 8
                      ? "bg-yellow-500 text-white border-yellow-500"
                      : "bg-green-500 text-white border-green-500"
                    : "bg-background border-border hover:bg-muted"
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Not at all likely</span>
            <span>Extremely likely</span>
          </div>
        </div>
      );
    }

    default:
      return <Input value={value || ""} onChange={(e) => onChange(e.target.value)} />;
  }
}
