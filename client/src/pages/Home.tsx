import { Link } from "wouter";
import { Button } from "@/components/Button";
import { motion } from "framer-motion";
import { Play, BookOpen, Trophy } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-200/50 rounded-full blur-3xl z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-200/50 rounded-full blur-3xl z-0" />

      {/* Navbar */}
      <nav className="relative z-10 px-8 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="text-2xl font-display font-bold text-slate-800">LIFEtune</div>
        <div className="flex gap-4">
          <Button variant="ghost" size="sm">About</Button>
          <Button variant="ghost" size="sm">Rules</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto space-y-8"
        >
          <h1 className="text-6xl md:text-8xl font-display font-black text-slate-900 tracking-tight leading-[0.9]">
            Master Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Financial Life</span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-xl mx-auto leading-relaxed">
            The board game that teaches you about money, careers, and the unexpected twists of life. Will you retire early or build an empire?
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Link href="/game">
              <Button size="xl" className="group min-w-[200px]">
                Start Game
                <Play className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <Button variant="secondary" size="xl" className="min-w-[200px]">
              <BookOpen className="mr-2 w-5 h-5 text-slate-400" />
              How to Play
            </Button>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-24 max-w-5xl mx-auto w-full px-4">
          {[
            { 
              icon: Trophy, 
              title: "Choose Goals", 
              desc: "Pick a life goal like 'Tycoon' or 'Early Retiree' and strategize to win." 
            },
            { 
              icon: BookOpen, 
              title: "Learn Finance", 
              desc: "Understand insurance, investments, and debt management through play." 
            },
            { 
              icon: Play, 
              title: "Quick Sessions", 
              desc: "Perfect for classrooms or quick breaks. Play a full life in 15 minutes." 
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/50 shadow-lg text-left hover:bg-white hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
                <feature.icon size={24} />
              </div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-slate-400 text-sm">
        <p>© 2024 LIFEtune. Built for learning.</p>
      </footer>
    </div>
  );
}
