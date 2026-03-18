import { Zap } from "lucide-react";

export default function ChangerBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-gradient-to-r from-primary to-accent px-2.5 py-0.5 rounded-full shadow-sm">
      <Zap className="w-3 h-3" /> Changer
    </span>
  );
}