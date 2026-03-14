import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateContact } from "@/hooks/useContacts";
import { useOrganisations } from "@/hooks/useOrganisations";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const contactSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(50, "First name must be 50 characters or fewer"),
  last_name: z.string().min(1, "Last name is required").max(50, "Last name must be 50 characters or fewer"),
  email: z.string().email("Invalid email format").or(z.literal("")).optional(),
  phone: z.string().optional(),
  job_title: z.string().optional(),
  organisation_id: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateContactDialog({ open, onOpenChange }: Props) {
  const { data: orgs } = useOrganisations();
  const createContact = useCreateContact();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { first_name: "", last_name: "", email: "", phone: "", job_title: "", organisation_id: "" },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const onSubmit = async (data: ContactFormData) => {
    try {
      await createContact.mutateAsync({
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email || null,
        job_title: data.job_title || null,
        organisation_id: data.organisation_id || null,
      });
      toast.success("Contact created");
      form.reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create contact");
    }
  };

  const { errors, isValid } = form.formState;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="contact-first">First Name</Label>
              <Input id="contact-first" {...form.register("first_name")} placeholder="Jane" autoFocus />
              {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-last">Last Name</Label>
              <Input id="contact-last" {...form.register("last_name")} placeholder="Smith" />
              {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input id="contact-email" type="email" {...form.register("email")} placeholder="jane@company.com" />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-job">Job Title</Label>
            <Input id="contact-job" {...form.register("job_title")} placeholder="Head of D&I" />
          </div>
          <div className="space-y-2">
            <Label>Organisation</Label>
            <Select value={form.watch("organisation_id") || ""} onValueChange={(v) => form.setValue("organisation_id", v, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Select organisation..." /></SelectTrigger>
              <SelectContent>
                {orgs?.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createContact.isPending || !isValid}>
              {createContact.isPending ? "Creating..." : "Create Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
