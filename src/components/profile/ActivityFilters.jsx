import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const STATUSES = ["All", "in_process", "completed", "cancelled"];
const TYPES = ["All", "volunteer", "donation"];
const STATUS_LABELS = { all: "All", in_process: "Active", completed: "Completed", cancelled: "Cancelled" };

export default function ActivityFilters({ filters, onChange }) {
  const set = (key, val) => onChange({ ...filters, [key]: val });
  const hasFilters = filters.search || filters.status !== "All" || filters.type !== "All";

  return (
    <div className="bg-white rounded-2xl border border-border p-4 shadow-sm space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Filter Activities</span>
        {hasFilters && (
          <button
            onClick={() => onChange({ search: "", status: "All", type: "All" })}
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          className="pl-8 rounded-xl text-sm h-8"
          placeholder="Search activities..."
          value={filters.search}
          onChange={e => set("search", e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">Status:</span>
          {STATUSES.map(s => (
            <button key={s} onClick={() => set("status", s)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                filters.status === s ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary"
              }`}>
              {STATUS_LABELS[s] || s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">Type:</span>
          {TYPES.map(t => (
            <button key={t} onClick={() => set("type", t)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors capitalize ${
                filters.type === t ? "bg-accent text-foreground border-accent" : "bg-white text-muted-foreground border-border hover:border-accent"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}