import { useState } from "react";
import { useEntityLinks, useCreateEntityLink, useDeleteEntityLink, EntityLink } from "@/hooks/useEntityLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link2, Plus, X } from "lucide-react";
import { toast } from "sonner";

const entityTypeLabels: Record<string, string> = {
  project: "Project",
  delivery: "Delivery",
  form: "Form",
  contract: "Contract",
  contact: "Contact",
  invoice: "Invoice",
  session: "Session",
};

interface EntityLinksPanelProps {
  sourceType: string;
  sourceId: string;
}

export function EntityLinksPanel({ sourceType, sourceId }: EntityLinksPanelProps) {
  const { data: links, isLoading } = useEntityLinks(sourceType, sourceId);
  const createLink = useCreateEntityLink();
  const deleteLink = useDeleteEntityLink();
  const [adding, setAdding] = useState(false);
  const [targetType, setTargetType] = useState("");
  const [targetId, setTargetId] = useState("");
  const [relationship, setRelationship] = useState("");

  const handleAdd = () => {
    if (!targetType || !targetId.trim()) {
      toast.error("Target type and ID are required");
      return;
    }
    createLink.mutate(
      {
        source_type: sourceType,
        source_id: sourceId,
        target_type: targetType,
        target_id: targetId.trim(),
        relationship: relationship || null,
      },
      {
        onSuccess: () => {
          toast.success("Link created");
          setAdding(false);
          setTargetType("");
          setTargetId("");
          setRelationship("");
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const getLinkedEntity = (link: EntityLink) => {
    const isSource = link.source_type === sourceType && link.source_id === sourceId;
    return {
      type: isSource ? link.target_type : link.source_type,
      id: isSource ? link.target_id : link.source_id,
    };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Linked Items</span>
        </div>
        {!adding && (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Link
          </Button>
        )}
      </div>

      {adding && (
        <div className="border rounded-md p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Select value={targetType} onValueChange={setTargetType}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Entity type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(entityTypeLabels)
                  .filter(([key]) => key !== sourceType)
                  .map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Input
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Entity ID"
              className="h-8 text-xs"
            />
          </div>
          <Input
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="Relationship (optional, e.g. 'facilitator')"
            className="h-8 text-xs"
          />
          <div className="flex gap-1">
            <Button size="sm" className="h-7 text-xs" onClick={handleAdd} disabled={createLink.isPending}>
              Add
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : !links?.length ? (
        <p className="text-xs text-muted-foreground">No linked items.</p>
      ) : (
        <div className="space-y-1.5">
          {links.map((link) => {
            const linked = getLinkedEntity(link);
            return (
              <div
                key={link.id}
                className="flex items-center gap-2 p-2 rounded-md border text-xs"
              >
                <Badge variant="secondary" className="text-[10px]">
                  {entityTypeLabels[linked.type] || linked.type}
                </Badge>
                <span className="text-muted-foreground truncate flex-1">
                  {linked.id.slice(0, 8)}...
                </span>
                {link.relationship && (
                  <Badge variant="outline" className="text-[10px]">
                    {link.relationship}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() =>
                    deleteLink.mutate(link.id, {
                      onSuccess: () => toast.success("Link removed"),
                    })
                  }
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
