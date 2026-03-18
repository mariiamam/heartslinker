import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Tag, CheckCircle, XCircle, Megaphone, RefreshCw } from "lucide-react";
import { format } from "date-fns";

const TYPE_META = {
  campaign_new: { icon: Megaphone, color: "bg-amber-100 text-amber-600", label: "New Campaign" },
  tagged_post: { icon: Tag, color: "bg-blue-100 text-blue-600", label: "You were tagged" },
  hour_approved: { icon: CheckCircle, color: "bg-green-100 text-green-600", label: "Hours Approved" },
  hour_rejected: { icon: XCircle, color: "bg-red-100 text-red-600", label: "Hours Rejected" },
  volunteering_accepted: { icon: CheckCircle, color: "bg-green-100 text-green-600", label: "Accepted!" },
  volunteering_rejected: { icon: XCircle, color: "bg-red-100 text-red-600", label: "Not Accepted" },
};

export default function UpdatesWindow({ notifications }) {
  const qc = useQueryClient();

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => qc.invalidateQueries(["notifications"]),
  });

  const reshare = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { reshared: true }),
    onSuccess: () => qc.invalidateQueries(["notifications"]),
  });

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <Bell className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-foreground">Updates</h3>
        {unread > 0 && (
          <span className="ml-auto bg-primary text-white text-xs rounded-full px-2 py-0.5 font-bold">{unread}</span>
        )}
      </div>

      {!notifications.length ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">No updates yet. Follow NGOs to get notified!</div>
      ) : (
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {notifications.map(n => {
            const meta = TYPE_META[n.type] || { icon: Bell, color: "bg-secondary text-secondary-foreground", label: n.type };
            const Icon = meta.icon;
            return (
              <div key={n.id} className={`px-5 py-4 flex gap-3 transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground">{meta.label}</p>
                  <p className="text-sm text-foreground font-medium leading-snug">{n.title}</p>
                  {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-muted-foreground">{format(new Date(n.created_date), "MMM d, HH:mm")}</span>
                    {!n.is_read && (
                      <button onClick={() => markRead.mutate(n.id)} className="text-xs text-primary hover:underline">Mark read</button>
                    )}
                    {n.type === "tagged_post" && !n.reshared && (
                      <button onClick={() => reshare.mutate(n.id)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <RefreshCw className="w-3 h-3" /> Reshare
                      </button>
                    )}
                    {n.reshared && <span className="text-xs text-green-600 font-medium">✓ Reshared</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}