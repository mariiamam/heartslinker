const SKILL_COLORS = [
  "bg-primary/10 text-primary",
  "bg-amber-100 text-amber-700",
  "bg-orange-100 text-orange-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
  "bg-green-100 text-green-700",
];

export default function SkillsSection({ skills }) {
  if (!skills?.length) return (
    <div className="text-sm text-muted-foreground">No skills listed yet.</div>
  );

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill, idx) => (
        <span
          key={skill}
          className={`text-sm font-medium px-3 py-1.5 rounded-xl ${SKILL_COLORS[idx % SKILL_COLORS.length]}`}
        >
          {skill}
        </span>
      ))}
    </div>
  );
}