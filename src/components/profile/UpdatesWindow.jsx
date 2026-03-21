import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Tag, CheckCircle, XCircle, Megaphone, RefreshCw, Trash2 } from "lucide-react";
import { format } from "date-fns";
import CampaignDetailModal from "@/components/ngo/CampaignDetailModal";

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
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);

  const { data: selectedCampaign = null } = useQuery({
    queryKey: ["campaign-detail", selectedCampaignId],
    queryFn: async () => {
      const list = await base44.entities.Campaign.filter({ id: selectedCampaignId });
      return list[0] || null;
    },
    enabled: !!selectedCampaignId,
  });

  const { data: ngos = [] } = useQuery({
    queryKey: ["all-ngos-map"],
    queryFn: () => base44.entities.NGO.list(),
    enabled: !!selectedCampaignId,
  });

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => qc.invalidateQueries(["notifications"]),
  });

  const reshare = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { reshared: true }),
    onSuccess: () => qc.invalidateQueries(["notifications"]),
  });

  const deleteNotif = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => qc.invalidateQueries(["notifications"]),
  });

  const handleCampaignClick = (n) => {
    if (n.type === "campaign_new" && n.link_id) {
      setSelectedCampaignId(n.link_id);
      if (!n.is_read) markRead.mutate(n.id);
    }
  };

  const ngoName = selectedCampaign
    ? ngos.find(g => g.id === selectedCampaign.ngo_id)?.name
    : null;

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-foreground">Notifications</h3>
          {unread > 0 && (
            <span className="ml-auto bg-primary text-white text-xs rounded-full px-2 py-0.5 font-bold">{unread}</span>
          )}
        </div>

        {!notifications.length ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">No notifications yet. Follow NGOs to get notified!</div>
        ) : (
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {notifications.map(n => {
              const meta = TYPE_META[n.type] || { icon: Bell, color: "bg-secondary text-secondary-foreground", label: n.type };
              const Icon = meta.icon;
              const isCampaignNotif = n.type === "campaign_new" && n.link_id;
              return (
                <div
                  key={n.id}
                  className={`px-5 py-4 flex gap-3 transition-colors ${!n.is_read ? "bg-primary/5" : ""} ${isCampaignNotif ? "cursor-pointer hover:bg-amber-50" : ""}`}
                  onClick={() => isCampaignNotif && handleCampaignClick(n)}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">{meta.label}</p>
                    <p className="text-sm text-foreground font-medium leading-snug">{n.title}</p>
                    {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                    {isCampaignNotif && (
                      <p className="text-xs text-primary font-semibold mt-1">Tap to view campaign & join →</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-muted-foreground">{format(new Date(n.created_date), "MMM d, HH:mm")}</span>
                      {!n.is_read && (
                        <button
                          onClick={e => { e.stopPropagation(); markRead.mutate(n.id); }}
                          className="text-xs text-primary hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                      {n.type === "tagged_post" && !n.reshared && (
                        <button
                          onClick={e => { e.stopPropagation(); reshare.mutate(n.id); }}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <RefreshCw className="w-3 h-3" /> Reshare
                        </button>
                      )}
                      {n.reshared && <span className="text-xs text-green-600 font-medium">✓ Reshared</span>}
                      <button
                        onClick={e => { e.stopPropagation(); deleteNotif.mutate(n.id); }}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedCampaignId && selectedCampaign && (
        <CampaignDetailModal
          campaign={selectedCampaign}
          ngoName={ngoName}
          onClose={() => setSelectedCampaignId(null)}
        />
      )}
    </>
  );
}