import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CSVColumn {
  key: string;
  label: string;
  required?: boolean;
}

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  tableName: string;
  columns: CSVColumn[];
  onSuccess?: () => void;
  /** Transform a mapped row before insert (e.g. add created_by) */
  transformRow?: (row: Record<string, string>) => Record<string, any>;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

export function CSVImportDialog({
  open,
  onOpenChange,
  title,
  tableName,
  columns,
  onSuccess,
  transformRow,
}: CSVImportDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "map" | "preview" | "importing" | "done">("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<{ inserted: number; errors: number }>({ inserted: 0, errors: 0 });

  const reset = useCallback(() => {
    setStep("upload");
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    setImportResult({ inserted: 0, errors: 0 });
  }, []);

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (!headers.length) {
        toast.error("Could not parse CSV headers");
        return;
      }
      setCsvHeaders(headers);
      setCsvRows(rows);

      // Auto-map by fuzzy match
      const autoMap: Record<string, string> = {};
      for (const col of columns) {
        const match = headers.find(
          (h) =>
            h.toLowerCase().replace(/[_ ]/g, "") === col.key.toLowerCase().replace(/[_ ]/g, "") ||
            h.toLowerCase().replace(/[_ ]/g, "") === col.label.toLowerCase().replace(/[_ ]/g, "")
        );
        if (match) autoMap[col.key] = match;
      }
      setMapping(autoMap);
      setStep("map");
    };
    reader.readAsText(file);
    // Reset file input
    if (fileRef.current) fileRef.current.value = "";
  };

  const requiredMissing = columns.filter((c) => c.required && !mapping[c.key]);

  const getMappedRows = (): Record<string, any>[] => {
    return csvRows.map((row) => {
      const obj: Record<string, string> = {};
      for (const col of columns) {
        const csvHeader = mapping[col.key];
        if (csvHeader) {
          const idx = csvHeaders.indexOf(csvHeader);
          if (idx >= 0) obj[col.key] = row[idx] || "";
        }
      }
      return transformRow ? transformRow(obj) : obj;
    }).filter((row) => {
      // Filter out empty rows
      return Object.values(row).some((v) => v !== "" && v !== null && v !== undefined);
    });
  };

  const handleImport = async () => {
    setStep("importing");
    const rows = getMappedRows();
    const batchSize = 50;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await (supabase.from(tableName as any) as any).insert(batch);
      if (error) {
        console.error("CSV import batch error:", error);
        errors += batch.length;
      } else {
        inserted += batch.length;
      }
    }

    setImportResult({ inserted, errors });
    setStep("done");
    if (inserted > 0) onSuccess?.();
  };

  const previewRows = getMappedRows().slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import {title}
          </DialogTitle>
          <DialogDescription>Upload a CSV file to bulk import records.</DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8 border-2 border-dashed border-border rounded-lg">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">Drop your CSV file here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">
                Expected columns: {columns.filter((c) => c.required).map((c) => c.label).join(", ")}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              Choose File
            </Button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </div>
        )}

        {step === "map" && (
          <div className="flex-1 overflow-auto space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">{csvRows.length} rows</Badge>
              <Badge variant="secondary">{csvHeaders.length} columns</Badge>
            </div>

            <p className="text-sm text-muted-foreground">Map your CSV columns to the database fields:</p>

            <div className="space-y-2">
              {columns.map((col) => (
                <div key={col.key} className="flex items-center gap-3">
                  <span className="text-sm w-36 truncate flex items-center gap-1">
                    {col.label}
                    {col.required && <span className="text-destructive">*</span>}
                  </span>
                  <Select
                    value={mapping[col.key] || "__none__"}
                    onValueChange={(v) => setMapping({ ...mapping, [col.key]: v === "__none__" ? "" : v })}
                  >
                    <SelectTrigger className="h-8 flex-1">
                      <SelectValue placeholder="Skip" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Skip —</SelectItem>
                      {csvHeaders.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {requiredMissing.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                Missing required: {requiredMissing.map((c) => c.label).join(", ")}
              </div>
            )}

            {/* Preview */}
            {previewRows.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Preview (first 5 rows):</p>
                <ScrollArea className="max-h-48 border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns.filter((c) => mapping[c.key]).map((c) => (
                          <TableHead key={c.key} className="text-xs py-1 px-2">{c.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.map((row, i) => (
                        <TableRow key={i}>
                          {columns.filter((c) => mapping[c.key]).map((c) => (
                            <TableCell key={c.key} className="text-xs py-1 px-2 max-w-[150px] truncate">
                              {String(row[c.key] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        {step === "importing" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Importing {csvRows.length} records…</p>
          </div>
        )}

        {step === "done" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
            <CheckCircle2 className="h-10 w-10 text-[hsl(var(--stage-won))]" />
            <p className="text-sm font-medium">{importResult.inserted} records imported</p>
            {importResult.errors > 0 && (
              <p className="text-xs text-destructive">{importResult.errors} records failed</p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "map" && (
            <>
              <Button variant="outline" size="sm" onClick={reset}>Back</Button>
              <Button size="sm" onClick={handleImport} disabled={requiredMissing.length > 0}>
                Import {csvRows.length} Records
              </Button>
            </>
          )}
          {step === "done" && (
            <Button size="sm" onClick={() => handleClose(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
