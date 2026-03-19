import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/layout/Navbar";
import {
  BadgeCheck, MapPin, Globe, Heart, Share2, Users, Clock,
  ImagePlus, Pencil, Check, X, Plus, BarChart2, Megaphone, FileText,
  Star, MessageSquare, ChevronDown, ChevronUp
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function NGOProfile() {
  const [user, setUser] = useState(null);
  const [editingMission, setEditingMission] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [missionVal, setMissionVal] = useState("");
  const [websiteVal, setWebsiteVal] = useState("");
  const [locationVal, setLocationVal] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [creatingNGO, setCreatingNGO] = useState(false);
  const [newNGOName, setNewNGOName] = useState("");
  const [newNGOEmail, setNewNGOEmail] = useState("");
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: ngos = [] } = useQuery({
    queryKey: ["my-ngo", user?.email],
    queryFn: () => base44.entities.NGO.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const ngo = ngos[0] || null;

  const { data: activities = [] } = useQuery({
    queryKey: ["ngo-activities", ngo?.id],
    queryFn: () => base44.entities.Activity.filter({ ngo_id: ngo?.id }),
    enabled: !!ngo?.id,
  });

  const { data: hourEntries = [] } = useQuery({
    queryKey: ["hour-entries", ngo?.id],
    queryFn: async () => {
      if (!activities.length) return [];
      const all = await base44.entities.HourEntry.list("-created_date", 200);
      const ids = activities.map(a => a.id);
      return all.filter(h => ids.includes(h.activity_id));
    },
    enabled: !!activities.length,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns", ngo?.id],
    queryFn: () => base44.entities.Campaign.filter({ ngo_id: ngo?.id }),
    enabled: !!ngo?.id,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["ngo-posts", ngo?.id],
    queryFn: () => base44.entities.NGOPost.filter({ ngo_id: ngo?.id }),
    enabled: !!ngo?.id,
  });

  const { data: follows = [] } = useQuery({
    queryKey: ["ngo-follows", ngo?.id],
    queryFn: () => base44.entities.NGOFollow.filter({ ngo_id: ngo?.id }),
    enabled: !!ngo?.id,
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ["ngo-feedback", ngo?.id],
    queryFn: () => base44.entities.NGOFeedback.filter({ ngo_id: ngo?.id }),
    enabled: !!ngo?.id,
  });

  const updateNGO = useMutation({
    mutationFn: (data) => base44.entities.NGO.update(ngo.id, data),
    onSuccess: () => qc.invalidateQueries(["my-ngo"]),
  });

  const createNGO = useMutation({
    mutationFn: () => base44.entities.NGO.create({ name: newNGOName, email: newNGOEmail || user?.email }),
    onSuccess: () => { qc.invalidateQueries(["my-ngo"]); setCreatingNGO(false); },
  });

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !ngo) return;
    setUploadingCover(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await updateNGO.mutateAsync({ cover_url: file_url });
    setUploadingCover(false);
  };

  const approvedHours = hourEntries.filter(h => h.status === "approved").reduce((s, h) => s + (h.hours || 0), 0);
  const uniqueVolunteers = [...new Set(activities.map(a => a.user_email))].length;
  const avgRating = feedbacks.length ? (feedbacks.reduce((s, f) => s + (f.rating || 0), 0) / feedbacks.length) : null;

  const coverUrl = ngo?.cover_url || "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1400&q=80";

  if (!user) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!ngo && !creatingNGO) return (
    <div className="min-h-screen bg-background font-inter">
      <Navbar />
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Megaphone className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Set Up Your NGO Profile</h1>
        <p className="text-muted-foreground text-sm mb-8">You don't have an NGO profile yet. Create one to start recruiting volunteers and running campaigns.</p>
        <Button className="bg-primary hover:bg-primary/90 rounded-2xl px-6" onClick={() => setCreatingNGO(true)}>
          <Plus className="w-4 h-4 mr-1" /> Create NGO Profile
        </Button>
      </div>
    </div>
  );

  if (creatingNGO) return (
    <div className="min-h-screen bg-background font-inter">
      <Navbar />
      <div className="max-w-md mx-auto px-5 py-24">
        <h1 className="text-2xl font-bold text-foreground mb-6">Create NGO Profile</h1>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">NGO Name *</label>
            <Input placeholder="e.g. Save the Children" value={newNGOName} onChange={e => setNewNGOName(e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Contact Email</label>
            <Input placeholder={user?.email} value={newNGOEmail} onChange={e => setNewNGOEmail(e.target.value)} className="rounded-xl" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="bg-primary hover:bg-primary/90 rounded-xl flex-1" disabled={!newNGOName || createNGO.isPending} onClick={() => createNGO.mutate()}>
              {createNGO.isPending ? "Creating..." : "Create Profile"}
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => setCreatingNGO(false)}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background font-inter">
      <Navbar />

      <div className="max-w-4xl mx-auto pb-16">

        {/* Cover — no logo overlay */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          <label className="absolute top-4 right-4 cursor-pointer z-10">
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            <div className="flex items-center gap-1.5 bg-black/40 hover:bg-black/60 text-white text-xs px-3 py-1.5 rounded-xl transition-colors backdrop-blur-sm">
              {uploadingCover ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
              {uploadingCover ? "Uploading..." : "Change Cover"}
            </div>
          </label>

          {/* NGO name — no small logo, no volunteer count */}
          <div className="absolute bottom-5 left-6 md:left-10">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">{ngo?.name}</h1>
              {ngo?.is_verified && <BadgeCheck className="w-5 h-5 text-orange-300" />}
            </div>
            {/* Clickable followers count */}
            <button
              onClick={() => setShowFollowers(v => !v)}
              className="flex items-center gap-1 text-white/70 text-sm mt-1 hover:text-white transition-colors"
            >
              <Heart className="w-3.5 h-3.5" />
              {follows.length} followers
              {showFollowers ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Followers dropdown */}
        {showFollowers && (
          <div className="px-6 md:px-10 mt-2">
            <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">{follows.length} Followers</p>
              </div>
              {follows.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No followers yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {follows.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                        {f.user_email?.[0]?.toUpperCase()}
                      </div>
                      <p className="text-sm text-foreground">{f.user_email}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="px-6 md:px-10 mt-4 flex items-center gap-3">
          <Link to="/NGODashboard">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 border-border">
              <BarChart2 className="w-4 h-4" /> Manage Dashboard
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 border-border">
            <Share2 className="w-4 h-4" /> Share
          </Button>
        </div>

        {/* Stats row — Followers box replaced with Rating */}
        <div className="px-6 md:px-10 mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox icon={Users} color="text-primary" value={uniqueVolunteers} label="Volunteers" />
          <StatBox icon={Clock} color="text-amber-500" value={`${approvedHours}h`} label="Volunteer Hours" />
          <StatBox icon={Megaphone} color="text-green-600" value={campaigns.filter(c => c.is_active).length} label="Active Campaigns" />
          {/* Rating box */}
          <div className="bg-white border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-none">
                {avgRating ? avgRating.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Rating ({feedbacks.length})</p>
            </div>
          </div>
        </div>

        {/* Mission */}
        <div className="px-6 md:px-10 mt-5">
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Our Mission</h2>
                {editingMission ? (
                  <div className="space-y-2">
                    <textarea
                      rows={4}
                      className="w-full text-sm text-foreground border border-input rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      value={missionVal}
                      onChange={e => setMissionVal(e.target.value)}
                      placeholder="Tell the world about your NGO's mission..."
                    />
                    <div className="flex gap-2">
                      <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90 gap-1 text-xs"
                        onClick={() => { updateNGO.mutate({ mission: missionVal }); setEditingMission(false); }}>
                        <Check className="w-3 h-3" /> Save
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl gap-1 text-xs"
                        onClick={() => { setEditingMission(false); setMissionVal(ngo?.mission || ""); }}>
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
                <Button size="icon" variant="ghost" className="rounded-xl text-muted-foreground hover:text-foreground flex-shrink-0"
                  onClick={() => { setMissionVal(ngo?.mission || ""); setEditingMission(true); }}>
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-muted-foreground" />
                {editingWebsite ? (
                  <div className="flex items-center gap-1">
                    <Input className="h-7 text-xs rounded-lg w-44" value={websiteVal} onChange={e => setWebsiteVal(e.target.value)} placeholder="https://..." />
                    <button onClick={() => { updateNGO.mutate({ website: websiteVal }); setEditingWebsite(false); }}><Check className="w-4 h-4 text-primary" /></button>
                    <button onClick={() => setEditingWebsite(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground cursor-pointer hover:text-primary flex items-center gap-1"
                    onClick={() => { setWebsiteVal(ngo?.website || ""); setEditingWebsite(true); }}>
                    {ngo?.website ? <a href={ngo.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{ngo.website}</a> : <span className="italic text-xs">Add website</span>}
                    <Pencil className="w-3 h-3" />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                {editingLocation ? (
                  <div className="flex items-center gap-1">
                    <Input className="h-7 text-xs rounded-lg w-36" value={locationVal} onChange={e => setLocationVal(e.target.value)} placeholder="City, Country" />
                    <button onClick={() => { updateNGO.mutate({ description: locationVal }); setEditingLocation(false); }}><Check className="w-4 h-4 text-primary" /></button>
                    <button onClick={() => setEditingLocation(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground cursor-pointer hover:text-primary flex items-center gap-1"
                    onClick={() => { setLocationVal(ngo?.description || ""); setEditingLocation(true); }}>
                    {ngo?.description || <span className="italic text-xs">Add location</span>}
                    <Pencil className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 md:px-10 mt-8">
          <Tabs defaultValue="campaigns">
            <TabsList className="bg-secondary rounded-xl p-1 gap-1">
              <TabsTrigger value="campaigns" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Megaphone className="w-3.5 h-3.5 mr-1.5" /> Campaigns
              </TabsTrigger>
              <TabsTrigger value="posts" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Posts
              </TabsTrigger>
              <TabsTrigger value="volunteers" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Users className="w-3.5 h-3.5 mr-1.5" /> Volunteers
              </TabsTrigger>
              <TabsTrigger value="feedback" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Feedback
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="campaigns">
                <CampaignsList campaigns={campaigns} />
              </TabsContent>
              <TabsContent value="posts">
                <PostsList posts={posts} />
              </TabsContent>
              <TabsContent value="volunteers">
                <VolunteersList activities={activities} />
              </TabsContent>
              <TabsContent value="feedback">
                <FeedbackSection feedbacks={feedbacks} ngoId={ngo?.id} userEmail={user?.email} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, color, value, label }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className="text-lg font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function CampaignsList({ campaigns }) {
  const [expanded, setExpanded] = useState(null);

  if (!campaigns.length) return (
    <div className="bg-white border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm shadow-sm">No campaigns yet.</div>
  );
  
  return (
    <div className="space-y-3">
      {campaigns.map(c => {
        const isFund = c.type === "fundraising";
        const isOpen = expanded === c.id;
        return (
          <div key={c.id} 
            onClick={() => setExpanded(isOpen ? null : c.id)}
            className="bg-white rounded-2xl border border-border shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all overflow-hidden">
            {/* Orange top line */}
            <div className="h-1.5 bg-gradient-to-r from-primary to-accent w-full" />
            
            <div className="p-5 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" 
                      style={{backgroundColor: isFund ? "#fed7aa" : "#bbf7d0", color: isFund ? "#a16207" : "#15803d"}}>
                      {isFund ? "💰 Fundraising" : "🤝 Volunteers"}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.is_active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                      {c.is_active ? "Ongoing" : "Completed"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground">{c.title}</h3>
                  {c.location && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {c.location}
                    </p>
                  )}
                </div>
                <div className="text-muted-foreground flex-shrink-0">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Quick preview */}
              {c.description && (
                <p className="text-sm text-foreground/70 leading-relaxed">{c.description.slice(0, 80)}{c.description.length > 80 ? "…" : ""}</p>
              )}

              {/* Quick stats */}
              {isFund && c.goal_amount > 0 ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <div className="flex-1 bg-muted rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${Math.min(100, ((c.collected_amount || 0) / c.goal_amount) * 100)}%` }} />
                  </div>
                  <span className="whitespace-nowrap font-medium">${(c.collected_amount || 0).toLocaleString()} / ${c.goal_amount.toLocaleString()}</span>
                </div>
              ) : !isFund && c.volunteers_needed ? (
                <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                  <Users className="w-3 h-3" /> {c.volunteers_enrolled || 0} / {c.volunteers_needed} volunteers
                </div>
              ) : null}
            </div>

            {/* Expanded details */}
            {isOpen && (
              <div className="border-t border-border bg-secondary/20 px-5 py-4 space-y-3 text-sm">
                {c.description && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Description</p>
                    <p className="text-foreground/80">{c.description}</p>
                  </div>
                )}

                {c.category && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Category</p>
                    <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-1 rounded-full">{c.category}</span>
                  </div>
                )}

                {c.start_date || c.end_date ? (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Timeline</p>
                    <p className="text-foreground/80 text-xs">{c.start_date ? `From ${c.start_date}` : ""}{c.end_date ? ` to ${c.end_date}` : ""}</p>
                  </div>
                ) : null}

                {isFund && c.goal_amount > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Fundraising Progress</p>
                    <p className="text-foreground/80 text-xs">${(c.collected_amount || 0).toLocaleString()} raised of ${c.goal_amount.toLocaleString()} goal</p>
                  </div>
                ) : !isFund && c.volunteers_needed ? (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Volunteer Spots</p>
                    <p className="text-foreground/80 text-xs">{c.volunteers_enrolled || 0} / {c.volunteers_needed} volunteers{c.min_age || c.max_age ? ` • Ages ${c.min_age || "any"} – ${c.max_age || "any"}` : ""}</p>
                  </div>
                ) : null}

                {c.requirements && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Requirements</p>
                    <p className="text-foreground/80 text-xs">{c.requirements}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PostsList({ posts }) {
  if (!posts.length) return (
    <div className="bg-white border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm shadow-sm">No posts yet.</div>
  );
  return (
    <div className="space-y-3">
      {posts.map(p => (
        <div key={p.id} className="bg-white border border-border rounded-2xl p-5 shadow-sm">
          {p.title && <h3 className="font-semibold text-foreground mb-1">{p.title}</h3>}
          <p className="text-sm text-foreground/80 leading-relaxed">{p.content}</p>
          {p.image_url && <img src={p.image_url} alt="" className="mt-3 rounded-xl w-full object-cover max-h-64" />}
        </div>
      ))}
    </div>
  );
}

function VolunteersList({ activities }) {
  const volunteers = [...new Map(activities.map(a => [a.user_email, a])).values()];
  if (!volunteers.length) return (
    <div className="bg-white border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm shadow-sm">No volunteers yet.</div>
  );
  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
      {volunteers.map((v, i) => (
        <div key={v.user_email} className={`flex items-center gap-3 px-5 py-3.5 ${i !== 0 ? "border-t border-border" : ""}`}>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
            {v.user_email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{v.user_email}</p>
            <p className="text-xs text-muted-foreground">{activities.filter(a => a.user_email === v.user_email).length} activities</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="focus:outline-none"
        >
          <Star className={`w-5 h-5 transition-colors ${s <= (hover || value) ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

function FeedbackSection({ feedbacks, ngoId, userEmail }) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const myFeedback = feedbacks.find(f => f.user_email === userEmail);

  const submit = useMutation({
    mutationFn: () => {
      if (myFeedback) {
        return base44.entities.NGOFeedback.update(myFeedback.id, { rating, comment });
      }
      return base44.entities.NGOFeedback.create({ ngo_id: ngoId, user_email: userEmail, rating, comment });
    },
    onSuccess: () => {
      qc.invalidateQueries(["ngo-feedback"]);
      setRating(0);
      setComment("");
    },
  });

  const avgRating = feedbacks.length ? (feedbacks.reduce((s, f) => s + (f.rating || 0), 0) / feedbacks.length) : null;

  return (
    <div className="space-y-4">
      {/* Summary */}
      {feedbacks.length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">{avgRating?.toFixed(1)}</p>
            <div className="flex gap-0.5 mt-1 justify-center">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{feedbacks.length} review{feedbacks.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      )}

      {/* Leave feedback form */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
        <h4 className="font-semibold text-foreground mb-3">{myFeedback ? "Update your feedback" : "Leave Feedback"}</h4>
        <StarRating value={myFeedback ? myFeedback.rating : rating} onChange={setRating} />
        <textarea
          rows={3}
          className="mt-3 w-full text-sm border border-input rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Share your experience with this NGO..."
          value={comment || (myFeedback ? myFeedback.comment : "")}
          onChange={e => setComment(e.target.value)}
        />
        <Button size="sm" className="mt-2 rounded-xl bg-primary hover:bg-primary/90 text-xs"
          disabled={(rating === 0 && !myFeedback) || submit.isPending}
          onClick={() => submit.mutate()}>
          {submit.isPending ? "Saving..." : myFeedback ? "Update" : "Submit Feedback"}
        </Button>
      </div>

      {/* Feedback list */}
      {feedbacks.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm shadow-sm">
          No feedback yet. Be the first to leave a review!
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map(f => (
            <div key={f.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                    {f.user_email?.[0]?.toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-foreground">{f.user_email}</p>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= f.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />
                  ))}
                </div>
              </div>
              {f.comment && <p className="text-sm text-foreground/80">{f.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}