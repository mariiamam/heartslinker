import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Heart, Share2, MapPin, Globe, BadgeCheck, Zap } from "lucide-react";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ImpactStatsIcons from "@/components/profile/ImpactStatsIcons";
import BadgesSection from "@/components/profile/BadgesSection";
import TestimonialsSection from "@/components/profile/TestimonialsSection";
import SkillsSection from "@/components/profile/SkillsSection";
import ProfilePostsSection from "@/components/profile/ProfilePostsSection";
import Navbar from "@/components/layout/Navbar";

export default function PublicUserProfile() {
  const [searchParams] = useSearchParams();
  const userEmail = searchParams.get("email");
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (userEmail) {
      base44.entities.User.filter({ email: userEmail }).then(users => {
        if (users.length > 0) setUser(users[0]);
      });
    }
  }, [userEmail]);

  const { data: profiles = [] } = useQuery({
    queryKey: ["public-profile", userEmail],
    queryFn: () => base44.entities.ImpactProfile.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["public-activities", userEmail],
    queryFn: () => base44.entities.Activity.filter({ user_email: userEmail, is_visible: true }),
    enabled: !!userEmail,
  });

  const { data: testimonials = [] } = useQuery({
    queryKey: ["public-testimonials", userEmail],
    queryFn: () => base44.entities.Testimonial.filter({ recipient_email: userEmail }),
    enabled: !!userEmail,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["public-posts", userEmail],
    queryFn: () => base44.entities.ProfilePost.filter({ user_email: userEmail, is_visible: true }),
    enabled: !!userEmail,
  });

  const { data: hourEntries = [] } = useQuery({
    queryKey: ["public-hours", userEmail],
    queryFn: () => base44.entities.HourEntry.filter({ user_email: userEmail, status: "approved" }),
    enabled: !!userEmail,
  });

  const profile = profiles[0] || null;

  if (!userEmail) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">No user specified. Use: /PublicUserProfile?email=user@example.com</p>
      </div>
    </div>
  );

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
        <ProfileHeader profile={profile} user={user} activities={activities} hourEntries={hourEntries} />

        {/* Stats + Action buttons */}
        <div className="px-6 md:px-10 mt-5 flex items-center justify-between">
          <ImpactStatsIcons profile={profile} activityCount={activities.length} />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-border">
              <Share2 className="w-4 h-4" /> Share
            </Button>
            <Button size="sm" className="gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
              <Heart className="w-4 h-4" /> Follow
            </Button>
          </div>
        </div>

        {/* About / Story */}
        {profile?.bio && (
          <div className="px-6 md:px-10 mt-5">
            <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-bold text-foreground mb-2">About</h3>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            </div>
          </div>
        )}

        {/* Public Activities */}
        {activities.length > 0 && (
          <div className="px-6 md:px-10 mt-5">
            <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-bold text-foreground mb-4">Impact</h3>
              <div className="space-y-3">
                {activities.map(act => (
                  <div key={act.id} className="flex gap-3 items-start border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm">
                      🤝
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{act.title}</p>
                      <p className="text-xs text-muted-foreground">{act.ngo_name}{act.cause ? ` · ${act.cause}` : ""}</p>
                      {act.start_date && (
                        <p className="text-xs text-muted-foreground mt-0.5">Since {act.start_date}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Posts */}
        <div className="px-6 md:px-10 mt-5">
          <ProfilePostsSection posts={posts} userEmail={userEmail} isOwner={false} />
        </div>

        {/* Tabs: Badges, Skills, Testimonials */}
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
          "Making a difference, one action at a time."
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