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
import Navbar from "@/components/layout/Navbar";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

export default function ImpactProfile() {
  const [user, setUser] = useState(null);

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

        {/* Stats icons + Settings icon row */}
        <div className="px-6 md:px-10 mt-5 flex items-center justify-between">
          <ImpactStatsIcons profile={profile} activityCount={activities.length} />
          <Link
            to="/Settings"
            className="p-2.5 rounded-2xl bg-muted border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>

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