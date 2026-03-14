import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateOrganisation } from "@/hooks/useOrganisations";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const sectors = ["Healthcare", "Technology", "Financial Services", "Public Sector", "Media", "Education", "Legal", "Retail"];

const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be 100 characters or fewer"),
  sector: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateClientDialog({ open, onOpenChange }: Props) {
  const createOrg = useCreateOrganisation();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", sector: "", email: "", website: "" },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      await createOrg.mutateAsync({
        name: data.name.trim(),
        sector: data.sector || null,
        email: data.email || null,
        website: data.website || null,
      });
      toast.success("Client created");
      form.reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create client");
    }
  };

  const { errors, isValid } = form.formState;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Organisation Name</Label>
            <Input id="client-name" {...form.register("name")} placeholder="e.g. Lloyds Bank" autoFocus />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Sector</Label>
            <Select value={form.watch("sector") || ""} onValueChange={(v) => form.setValue("sector", v, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Select sector..." /></SelectTrigger>
              <SelectContent>
                {sectors.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-email">Email</Label>
            <Input id="client-email" type="email" {...form.register("email")} placeholder="info@company.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-website">Website</Label>
            <Input id="client-website" {...form.register("website")} placeholder="https://..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createOrg.isPending || !isValid}>
              {createOrg.isPending ? "Creating..." : "Create Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
