import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ImpactStats from "@/components/profile/ImpactStats";
import BadgesSection from "@/components/profile/BadgesSection";
import ActivityTimeline from "@/components/profile/ActivityTimeline";
import TestimonialsSection from "@/components/profile/TestimonialsSection";
import SkillsSection from "@/components/profile/SkillsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    queryKey: ["activities", user?.email],
    queryFn: () => base44.entities.VolunteerActivity.filter({ user_email: user?.email }, "-date", 20),
    enabled: !!user?.email,
  });

  const { data: testimonials = [] } = useQuery({
    queryKey: ["testimonials", user?.email],
    queryFn: () => base44.entities.Testimonial.filter({ recipient_email: user?.email }),
    enabled: !!user?.email,
  });

  const profile = profiles[0] || null;

  if (!user) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background font-inter">
      {/* Top nav bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-rose-400" />

      <div className="max-w-4xl mx-auto pb-16">
        {/* Header */}
        <ProfileHeader profile={profile} user={user} />

        {/* Stats */}
        <div className="px-6 md:px-10 mt-8">
          <ImpactStats profile={profile} activityCount={activities.length} />
        </div>

        {/* Tabs */}
        <div className="px-6 md:px-10 mt-8">
          <Tabs defaultValue="timeline">
            <TabsList className="bg-secondary rounded-xl p-1 w-full sm:w-auto gap-1">
              <TabsTrigger value="timeline" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Timeline
              </TabsTrigger>
              <TabsTrigger value="badges" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Badges
              </TabsTrigger>
              <TabsTrigger value="skills" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Skills
              </TabsTrigger>
              <TabsTrigger value="testimonials" className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Testimonials
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="timeline">
                <SectionCard title="Activity Timeline" subtitle="Your impact journey, step by step">
                  <ActivityTimeline activities={activities} />
                </SectionCard>
              </TabsContent>

              <TabsContent value="badges">
                <SectionCard title="Impact Badges" subtitle="Recognition for your humanitarian contributions">
                  <BadgesSection badges={profile?.badges} />
                </SectionCard>
              </TabsContent>

              <TabsContent value="skills">
                <SectionCard title="Volunteering Skills" subtitle="What you bring to the mission">
                  <SkillsSection skills={profile?.skills} />
                </SectionCard>
              </TabsContent>

              <TabsContent value="testimonials">
                <SectionCard title="Testimonials" subtitle="Words from NGOs, friends, and fellow volunteers">
                  <TestimonialsSection testimonials={testimonials} />
                </SectionCard>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Footer quote */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/10 to-rose-100/50 border-t border-border py-8 text-center px-4">
        <p className="text-sm text-muted-foreground italic max-w-md mx-auto">
          "A single act of kindness can change a life — and that's all the legacy I need."
        </p>
        <p className="text-xs text-muted-foreground mt-2 font-medium">— HeartsLinker</p>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}