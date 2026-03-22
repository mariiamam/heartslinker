/**
 * Badge definitions and calculation logic.
 * All badges use APPROVED / VERIFIED data only.
 */

export const BADGE_DEFS = [
  {
    key: "first_steps",
    emoji: "🌱",
    name: "First Steps",
    desc: "Complete your first verified volunteering activity",
    category: "Progress",
    color: "bg-green-50 border-green-200 text-green-800",
  },
  {
    key: "verified_volunteer",
    emoji: "✔️",
    name: "Verified Volunteer",
    desc: "Receive your first NGO-approved participation",
    category: "Trust",
    color: "bg-blue-50 border-blue-200 text-blue-800",
  },
  {
    key: "ten_hours",
    emoji: "⏱️",
    name: "10 Hours Club",
    desc: "Log 10+ approved volunteer hours",
    category: "Progress",
    color: "bg-orange-50 border-orange-200 text-orange-800",
  },
  {
    key: "fifty_hours",
    emoji: "⭐",
    name: "50 Hours Star",
    desc: "Log 50+ approved volunteer hours",
    category: "Progress",
    color: "bg-amber-50 border-amber-200 text-amber-800",
  },
  {
    key: "century_volunteer",
    emoji: "🏆",
    name: "Century Volunteer",
    desc: "Log 100+ approved volunteer hours",
    category: "Progress",
    color: "bg-yellow-50 border-yellow-300 text-yellow-800",
  },
  {
    key: "multi_ngo",
    emoji: "🤝",
    name: "Multi-NGO Volunteer",
    desc: "Volunteer with 2 or more NGOs",
    category: "Diversity",
    color: "bg-teal-50 border-teal-200 text-teal-800",
  },
  {
    key: "five_campaigns",
    emoji: "🔥",
    name: "5 Campaigns",
    desc: "Participate in 5 different campaigns",
    category: "Participation",
    color: "bg-red-50 border-red-200 text-red-800",
  },
  {
    key: "weekly_helper",
    emoji: "📅",
    name: "Weekly Helper",
    desc: "Volunteer in 4 different weeks",
    category: "Consistency",
    color: "bg-purple-50 border-purple-200 text-purple-800",
  },
  {
    key: "multi_cause",
    emoji: "🌍",
    name: "Multi-Cause Volunteer",
    desc: "Volunteer in 2 or more causes",
    category: "Diversity",
    color: "bg-cyan-50 border-cyan-200 text-cyan-800",
  },
  {
    key: "trusted_volunteer",
    emoji: "🔒",
    name: "Trusted Volunteer",
    desc: "Complete 5 approved activities",
    category: "Trust",
    color: "bg-indigo-50 border-indigo-200 text-indigo-800",
  },
];

/**
 * Calculate which badges are earned, their progress, and what's next.
 *
 * @param {object} params
 * @param {Array}  params.activities    - Activity records for this user
 * @param {Array}  params.hourEntries   - HourEntry records for this user
 * @returns {Array} enriched badge objects with { ...def, achieved, progress, progressMax, progressLabel }
 */
export function computeBadges({ activities = [], hourEntries = [] }) {
  const approved = hourEntries.filter(h => h.status === "approved");
  const totalHours = approved.reduce((s, h) => s + (h.hours || 0), 0);

  // Distinct NGOs
  const uniqueNGOs = new Set(activities.map(a => a.ngo_id).filter(Boolean)).size;

  // Distinct campaigns with an activity record (= accepted participation)
  const uniqueCampaigns = new Set(activities.map(a => a.campaign_id).filter(Boolean)).size;

  // Distinct causes from activities that have approved hours
  const activityIdsWithApprovedHours = new Set(approved.map(h => h.activity_id));
  const causesWithHours = new Set(
    activities
      .filter(a => activityIdsWithApprovedHours.has(a.id) && a.cause)
      .map(a => a.cause)
  );

  // Weeks with approved activity
  const weeksWithActivity = new Set(
    approved.map(h => {
      if (!h.date) return null;
      const d = new Date(h.date);
      // ISO week key: year + week number
      const startOfYear = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
      return `${d.getFullYear()}-W${weekNum}`;
    }).filter(Boolean)
  );

  // Approved activities count (activities that have at least 1 approved hour entry)
  const approvedActivityCount = activities.filter(a =>
    approved.some(h => h.activity_id === a.id)
  ).length;

  return BADGE_DEFS.map(def => {
    switch (def.key) {
      case "first_steps":
        return { ...def, achieved: approvedActivityCount >= 1, progress: Math.min(approvedActivityCount, 1), progressMax: 1, progressLabel: `${Math.min(approvedActivityCount, 1)} / 1 activity` };
      case "verified_volunteer":
        return { ...def, achieved: approvedActivityCount >= 1, progress: Math.min(approvedActivityCount, 1), progressMax: 1, progressLabel: `${Math.min(approvedActivityCount, 1)} / 1 verified activity` };
      case "ten_hours":
        return { ...def, achieved: totalHours >= 10, progress: Math.min(totalHours, 10), progressMax: 10, progressLabel: `${totalHours} / 10 hours` };
      case "fifty_hours":
        return { ...def, achieved: totalHours >= 50, progress: Math.min(totalHours, 50), progressMax: 50, progressLabel: `${totalHours} / 50 hours` };
      case "century_volunteer":
        return { ...def, achieved: totalHours >= 100, progress: Math.min(totalHours, 100), progressMax: 100, progressLabel: `${totalHours} / 100 hours` };
      case "multi_ngo":
        return { ...def, achieved: uniqueNGOs >= 2, progress: Math.min(uniqueNGOs, 2), progressMax: 2, progressLabel: `${uniqueNGOs} / 2 NGOs` };
      case "five_campaigns":
        return { ...def, achieved: uniqueCampaigns >= 5, progress: Math.min(uniqueCampaigns, 5), progressMax: 5, progressLabel: `${uniqueCampaigns} / 5 campaigns` };
      case "weekly_helper":
        return { ...def, achieved: weeksWithActivity.size >= 4, progress: Math.min(weeksWithActivity.size, 4), progressMax: 4, progressLabel: `${weeksWithActivity.size} / 4 weeks` };
      case "multi_cause":
        return { ...def, achieved: causesWithHours.size >= 2, progress: Math.min(causesWithHours.size, 2), progressMax: 2, progressLabel: `${causesWithHours.size} / 2 causes` };
      case "trusted_volunteer":
        return { ...def, achieved: approvedActivityCount >= 5, progress: Math.min(approvedActivityCount, 5), progressMax: 5, progressLabel: `${approvedActivityCount} / 5 activities` };
      default:
        return { ...def, achieved: false, progress: 0, progressMax: 1, progressLabel: "" };
    }
  });
}