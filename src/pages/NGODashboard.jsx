import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VolunteersList from "@/components/ngo/VolunteersList";
import ActivitiesPanel from "@/components/ngo/ActivitiesPanel";
import HoursApproval from "@/components/ngo/HoursApproval";
import NGOStatsBar from "@/components/ngo/NGOStatsBar";
import { Building2 } from "lucide-react";

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

  if (!user) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background font-inter">
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-rose-400" />

      {/* Header */}
      <div className="bg-white border-b border-border px-6 md:px-10 py-5">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{ngo?.name || "NGO Dashboard"}</h1>
            <p className="text-xs text-muted-foreground">Manage volunteers, activities & hours</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 space-y-6">
        <NGOStatsBar activities={activities} hourEntries={hourEntries} />

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
  );
}