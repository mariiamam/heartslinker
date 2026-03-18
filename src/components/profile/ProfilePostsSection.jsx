import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Image, Send, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function ProfilePostsSection({ posts, userEmail, isOwner }) {
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProfilePost.create(data),
    onSuccess: () => {
      qc.invalidateQueries(["profile-posts"]);
      setContent(""); setImageUrl(""); setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProfilePost.delete(id),
    onSuccess: () => qc.invalidateQueries(["profile-posts"]),
  });

  const toggleVisibility = useMutation({
    mutationFn: ({ id, is_visible }) => base44.entities.ProfilePost.update(id, { is_visible }),
    onSuccess: () => qc.invalidateQueries(["profile-posts"]),
  });

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImageUrl(file_url);
    setUploading(false);
  };

  const visiblePosts = isOwner ? posts : posts.filter(p => p.is_visible);

  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground">Posts & Updates</h3>
        {isOwner && (
          <Button size="sm" variant="outline" className="gap-1 rounded-xl text-xs" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-3 h-3" /> Share
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-secondary/30 rounded-xl p-4 space-y-3 border border-border">
          <textarea
            className="w-full border border-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary bg-white"
            rows={3}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share an update, reflection, or story..."
          />
          {imageUrl && <img src={imageUrl} alt="" className="rounded-xl max-h-48 object-cover w-full" />}
          <div className="flex items-center gap-2 justify-between">
            <label className="cursor-pointer text-muted-foreground hover:text-primary transition-colors">
              <Image className="w-4 h-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </label>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" className="rounded-xl gap-1 bg-primary hover:bg-primary/90 text-xs" disabled={!content || createMutation.isPending || uploading}
                onClick={() => createMutation.mutate({ user_email: userEmail, content, image_url: imageUrl || undefined })}>
                <Send className="w-3 h-3" /> Post
              </Button>
            </div>
          </div>
        </div>
      )}

      {!visiblePosts.length ? (
        <p className="text-sm text-muted-foreground italic text-center py-4">No posts yet.</p>
      ) : (
        <div className="space-y-3">
          {visiblePosts.map(post => (
            <div key={post.id} className="border border-border rounded-xl p-4 space-y-2">
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>
              {post.image_url && <img src={post.image_url} alt="" className="rounded-xl max-h-56 object-cover w-full" />}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">{format(new Date(post.created_date), "MMM d, yyyy")}</span>
                {isOwner && (
                  <div className="flex gap-2">
                    <button onClick={() => toggleVisibility.mutate({ id: post.id, is_visible: !post.is_visible })}
                      className="text-muted-foreground hover:text-primary transition-colors" title={post.is_visible ? "Hide" : "Show"}>
                      {post.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground/50" />}
                    </button>
                    <button onClick={() => deleteMutation.mutate(post.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}