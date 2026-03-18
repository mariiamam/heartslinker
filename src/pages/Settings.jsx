import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, Briefcase, UserCog } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import UpdatesWindow from "@/components/profile/UpdatesWindow";
import MyCampaignsWindow from "@/components/profile/MyCampaignsWindow";
import EditProfileForm from "@/components/profile/EditProfileForm";

const TABS = [
  { id: "updates", label: "My Updates", icon: Bell },
  { id: "campaigns", label: "My Campaigns & Activities", icon: Briefcase },
  { id: "edit", label: "Edit My Profile", icon: UserCog },
];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("updates");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["my-activities", user?.email],
    queryFn: () => base44.entities.Activity.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["impact-profile", user?.email],
    queryFn: () => base44.entities.ImpactProfile.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const profile = profiles[0] || null;
  const unread = notifications.filter(n => !n.is_read).length;

  if (!user) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background font-inter">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/ImpactProfile" className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>

        {/* Tab buttons */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                tab === id
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-muted-foreground border-border hover:bg-muted/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {id === "updates" && unread > 0 && (
                <span className="ml-auto bg-white text-primary text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                  {unread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "updates" && <UpdatesWindow notifications={notifications} />}
        {tab === "campaigns" && <MyCampaignsWindow activities={activities} userEmail={user.email} />}
        {tab === "edit" && <EditProfileForm profile={profile} user={user} />}
      </div>
    </div>
  );
}