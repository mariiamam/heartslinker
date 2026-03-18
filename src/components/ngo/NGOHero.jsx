import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ImagePlus, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NGOHero({ ngo }) {
  const [editingMission, setEditingMission] = useState(false);
  const [mission, setMission] = useState(ngo?.mission || "");
  const [uploadingCover, setUploadingCover] = useState(false);
  const qc = useQueryClient();

  const updateNGO = useMutation({
    mutationFn: (data) => base44.entities.NGO.update(ngo.id, data),
    onSuccess: () => qc.invalidateQueries(["my-ngo"]),
  });

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingCover(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await updateNGO.mutateAsync({ cover_url: file_url });
    setUploadingCover(false);
  };

  const saveMission = () => {
    updateNGO.mutate({ mission });
    setEditingMission(false);
  };

  const coverUrl = ngo?.cover_url || "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1400&q=80";

  return (
    <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
      {/* Cover Image */}
      <div className="relative h-56 md:h-72 w-full group">
        <img src={coverUrl} alt="NGO Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Upload cover button */}
        <label className="absolute top-4 right-4 cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          <div className="flex items-center gap-1.5 bg-black/40 hover:bg-black/60 text-white text-xs px-3 py-1.5 rounded-xl transition-colors backdrop-blur-sm">
            {uploadingCover ? (
              <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <ImagePlus className="w-3.5 h-3.5" />
            )}
            {uploadingCover ? "Uploading..." : "Change Cover"}
          </div>
        </label>

        {/* NGO Name over cover */}
        <div className="absolute bottom-5 left-6 md:left-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{ngo?.name}</h1>
          {ngo?.is_verified && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-orange-300">
              <BadgeCheck className="w-3.5 h-3.5" /> Verified NGO
            </span>
          )}
        </div>
      </div>

      {/* Mission / Introduction */}
      <div className="px-6 md:px-10 py-6 border-t border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Our Mission & Motives</h2>
            {editingMission ? (
              <div className="space-y-2">
                <textarea
                  className="w-full text-sm text-foreground leading-relaxed border border-input rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={4}
                  value={mission}
                  onChange={e => setMission(e.target.value)}
                  placeholder="Tell the world about your NGO's mission, values, and what drives you..."
                />
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90 gap-1 text-xs" onClick={saveMission}>
                    <Check className="w-3 h-3" /> Save
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl gap-1 text-xs" onClick={() => { setEditingMission(false); setMission(ngo?.mission || ""); }}>
                    <X className="w-3 h-3" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground/80 leading-relaxed">
                {ngo?.mission || <span className="text-muted-foreground italic">No mission statement yet. Click edit to add one.</span>}
              </p>
            )}
          </div>
          {!editingMission && (
            <Button size="sm" variant="ghost" className="rounded-xl text-muted-foreground hover:text-foreground flex-shrink-0" onClick={() => setEditingMission(true)}>
              <Pencil className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}