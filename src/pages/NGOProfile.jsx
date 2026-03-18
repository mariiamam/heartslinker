import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/layout/Navbar";
import {
  BadgeCheck, MapPin, Globe, Heart, Share2, Users, Clock,
  ImagePlus, Pencil, Check, X, Plus, BarChart2, Megaphone, FileText
} from "lucide-react";
import { Link } from "react-router-dom";

export default function NGOProfile() {
  const [user, setUser] = useState(null);
  const [editingMission, setEditingMission] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [missionVal, setMissionVal] = useState("");
  const [nameVal, setNameVal] = useState("");
  const [websiteVal, setWebsiteVal] = useState("");
  const [locationVal, setLocationVal] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
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

  const updateNGO = useMutation({
    mutationFn: (data) => base44.entities.NGO.update(ngo.id, data),
    onSuccess: () => qc.invalidateQueries(["my-ngo"]),
  });

  const [creatingNGO, setCreatingNGO] = useState(false);
  const [newNGOName, setNewNGOName] = useState("");
  const [newNGOEmail, setNewNGOEmail] = useState("");

  const createNGO = useMutation({
    mutationFn: () => base44.entities.NGO.create({ name: newNGOName, email: newNGOEmail || user?.email }),
    onSuccess: () => {
      qc.invalidateQueries(["my-ngo"]);
      setCreatingNGO(false);
    },
  });

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !ngo) return;
    setUploadingCover(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await updateNGO.mutateAsync({ cover_url: file_url });
    setUploadingCover(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !ngo) return;
    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await updateNGO.mutateAsync({ logo_url: file_url });
    setUploadingLogo(false);
  };

  const approvedHours = hourEntries.filter(h => h.status === "approved").reduce((s, h) => s + (h.hours || 0), 0);
  const uniqueVolunteers = [...new Set(activities.map(a => a.user_email))].length;

  const coverUrl = ngo?.cover_url || "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1400&q=80";
  const logoUrl = ngo?.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${ngo?.name}`;

  if (!user) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  // No NGO yet — prompt to create
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

        {/* Cover */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Change cover */}
          <label className="absolute top-4 right-4 cursor-pointer z-10">
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            <div className="flex items-center gap-1.5 bg-black/40 hover:bg-black/60 text-white text-xs px-3 py-1.5 rounded-xl transition-colors backdrop-blur-sm">
              {uploadingCover ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
              {uploadingCover ? "Uploading..." : "Change Cover"}
            </div>
          </label>

          {/* NGO name on cover */}
          <div className="absolute bottom-5 left-6 md:left-10 flex items-end gap-4">
            {/* Logo */}
            <div className="relative w-20 h-20 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white flex-shrink-0">
              <img src={logoUrl} alt={ngo?.name} className="w-full h-full object-cover" />
              <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                {uploadingLogo ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <ImagePlus className="w-4 h-4 text-white" />}
              </label>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">{ngo?.name}</h1>
                {ngo?.is_verified && <BadgeCheck className="w-5 h-5 text-orange-300" />}
              </div>
              <p className="text-white/70 text-sm mt-0.5">{follows.length} followers · {uniqueVolunteers} volunteers</p>
            </div>
          </div>
        </div>

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

        {/* Stats row */}
        <div className="px-6 md:px-10 mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Volunteers", value: uniqueVolunteers, icon: Users, color: "text-primary" },
            { label: "Volunteer Hours", value: `${approvedHours}h`, icon: Clock, color: "text-amber-500" },
            { label: "Campaigns", value: campaigns.length, icon: Megaphone, color: "text-green-600" },
            { label: "Followers", value: follows.length, icon: Heart, color: "text-rose-500" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
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

            {/* Website / Location */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
              {/* Website */}
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

              {/* Location (use NGO description as location proxy or add a location field) */}
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

        {/* Tabs: Campaigns / Posts / Volunteers */}
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
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function CampaignsList({ campaigns }) {
  if (!campaigns.length) return (
    <div className="bg-white border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm shadow-sm">
      No campaigns yet.
    </div>
  );
  return (
    <div className="space-y-3">
      {campaigns.map(c => (
        <div key={c.id} className="bg-white border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mb-2 inline-block ${c.type === "fundraising" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                {c.type === "fundraising" ? "Fundraising" : "Volunteers"}
              </span>
              <h3 className="font-semibold text-foreground">{c.title}</h3>
              {c.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${c.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
              {c.is_active ? "Active" : "Closed"}
            </span>
          </div>
          {c.type === "fundraising" && c.goal_amount > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>${(c.collected_amount || 0).toLocaleString()} raised</span>
                <span>Goal: ${c.goal_amount.toLocaleString()}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="h-2 rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${Math.min(100, ((c.collected_amount || 0) / c.goal_amount) * 100)}%` }} />
              </div>
            </div>
          )}
          {c.type === "volunteers" && c.volunteers_needed > 0 && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Users className="w-3 h-3" /> {c.volunteers_needed} volunteers needed{c.location ? ` · ${c.location}` : ""}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function PostsList({ posts }) {
  if (!posts.length) return (
    <div className="bg-white border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm shadow-sm">
      No posts yet.
    </div>
  );
  return (
    <div className="space-y-3">
      {posts.map(p => (
        <div key={p.id} className="bg-white border border-border rounded-2xl p-5 shadow-sm">
          {p.title && <h3 className="font-semibold text-foreground mb-1">{p.title}</h3>}
          <p className="text-sm text-foreground/80 leading-relaxed">{p.content}</p>
          {p.image_url && (
            <img src={p.image_url} alt="" className="mt-3 rounded-xl w-full object-cover max-h-64" />
          )}
        </div>
      ))}
    </div>
  );
}

function VolunteersList({ activities }) {
  const volunteers = [...new Map(activities.map(a => [a.user_email, a])).values()];
  if (!volunteers.length) return (
    <div className="bg-white border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm shadow-sm">
      No volunteers yet.
    </div>
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