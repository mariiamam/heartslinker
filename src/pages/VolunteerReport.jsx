import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Clock, Award, Flame, CheckCircle, BadgeCheck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import jsPDF from "jspdf";
import { computeBadges } from "@/lib/badges";

export default function VolunteerReport() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: profiles = [] } = useQuery({
    queryKey: ["impact-profile-report", user?.email],
    queryFn: () => base44.entities.ImpactProfile.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activities-report", user?.email],
    queryFn: () => base44.entities.Activity.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: hourEntries = [] } = useQuery({
    queryKey: ["hours-report", user?.email],
    queryFn: () => base44.entities.HourEntry.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const cv = profiles[0] || null;

  const approvedHours = hourEntries.filter(h => h.status === "approved");
  const pendingHours = hourEntries.filter(h => h.status === "pending");
  const totalHours = approvedHours.reduce((s, h) => s + (h.hours || 0), 0);
  const totalPending = pendingHours.reduce((s, h) => s + (h.hours || 0), 0);

  const verifiedActivities = activities.filter(a => a.ngo_name);
  const uniqueNGOs = [...new Set(activities.map(a => a.ngo_id).filter(Boolean))].length;

  // Group hours by campaign/activity
  const hoursPerActivity = activities.map(act => {
    const hrs = approvedHours.filter(h => h.activity_id === act.id).reduce((s, h) => s + (h.hours || 0), 0);
    return { ...act, approvedHours: hrs };
  }).filter(a => a.approvedHours > 0).sort((a, b) => b.approvedHours - a.approvedHours);

  // Badges / Milestones
  const badges = computeBadges({ activities, hourEntries });
  const earnedBadges = badges.filter(b => b.achieved);
  const nextBadge = badges.find(b => !b.achieved && b.progress > 0) || badges.find(b => !b.achieved);

  // Recent activity (last 10 hour entries)
  const recentEntries = [...approvedHours]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 10);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const name = cv?.cv_full_name || user?.full_name || "Volunteer";
    const email = user?.email || "";
    const date = format(new Date(), "MMMM d, yyyy");

    // Header
    doc.setFillColor(234, 88, 12);
    doc.rect(0, 0, 210, 38, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("HeartsLinker", 14, 16);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Volunteer Achievement Certificate", 14, 25);
    doc.setFontSize(9);
    doc.text(`Generated: ${date}`, 14, 33);

    // Volunteer name
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(name, 14, 52);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(email, 14, 59);
    if (cv?.cv_city || cv?.cv_country) {
      doc.text([cv.cv_city, cv.cv_country].filter(Boolean).join(", "), 14, 65);
    }

    // Divider
    doc.setDrawColor(234, 88, 12);
    doc.setLineWidth(0.5);
    doc.line(14, 70, 196, 70);

    // Stats summary
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Impact Summary", 14, 80);

    const stats = [
      ["Total Verified Hours", `${totalHours}h`],
      ["Campaigns Participated", `${verifiedActivities.length}`],
      ["NGOs Worked With", `${uniqueNGOs}`],
    ];
    stats.forEach(([label, val], i) => {
      const x = 14 + i * 62;
      doc.setFillColor(255, 247, 237);
      doc.roundedRect(x, 85, 58, 22, 3, 3, "F");
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(234, 88, 12);
      doc.text(val, x + 29, 98, { align: "center" });
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(label, x + 29, 104, { align: "center" });
    });

    // Verified activities
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Verified Volunteer Activities", 14, 120);
    doc.setLineWidth(0.3);
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 123, 196, 123);

    let y = 130;
    if (hoursPerActivity.length === 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text("No approved hours yet.", 14, y);
      y += 10;
    } else {
      hoursPerActivity.forEach(act => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text(act.title, 14, y);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(act.ngo_name || "", 14, y + 5);
        if (act.start_date) doc.text(act.start_date, 14, y + 10);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(234, 88, 12);
        doc.text(`${act.approvedHours}h`, 190, y + 4, { align: "right" });
        doc.setDrawColor(240, 240, 240);
        doc.line(14, y + 14, 196, y + 14);
        y += 18;
      });
    }

    // Skills
    const allSkills = [...(cv?.cv_primary_skills || []), ...(cv?.cv_other_skills || [])];
    if (allSkills.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      y += 6;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("Skills", 14, y);
      doc.setLineWidth(0.3);
      doc.setDrawColor(220, 220, 220);
      doc.line(14, y + 3, 196, y + 3);
      y += 10;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(allSkills.join("  ·  "), 14, y, { maxWidth: 180 });
      y += 12;
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("This document was generated by HeartsLinker — heartslinker.com", 105, 290, { align: "center" });
    }

    doc.save(`HeartsLinker_VolunteerCV_${name.replace(/\s+/g, "_")}.pdf`);
  };

  if (!user) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background font-inter">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/ImpactProfile">
              <button className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">My Volunteer Report</h1>
              <p className="text-xs text-muted-foreground">Verified achievements & impact summary</p>
            </div>
          </div>
          <Button onClick={downloadPDF} className="rounded-xl bg-primary hover:bg-primary/90 gap-2 text-sm">
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<Clock className="w-5 h-5 text-primary" />} value={`${totalHours}h`} label="Verified Hours" color="bg-orange-50 border-orange-100" />
          <StatCard icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} value={verifiedActivities.length} label="Campaigns" color="bg-emerald-50 border-emerald-100" />
          <StatCard icon={<BadgeCheck className="w-5 h-5 text-blue-500" />} value={uniqueNGOs} label="NGOs" color="bg-blue-50 border-blue-100" />
        </div>

        {totalPending > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span><strong>{totalPending}h</strong> pending approval from NGOs</span>
          </div>
        )}

        {/* Badges */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">Badges & Milestones</h2>
          </div>

          {/* Earned */}
          {earnedBadges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {earnedBadges.map(b => (
                <div key={b.key} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium ${b.color}`}>
                  <span>{b.emoji}</span> {b.name}
                </div>
              ))}
            </div>
          )}

          {/* Next badge */}
          {nextBadge && (
            <div className="bg-muted/40 border border-border rounded-2xl p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Next Badge</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{nextBadge.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{nextBadge.name}</p>
                  <p className="text-xs text-muted-foreground mb-1.5">{nextBadge.desc}</p>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: `${nextBadge.progressMax > 0 ? (nextBadge.progress / nextBadge.progressMax) * 100 : 0}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{nextBadge.progressLabel}</p>
                </div>
              </div>
            </div>
          )}

          {earnedBadges.length === 0 && !nextBadge && (
            <p className="text-sm text-muted-foreground">Complete your first volunteering to unlock milestones!</p>
          )}
        </div>

        {/* Hours per campaign */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">Hours by Campaign</h2>
          </div>
          {hoursPerActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No approved hours yet.</p>
          ) : (
            <div className="space-y-3">
              {hoursPerActivity.map(act => {
                const pct = totalHours > 0 ? Math.round((act.approvedHours / totalHours) * 100) : 0;
                return (
                  <div key={act.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{act.title}</p>
                        <p className="text-xs text-muted-foreground">{act.ngo_name}</p>
                      </div>
                      <span className="text-sm font-bold text-primary">{act.approvedHours}h</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity log */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">Recent Activity</h2>
          </div>
          {recentEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {recentEntries.map(h => {
                const act = activities.find(a => a.id === h.activity_id);
                return (
                  <div key={h.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{act?.title || "Activity"}</p>
                      <p className="text-xs text-muted-foreground">{act?.ngo_name || ""}{h.date ? ` · ${format(new Date(h.date), "MMM d, yyyy")}` : ""}</p>
                    </div>
                    <span className="text-sm font-bold text-primary flex-shrink-0">+{h.hours}h</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Download CTA */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-rose-100/50 border border-border rounded-2xl p-6 text-center space-y-3">
          <p className="font-bold text-foreground">Share your impact!</p>
          <p className="text-sm text-muted-foreground">Download your Volunteer CV and share it with employers, universities, or on social media.</p>
          <Button onClick={downloadPDF} className="rounded-xl bg-primary hover:bg-primary/90 gap-2">
            <Download className="w-4 h-4" /> Download Volunteer CV (PDF)
          </Button>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <div className={`border rounded-2xl p-4 text-center ${color}`}>
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function buildMilestones(hours, campaigns, ngos) {
  return [
    { emoji: "🌱", label: "First Steps", desc: "Complete your first volunteering activity", achieved: campaigns >= 1 },
    { emoji: "⏱️", label: "10 Hours Club", desc: "Log 10+ verified volunteer hours", achieved: hours >= 10 },
    { emoji: "🤝", label: "Multi-NGO Volunteer", desc: "Volunteer with 2 or more NGOs", achieved: ngos >= 2 },
    { emoji: "⭐", label: "50 Hours Star", desc: "Log 50+ verified volunteer hours", achieved: hours >= 50 },
    { emoji: "🔥", label: "5 Campaigns", desc: "Participate in 5 different campaigns", achieved: campaigns >= 5 },
    { emoji: "🏆", label: "Century Volunteer", desc: "Log 100+ verified volunteer hours", achieved: hours >= 100 },
  ];
}