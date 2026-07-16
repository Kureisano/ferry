import React, { useState } from 'react';
import { Tv, ShieldAlert, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AdminUser } from '../types';

interface AdminLoginProps {
  onLoginSuccess: (username: string) => void;
  adminUsers?: AdminUser[];
}

export default function AdminLogin({ onLoginSuccess, adminUsers = [] }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const inputUser = username.trim().toLowerCase();
    const inputPass = password.trim();

    if (!inputUser || !inputPass) {
      setError('Username dan Password wajib diisi.');
      return;
    }

    setIsLoading(true);

    // Dynamic login verification using live Firestore admin list
    setTimeout(() => {
      let isValid = false;
      let authenticatedUsername = inputUser;

      if (adminUsers.length > 0) {
        // Authenticate against live Firestore accounts list
        const match = adminUsers.find(u => u.username.toLowerCase() === inputUser && u.passwordHash === inputPass);
        if (match) {
          isValid = true;
          authenticatedUsername = match.username;
        }
      } else {
        // Fallback for first-time cold starts if Firestore list is not loaded yet
        if (inputUser === 'admin' && (inputPass === 'admin' || inputPass === 'admin123')) {
          isValid = true;
          authenticatedUsername = 'admin';
        }
      }

      if (isValid) {
        onLoginSuccess(authenticatedUsername);
      } else {
        setError('Kredensial salah. Silakan coba lagi.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Decorative ambient glowing background circles */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Logo & Title Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(99,102,241,0.25)] mb-4">
            <Tv className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-display font-black tracking-tight text-white">
            SignageStudio <span className="text-indigo-400 font-mono text-xs ml-1 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 tracking-wider">PRO</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-2">
            DIGITAL MEDIA SIGNAGE CONTROL & MONITOR
          </p>
        </div>

        {/* Login Box Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-slate-100 mb-6">Otorisasi Administrator</h2>

          {error && (
            <div className="mb-5 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-400">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-widest uppercase text-slate-400 block">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  disabled={isLoading}
                  autoComplete="username"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-widest uppercase text-slate-400 block">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-98 text-white font-bold text-xs py-3.5 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Sandi...</span>
                </>
              ) : (
                <span>Masuk Ke Panel Admin</span>
              )}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800/60"></div>
              <span className="flex-shrink mx-3 text-[10px] font-mono uppercase text-slate-500">atau hubungkan monitor</span>
              <div className="flex-grow border-t border-slate-800/60"></div>
            </div>

            <a
              href="?mode=display"
              className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold text-xs py-3 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md"
            >
              <Tv className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Masuk Sebagai Monitor TV (Kiosk Mode)</span>
            </a>
          </form>

          {/* Preset Credentials Help Bar */}
          <div className="mt-8 border-t border-slate-800/80 pt-5 text-center">
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Gunakan kredensial default berikut untuk pengujian:
            </p>
            <div className="mt-2 inline-flex items-center gap-4 bg-slate-950 border border-slate-850 px-4 py-2 rounded-xl text-xs font-mono text-indigo-400">
              <div>
                <span className="text-[9px] text-slate-500">USER:</span> admin
              </div>
              <div className="text-slate-700">|</div>
              <div>
                <span className="text-[9px] text-slate-500">PASS:</span> admin
              </div>
            </div>
          </div>
        </div>

        {/* Footer info text */}
        <p className="text-center text-[9px] font-mono tracking-widest text-slate-600 mt-6 uppercase">
          SIGNAGE STUDIO • ALL RIGHT RESERVED
        </p>
      </div>
    </div>
  );
}
