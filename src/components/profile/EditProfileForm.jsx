import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";

export default function EditProfileForm({ profile, user }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    tagline: profile?.tagline || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    languages: profile?.languages?.join(", ") || "",
    causes: profile?.causes?.join(", ") || "",
    skills: profile?.skills?.join(", ") || "",
    avatar_url: profile?.avatar_url || "",
    cover_url: profile?.cover_url || "",
    show_donations: profile?.show_donations || false,
  });
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (profile?.id) {
        return base44.entities.ImpactProfile.update(profile.id, data);
      } else {
        return base44.entities.ImpactProfile.create(data);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries(["impact-profile"]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const handleSave = () => {
    mutation.mutate({
      ...form,
      languages: form.languages ? form.languages.split(",").map(s => s.trim()).filter(Boolean) : [],
      causes: form.causes ? form.causes.split(",").map(s => s.trim()).filter(Boolean) : [],
      skills: form.skills ? form.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
    });
  };

  const field = (label, key, type = "text", placeholder = "") => (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
      <Input
        type={type}
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="rounded-xl"
      />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-5">
      <h3 className="font-bold text-foreground">Edit My Profile</h3>

      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">My Story / Bio</label>
        <textarea
          className="w-full border border-border rounded-xl p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          rows={4}
          value={form.bio}
          onChange={e => setForm({ ...form, bio: e.target.value })}
          placeholder="Tell the world who you are and why you care..."
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {field("Location", "location", "text", "City or region")}
        {field("Languages (comma-separated)", "languages", "text", "e.g. English, Arabic")}
        {field("Causes (comma-separated)", "causes", "text", "e.g. education, health")}
        {field("Skills (comma-separated)", "skills", "text", "e.g. teaching, coding")}
        {field("Avatar URL", "avatar_url", "url", "https://...")}
        {field("Cover Image URL", "cover_url", "url", "https://...")}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="show_donations"
          checked={form.show_donations}
          onChange={e => setForm({ ...form, show_donations: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="show_donations" className="text-sm text-foreground">Show total donations publicly</label>
      </div>

      <div className="flex items-center gap-3 justify-end">
        {saved && <span className="text-sm text-green-600 font-medium flex items-center gap-1"><Check className="w-4 h-4" /> Saved!</span>}
        <Button onClick={handleSave} disabled={mutation.isPending} className="rounded-xl bg-primary hover:bg-primary/90 gap-2">
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}