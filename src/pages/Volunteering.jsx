import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/layout/Navbar";
import { Search, MapPin, Clock, Filter, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";

const CAUSES = ["All", "Education", "Food", "Health", "Environment", "Refugees", "Children", "Shelter"];
const LOCATIONS = ["All Locations", "Africa", "Asia", "Middle East", "Europe", "Latin America", "Remote"];
const TYPES = ["All", "volunteer", "donation"];
const HOURS = ["Any", "< 10h", "10–50h", "> 50h"];

export default function Volunteering() {
  const [search, setSearch] = useState("");
  const [cause, setCause] = useState("All");
  const [location, setLocation] = useState("All Locations");
  const [type, setType] = useState("All");
  const [hours, setHours] = useState("Any");

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["all-activities"],
    queryFn: () => base44.entities.Activity.filter({ status: "in_process" }),
  });

  const { data: ngos = [] } = useQuery({
    queryKey: ["all-ngos"],
    queryFn: () => base44.entities.NGO.list(),
  });

  const ngoMap = Object.fromEntries(ngos.map(n => [n.id, n]));

  const filtered = activities.filter(a => {
    const matchSearch = !search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase());
    const matchCause = cause === "All" || a.cause?.toLowerCase().includes(cause.toLowerCase());
    const matchLoc = location === "All Locations" || a.description?.toLowerCase().includes(location.toLowerCase()) || ngoMap[a.ngo_id]?.description?.toLowerCase().includes(location.toLowerCase());
    const matchType = type === "All" || a.type === type;
    const matchHours = hours === "Any" || (
      hours === "< 10h" ? (a.target_hours || 0) < 10 :
      hours === "10–50h" ? (a.target_hours || 0) >= 10 && (a.target_hours || 0) <= 50 :
      hours === "> 50h" ? (a.target_hours || 0) > 50 : true
    );
    return matchSearch && matchCause && matchLoc && matchType && matchHours;
  });

  return (
    <div className="min-h-screen bg-background font-inter">
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden py-16 px-6">
        <div className="absolute inset-0 -z-10">
          <img src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1400&q=80" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-accent/60" />
        </div>
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-3xl md:text-5xl font-bold">Find Your Volunteering Mission</h1>
          <p className="mt-3 text-white/80 text-lg max-w-xl mx-auto">Browse opportunities worldwide. Filter by cause, location, or skills and make your mark.</p>
          <div className="mt-6 flex gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9 rounded-xl bg-white text-foreground" placeholder="Search opportunities..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-10">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Cause</p>
            <div className="flex flex-wrap gap-1.5">
              {CAUSES.map(c => (
                <button key={c} onClick={() => setCause(c)}
                  className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${cause === c ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Location</p>
            <div className="flex flex-wrap gap-1.5">
              {LOCATIONS.map(l => (
                <button key={l} onClick={() => setLocation(l)}
                  className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${location === l ? "bg-accent text-foreground border-accent" : "bg-white text-muted-foreground border-border hover:border-accent"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : !filtered.length ? (
          <div className="text-center py-20 text-muted-foreground">No opportunities found. Try adjusting your filters.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(a => {
              const ngo = ngoMap[a.ngo_id];
              return (
                <div key={a.id} className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden group">
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      {a.cause && (
                        <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full capitalize">{a.cause}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground leading-snug group-hover:text-primary transition-colors">{a.title}</h3>
                      {ngo && <p className="text-xs text-primary font-medium mt-0.5">{ngo.name}</p>}
                    </div>
                    {a.description && <p className="text-sm text-foreground/70 leading-relaxed">{a.description}</p>}

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                      {a.target_hours && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.target_hours}h target</span>
                      )}
                      {a.start_date && (
                        <span className="flex items-center gap-1"><Filter className="w-3 h-3" /> Started {a.start_date}</span>
                      )}
                    </div>

                    <button className="w-full mt-1 border border-primary text-primary hover:bg-primary hover:text-white text-sm font-semibold py-2 rounded-xl transition-colors">
                      Apply to Volunteer
                    </button>
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