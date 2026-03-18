import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/layout/Navbar";
import { Search, MapPin, Users, DollarSign, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

const CATEGORIES = ["All", "Food", "Education", "Shelter", "Health", "Environment", "Refugees", "Children"];

export default function Campaigns() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["all-campaigns"],
    queryFn: () => base44.entities.Campaign.filter({ is_active: true }),
  });

  const { data: ngos = [] } = useQuery({
    queryKey: ["all-ngos"],
    queryFn: () => base44.entities.NGO.list(),
  });

  const ngoMap = Object.fromEntries(ngos.map(n => [n.id, n]));

  const filtered = campaigns.filter(c => {
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || c.description?.toLowerCase().includes(category.toLowerCase()) || c.title?.toLowerCase().includes(category.toLowerCase()) || c.location?.toLowerCase().includes(category.toLowerCase());
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-background font-inter">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-rose-50 border-b border-border py-14 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground">Donation Campaigns</h1>
          <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">Support verified campaigns with transparent progress tracking. Every dollar counts.</p>
          <div className="mt-6 flex gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9 rounded-xl" placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-10">
        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`text-sm px-4 py-1.5 rounded-full font-medium border transition-colors ${category === cat ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"}`}>
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : !filtered.length ? (
          <div className="text-center py-20 text-muted-foreground">No campaigns found. Try a different filter.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(c => {
              const ngo = ngoMap[c.ngo_id];
              const isFund = c.type === "fundraising";
              const progress = isFund && c.goal_amount ? Math.min(100, Math.round(((c.collected_amount || 0) / c.goal_amount) * 100)) : 0;
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                  <div className="h-3 bg-gradient-to-r from-primary to-accent" />
                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{isFund ? "💰" : "🤝"}</span>
                      <div>
                        <h3 className="font-bold text-foreground leading-snug">{c.title}</h3>
                        {ngo && <p className="text-xs text-primary font-medium mt-0.5">{ngo.name}</p>}
                      </div>
                    </div>
                    {c.location && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" /> {c.location}
                      </span>
                    )}
                    {c.description && <p className="text-sm text-foreground/70 leading-relaxed flex-1">{c.description}</p>}

                    {isFund && c.goal_amount ? (
                      <div className="space-y-1.5 mt-auto">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-primary">${(c.collected_amount || 0).toLocaleString()} raised</span>
                          <span className="text-muted-foreground">of ${c.goal_amount.toLocaleString()}</span>
                        </div>
                        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground">{progress}% of goal</p>
                        <button className="w-full mt-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
                          Donate Now
                        </button>
                      </div>
                    ) : c.volunteers_needed ? (
                      <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-primary font-medium">
                          <Users className="w-3.5 h-3.5" /> {c.volunteers_needed} volunteers needed
                        </span>
                        <button className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-4 py-1.5 rounded-xl transition-colors">
                          Join
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}