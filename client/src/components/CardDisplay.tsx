import { motion } from "framer-motion";
import { type Card, getIconForType } from "@/lib/game-data";
import { cn } from "@/lib/utils";

interface CardDisplayProps {
  card: Card;
  isRevealed?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CardDisplay({ card, isRevealed = true, onClick, className }: CardDisplayProps) {
  const Icon = getIconForType(card.type);

  const typeColors = {
    investment: "bg-blue-100 text-blue-600 border-blue-200",
    event: "bg-yellow-100 text-yellow-600 border-yellow-200",
    interaction: "bg-purple-100 text-purple-600 border-purple-200",
    personal: "bg-pink-100 text-pink-600 border-pink-200",
  };

  const gradientBack = "bg-gradient-to-br from-indigo-500 to-purple-600";

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.05, rotate: 1 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      onClick={onClick}
      className={cn(
        "relative w-64 aspect-[3/4] rounded-2xl shadow-xl cursor-pointer perspective-1000 transition-all duration-300",
        className
      )}
    >
      <div className={cn(
        "absolute inset-0 rounded-2xl border-4 backface-hidden flex flex-col items-center justify-center p-6 text-center overflow-hidden",
        isRevealed ? "bg-white border-white rotate-y-0" : `${gradientBack} border-indigo-400`
      )}>
        {isRevealed ? (
          <>
            <div className={cn("mb-4 p-4 rounded-full border-2", typeColors[card.type])}>
              <Icon size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{card.title}</h3>
            <p className="text-sm text-slate-500 font-medium mb-4 uppercase tracking-wider">{card.type}</p>
            <p className="text-slate-600 leading-relaxed mb-auto">{card.description}</p>
            
            {card.type === 'investment' && (
              <div className="mt-4 w-full bg-slate-100 py-2 rounded-lg font-mono font-bold text-slate-700">
                Cost: ${card.cost}
              </div>
            )}
            
            {card.value !== undefined && card.value !== 0 && (
              <div className={cn(
                "mt-4 w-full py-2 rounded-lg font-mono font-bold",
                card.value > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {card.value > 0 ? '+' : ''}{card.value}
              </div>
            )}
          </>
        ) : (
          <div className="text-white font-display text-4xl opacity-50 rotate-45">
            LIFEtune
          </div>
        )}
      </div>
    </motion.div>
  );
}
