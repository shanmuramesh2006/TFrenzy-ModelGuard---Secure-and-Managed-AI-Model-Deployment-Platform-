import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Smartphone,
  Award,
  ShieldOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Zap
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [hardwareKeySimulation, setHardwareKeySimulation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  setErrorMsg('');
  setIsLoading(true);

  try {
    const success = await login(
      email,
      password,
      selectedRole
    );

    if (!success) {
      setErrorMsg(
        'Invalid email or password. On first login, password must contain at least 12 characters with uppercase, lowercase, number, and special character.'
      );
      return;
    }
  } catch (error) {
    console.error('Login failed:', error);
    setErrorMsg('Unable to authenticate. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-[#030712] text-[#9CA3AF] flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans select-none">
      {/* Background radial glows & cyber grid overlay */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#00F0FF]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#8B5CF6]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#2563EB]/10 rounded-full blur-[160px] pointer-events-none" />
      
      {/* Subtle background tech grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B15_1px,transparent_1px),linear-gradient(to_bottom,#1E293B15_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

      {/* Main 2-Column Desktop / Responsive Container */}
      <div className="w-full max-w-6xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto">
        
        {/* ==================== LEFT COLUMN: BRANDING & CYBERSECURITY VISUAL ==================== */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-8 py-2">
          
          {/* Top Branding Header */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00F0FF] via-[#2563EB] to-[#8B5CF6] p-[1.5px] shadow-lg shadow-[#00F0FF]/20 shrink-0">
                <div className="w-full h-full bg-[#070B19] rounded-[14px] flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-[#00F0FF]" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                  TFrenzy
                </h2>
                <p className="text-sm font-extrabold text-[#00FFD1] tracking-wider uppercase font-mono">
                  ModelGuard
                </p>
              </div>
            </div>

            {/* Outlined Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-mono font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#00F0FF]" />
              <span>Secure AI. Trusted Deployment.</span>
            </div>

            {/* Main Hero Heading */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                Protect Your AI Models.
                <br />
                Deploy with{' '}
                <span className="bg-gradient-to-r from-[#00F0FF] via-[#3B82F6] to-[#A855F7] bg-clip-text text-transparent">
                  Confidence.
                </span>
              </h1>
              <p className="text-base sm:text-lg font-bold text-[#E2E8F0]">
                Encrypted. Authorized. Controlled.
              </p>
              <p className="text-sm text-[#94A3B8]">
                AI model deployment made secure and simple.
              </p>
            </div>
          </div>

          {/* Holographic Security Visual (Shield, Pedestal, Digital Mesh) */}
          <div className="relative py-4 flex items-center justify-center min-h-[220px]">
            {/* Background Mesh Wave SVG */}
            <svg
              className="absolute inset-0 w-full h-full overflow-visible pointer-events-none opacity-40"
              viewBox="0 0 500 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 0 160 Q 125 80 250 140 T 500 100"
                stroke="url(#grid-gradient-1)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <path
                d="M 0 140 Q 125 180 250 110 T 500 150"
                stroke="url(#grid-gradient-2)"
                strokeWidth="1.5"
              />
              <path
                d="M 0 120 Q 150 40 300 130 T 500 80"
                stroke="url(#grid-gradient-1)"
                strokeWidth="1"
              />
              <defs>
                <linearGradient id="grid-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#2563EB" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="grid-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#00F0FF" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#00FFD1" stopOpacity="0.8" />
                </linearGradient>
              </defs>
            </svg>

            {/* Glowing 3D Pedestal & Hologram Shield */}
            <div className="relative flex flex-col items-center justify-center z-10">
              
              {/* Floating Shield Graphic */}
              <div className="relative w-28 h-28 flex items-center justify-center animate-bounce-slow">
                {/* Shield Glow halo */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#00F0FF] via-[#2563EB] to-[#8B5CF6] rounded-full blur-xl opacity-60 animate-pulse" />
                
                {/* Holographic Shield Container */}
                <svg className="w-24 h-24 relative z-10 filter drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]" viewBox="0 0 100 120" fill="none">
                  {/* Outer Shield Outline */}
                  <path
                    d="M 50 10 L 85 25 C 85 70 50 105 50 105 C 50 105 15 70 15 25 Z"
                    fill="url(#shield-bg)"
                    stroke="url(#shield-border)"
                    strokeWidth="2.5"
                  />
                  {/* Inner Tech Grid Lines */}
                  <path
                    d="M 50 20 L 75 32 C 75 65 50 90 50 90 C 50 90 25 65 25 32 Z"
                    stroke="#00F0FF"
                    strokeWidth="1"
                    strokeOpacity="0.4"
                    strokeDasharray="2 2"
                  />
                  {/* Center Padlock Icon */}
                  <rect x="40" y="55" width="20" height="18" rx="3" fill="#00F0FF" />
                  <path
                    d="M 44 55 V 48 C 44 44.6863 46.6863 42 50 42 C 53.3137 42 56 44.6863 56 48 V 55"
                    stroke="#00F0FF"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle cx="50" cy="62" r="2" fill="#070B19" />
                  
                  <defs>
                    <linearGradient id="shield-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.25" />
                      <stop offset="50%" stopColor="#2563EB" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.3" />
                    </linearGradient>
                    <linearGradient id="shield-border" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00F0FF" />
                      <stop offset="50%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Multi-Ring Cyber Pedestal Base */}
              <div className="relative -mt-3 w-44 h-12 flex items-center justify-center">
                {/* Outer Ring */}
                <div className="absolute w-40 h-10 rounded-[100%] border border-[#00F0FF]/50 bg-[#00F0FF]/5 shadow-[0_0_20px_rgba(0,240,255,0.3)] transform rotate-x-60" />
                {/* Middle Ring */}
                <div className="absolute w-28 h-7 rounded-[100%] border border-[#8B5CF6]/60 bg-[#8B5CF6]/10 transform rotate-x-60" />
                {/* Inner Ring */}
                <div className="absolute w-16 h-4 rounded-[100%] border-2 border-[#00FFD1] bg-[#00FFD1]/20 shadow-[0_0_15px_rgba(0,255,209,0.5)] transform rotate-x-60" />
              </div>
            </div>
          </div>

          {/* Bottom Security Feature Indicators (4 items) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            
            <div className="bg-[#090D1A]/80 border border-[#1E2638] rounded-xl p-3 flex flex-col items-center text-center space-y-1.5 hover:border-[#00F0FF]/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">
                Encrypted Storage
              </span>
            </div>

            <div className="bg-[#090D1A]/80 border border-[#1E2638] rounded-xl p-3 flex flex-col items-center text-center space-y-1.5 hover:border-[#00F0FF]/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">
                Device Authorized
              </span>
            </div>

            <div className="bg-[#090D1A]/80 border border-[#1E2638] rounded-xl p-3 flex flex-col items-center text-center space-y-1.5 hover:border-[#00F0FF]/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">
                License Controlled
              </span>
            </div>

            <div className="bg-[#090D1A]/80 border border-[#1E2638] rounded-xl p-3 flex flex-col items-center text-center space-y-1.5 hover:border-[#00F0FF]/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
                <ShieldOff className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">
                Tamper Proof
              </span>
            </div>

          </div>

          {/* Bottom Motto */}
          <div className="flex items-center gap-2 text-xs text-[#94A3B8] font-mono pt-1">
            <CheckCircle2 className="w-4 h-4 text-[#00FFD1] shrink-0" />
            <span>Your models. Your rules. Our security.</span>
          </div>

        </div>

        {/* ==================== RIGHT COLUMN: PREMIUM LOGIN CARD ==================== */}
        <div className="lg:col-span-6 flex justify-center w-full">
          <div className="w-full max-w-md bg-[#0A0E1A]/85 border border-[#1E2638] hover:border-[#2D3A54] transition-all rounded-3xl p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative overflow-hidden">
            
            {/* Subtle card glow accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#00F0FF]/10 to-transparent rounded-full pointer-events-none" />

            {/* Top Shield Logo Centered */}
            <div className="flex flex-col items-center text-center space-y-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00F0FF] via-[#2563EB] to-[#8B5CF6] p-[1.5px] shadow-lg shadow-[#00F0FF]/25">
                <div className="w-full h-full bg-[#070B19] rounded-[14px] flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-[#00F0FF]" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Welcome Back
                </h2>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Sign in to access your ModelGuard portal
                </p>
              </div>

              {/* Horizontal Divider with Lock Icon */}
              <div className="w-full flex items-center justify-center my-2 relative">
                <div className="w-full border-t border-[#1E2638]" />
                <div className="absolute bg-[#0A0E1A] px-2 text-[#64748B]">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Error Message display */}
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Role Authority Level Quick Switcher */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono">
                    Session Authority
                  </label>
                  <span className="text-[10px] text-[#00F0FF] font-mono font-semibold">
                    {selectedRole === 'admin' ? 'LEVEL_5_ROOT' : selectedRole === 'security_auditor' ? 'AUDITOR' : 'OPERATOR'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#050814] border border-[#1E2638] rounded-xl font-mono">
                  <button
                    type="button"
                    onClick={() => {setSelectedRole('security_auditor');}}
                    className={`py-1.5 px-2 text-[10px] rounded-lg text-center font-bold transition-all ${
                      selectedRole === 'admin'
                        ? 'bg-gradient-to-r from-[#00F0FF]/20 to-[#2563EB]/20 border border-[#00F0FF] text-[#00F0FF] shadow-sm'
                        : 'text-[#64748B] hover:text-white'
                    }`}
                  >
                    Root Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedRole('security_auditor');}}
                    className={`py-1.5 px-2 text-[10px] rounded-lg text-center font-bold transition-all ${
                      selectedRole === 'security_auditor'
                        ? 'bg-gradient-to-r from-[#00F0FF]/20 to-[#2563EB]/20 border border-[#00F0FF] text-[#00F0FF] shadow-sm'
                        : 'text-[#64748B] hover:text-white'
                    }`}
                  >
                    Auditor
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedRole('field_operator');}}
                    className={`py-1.5 px-2 text-[10px] rounded-lg text-center font-bold transition-all ${
                      selectedRole === 'field_operator'
                        ? 'bg-gradient-to-r from-[#00F0FF]/20 to-[#2563EB]/20 border border-[#00F0FF] text-[#00F0FF] shadow-sm'
                        : 'text-[#64748B] hover:text-white'
                    }`}
                  >
                    Operator
                  </button>
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#CBD5E1]">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    className="w-full bg-[#050814]/90 border border-[#1E2638] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#00F0FF] font-sans transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#CBD5E1]">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full bg-[#050814]/90 border border-[#1E2638] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#00F0FF] font-sans transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Gradient Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-gradient-to-r from-[#00FFD1] via-[#2563EB] to-[#8B5CF6] hover:opacity-95 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00F0FF]/20 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Footer Note */}
            <div className="mt-6 pt-2 text-center flex items-center justify-center gap-1.5 text-xs text-[#64748B]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00FFD1]" />
              <span>Protected by TFrenzy ModelGuard</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
