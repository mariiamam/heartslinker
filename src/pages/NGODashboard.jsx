import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VolunteersList from "@/components/ngo/VolunteersList";
import ActivitiesPanel from "@/components/ngo/ActivitiesPanel";
import HoursApproval from "@/components/ngo/HoursApproval";
import NGOStatsBar from "@/components/ngo/NGOStatsBar";
import NGOHero from "@/components/ngo/NGOHero";
import CampaignsSection from "@/components/ngo/CampaignsSection";
import NGOPostsSection from "@/components/ngo/NGOPostsSection";
import NGOSideMenu from "@/components/ngo/NGOSideMenu";

export default function NGODashboard() {
  const [user, setUser] = useState(null);

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
      const activityIds = activities.map(a => a.id);
      const all = await base44.entities.HourEntry.list("-created_date", 100);
      return all.filter(h => activityIds.includes(h.activity_id));
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

  const { data: participationRequests = [] } = useQuery({
    queryKey: ["participation-requests", ngo?.id],
    queryFn: () => base44.entities.CampaignParticipationRequest.filter({ ngo_id: ngo?.id }),
    enabled: !!ngo?.id,
  });

  if (!user) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background font-inter">
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-rose-400" />

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-8">

        {/* Floating side menu */}
        <NGOSideMenu ngo={ngo} campaigns={campaigns} activities={activities} hourEntries={hourEntries} participationRequests={participationRequests} />

        {/* 1. Hero: Cover + Name + Mission */}
        <NGOHero ngo={ngo} />

        {/* 2. Stats */}
        <NGOStatsBar activities={activities} hourEntries={hourEntries} />

        {/* 3. Active Campaigns */}
        <CampaignsSection campaigns={campaigns} ngoId={ngo?.id} />

        {/* 4. Posts */}
        <NGOPostsSection posts={posts} ngoId={ngo?.id} ngoName={ngo?.name} />

        {/* 5. Management tabs */}
        <div className="pt-4 border-t border-border">
          <h2 className="text-lg font-bold text-foreground mb-4">Management</h2>
          <Tabs defaultValue="volunteers">
            <TabsList className="bg-secondary rounded-xl p-1 gap-1">
              <TabsTrigger value="volunteers" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Volunteers
              </TabsTrigger>
              <TabsTrigger value="activities" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Activities
              </TabsTrigger>
              <TabsTrigger value="hours" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Hours Approval
                {hourEntries.filter(h => h.status === "pending").length > 0 && (
                  <span className="ml-1.5 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5">
                    {hourEntries.filter(h => h.status === "pending").length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <div className="mt-6">
              <TabsContent value="volunteers">
                <VolunteersList activities={activities} hourEntries={hourEntries} />
              </TabsContent>
              <TabsContent value="activities">
                <ActivitiesPanel activities={activities} ngo={ngo} />
              </TabsContent>
              <TabsContent value="hours">
                <HoursApproval hourEntries={hourEntries} activities={activities} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

      </div>
    </div>
  );
}