import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MyStorySection({ profile, isOwner }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(profile?.bio || "");
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (bio) => {
      if (profile?.id) {
        return base44.entities.ImpactProfile.update(profile.id, { bio });
      } else {
        return base44.entities.ImpactProfile.create({ bio });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries(["impact-profile"]);
      setEditing(false);
    },
  });

  const story = profile?.bio;

  if (!story && !isOwner) return null;

  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-foreground">My Story</h3>
        {isOwner && !editing && (
          <button onClick={() => { setText(profile?.bio || ""); setEditing(true); }}
            className="text-muted-foreground hover:text-primary transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            className="w-full border border-border rounded-xl p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            rows={5}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Tell the world who you are and why you care..."
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" className="rounded-xl gap-1" onClick={() => setEditing(false)}>
              <X className="w-3 h-3" /> Cancel
            </Button>
            <Button size="sm" className="rounded-xl gap-1 bg-primary hover:bg-primary/90" onClick={() => mutation.mutate(text)} disabled={mutation.isPending}>
              <Check className="w-3 h-3" /> Save
            </Button>
          </div>
        </div>
      ) : story ? (
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{story}</p>
      ) : (
        <button onClick={() => setEditing(true)} className="text-sm text-muted-foreground hover:text-primary italic">
          + Add your story...
        </button>
      )}
    </div>
  );
}