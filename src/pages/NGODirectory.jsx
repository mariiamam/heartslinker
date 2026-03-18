import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/layout/Navbar";
import { Search, BadgeCheck, Globe, MapPin, Users, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function NGODirectory() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const { data: ngos = [], isLoading } = useQuery({
    queryKey: ["all-ngos"],
    queryFn: () => base44.entities.NGO.list(),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["all-campaigns"],
    queryFn: () => base44.entities.Campaign.filter({ is_active: true }),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["all-activities"],
    queryFn: () => base44.entities.Activity.list(),
  });

  const filtered = ngos.filter(n =>
    !search ||
    n.name?.toLowerCase().includes(search.toLowerCase()) ||
    n.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background font-inter">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-foreground to-foreground/80 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-3xl md:text-5xl font-bold">NGO Directory</h1>
          <p className="mt-3 text-white/70 text-lg max-w-xl mx-auto">Discover verified humanitarian organizations and connect with their active campaigns.</p>
          <div className="mt-6 flex gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input className="pl-9 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20" placeholder="Search NGOs..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-10 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : !filtered.length ? (
          <div className="text-center py-20 text-muted-foreground">No NGOs found.</div>
        ) : filtered.map(ngo => {
          const ngoCampaigns = campaigns.filter(c => c.ngo_id === ngo.id);
          const ngoActivities = activities.filter(a => a.ngo_id === ngo.id);
          const isExpanded = expandedId === ngo.id;

          return (
            <div key={ngo.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              {/* NGO Row */}
              <div
                className="flex items-center gap-4 p-5 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : ngo.id)}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {ngo.logo_url
                    ? <img src={ngo.logo_url} alt={ngo.name} className="w-full h-full object-cover" />
                    : <span className="text-2xl font-bold text-primary">{ngo.name?.[0]}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-foreground text-lg">{ngo.name}</h2>
                    {ngo.is_verified && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-orange-500 font-medium">
                        <BadgeCheck className="w-3.5 h-3.5" /> Verified NGO
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">{ngo.description}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {ngoActivities.length} activities</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {ngoCampaigns.length} campaigns</span>
                    {ngo.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {ngo.website}</span>}
                  </div>
                </div>
                <div className="text-muted-foreground flex-shrink-0">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {/* Expanded: campaigns */}
              {isExpanded && (
                <div className="border-t border-border px-5 py-5 bg-secondary/20 space-y-4">
                  {ngo.mission && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Mission</p>
                      <p className="text-sm text-foreground/80 leading-relaxed">{ngo.mission}</p>
                    </div>
                  )}
                  {ngoCampaigns.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Active Campaigns</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {ngoCampaigns.map(c => {
                          const isFund = c.type === "fundraising";
                          const pct = isFund && c.goal_amount ? Math.min(100, Math.round(((c.collected_amount || 0) / c.goal_amount) * 100)) : 0;
                          return (
                            <div key={c.id} className="bg-white rounded-xl border border-border p-4 space-y-2">
                              <div className="flex gap-2 items-start">
                                <span>{isFund ? "💰" : "🤝"}</span>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{c.title}</p>
                                  {c.location && <p className="text-xs text-muted-foreground flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{c.location}</p>}
                                </div>
                              </div>
                              {c.description && <p className="text-xs text-foreground/70">{c.description}</p>}
                              {isFund && c.goal_amount && (
                                <div className="space-y-1">
                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                  <p className="text-xs text-muted-foreground">${(c.collected_amount || 0).toLocaleString()} / ${c.goal_amount.toLocaleString()} · {pct}%</p>
                                </div>
                              )}
                              {!isFund && c.volunteers_needed && (
                                <p className="text-xs text-primary font-medium flex items-center gap-1"><Users className="w-3 h-3" />{c.volunteers_needed} volunteers needed</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {ngoCampaigns.length === 0 && ngoActivities.length === 0 && (
                    <p className="text-sm text-muted-foreground">No active campaigns at the moment.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}