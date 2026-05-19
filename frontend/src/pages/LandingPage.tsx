import { useNavigate } from "react-router-dom";
import HeroGeometric from "../components/ui/shape-landing-hero";
import { ChevronRight, TrendingUp } from "lucide-react";

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#030303] overflow-hidden">
            <HeroGeometric 
                badge="Premium Expense Tracker" 
                title1="Wealth Management" 
                title2="Simplified" 
            >
                <div className="flex flex-col items-center gap-6">
                    <button 
                        onClick={() => navigate("/login")}
                        className="group relative px-8 py-4 bg-white text-black font-bold rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/10"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-rose-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                        <span className="relative flex items-center gap-2">
                            Get Started
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                    
                    <div className="flex items-center gap-8 text-white/40 text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            Smart Analytics
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                            Secure Storage
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            Multi-user Support
                        </div>
                    </div>
                </div>
            </HeroGeometric>
        </div>
    );
}
