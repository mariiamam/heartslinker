import { format } from "date-fns";
import { Clock, Heart, Award, Zap } from "lucide-react";

const TYPE_META = {
  volunteer: { icon: Clock, color: "bg-primary/10 text-primary", label: "Volunteered" },
  donation: { icon: Heart, color: "bg-rose-100 text-rose-500", label: "Donated" },
  badge: { icon: Award, color: "bg-amber-100 text-amber-600", label: "Badge Earned" },
  mission: { icon: Zap, color: "bg-orange-100 text-orange-500", label: "Mission" },
};

export default function ActivityTimeline({ activities }) {
  if (!activities?.length) return (
    <div className="text-center py-8 text-muted-foreground text-sm">
      No activity yet. Join a mission to start your impact story!
    </div>
  );

  return (
    <div className="space-y-1">
      {activities.map((item, idx) => {
        const meta = TYPE_META[item.type] || TYPE_META.volunteer;
        const Icon = meta.icon;
        return (
          <div key={item.id || idx} className="flex gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors group">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground text-sm">{item.title}</p>
                  {item.ngo_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.ngo_name}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {item.hours > 0 && (
                    <span className="text-xs font-medium text-primary">{item.hours}h</span>
                  )}
                  {item.date && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(item.date), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}