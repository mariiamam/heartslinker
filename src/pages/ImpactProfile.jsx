import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ImpactStatsIcons from "@/components/profile/ImpactStatsIcons";
import BadgesSection from "@/components/profile/BadgesSection";
import TestimonialsSection from "@/components/profile/TestimonialsSection";
import SkillsSection from "@/components/profile/SkillsSection";
import ProfilePostsSection from "@/components/profile/ProfilePostsSection";
import ImpactAnalytics from "@/components/profile/ImpactAnalytics";
import EditProfileForm from "@/components/profile/EditProfileForm";
import UpdatesWindow from "@/components/profile/UpdatesWindow";
import MyCampaignsWindow from "@/components/profile/MyCampaignsWindow";
import QuickMenu from "@/components/profile/QuickMenu";
import MyCVPanel from "@/components/profile/MyCVPanel";
import Navbar from "@/components/layout/Navbar";
import { X } from "lucide-react";

export default function ImpactProfile() {
  const [user, setUser] = useState(null);
  const [activePanel, setActivePanel] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: profiles = [] } = useQuery({
    queryKey: ["impact-profile", user?.email],
    queryFn: () => base44.entities.ImpactProfile.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["my-activities", user?.email],
    queryFn: () => base44.entities.Activity.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: testimonials = [] } = useQuery({
    queryKey: ["testimonials", user?.email],
    queryFn: () => base44.entities.Testimonial.filter({ recipient_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["profile-posts", user?.email],
    queryFn: () => base44.entities.ProfilePost.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: hourEntries = [] } = useQuery({
    queryKey: ["my-hour-entries", user?.email],
    queryFn: () => base44.entities.HourEntry.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const profile = profiles[0] || null;
  const publicActivities = activities.filter(a => a.is_visible !== false);

  if (!user) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background font-inter">
      <Navbar />

      <div className="max-w-4xl mx-auto pb-16">
        {/* Header */}
        <ProfileHeader profile={profile} user={user} />

        {/* Stats icons + Menu icon row */}
        <div className="px-6 md:px-10 mt-5 flex items-center justify-between">
          <ImpactStatsIcons profile={profile} activityCount={activities.length} />
          <QuickMenu activePanel={activePanel} onSelect={setActivePanel} />
        </div>

        {/* Full-page overlays for each panel */}
        {activePanel && activePanel !== "cv" && (
          <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
            <div className="max-w-3xl mx-auto px-5 py-8 pb-20">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-foreground">
                  {activePanel === "analytics" && "Impact Analytics"}
                  {activePanel === "updates" && "My Updates"}
                  {activePanel === "campaigns" && "My Campaigns & Activities"}
                  {activePanel === "settings" && "Settings"}
                </h1>
                <button
                  onClick={() => setActivePanel(null)}
                  className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>
              {activePanel === "analytics" && (
                <ImpactAnalytics profile={profile} activities={activities} hourEntries={hourEntries} />
              )}
              {activePanel === "updates" && (
                <UpdatesWindow notifications={notifications} />
              )}
              {activePanel === "campaigns" && (
                <MyCampaignsWindow activities={activities} userEmail={user.email} />
              )}
              {activePanel === "settings" && (
                <EditProfileForm profile={profile} user={user} />
              )}
            </div>
          </div>
        )}

        {/* CV — fullscreen overlay */}
        {activePanel === "cv" && (
          <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
            <div className="max-w-3xl mx-auto px-5 py-8 pb-20">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-foreground">My CV</h1>
                <button
                  onClick={() => setActivePanel(null)}
                  className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>
              <MyCVPanel user={user} activities={activities} />
            </div>
          </div>
        )}

        {/* My Story — read only */}
        {profile?.bio && (
          <div className="px-6 md:px-10 mt-5">
            <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-bold text-foreground mb-2">My Story</h3>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            </div>
          </div>
        )}

        {/* Public activities */}
        {publicActivities.length > 0 && (
          <div className="px-6 md:px-10 mt-5">
            <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-bold text-foreground mb-4">Changes — What I've Done</h3>
              <div className="space-y-3">
                {publicActivities.map(act => (
                  <div key={act.id} className="flex gap-3 items-start border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm">
                      {act.type === "donation" ? "💰" : "🤝"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{act.title}</p>
                      <p className="text-xs text-muted-foreground">{act.ngo_name}{act.cause ? ` · ${act.cause}` : ""}</p>
                      {act.type === "donation" ? (
                        <p className="text-xs text-muted-foreground mt-0.5">Donated to {act.ngo_name}</p>
                      ) : act.start_date && (
                        <p className="text-xs text-muted-foreground mt-0.5">Since {act.start_date}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Posts — Instagram-style feed */}
        <div className="px-6 md:px-10 mt-5">
          <ProfilePostsSection posts={posts} userEmail={user.email} isOwner={true} />
        </div>

        {/* Badges / Skills / Testimonials tabs */}
        <div className="px-6 md:px-10 mt-8">
          <Tabs defaultValue="badges">
            <TabsList className="bg-secondary rounded-xl p-1 gap-1">
              <TabsTrigger value="badges" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Badges</TabsTrigger>
              <TabsTrigger value="skills" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Skills</TabsTrigger>
              <TabsTrigger value="testimonials" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Testimonials</TabsTrigger>
            </TabsList>
            <div className="mt-4">
              <TabsContent value="badges">
                <SectionCard title="Impact Badges"><BadgesSection badges={profile?.badges} /></SectionCard>
              </TabsContent>
              <TabsContent value="skills">
                <SectionCard title="Volunteering Skills"><SkillsSection skills={profile?.skills} /></SectionCard>
              </TabsContent>
              <TabsContent value="testimonials">
                <SectionCard title="Testimonials"><TestimonialsSection testimonials={testimonials} /></SectionCard>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary/5 via-accent/10 to-rose-100/50 border-t border-border py-8 text-center px-4">
        <p className="text-sm text-muted-foreground italic max-w-md mx-auto">
          "A single act of kindness can change a life — and that's all the legacy I need."
        </p>
        <p className="text-xs text-muted-foreground mt-2 font-medium">— HeartsLinker</p>
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
      <h3 className="text-base font-semibold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}