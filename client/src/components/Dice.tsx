import { motion, AnimatePresence } from "framer-motion";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";

interface DiceProps {
  value: number;
  rolling: boolean;
}

export function Dice({ value, rolling }: DiceProps) {
  const DiceIcon = [Dice1, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6][Math.min(value, 6)];
  
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {rolling ? (
          <motion.div
            key="rolling"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.3, ease: "linear" }}
            className="text-primary/50"
          >
            <Dice6 size={80} />
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: [0, -10, 10, 0] }}
            transition={{ type: "spring", damping: 12 }}
            className="text-primary drop-shadow-xl bg-white rounded-xl"
          >
            <DiceIcon size={80} strokeWidth={1.5} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
