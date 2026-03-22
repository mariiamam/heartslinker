import { useState } from "react";
import { X, ChevronDown, ChevronUp, Shield, ShieldCheck } from "lucide-react";
import { computeBadges } from "@/lib/badges";

const VISIBLE_COUNT = 4;

export default function BadgesSection({ activities = [], hourEntries = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const badges = computeBadges({ activities, hourEntries });
  const earned = badges.filter(b => b.achieved);
  const inProgress = badges.filter(b => !b.achieved && b.progress > 0);
  const locked = badges.filter(b => !b.achieved && b.progress === 0);
  const nextBadge = inProgress[0] || locked[0];

  const visible = expanded ? earned : earned.slice(0, VISIBLE_COUNT);
  const hasMore = earned.length > VISIBLE_COUNT;

  if (badges.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Earned badges — stacked list */}
      {earned.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          Start volunteering to unlock your first badge.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {visible.map(b => <EarnedBadgeRow key={b.key} badge={b} />)}
          </div>

          {hasMore && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mt-1"
            >
              {expanded
                ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                : <><ChevronDown className="w-3.5 h-3.5" /> Show {earned.length - VISIBLE_COUNT} more</>
              }
            </button>
          )}
        </>
      )}

      {/* Next badge */}
      {nextBadge && (
        <div className="border border-border rounded-xl px-4 py-3 bg-muted/20 mt-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Next Milestone</p>
          <div className="flex items-center gap-3">
            <span className="text-xl opacity-40">{nextBadge.emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{nextBadge.name}</p>
              <div className="h-1 bg-muted rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-foreground/30 rounded-full transition-all"
                  style={{ width: `${nextBadge.progressMax > 0 ? (nextBadge.progress / nextBadge.progressMax) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{nextBadge.progressLabel}</p>
            </div>
          </div>
        </div>
      )}

      {/* View all link */}
      <button
        onClick={() => setShowAll(true)}
        className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
      >
        View all badges ({badges.length})
      </button>

      {showAll && (
        <AllBadgesModal earned={earned} inProgress={inProgress} locked={locked} onClose={() => setShowAll(false)} />
      )}
    </div>
  );
}

function EarnedBadgeRow({ badge }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-border/70 bg-white hover:bg-muted/20 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center flex-shrink-0">
        <span className="text-base leading-none">{badge.emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">{badge.name}</p>
        <p className="text-xs text-muted-foreground truncate">{badge.desc}</p>
      </div>
      <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
    </div>
  );
}

function AllBadgesModal({ earned, inProgress, locked, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-foreground" />
            <h2 className="font-bold text-foreground text-sm tracking-wide uppercase">All Badges</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <X className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-border">
          {earned.length > 0 && (
            <ModalSection title={`Earned — ${earned.length}`}>
              {earned.map(b => <ModalBadgeRow key={b.key} badge={b} state="earned" />)}
            </ModalSection>
          )}
          {inProgress.length > 0 && (
            <ModalSection title={`In Progress — ${inProgress.length}`}>
              {inProgress.map(b => <ModalBadgeRow key={b.key} badge={b} state="progress" />)}
            </ModalSection>
          )}
          {locked.length > 0 && (
            <ModalSection title={`Locked — ${locked.length}`}>
              {locked.map(b => <ModalBadgeRow key={b.key} badge={b} state="locked" />)}
            </ModalSection>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalSection({ title, children }) {
  return (
    <div className="p-5 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{title}</p>
      {children}
    </div>
  );
}

function ModalBadgeRow({ badge, state }) {
  const pct = badge.progressMax > 0 ? Math.round((badge.progress / badge.progressMax) * 100) : 0;
  const isLocked = state === "locked";
  const isEarned = state === "earned";

  return (
    <div className={`flex items-start gap-3 py-3 px-3 rounded-xl border transition-colors ${isEarned ? "border-border bg-muted/10" : "border-border/50 bg-white"}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLocked ? "bg-muted" : "bg-foreground/5"}`}>
        <span className={`text-base leading-none ${isLocked ? "opacity-30 grayscale" : ""}`}>{badge.emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-tight ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>{badge.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{badge.desc}</p>
        {state === "progress" && (
          <div className="mt-2">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-foreground/40 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{badge.progressLabel}</p>
          </div>
        )}
      </div>
      {isEarned && <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
    </div>
  );
}