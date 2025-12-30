import { Divide, Briefcase, Heart, AlertTriangle, TrendingUp, Zap } from "lucide-react";

export type CardType = 'investment' | 'event' | 'interaction' | 'personal';

export interface Card {
  id: string;
  type: CardType;
  title: string;
  description: string;
  cost?: number; // For investments
  value?: number; // Instant effect value
  turnsSkipped?: number;
  effect?: (player: any, players: any[]) => string; // Custom logic description
}

export const JOBS = {
  BLUE_COLLAR: { 
    id: 'blue',
    name: 'Blue Collar', 
    salary: 250, 
    description: 'Steady income, no debt.',
    startDebt: 0,
    startSkip: 0
  },
  WHITE_COLLAR: { 
    id: 'white',
    name: 'White Collar', 
    salary: 400, 
    description: 'Higher salary, but starts with debt and study time.',
    startDebt: 500,
    startSkip: 2
  }
};

export const LIFE_GOALS = [
  { id: 'retire', name: "Early Retiree", desc: "Finish with > $5,000", bonus: 1000, condition: (p: any) => p.money > 5000 },
  { id: 'tycoon', name: "Tycoon", desc: "Own 5+ Investments", bonus: 800, condition: (p: any) => p.investments.length >= 5 },
  { id: 'safe', name: "Safety First", desc: "Have Insurance", bonus: 500, condition: (p: any) => p.insurance },
  { id: 'saver', name: "Penny Pincher", desc: "Spend < $1000 on cards", bonus: 600, condition: (p: any) => true }, // Simplified for demo
];

export const GAME_CARDS: Card[] = [
  // Investments
  { id: 'inv_1', type: 'investment', title: 'Big Company', description: 'Established market leader.', cost: 300 },
  { id: 'inv_2', type: 'investment', title: 'Startup', description: 'High risk, high reward potential.', cost: 500 },
  { id: 'inv_3', type: 'investment', title: 'Bonds', description: 'Steady debt security.', cost: 200 },
  { id: 'inv_4', type: 'investment', title: 'Bank', description: 'Traditional savings account.', cost: 100 },
  { id: 'inv_5', type: 'investment', title: 'Big Company', description: 'Established market leader.', cost: 300 },
  { id: 'inv_6', type: 'investment', title: 'Startup', description: 'High risk, high reward potential.', cost: 500 },
  { id: 'inv_7', type: 'investment', title: 'Bonds', description: 'Steady debt security.', cost: 200 },
  { id: 'inv_8', type: 'investment', title: 'Bank', description: 'Traditional savings account.', cost: 100 },
  
  // Events (Economic)
  { id: 'evt_1', type: 'event', title: 'Tax Refund', description: 'Unexpected bonus from the IRS.', value: 200 },
  { id: 'evt_2', type: 'event', title: 'Car Repair', description: 'Your transmission broke down.', value: -300 },
  { id: 'evt_3', type: 'event', title: 'Lottery Win', description: 'Small scratch-off victory!', value: 150 },
  { id: 'evt_4', type: 'event', title: 'Medical Bill', description: 'Emergency room visit.', value: -400 },
  
  // Personal
  { id: 'pers_1', type: 'personal', title: 'Sick Day', description: 'Flu season hits hard.', turnsSkipped: 1 },
  { id: 'pers_2', type: 'personal', title: 'Vacation', description: 'Taking a break to recharge.', value: -200, turnsSkipped: 1 },
  { id: 'pers_3', type: 'personal', title: 'Promotion', description: 'Hard work pays off! One-time bonus.', value: 500 },
  
  // Interaction
  { id: 'int_1', type: 'interaction', title: 'Birthday Gift', description: 'Give $50 to each other player.', value: -50 },
  { id: 'int_2', type: 'interaction', title: 'Community Service', description: 'Skip a turn to help others.', turnsSkipped: 1 },
];

export const getIconForType = (type: CardType) => {
  switch (type) {
    case 'investment': return TrendingUp;
    case 'event': return Zap;
    case 'interaction': return Users;
    case 'personal': return Heart;
    default: return AlertTriangle;
  }
};

import { Users } from "lucide-react";
