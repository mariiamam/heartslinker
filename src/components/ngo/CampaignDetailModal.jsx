import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, MapPin, Users, Calendar, ClipboardList, UserCheck, AlertTriangle, Clock, Send, CheckCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function CampaignDetailModal({ campaign, onClose, ngoName }) {
  const [user, setUser] = useState(null);
  const [cv, setCV] = useState(null);
  const [showJoinFlow, setShowJoinFlow] = useState(false);
  const [agreed1, setAgreed1] = useState(false);
  const [agreed2, setAgreed2] = useState(false);
  const [agreed3, setAgreed3] = useState(false);
  const [joinDone, setJoinDone] = useState(false);
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

  const joinMutation = useMutation({
    mutationFn: () => base44.entities.CampaignParticipationRequest.create({
      campaign_id: campaign.id,
      campaign_title: campaign.title,
      ngo_id: campaign.ngo_id,
      user_email: user.email,
      message: buildCVSummary(cv, user),
    }),
    onSuccess: () => {
      setJoinDone(true);
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
  const allAgreed = agreed1 && agreed2 && agreed3;

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

          {/* Join / Donate section */}
          {!isFund && !joinDone && (
            <>
              {!showJoinFlow ? (
                <Button
                  className="w-full rounded-2xl bg-primary hover:bg-primary/90 gap-2"
                  disabled={noSeats}
                  onClick={() => setShowJoinFlow(true)}
                >
                  🤝 Join this Campaign
                </Button>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <p className="text-sm font-bold text-orange-700">Before joining — please read and agree</p>
                  </div>

                  {/* CV preview */}
                  {cv && (
                    <div className="bg-white border border-border rounded-xl p-3 text-xs text-foreground/80 space-y-1">
                      <p className="font-semibold text-foreground text-xs mb-1.5">Your CV will be sent to the NGO:</p>
                      {(cv.cv_full_name || user?.full_name) && <p>👤 {cv.cv_full_name || user?.full_name}</p>}
                      {cv.cv_phone && <p>📞 {cv.cv_phone}</p>}
                      {user?.email && <p>✉️ {user.email}</p>}
                      {cv.location && <p>📍 {cv.location}</p>}
                      {cv.skills?.length > 0 && <p>🛠 {cv.skills.join(", ")}</p>}
                      {!cv.cv_full_name && !cv.cv_phone && (
                        <p className="text-orange-600 italic">No CV details saved yet. <a href="/ImpactProfile" className="underline">Fill your CV</a> for a better application.</p>
                      )}
                    </div>
                  )}
                  {!cv && (
                    <div className="bg-white border border-orange-200 rounded-xl p-3 text-xs text-orange-600">
                      You haven't set up your CV yet. <a href="/ImpactProfile" className="underline font-semibold">Click here to fill it in</a> for a stronger application. You can still join without it.
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <ConsentItem checked={agreed1} onChange={setAgreed1}
                      text="I authorize HeartsLinker to automatically send my CV to this NGO when I click Join." />
                    <ConsentItem checked={agreed2} onChange={setAgreed2}
                      text="I confirm all information in my CV is truthful and accurate. I take full responsibility for any false or misleading information." />
                    <ConsentItem checked={agreed3} onChange={setAgreed3}
                      text="I understand my application will be reviewed by the NGO and I may be contacted regarding this opportunity." />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="rounded-xl flex-1" onClick={() => setShowJoinFlow(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-xl flex-1 bg-primary hover:bg-primary/90 gap-1.5"
                      disabled={!allAgreed || joinMutation.isPending}
                      onClick={() => joinMutation.mutate()}
                    >
                      <Send className="w-3.5 h-3.5" />
                      {joinMutation.isPending ? "Sending..." : "Confirm & Join"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {joinDone && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-700">Application sent!</p>
                <p className="text-xs text-green-600">Your CV has been sent to the NGO. They will review it and get back to you.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConsentItem({ checked, onChange, text }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer">
      <input
        type="checkbox"
        className="mt-0.5 accent-primary w-4 h-4 flex-shrink-0"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span className="text-xs text-foreground/80 leading-relaxed">{text}</span>
    </label>
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
  if (cv?.cv_age) lines.push(`Age: ${cv.cv_age}`);
  if (cv?.cv_birth_date) lines.push(`Date of Birth: ${cv.cv_birth_date}`);
  if (cv?.location) lines.push(`Location: ${cv.location}`);
  if (cv?.skills?.length) lines.push(`Skills: ${cv.skills.join(", ")}`);
  if (cv?.bio) lines.push(`\nAbout Me:\n${cv.bio}`);
  if (cv?.uploaded_cv_url) lines.push(`\nAttached CV: ${cv.uploaded_cv_url}`);
  lines.push("\n✅ CV sent via HeartsLinker — volunteering history verified by the platform.");
  return lines.join("\n");
}