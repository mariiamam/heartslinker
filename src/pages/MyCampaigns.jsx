import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import MyCampaignsWindow from "@/components/profile/MyCampaignsWindow";
import { Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

export default function MyCampaigns() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: activities = [] } = useQuery({
    queryKey: ["my-activities", user?.email],
    queryFn: () => base44.entities.Activity.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  if (!user) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background font-inter">
      <Navbar />
      <div className="max-w-2xl mx-auto px-5 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/ImpactProfile" className="text-sm text-muted-foreground hover:text-primary transition-colors">← Back to Profile</Link>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Campaigns & Activities</h1>
            <p className="text-sm text-muted-foreground">{activities.length} activit{activities.length !== 1 ? "ies" : "y"}</p>
          </div>
        </div>
        <MyCampaignsWindow activities={activities} userEmail={user.email} />
      </div>
    </div>
  );
}