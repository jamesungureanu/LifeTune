import { motion } from "framer-motion";
import { Shield, TrendingUp, DollarSign, Briefcase, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerBadgeProps {
  player: any;
  isActive: boolean;
  className?: string;
}

export function PlayerBadge({ player, isActive, className }: PlayerBadgeProps) {
  return (
    <motion.div
      animate={{
        scale: isActive ? 1.05 : 1,
        y: isActive ? -5 : 0,
        borderColor: isActive ? "rgb(246 83 65)" : "transparent"
      }}
      className={cn(
        "bg-white rounded-2xl p-4 shadow-lg border-2 border-transparent transition-all relative overflow-hidden",
        isActive && "ring-4 ring-primary/20 z-10",
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 w-20 h-20 bg-slate-50 rounded-full z-0" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-lg text-slate-800">{player.name}</h3>
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
              <Briefcase size={12} />
              {player.job?.name || "Unemployed"}
            </div>
          </div>
          {isActive && (
            <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Active
            </span>
          )}
        </div>

        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-2xl font-mono font-bold text-slate-700">${player.money}</span>
        </div>

        {/* Status Indicators */}
        <div className="flex gap-2 mt-3">
          {player.insurance && (
            <div className="bg-green-100 text-green-700 p-1.5 rounded-md" title="Insured">
              <Shield size={14} />
            </div>
          )}
          {player.investments.length > 0 && (
            <div className="bg-blue-100 text-blue-700 p-1.5 rounded-md flex items-center gap-1" title="Investments">
              <TrendingUp size={14} />
              <span className="text-xs font-bold">{player.investments.length}</span>
            </div>
          )}
          {player.skipTurns > 0 && (
            <div className="bg-red-100 text-red-700 p-1.5 rounded-md flex items-center gap-1" title="Skipped Turns">
              <AlertOctagon size={14} />
              <span className="text-xs font-bold">{player.skipTurns}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
