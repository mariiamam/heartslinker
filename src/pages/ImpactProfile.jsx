import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ImpactStatsCreative from "@/components/profile/ImpactStatsCreative";
import BadgesSection from "@/components/profile/BadgesSection";
import ActivityTimeline from "@/components/profile/ActivityTimeline";
import TestimonialsSection from "@/components/profile/TestimonialsSection";
import SkillsSection from "@/components/profile/SkillsSection";
import MyStorySection from "@/components/profile/MyStorySection";
import ProfilePostsSection from "@/components/profile/ProfilePostsSection";
import Navbar from "@/components/layout/Navbar";
import { Zap, Bell, Briefcase } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function ImpactProfile() {
  const [user, setUser] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
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

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const profile = profiles[0] || null;
  const unread = notifications.filter(n => !n.is_read).length;

  const handleRightClick = (e) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Public changes: activities marked visible
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

        {/* "Changer" badge — private, shown under name */}
        <div className="px-6 md:px-10 mt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-primary to-accent px-3 py-1 rounded-full shadow-sm">
            <Zap className="w-3 h-3" /> Changer
          </span>
        </div>

        {/* Stats — creative */}
        <div className="px-6 md:px-10 mt-6">
          <ImpactStatsCreative profile={profile} activityCount={activities.length} />
        </div>

        {/* My Story */}
        <div className="px-6 md:px-10 mt-5">
          <MyStorySection profile={profile} isOwner={true} />
        </div>

        {/* Public changes (visible activities) */}
        <div className="px-6 md:px-10 mt-5">
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="font-bold text-foreground mb-4">Changes — What I've Done</h3>
            {publicActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No shared activities yet.</p>
            ) : (
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
            )}
          </div>
        </div>

        {/* Posts */}
        <div className="px-6 md:px-10 mt-5">
          <ProfilePostsSection posts={posts} userEmail={user.email} isOwner={true} />
        </div>

        {/* Private section — Updates + Campaigns in a grid */}
        <div className="px-6 md:px-10 mt-5 grid md:grid-cols-2 gap-5">
          {/* Updates Window */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">Updates</h3>
              {unread > 0 && <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{unread}</span>}
            </div>
            <UpdatesWindow notifications={notifications} />
          </div>

          {/* My Campaigns */}
          <div>
            <MyCampaignsWindow activities={activities} userEmail={user.email} />
          </div>
        </div>

        {/* Extra Tabs */}
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