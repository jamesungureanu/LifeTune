import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useLocation } from "wouter";
import { 
  GAME_CARDS, JOBS, LIFE_GOALS, 
  type Card, type CardType 
} from "@/lib/game-data";
import { Button } from "@/components/Button";
import { CardDisplay } from "@/components/CardDisplay";
import { PlayerBadge } from "@/components/PlayerBadge";
import { Dice } from "@/components/Dice";
import { useCreateGameSession } from "@/hooks/use-game-sessions";
import { 
  DollarSign, Shield, ArrowRight, AlertCircle, 
  CheckCircle2, Trophy, Briefcase, GraduationCap 
} from "lucide-react";

// --- Game Types ---
type GameState = 'setup_count' | 'setup_jobs' | 'playing' | 'ended';
type TurnPhase = 'collect' | 'premium' | 'action' | 'decision' | 'end';

interface Player {
  id: number;
  name: string;
  money: number;
  job: typeof JOBS.BLUE_COLLAR | typeof JOBS.WHITE_COLLAR | null;
  insurance: boolean;
  investments: Card[];
  lifeGoal: typeof LIFE_GOALS[0] | null;
  skipTurns: number;
  hasLoan: boolean; // From white collar debt
}

interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'danger' | 'warning';
  timestamp: number;
}

export default function Game() {
  const [_, setLocation] = useLocation();
  const saveSession = useCreateGameSession();

  // State
  const [gameState, setGameState] = useState<GameState>('setup_count');
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('collect');
  const [players, setPlayers] = useState<Player[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [pendingInvestment, setPendingInvestment] = useState<Card | null>(null);
  const [gameLog, setGameLog] = useState<LogEntry[]>([]);
  
  // Animation/Visual State
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [lastDrawnCard, setLastDrawnCard] = useState<Card | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Derived
  const currentPlayer = players[currentPlayerIdx];
  const isSetup = gameState.startsWith('setup');

  // --- Helpers ---
  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setGameLog(prev => [{ message, type, timestamp: Date.now() }, ...prev]);
  };

  const shuffleDeck = () => {
    const shuffled = [...GAME_CARDS]
      .sort(() => Math.random() - 0.5)
      // Duplicate some cards for a longer game if needed, or just use base set
      .concat([...GAME_CARDS].sort(() => Math.random() - 0.5)); 
    setDeck(shuffled);
  };

  // --- Game Actions ---

  const startGame = (playerCount: number) => {
    const newPlayers: Player[] = Array.from({ length: playerCount }, (_, i) => ({
      id: i,
      name: `Player ${i + 1}`,
      money: 1200,
      job: null,
      insurance: false,
      investments: [],
      lifeGoal: null,
      skipTurns: 0,
      hasLoan: false
    }));
    
    setPlayers(newPlayers);
    setGameState('setup_jobs');
    setCurrentPlayerIdx(0);
  };

  const assignJob = (jobId: 'blue' | 'white') => {
    const job = jobId === 'blue' ? JOBS.BLUE_COLLAR : JOBS.WHITE_COLLAR;
    const goal = LIFE_GOALS[Math.floor(Math.random() * LIFE_GOALS.length)]; // Random goal

    setPlayers(prev => prev.map((p, i) => {
      if (i !== currentPlayerIdx) return p;
      return {
        ...p,
        job,
        lifeGoal: goal,
        skipTurns: job.startSkip,
        hasLoan: job.startDebt > 0,
        money: p.money - job.startDebt // Pay for education immediately or track as debt? Let's deduct.
      };
    }));

    addLog(`${players[currentPlayerIdx].name} assigned life goal: ${goal.name}`, 'info');

    if (currentPlayerIdx < players.length - 1) {
      setCurrentPlayerIdx(prev => prev + 1);
    } else {
      // All players set up
      setCurrentPlayerIdx(0);
      shuffleDeck();
      setGameState('playing');
      setTurnPhase('collect');
      addLog("Game Started! Good luck everyone.", "success");
      // Initial collect phase trigger for P1 handled by effect or manual start?
      // Let's rely on the UI to guide the first collect.
    }
  };

  const handleCollectPhase = () => {
    if (currentPlayer.skipTurns > 0) {
      addLog(`${currentPlayer.name} skips this turn.`, 'warning');
      setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, skipTurns: p.skipTurns - 1 } : p));
      endTurn();
      return;
    }

    const salary = currentPlayer.job?.salary || 0;
    setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, money: p.money + salary } : p));
    addLog(`${currentPlayer.name} collected salary $${salary}.`, 'success');
    setTurnPhase('premium');
  };

  const handlePremiumPhase = (pay: boolean) => {
    if (pay && currentPlayer.insurance) {
      setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, money: p.money - 50 } : p));
      addLog(`${currentPlayer.name} paid $50 insurance premium.`, 'info');
    } else if (pay && !currentPlayer.insurance) {
      // Should not happen via UI, but safe guard
    } else {
       addLog(`${currentPlayer.name} skipped insurance payment. Warning: You are at risk!`, 'warning');
       // Logic: Could remove insurance if they don't pay? Let's keep it simple: must pay to keep active?
       // For simplicity of this version: Skipping payment creates risk or removes it?
       // Let's say: If you skip payment, you lose insurance.
       if (currentPlayer.insurance) {
         setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, insurance: false } : p));
         addLog(`${currentPlayer.name} lost insurance coverage!`, 'danger');
       }
    }
    setTurnPhase('action');
  };

  const buyInsurance = () => {
    if (currentPlayer.money >= 200) {
      setPlayers(prev => prev.map((p, i) => i === currentPlayerIdx ? { ...p, money: p.money - 200, insurance: true } : p));
      addLog(`${currentPlayer.name} bought insurance for $200.`, 'success');
    } else {
      addLog("Not enough money for insurance.", 'danger');
    }
  };

  const drawCard = () => {
    if (deck.length === 0) {
      endGame();
      return;
    }

    const newDeck = [...deck];
    const card = newDeck.pop()!;
    setDeck(newDeck);
    setLastDrawnCard(card);

    if (card.type === 'investment') {
      if (currentPlayer.money >= (card.cost || 0)) {
        setPendingInvestment(card);
        setTurnPhase('decision');
      } else {
        addLog(`${currentPlayer.name} drew ${card.title} but can't afford $${card.cost}.`, 'warning');
        setTurnPhase('end');
      }
    } else {
      // Immediate effect
      applyCardEffect(card);
      setTurnPhase('end');
    }
  };

  const applyCardEffect = (card: Card) => {
    let moneyChange = card.value || 0;
    let skips = card.turnsSkipped || 0;

    // Insurance logic
    if (card.type === 'event' && moneyChange < 0 && currentPlayer.insurance) {
      addLog(`${currentPlayer.name} used insurance to cover ${card.title}!`, 'success');
      moneyChange = 0; 
    }

    // Interaction logic (e.g., Birthday Gift -50)
    if (card.type === 'interaction') {
        // Simple implementation of 'birthday gift': Pay $50 to bank (simplified) or other players?
        // Prompt implies "interaction". Let's assume simplified: Just effect on player for MVP.
        // OR: "Give $50 to each player"
        if (card.title === "Birthday Gift") {
            const giftAmount = 50;
            const totalGift = giftAmount * (players.length - 1);
            if (currentPlayer.money >= totalGift) {
                 moneyChange = -totalGift;
                 setPlayers(prev => prev.map((p, i) => {
                     if (i === currentPlayerIdx) return p; // Wait to update current
                     return { ...p, money: p.money + giftAmount };
                 }));
                 addLog(`${currentPlayer.name} gave $50 to everyone!`, 'info');
            }
        }
    }

    setPlayers(prev => prev.map((p, i) => {
      if (i !== currentPlayerIdx) return p;
      return { 
        ...p, 
        money: p.money + moneyChange,
        skipTurns: p.skipTurns + skips
      };
    }));

    addLog(`${currentPlayer.name} drew ${card.title}: ${card.description}`, moneyChange > 0 ? 'success' : moneyChange < 0 ? 'danger' : 'info');
  };

  const handleInvestmentChoice = (buy: boolean) => {
    if (buy && pendingInvestment) {
      setPlayers(prev => prev.map((p, i) => {
        if (i !== currentPlayerIdx) return p;
        return {
          ...p,
          money: p.money - (pendingInvestment.cost || 0),
          investments: [...p.investments, pendingInvestment]
        };
      }));
      addLog(`${currentPlayer.name} invested in ${pendingInvestment.title}!`, 'success');
    } else {
      addLog(`${currentPlayer.name} passed on the investment.`, 'info');
    }
    setPendingInvestment(null);
    setTurnPhase('end');
  };

  const endTurn = () => {
    if (deck.length === 0) {
      endGame();
      return;
    }
    setLastDrawnCard(null);
    setCurrentPlayerIdx((prev) => (prev + 1) % players.length);
    setTurnPhase('collect');
  };

  const endGame = () => {
    setGameState('ended');
    setIsRolling(true);
    addLog("Game Over! Rolling for investment liquidation...", 'info');
    
    setTimeout(() => {
        // Liquidation Logic
        const finalPlayers = players.map(p => {
            let liquidationTotal = 0;
            const rolls: number[] = [];
            
            // Calculate investments
            p.investments.forEach(inv => {
                const roll = Math.floor(Math.random() * 8) + 1; // 1-8
                rolls.push(roll);
                
                let value = 0;
                const title = inv.title.toLowerCase();
                
                if (title.includes('big company')) {
                    if (roll <= 2) value = 0;
                    else if (roll <= 6) value = 500;
                    else value = 900;
                } else if (title.includes('startup')) {
                    if (roll <= 6) value = 0;
                    else value = 2000;
                } else if (title.includes('bond')) {
                    if (roll === 1) value = 0;
                    else value = 400;
                } else if (title.includes('bank')) {
                    if (roll === 1) value = 0;
                    else value = 200;
                } else {
                    // Fallback for any other investment types
                    value = (inv.cost || 0) * (roll / 4);
                }
                
                liquidationTotal += value;
            });

            if (p.investments.length > 0) {
              addLog(`${p.name} rolled for investments: ${rolls.join(', ')}`, 'info');
            }

            const finalMoney = p.money + liquidationTotal;
            
            // Goal Bonus
            let bonus = 0;
            if (p.lifeGoal && p.lifeGoal.condition({ ...p, money: finalMoney })) {
                bonus = p.lifeGoal.bonus;
            }

            return {
                ...p,
                finalMoney: finalMoney + bonus,
                liquidationValue: liquidationTotal,
                goalBonus: bonus
            };
        }).sort((a, b) => b.finalMoney - a.finalMoney); // Sort by winner

        // Save session
        saveSession.mutate({
          players: finalPlayers,
          winner: finalPlayers[0].name,
          playedAt: new Date().toISOString()
        });

        // @ts-ignore - hacking the type for display purposes in the end screen
        setPlayers(finalPlayers); 
        setIsRolling(false);
        setShowConfetti(true);
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    }, 2000);
  };


  // --- Render Helpers ---

  if (gameState === 'setup_count') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8">
            <h1 className="text-6xl font-display text-primary rotate-[-5deg]">LIFEtune</h1>
            <div className="bg-white p-8 rounded-3xl shadow-2xl border-b-8 border-slate-200">
                <h2 className="text-2xl mb-6">How many players?</h2>
                <div className="grid grid-cols-3 gap-4">
                    {[2, 3, 4].map(num => (
                        <Button key={num} onClick={() => startGame(num)} size="xl" variant="secondary">
                            {num}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
      </div>
    );
  }

  if (gameState === 'setup_jobs') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-2xl w-full">
              <h2 className="text-3xl text-center mb-4 font-display">
                  <span className="text-primary">{currentPlayer.name}</span>, choose your path!
              </h2>
              {currentPlayer.lifeGoal && (
                  <div className="mb-8 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-3xl text-center">
                      <p className="text-sm uppercase tracking-widest text-yellow-600 font-bold mb-1">Your Life Goal</p>
                      <h3 className="text-2xl font-bold text-yellow-900 mb-2">{currentPlayer.lifeGoal.name}</h3>
                      <p className="text-slate-600 italic">"{currentPlayer.lifeGoal.desc}"</p>
                  </div>
              )}
              <div className="grid md:grid-cols-2 gap-6">
                  {/* Blue Collar */}
                  <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-blue-100 hover:border-blue-400 transition-colors cursor-pointer group"
                       onClick={() => assignJob('blue')}>
                      <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Briefcase className="text-blue-600" size={32} />
                      </div>
                      <h3 className="text-2xl mb-2 text-blue-900">Blue Collar</h3>
                      <p className="text-slate-600 mb-4 h-12">Start earning immediately with no debt.</p>
                      <ul className="space-y-2 text-sm text-slate-500 mb-6">
                          <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> Salary: $250</li>
                          <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> Start Debt: $0</li>
                      </ul>
                      <Button className="w-full" variant="outline">Select Career</Button>
                  </div>

                  {/* White Collar */}
                  <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-purple-100 hover:border-purple-400 transition-colors cursor-pointer group"
                       onClick={() => assignJob('white')}>
                      <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <GraduationCap className="text-purple-600" size={32} />
                      </div>
                      <h3 className="text-2xl mb-2 text-purple-900">White Collar</h3>
                      <p className="text-slate-600 mb-4 h-12">Higher potential salary, but starts with debt.</p>
                      <ul className="space-y-2 text-sm text-slate-500 mb-6">
                          <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> Salary: $400</li>
                          <li className="flex items-center gap-2"><AlertCircle size={16} className="text-orange-500"/> Start Debt: $500</li>
                      </ul>
                      <Button className="w-full" variant="outline">Select Career</Button>
                  </div>
              </div>
          </div>
      </div>
    );
  }

  if (gameState === 'ended') {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center">
         {isRolling ? (
             <div className="text-center">
                 <Dice value={6} rolling={true} />
                 <h2 className="text-2xl mt-8 animate-pulse text-slate-600">Calculating Market Returns...</h2>
             </div>
         ) : (
             <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-8 rounded-3xl shadow-2xl max-w-4xl w-full border-t-8 border-primary"
             >
                 <div className="text-center mb-10">
                    <Trophy className="mx-auto text-yellow-500 mb-4" size={64} />
                    <h1 className="text-4xl md:text-5xl font-display mb-2">Game Over!</h1>
                    <p className="text-slate-500 text-lg">Here are the final standings</p>
                 </div>

                 <div className="space-y-4">
                     {players.map((p: any, idx) => (
                         <div key={p.id} className={cn(
                             "flex items-center p-4 rounded-xl border-2",
                             idx === 0 ? "bg-yellow-50 border-yellow-200" : "bg-slate-50 border-slate-100"
                         )}>
                             <div className="w-12 h-12 flex items-center justify-center font-bold text-2xl text-slate-400 mr-4">
                                 {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                             </div>
                             <div className="flex-1">
                                 <h3 className="text-xl font-bold">{p.name}</h3>
                                 <p className="text-sm text-slate-500">{p.job?.name} • Goal: {p.lifeGoal?.name}</p>
                             </div>
                             <div className="text-right grid grid-cols-2 gap-x-8 gap-y-1 text-sm mr-8">
                                 <span className="text-slate-400">Cash:</span> <span>${p.money}</span>
                                 <span className="text-slate-400">Investments:</span> <span className="text-blue-600">+${Math.round(p.liquidationValue)}</span>
                                 <span className="text-slate-400">Goal Bonus:</span> <span className="text-green-600">+${p.goalBonus}</span>
                             </div>
                             <div className="text-right">
                                 <div className="text-3xl font-bold font-mono text-slate-800">${Math.round(p.finalMoney)}</div>
                             </div>
                         </div>
                     ))}
                 </div>

                 <div className="mt-10 flex justify-center gap-4">
                     <Button onClick={() => window.location.reload()} size="lg">Play Again</Button>
                     <Button onClick={() => setLocation('/')} variant="outline" size="lg">Exit</Button>
                 </div>
             </motion.div>
         )}
      </div>
    );
  }

  // --- PLAYING STATE RENDER ---
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar / Players */}
      <div className="md:w-80 bg-slate-50 border-r border-slate-200 flex flex-col h-auto md:h-screen z-20 shadow-xl">
        <div className="p-6 border-b border-slate-200 bg-white">
          <h1 className="font-display text-2xl text-primary">LIFEtune</h1>
          <div className="text-sm text-slate-400 font-medium mt-1">
             Round {Math.floor((30 - deck.length) / players.length) + 1} • {deck.length} Cards Left
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {players.map((p, i) => (
            <PlayerBadge key={p.id} player={p} isActive={i === currentPlayerIdx} />
          ))}
        </div>

        {/* Game Log Mini */}
        <div className="h-48 bg-slate-100 p-4 border-t border-slate-200 overflow-y-auto">
             <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Recent Activity</h4>
             <div className="space-y-2 text-sm">
                 {gameLog.map((log, i) => (
                     <div key={i} className={cn(
                         "p-2 rounded border-l-4 text-xs",
                         log.type === 'success' && "border-green-400 bg-green-50",
                         log.type === 'danger' && "border-red-400 bg-red-50",
                         log.type === 'warning' && "border-orange-400 bg-orange-50",
                         log.type === 'info' && "border-blue-400 bg-blue-50",
                     )}>
                         {log.message}
                     </div>
                 ))}
             </div>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 relative flex flex-col p-6 overflow-hidden">
         {/* Top Bar Info */}
         <div className="flex justify-between items-center mb-8">
             <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 inline-flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"/>
                 <span className="font-bold text-slate-700">
                     Phase: <span className="text-primary uppercase">{turnPhase}</span>
                 </span>
             </div>
             
             {/* Life Goal Reminder */}
             <div className="bg-white/50 px-4 py-2 rounded-xl text-sm text-slate-600 border border-slate-200">
                 Goal: <strong>{currentPlayer.lifeGoal?.name}</strong> (+${currentPlayer.lifeGoal?.bonus})
             </div>
         </div>

         {/* Center Action Area */}
         <div className="flex-1 flex flex-col items-center justify-center relative">
             
             <AnimatePresence mode="wait">
                 {turnPhase === 'collect' && (
                     <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="text-center"
                     >
                         <div className="mb-6 inline-block p-6 bg-green-100 rounded-full text-green-600">
                             <DollarSign size={48} />
                         </div>
                         <h2 className="text-3xl font-display mb-4">Payday!</h2>
                         <p className="text-slate-600 mb-8 max-w-md">Time to collect your hard-earned cash from your {currentPlayer.job?.name} job.</p>
                         <Button onClick={handleCollectPhase} size="xl" className="shadow-green-200 bg-green-500 hover:bg-green-600 border-green-700">
                             Collect ${currentPlayer.job?.salary}
                         </Button>
                     </motion.div>
                 )}

                 {turnPhase === 'premium' && (
                     <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="bg-white p-8 rounded-3xl shadow-xl border-t-8 border-blue-500 max-w-lg w-full text-center"
                     >
                         <h3 className="text-2xl font-bold mb-4">Insurance Premium</h3>
                         {currentPlayer.insurance ? (
                             <>
                                 <p className="mb-6 text-slate-600">Pay $50 to keep your insurance active? It protects you from unexpected disasters.</p>
                                 <div className="flex justify-center gap-4">
                                     <Button onClick={() => handlePremiumPhase(true)}>Pay $50</Button>
                                     <Button onClick={() => handlePremiumPhase(false)} variant="ghost" className="text-red-500 hover:text-red-600">Skip (Risk it!)</Button>
                                 </div>
                             </>
                         ) : (
                             <div className="text-center">
                                 <p className="mb-6 text-slate-500">You don't have insurance. Nothing to pay.</p>
                                 <Button onClick={() => handlePremiumPhase(false)}>Continue</Button>
                             </div>
                         )}
                     </motion.div>
                 )}

                 {turnPhase === 'action' && (
                     <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-8"
                     >
                         <div className="grid grid-cols-2 gap-8">
                             {/* Deck */}
                             <div onClick={drawCard} className="relative cursor-pointer group">
                                 <div className="w-64 h-80 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl flex items-center justify-center transform group-hover:-translate-y-2 transition-transform border-4 border-white/20">
                                     <span className="text-white font-display text-4xl opacity-80 rotate-[-5deg]">Draw</span>
                                 </div>
                                 <div className="absolute inset-0 bg-indigo-900 rounded-2xl -z-10 translate-y-2 translate-x-2"/>
                                 <div className="absolute inset-0 bg-indigo-900/50 rounded-2xl -z-20 translate-y-4 translate-x-4"/>
                             </div>

                             {/* Shop / Info */}
                             <div className="w-64 h-80 bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between border-2 border-slate-100">
                                 <div>
                                     <h3 className="font-bold text-lg text-slate-800 mb-2">Actions</h3>
                                     <p className="text-sm text-slate-500">Choose to draw a card or manage your assets.</p>
                                 </div>
                                 
                                 {!currentPlayer.insurance && (
                                     <Button 
                                        onClick={buyInsurance} 
                                        variant="outline" 
                                        className="w-full justify-between group"
                                        disabled={currentPlayer.money < 200}
                                     >
                                         <span>Buy Insurance</span>
                                         <span className="bg-slate-100 px-2 py-0.5 rounded text-xs group-hover:bg-white">$200</span>
                                     </Button>
                                 )}
                                 
                                 <div className="text-center text-xs text-slate-400 mt-4">
                                     Drawing ends your action phase.
                                 </div>
                             </div>
                         </div>
                     </motion.div>
                 )}

                 {turnPhase === 'decision' && pendingInvestment && (
                     <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center"
                     >
                         <h2 className="text-2xl font-bold mb-6 text-slate-700">Investment Opportunity!</h2>
                         <CardDisplay card={pendingInvestment} className="mb-8" />
                         <div className="flex gap-4">
                             <Button 
                                onClick={() => handleInvestmentChoice(true)} 
                                variant="success" 
                                size="lg"
                             >
                                Buy for ${pendingInvestment.cost}
                             </Button>
                             <Button 
                                onClick={() => handleInvestmentChoice(false)} 
                                variant="secondary" 
                                size="lg"
                             >
                                Pass
                             </Button>
                         </div>
                     </motion.div>
                 )}

                 {turnPhase === 'end' && (
                     <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                     >
                         {lastDrawnCard && (
                             <div className="mb-8">
                                 <p className="text-slate-500 mb-4 font-bold uppercase tracking-wider">You Drew</p>
                                 <CardDisplay card={lastDrawnCard} />
                             </div>
                         )}
                         <Button onClick={endTurn} size="xl" className="w-full max-w-xs">
                             End Turn <ArrowRight className="ml-2" />
                         </Button>
                     </motion.div>
                 )}
             </AnimatePresence>

         </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
