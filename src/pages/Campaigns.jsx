import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/layout/Navbar";
import { Search, MapPin, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import CampaignDetailModal from "@/components/ngo/CampaignDetailModal";

const CATEGORIES = ["All", "Food", "Education", "Shelter", "Health", "Environment", "Refugees", "Children"];

export default function Campaigns() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedCampaign, setSelectedCampaign] = useState(null);

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
    const matchCat = category === "All" || c.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-background font-inter">
      <Navbar />

      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-rose-50 border-b border-border py-14 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground">Campaigns</h1>
          <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">Discover volunteer and fundraising campaigns from verified NGOs.</p>
          <div className="mt-6 flex gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9 rounded-xl" placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-10">
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
              const shortDesc = c.description
                ? c.description.length > 50 ? c.description.slice(0, 50) + "…" : c.description
                : null;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCampaign({ campaign: c, ngoName: ngo?.name })}
                  className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all overflow-hidden flex flex-col cursor-pointer"
                >
                  <div className="h-3 bg-gradient-to-r from-primary to-accent" />
                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <div>
                      <h3 className="font-bold text-foreground leading-snug text-sm">{c.title}</h3>
                      {ngo && <p className="text-xs text-primary font-medium mt-0.5">{ngo.name}</p>}
                    </div>
                    {c.location && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" /> {c.location}
                      </span>
                    )}
                    {shortDesc && <p className="text-xs text-foreground/70 leading-relaxed flex-1">{shortDesc}</p>}
                    <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                      {isFund ? (
                        <span className="text-xs text-primary font-medium">💰 Fundraising</span>
                      ) : c.volunteers_needed ? (
                        <span className="flex items-center gap-1 text-xs text-primary font-medium">
                          <Users className="w-3.5 h-3.5" /> {c.volunteers_needed} volunteers needed
                        </span>
                      ) : (
                        <span />
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedCampaign({ campaign: c, ngoName: ngo?.name }); }}
                        className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-4 py-1.5 rounded-xl transition-colors"
                      >
                        {isFund ? "Donate" : "Join"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedCampaign && (
        <CampaignDetailModal
          campaign={selectedCampaign.campaign}
          ngoName={selectedCampaign.ngoName}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
}