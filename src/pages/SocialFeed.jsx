import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import { Image, Globe, Users, Megaphone, Heart, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

const TYPE_FILTERS = [
  { label: "All", value: "all", icon: Globe },
  { label: "People", value: "user", icon: Users },
  { label: "NGOs", value: "ngo", icon: Megaphone },
];

export default function SocialFeed() {
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: userPosts = [] } = useQuery({
    queryKey: ["all-profile-posts"],
    queryFn: () => base44.entities.ProfilePost.filter({ is_visible: true }),
  });

  const { data: ngoPosts = [] } = useQuery({
    queryKey: ["all-ngo-posts"],
    queryFn: () => base44.entities.NGOPost.list("-created_date", 50),
  });

  const { data: ngos = [] } = useQuery({
    queryKey: ["all-ngos"],
    queryFn: () => base44.entities.NGO.list(),
  });

  const ngoMap = Object.fromEntries(ngos.map(n => [n.id, n]));

  // Combine + normalize feed items
  const feedItems = [
    ...userPosts.map(p => ({
      id: p.id,
      type: "user",
      author: p.user_email?.split("@")[0] || "Anonymous",
      authorSub: p.user_email,
      avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${p.user_email}`,
      content: p.content,
      image_url: p.image_url,
      date: p.created_date,
    })),
    ...ngoPosts.map(p => {
      const ngo = ngoMap[p.ngo_id];
      return {
        id: p.id,
        type: "ngo",
        author: ngo?.name || "NGO",
        authorSub: p.title || "",
        avatar: ngo?.logo_url || null,
        content: p.content,
        image_url: p.image_url,
        date: p.created_date,
        ngoVerified: ngo?.is_verified,
      };
    }),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = feedItems.filter(item => {
    const matchType = filter === "all" || item.type === filter;
    const matchSearch = !search || item.content?.toLowerCase().includes(search.toLowerCase()) || item.author?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background font-inter">
      <Navbar />

      <div className="max-w-2xl mx-auto px-5 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Community Feed</h1>
          <p className="text-sm text-muted-foreground mt-1">See what people & organizations are doing</p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 rounded-xl" placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Type filter tabs */}
        <div className="flex gap-2 mb-6">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full border font-medium transition-colors ${
                filter === f.value ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              <f.icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground self-center">{filtered.length} posts</span>
        </div>

        {/* Feed */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No posts yet. Be the first to share!</div>
        ) : (
          <div className="space-y-4">
            {filtered.map(item => (
              <FeedCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedCard({ item }) {
  const isNGO = item.type === "ngo";
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Author */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
          {item.avatar ? (
            <img src={item.avatar} alt={item.author} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">
              {isNGO ? <Megaphone className="w-5 h-5 text-primary" /> : <Users className="w-5 h-5 text-primary" />}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm text-foreground truncate">{item.author}</p>
            {isNGO && item.ngoVerified && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">✓ Verified</span>
            )}
            {isNGO && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">NGO</span>
            )}
          </div>
          {item.authorSub && <p className="text-xs text-muted-foreground truncate">{item.authorSub}</p>}
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {item.date ? format(new Date(item.date), "MMM d") : ""}
        </span>
      </div>

      {/* Content */}
      <div className="px-5 pb-3">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{item.content}</p>
      </div>

      {/* Image */}
      {item.image_url && (
        <img src={item.image_url} alt="" className="w-full max-h-72 object-cover" />
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 px-5 py-3 border-t border-border/60 text-xs text-muted-foreground">
        <button className="flex items-center gap-1 hover:text-rose-500 transition-colors">
          <Heart className="w-3.5 h-3.5" /> Like
        </button>
      </div>
    </div>
  );
}