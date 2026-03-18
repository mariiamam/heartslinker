import { Quote } from "lucide-react";

export default function TestimonialsSection({ testimonials }) {
  if (!testimonials?.length) return (
    <div className="text-center py-8 text-muted-foreground text-sm">
      No testimonials yet. NGOs and friends can leave recommendations here.
    </div>
  );

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {testimonials.map((t, idx) => (
        <div key={t.id || idx} className="bg-secondary/40 rounded-2xl p-5 border border-border relative">
          <Quote className="absolute top-4 right-4 w-6 h-6 text-primary/20" />
          <p className="text-sm text-foreground/80 leading-relaxed italic">"{t.message}"</p>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
              {t.author_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t.author_name}</p>
              <p className="text-xs text-muted-foreground">{t.author_role}{t.ngo_name ? ` · ${t.ngo_name}` : ""}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}