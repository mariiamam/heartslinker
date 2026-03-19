import { Button } from "@/components/ui/button";
import { MapPin, Globe, BadgeCheck, Heart, Share2, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const CAUSE_COLORS = {
  "orphans": "bg-orange-100 text-orange-700",
  "education": "bg-amber-100 text-amber-700",
  "refugees": "bg-rose-100 text-rose-700",
  "environment": "bg-green-100 text-green-700",
  "animals": "bg-teal-100 text-teal-700",
  "health": "bg-red-100 text-red-700",
  "women": "bg-pink-100 text-pink-700",
  "food": "bg-yellow-100 text-yellow-700",
};

export default function ProfileHeader({ profile, user, activities = [], hourEntries = [] }) {
  const coverUrl = profile?.cover_url || "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1200&q=80";
  const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.email}`;

  const totalHours = hourEntries.filter(h => h.status === "approved").reduce((s, h) => s + (h.hours || 0), 0);
  const uniqueNGOs = new Set(activities.map(a => a.ngo_id).filter(Boolean)).size;
  const activityCount = activities.length;

  return (
    <div className="relative">
      {/* Cover */}
      <div className="h-52 md:h-64 w-full overflow-hidden rounded-b-3xl">
        <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 h-52 md:h-64 bg-gradient-to-t from-black/40 to-transparent rounded-b-3xl" />
      </div>

      {/* Avatar + Info row */}
      <div className="px-6 md:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 relative z-10">
          {/* Avatar */}
          <div className="relative w-28 h-28 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-secondary flex-shrink-0">
            <img src={avatarUrl} alt={user?.full_name} className="w-full h-full object-cover" />
            {profile?.is_verified && (
              <div className="absolute bottom-1 right-1 bg-primary rounded-full p-0.5">
                <BadgeCheck className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Name & meta */}
          <div className="flex-1 pb-1">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-foreground font-inter">
                {user?.full_name || "Anonymous Hero"}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-primary to-accent px-2.5 py-0.5 rounded-full shadow-sm">
                  <Zap className="w-3 h-3" /> Change Maker
                </span>
                {profile?.is_verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit">
                    <BadgeCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
              {profile?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {profile.location}
                </span>
              )}
              {profile?.languages?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> {profile.languages.join(", ")}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pb-1">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-border">
              <Share2 className="w-4 h-4" /> Share
            </Button>
            <Button size="sm" className="gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
              <Heart className="w-4 h-4" /> Follow
            </Button>
          </div>
        </div>



        {/* Tagline under avatar */}
        {profile?.tagline && (
          <p className="mt-2 text-sm text-muted-foreground italic">{profile.tagline.slice(0, 50)}</p>
        )}

        {/* Causes */}
        {profile?.causes?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {profile.causes.map((c) => (
              <span key={c} className={`text-xs font-medium px-3 py-1 rounded-full ${CAUSE_COLORS[c.toLowerCase()] || "bg-secondary text-secondary-foreground"}`}>
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}