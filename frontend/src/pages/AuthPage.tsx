import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import HeroGeometric from "../components/ui/shape-landing-hero";
import { TrendingUp } from "lucide-react";

const API_BASE = "/api";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (localStorage.getItem("token")) {
            navigate("/dashboard");
        }
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const endpoint = isLogin ? "/auth/login" : "/auth/register";
            const res = await axios.post(`${API_BASE}${endpoint}`, { username, password });
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("username", res.data.username);
            navigate("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.error || "Something went wrong");
        }
    };

    return (
        <div className="relative min-h-screen bg-[#030303] flex flex-col items-center justify-center p-4">
            <div className="absolute inset-0 z-0">
                <HeroGeometric 
                    badge="SpendWise Auth" 
                    title1={isLogin ? "Welcome" : "Join"} 
                    title2={isLogin ? "Back" : "Us Now"} 
                />
            </div>
            
            <div className="relative z-20 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-rose-500 rounded-2xl rotate-6 shadow-xl shadow-indigo-500/20" />
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20" />
                        <TrendingUp className="relative z-10 text-white w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                        SpendWise
                    </h1>
                </div>

                <h2 className="text-xl font-bold text-white/60 mb-6 text-center uppercase tracking-widest">
                    {isLogin ? "Login" : "Register"}
                </h2>
                
                {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl mb-6 text-sm">{error}</div>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-white/60 text-sm mb-2">Username</label>
                        <input 
                            type="text" 
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="your_username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-white/60 text-sm mb-2">Password</label>
                        <input 
                            type="password" 
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-indigo-600 to-rose-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20"
                    >
                        {isLogin ? "Sign In" : "Create Account"}
                    </button>
                </form>
                
                <p className="text-white/40 text-center mt-6 text-sm">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button 
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                        {isLogin ? "Register" : "Login"}
                    </button>
                </p>
            </div>
        </div>
    );
}
