import { useState } from "react";
import { X, Lock } from "lucide-react";
import { computeBadges } from "@/lib/badges";

export default function BadgesSection({ activities = [], hourEntries = [] }) {
  const [showAll, setShowAll] = useState(false);

  const badges = computeBadges({ activities, hourEntries });
  const earned = badges.filter(b => b.achieved);
  const inProgress = badges.filter(b => !b.achieved && b.progress > 0);
  const locked = badges.filter(b => !b.achieved && b.progress === 0);

  // Next badge to earn (first in-progress, or first locked)
  const nextBadge = inProgress[0] || locked[0];

  const featured = earned.slice(0, 6);

  if (badges.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Earned badges (featured) */}
      {earned.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Start volunteering to unlock your first badge!
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {featured.map(b => (
            <EarnedBadgePill key={b.key} badge={b} />
          ))}
        </div>
      )}

      {/* Next badge progress */}
      {nextBadge && (
        <div className="bg-muted/40 border border-border rounded-2xl p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Next Badge</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{nextBadge.emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{nextBadge.name}</p>
              <p className="text-xs text-muted-foreground mb-1.5">{nextBadge.desc}</p>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                  style={{ width: `${nextBadge.progressMax > 0 ? (nextBadge.progress / nextBadge.progressMax) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{nextBadge.progressLabel}</p>
            </div>
          </div>
        </div>
      )}

      {/* View All button */}
      <button
        onClick={() => setShowAll(true)}
        className="text-xs font-semibold text-primary hover:underline"
      >
        View All Badges ({badges.length})
      </button>

      {/* Full badge modal */}
      {showAll && (
        <AllBadgesModal badges={badges} earned={earned} inProgress={inProgress} locked={locked} onClose={() => setShowAll(false)} />
      )}
    </div>
  );
}

function EarnedBadgePill({ badge }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border font-medium text-sm ${badge.color}`}>
      <span className="text-base">{badge.emoji}</span>
      <span>{badge.name}</span>
    </div>
  );
}

function AllBadgesModal({ badges, earned, inProgress, locked, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-foreground text-base">All Badges</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          {/* Earned */}
          {earned.length > 0 && (
            <Section title={`Earned (${earned.length})`} color="text-emerald-600">
              {earned.map(b => <BadgeCard key={b.key} badge={b} />)}
            </Section>
          )}

          {/* In Progress */}
          {inProgress.length > 0 && (
            <Section title={`In Progress (${inProgress.length})`} color="text-primary">
              {inProgress.map(b => <BadgeCard key={b.key} badge={b} />)}
            </Section>
          )}

          {/* Locked */}
          {locked.length > 0 && (
            <Section title={`Locked (${locked.length})`} color="text-muted-foreground">
              {locked.map(b => <BadgeCard key={b.key} badge={b} locked />)}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div>
      <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${color}`}>{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function BadgeCard({ badge, locked }) {
  const pct = badge.progressMax > 0 ? Math.round((badge.progress / badge.progressMax) * 100) : 0;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-2xl border ${badge.achieved ? badge.color : locked ? "bg-muted/30 border-border" : "bg-white border-border"}`}>
      <span className={`text-2xl mt-0.5 ${locked ? "grayscale opacity-50" : ""}`}>{locked ? "🔒" : badge.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${badge.achieved ? "" : "text-muted-foreground"}`}>{badge.name}</p>
        <p className="text-xs text-muted-foreground">{badge.desc}</p>
        {!badge.achieved && !locked && (
          <div className="mt-1.5">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{badge.progressLabel}</p>
          </div>
        )}
        {badge.achieved && (
          <span className="text-[10px] font-bold text-emerald-600 mt-0.5 block">✓ Earned</span>
        )}
      </div>
    </div>
  );
}