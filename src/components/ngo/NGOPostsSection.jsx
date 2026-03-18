import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, ImagePlus } from "lucide-react";
import { format } from "date-fns";

export default function NGOPostsSection({ posts, ngoId, ngoName }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  const createPost = useMutation({
    mutationFn: (data) => base44.entities.NGOPost.create(data),
    onSuccess: () => { qc.invalidateQueries(["ngo-posts"]); setShowForm(false); setForm({ title: "", content: "" }); setImageFile(null); },
  });

  const handleSubmit = async () => {
    if (!form.content) return;
    setUploading(true);
    let image_url = undefined;
    if (imageFile) {
      const res = await base44.integrations.Core.UploadFile({ file: imageFile });
      image_url = res.file_url;
    }
    await createPost.mutateAsync({ ...form, ngo_id: ngoId, image_url });
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Posts & Updates</h2>
        <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90 gap-1.5 text-xs" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3.5 h-3.5" /> New Post
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-3">
          <input
            className="w-full text-sm font-semibold text-foreground border-0 outline-none placeholder:text-muted-foreground"
            placeholder="Post title (optional)"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="w-full text-sm text-foreground border border-input rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            rows={4}
            placeholder="Share an update, story, or announcement..."
            value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
          />
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files[0])} />
              <ImagePlus className="w-4 h-4" />
              {imageFile ? imageFile.name : "Add image"}
            </label>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { setShowForm(false); setImageFile(null); }}>Cancel</Button>
              <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90" onClick={handleSubmit} disabled={uploading || createPost.isPending}>
                {uploading ? "Uploading..." : "Publish"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!posts?.length ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center text-muted-foreground text-sm">
          No posts yet. Share your first update!
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
              {post.image_url && (
                <img src={post.image_url} alt={post.title} className="w-full h-52 object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-primary">{ngoName}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {post.created_date ? format(new Date(post.created_date), "MMM d, yyyy") : ""}
                  </span>
                </div>
                {post.title && <h3 className="font-semibold text-foreground mb-1">{post.title}</h3>}
                <p className="text-sm text-foreground/80 leading-relaxed">{post.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}