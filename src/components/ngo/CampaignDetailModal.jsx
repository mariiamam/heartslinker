import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, MapPin, Users, Calendar, ClipboardList, UserCheck, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function CampaignDetailModal({ campaign, onClose, ngoName }) {
  const [user, setUser] = useState(null);
  const [cv, setCV] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.ImpactProfile.filter({ created_by: user.email }).then(list => {
      setCV(list[0] || null);
    });
  }, [user]);

  // Check if user already has a request for this campaign
  const { data: existingRequests = [] } = useQuery({
    queryKey: ["my-request", campaign?.id, user?.email],
    queryFn: () => base44.entities.CampaignParticipationRequest.filter({
      campaign_id: campaign.id,
      user_email: user.email,
    }),
    enabled: !!user?.email && !!campaign?.id,
  });

  const existingRequest = existingRequests[0] || null;

  const joinMutation = useMutation({
    mutationFn: () => base44.entities.CampaignParticipationRequest.create({
      campaign_id: campaign.id,
      campaign_title: campaign.title,
      ngo_id: campaign.ngo_id,
      user_email: user.email,
      message: buildCVSummary(cv, user),
    }),
    onSuccess: () => {
      qc.invalidateQueries(["my-request", campaign.id, user?.email]);
      qc.invalidateQueries(["participation-requests"]);
    },
  });

  if (!campaign) return null;

  const isFund = campaign.type === "fundraising";
  const seatsLeft = campaign.volunteers_needed && campaign.volunteers_enrolled != null
    ? campaign.volunteers_needed - (campaign.volunteers_enrolled || 0)
    : null;
  const fewSeatsLeft = seatsLeft !== null && seatsLeft <= 10 && seatsLeft > 0;
  const noSeats = seatsLeft !== null && seatsLeft <= 0;
  const progress = isFund && campaign.goal_amount
    ? Math.min(100, Math.round(((campaign.collected_amount || 0) / campaign.goal_amount) * 100))
    : 0;

  const fmt = (d) => { try { return format(new Date(d), "MMM d, yyyy"); } catch { return d; } };

  // Determine button state
  const requestStatus = existingRequest?.status;
  const isAccepted = requestStatus === "accepted";
  const isPending = requestStatus === "pending" || joinMutation.isSuccess;

  const renderJoinButton = () => {
    if (isAccepted) {
      return (
        <div className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-semibold py-2.5 rounded-2xl text-sm">
          <CheckCircle className="w-4 h-4" /> Participant
        </div>
      );
    }
    if (isPending) {
      return (
        <div className="w-full flex items-center justify-center gap-2 bg-yellow-400 text-yellow-900 font-semibold py-2.5 rounded-2xl text-sm">
          ⏳ Requested
        </div>
      );
    }
    if (!cv) {
      return (
        <div className="space-y-2.5">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-amber-800">Fill your CV first please</p>
          </div>
          <Button
            className="w-full rounded-2xl bg-amber-600 hover:bg-amber-700 gap-2"
            onClick={() => {
              window.location.hash = 'cv';
              onClose();
            }}
          >
            📋 Go to CV
          </Button>
        </div>
      );
    }
    return (
      <Button
        className="w-full rounded-2xl bg-primary hover:bg-primary/90 gap-2"
        disabled={noSeats || joinMutation.isPending}
        onClick={() => joinMutation.mutate()}
      >
        {joinMutation.isPending ? "Sending..." : "🤝 Join this Campaign"}
      </Button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{isFund ? "💰" : "🤝"}</span>
            <div>
              <h2 className="font-bold text-foreground text-lg leading-snug">{campaign.title}</h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {isFund ? "Fundraising" : "Volunteer Campaign"}
                </span>
                {campaign.category && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground">
                    {campaign.category}
                  </span>
                )}
                {ngoName && (
                  <span className="text-xs text-muted-foreground font-medium">by {ngoName}</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Urgency badges */}
          {fewSeatsLeft && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-2.5">
              <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-orange-600">Only {seatsLeft} seat{seatsLeft === 1 ? "" : "s"} left — apply soon!</p>
            </div>
          )}
          {noSeats && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-2.5">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-red-600">This campaign is full</p>
            </div>
          )}

          {/* Sign-up deadline banner */}
          {campaign.signup_deadline && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-2.5">
              <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-blue-700">Application deadline: {fmt(campaign.signup_deadline)}</p>
            </div>
          )}

          {/* Description */}
          {campaign.description && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">About this Campaign</h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{campaign.description}</p>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {campaign.location && (
              <InfoTile icon={MapPin} label="Location" value={campaign.location} />
            )}
            {campaign.volunteers_needed && (
              <InfoTile
                icon={Users}
                label="Volunteers"
                value={seatsLeft !== null ? `${seatsLeft} of ${campaign.volunteers_needed} spots left` : `${campaign.volunteers_needed} needed`}
              />
            )}
            {campaign.start_date && (
              <InfoTile icon={Calendar} label="Start Date" value={fmt(campaign.start_date)} />
            )}
            {campaign.end_date && (
              <InfoTile icon={Calendar} label="End Date" value={fmt(campaign.end_date)} />
            )}
            {(campaign.min_age || campaign.max_age) && (
              <InfoTile
                icon={UserCheck}
                label="Age Range"
                value={
                  campaign.min_age && campaign.max_age
                    ? `${campaign.min_age} – ${campaign.max_age} years`
                    : campaign.min_age
                    ? `${campaign.min_age}+ years`
                    : `Up to ${campaign.max_age} years`
                }
              />
            )}
          </div>

          {/* Requirements */}
          {campaign.requirements && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" /> Requirements
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed bg-muted/40 rounded-2xl px-4 py-3 whitespace-pre-line">{campaign.requirements}</p>
            </div>
          )}

          {/* Fundraising progress */}
          {isFund && campaign.goal_amount && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Fundraising Progress</h3>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span className="font-semibold text-primary">${(campaign.collected_amount || 0).toLocaleString()} raised</span>
                <span>Goal: ${campaign.goal_amount.toLocaleString()}</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{progress}% of goal reached</p>
            </div>
          )}

          {/* Join button */}
          {!isFund && renderJoinButton()}
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="bg-muted/40 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function buildCVSummary(cv, user) {
  if (!cv && !user) return "";
  const lines = ["📋 Volunteer CV from HeartsLinker\n"];
  if (cv?.cv_full_name || user?.full_name) lines.push(`Name: ${cv?.cv_full_name || user?.full_name}`);
  if (user?.email) lines.push(`Email: ${user.email}`);
  if (cv?.cv_phone) lines.push(`Phone: ${cv.cv_phone}`);
  if (cv?.cv_birth_date) lines.push(`Date of Birth: ${cv.cv_birth_date}`);
  if (cv?.cv_city || cv?.cv_country) lines.push(`Location: ${[cv.cv_city, cv.cv_country].filter(Boolean).join(", ")}`);
  if (cv?.cv_primary_skills?.length) lines.push(`Skills: ${cv.cv_primary_skills.join(", ")}`);
  if (cv?.bio) lines.push(`\nAbout Me:\n${cv.bio}`);
  if (cv?.uploaded_cv_url) lines.push(`\nAttached CV: ${cv.uploaded_cv_url}`);
  lines.push("\n✅ CV sent via HeartsLinker — volunteering history verified by the platform.");
  return lines.join("\n");
}