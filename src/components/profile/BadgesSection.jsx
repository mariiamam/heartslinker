const BADGE_META = {
  "Food Hero": { emoji: "🍞", color: "bg-yellow-50 border-yellow-200 text-yellow-800" },
  "Shelter Supporter": { emoji: "🏠", color: "bg-orange-50 border-orange-200 text-orange-800" },
  "Education Champion": { emoji: "📚", color: "bg-amber-50 border-amber-200 text-amber-800" },
  "Health Guardian": { emoji: "💊", color: "bg-red-50 border-red-200 text-red-800" },
  "Refugee Helper": { emoji: "🌍", color: "bg-teal-50 border-teal-200 text-teal-800" },
  "Animal Protector": { emoji: "🐾", color: "bg-green-50 border-green-200 text-green-800" },
  "50h Volunteer": { emoji: "⭐", color: "bg-primary/5 border-primary/20 text-primary" },
  "100h Legend": { emoji: "🌟", color: "bg-amber-50 border-amber-300 text-amber-700" },
};

export default function BadgesSection({ badges }) {
  if (!badges?.length) return (
    <div className="text-center py-8 text-muted-foreground text-sm">
      No badges earned yet — start volunteering to unlock your first badge!
    </div>
  );

  return (
    <div className="flex flex-wrap gap-3">
      {badges.map((badge) => {
        const meta = BADGE_META[badge] || { emoji: "🏅", color: "bg-secondary border-border text-foreground" };
        return (
          <div key={badge} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm ${meta.color}`}>
            <span className="text-lg">{meta.emoji}</span>
            {badge}
          </div>
        );
      })}
    </div>
  );
}