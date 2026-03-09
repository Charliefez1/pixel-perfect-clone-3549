import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForms, useUpdateForm, Form } from "@/hooks/useForms";
import { FormField, FormFieldType, fieldTypeLabels } from "@/lib/formTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Save,
  Type,
  AlignLeft,
  CircleDot,
  CheckSquare,
  Star,
  BarChart3,
  Gauge,
  Calendar,
  Mail,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const fieldTypeIcons: Record<FormFieldType, React.ReactNode> = {
  short_text: <Type className="h-4 w-4" />,
  long_text: <AlignLeft className="h-4 w-4" />,
  single_choice: <CircleDot className="h-4 w-4" />,
  multiple_choice: <CheckSquare className="h-4 w-4" />,
  rating: <Star className="h-4 w-4" />,
  likert: <BarChart3 className="h-4 w-4" />,
  nps: <Gauge className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
};

function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function createDefaultField(type: FormFieldType): FormField {
  const base: FormField = {
    id: generateFieldId(),
    type,
    label: "",
    required: false,
  };

  switch (type) {
    case "single_choice":
    case "multiple_choice":
      return { ...base, options: { choices: ["Option 1", "Option 2", "Option 3"] } };
    case "rating":
      return { ...base, options: { min: 1, max: 5, labels: ["Poor", "Excellent"] } };
    case "likert":
      return {
        ...base,
        options: {
          min: 1,
          max: 5,
          labels: ["Strongly disagree", "Strongly agree"],
        },
      };
    case "nps":
      return { ...base, options: { min: 0, max: 10 } };
    default:
      return base;
  }
}

export default function FormBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: forms, isLoading } = useForms();
  const updateForm = useUpdateForm();

  const form = forms?.find((f) => f.id === id);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [initialised, setInitialised] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Initialise fields from form data once loaded
  if (form && !initialised) {
    const existingFields = (form.fields_json as FormField[]) || [];
    setFields(existingFields);
    if (existingFields.length > 0) setSelectedFieldId(existingFields[0].id);
    setInitialised(true);
  }

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const addField = useCallback((type: FormFieldType) => {
    const newField = createDefaultField(type);
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  }, []);

  const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f))
    );
  }, []);

  const removeField = useCallback((fieldId: string) => {
    setFields((prev) => {
      const filtered = prev.filter((f) => f.id !== fieldId);
      return filtered;
    });
    setSelectedFieldId((prev) =>
      prev === fieldId ? fields.find((f) => f.id !== fieldId)?.id || null : prev
    );
  }, [fields]);

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    setFields((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(draggedIndex, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
    setDraggedIndex(null);
  };

  const handleSave = () => {
    if (!id) return;
    updateForm.mutate(
      { id, fields_json: fields as any },
      {
        onSuccess: () => toast.success("Form saved"),
        onError: () => toast.error("Failed to save form"),
      }
    );
  };

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

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="border-b border-border bg-background-elevated px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/forms/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{form.title}</h1>
            <p className="text-xs text-muted-foreground">Form Builder</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/forms/${id}`)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateForm.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateForm.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left panel — field list */}
        <div className="w-80 border-r border-border overflow-y-auto bg-background">
          <div className="p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Fields ({fields.length})
            </p>

            {fields.map((field, index) => (
              <div
                key={field.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                onClick={() => setSelectedFieldId(field.id)}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg cursor-pointer border transition-colors",
                  selectedFieldId === field.id
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:bg-muted/50"
                )}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab shrink-0" />
                <span className="text-muted-foreground shrink-0">{fieldTypeIcons[field.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {field.label || <span className="text-muted-foreground italic">Untitled</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{fieldTypeLabels[field.type]}</p>
                </div>
                {field.required && (
                  <Badge variant="secondary" className="text-[9px] shrink-0">
                    Required
                  </Badge>
                )}
              </div>
            ))}

            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No fields yet. Add your first field below.
              </p>
            )}

            <Separator className="my-3" />

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Add Field
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(fieldTypeLabels) as FormFieldType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => addField(type)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 text-left transition-colors"
                >
                  <span className="text-muted-foreground">{fieldTypeIcons[type]}</span>
                  <span className="text-xs">{fieldTypeLabels[type]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — field settings */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedField ? (
            <FieldSettings
              field={selectedField}
              onChange={(updates) => updateField(selectedField.id, updates)}
              onRemove={() => removeField(selectedField.id)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Select a field to edit</p>
                <p className="text-sm">Or add a new field from the left panel</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldSettings({
  field,
  onChange,
  onRemove,
}: {
  field: FormField;
  onChange: (updates: Partial<FormField>) => void;
  onRemove: () => void;
}) {
  const hasChoices = field.type === "single_choice" || field.type === "multiple_choice";
  const hasScale =
    field.type === "rating" || field.type === "likert" || field.type === "nps";

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{fieldTypeIcons[field.type]}</span>
          <Badge variant="secondary">{fieldTypeLabels[field.type]}</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Remove
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Question</Label>
        <Input
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Enter your question..."
          className="text-base"
        />
      </div>

      <div className="space-y-2">
        <Label>Description (optional)</Label>
        <Textarea
          value={field.description || ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Add a description or help text..."
          rows={2}
        />
      </div>

      {(field.type === "short_text" || field.type === "long_text" || field.type === "email" || field.type === "number") && (
        <div className="space-y-2">
          <Label>Placeholder text</Label>
          <Input
            value={field.placeholder || ""}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            placeholder="Placeholder text..."
          />
        </div>
      )}

      {hasChoices && (
        <div className="space-y-2">
          <Label>Options</Label>
          <div className="space-y-2">
            {(field.options?.choices || []).map((choice, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={choice}
                  onChange={(e) => {
                    const newChoices = [...(field.options?.choices || [])];
                    newChoices[i] = e.target.value;
                    onChange({ options: { ...field.options, choices: newChoices } });
                  }}
                  className="flex-1 h-9"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => {
                    const newChoices = (field.options?.choices || []).filter((_, idx) => idx !== i);
                    onChange({ options: { ...field.options, choices: newChoices } });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newChoices = [...(field.options?.choices || []), `Option ${(field.options?.choices?.length || 0) + 1}`];
                onChange({ options: { ...field.options, choices: newChoices } });
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Option
            </Button>
          </div>
        </div>
      )}

      {hasScale && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Min value</Label>
              <Input
                type="number"
                value={field.options?.min ?? 1}
                onChange={(e) =>
                  onChange({ options: { ...field.options, min: parseInt(e.target.value) || 0 } })
                }
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label>Max value</Label>
              <Input
                type="number"
                value={field.options?.max ?? 5}
                onChange={(e) =>
                  onChange({ options: { ...field.options, max: parseInt(e.target.value) || 5 } })
                }
                className="h-9"
              />
            </div>
          </div>
          {field.type !== "nps" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Low label</Label>
                <Input
                  value={field.options?.labels?.[0] || ""}
                  onChange={(e) =>
                    onChange({
                      options: {
                        ...field.options,
                        labels: [e.target.value, field.options?.labels?.[1] || ""],
                      },
                    })
                  }
                  className="h-9"
                  placeholder="e.g. Poor"
                />
              </div>
              <div className="space-y-2">
                <Label>High label</Label>
                <Input
                  value={field.options?.labels?.[1] || ""}
                  onChange={(e) =>
                    onChange({
                      options: {
                        ...field.options,
                        labels: [field.options?.labels?.[0] || "", e.target.value],
                      },
                    })
                  }
                  className="h-9"
                  placeholder="e.g. Excellent"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label>Field type</Label>
        <Select
          value={field.type}
          onValueChange={(v) => onChange({ type: v as FormFieldType })}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(fieldTypeLabels) as FormFieldType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {fieldTypeLabels[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Switch
          checked={field.required}
          onCheckedChange={(checked) => onChange({ required: checked })}
        />
        <Label>Required field</Label>
      </div>
    </div>
  );
}
