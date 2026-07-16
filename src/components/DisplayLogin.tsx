import React, { useState } from 'react';
import { Tv, ShieldAlert, Lock, Hash, Eye, EyeOff, Loader2, Info, Monitor, MessageSquare } from 'lucide-react';
import { DisplayItem, AdminUser } from '../types';

interface DisplayLoginProps {
  onLoginSuccess: (displayId: string) => void;
  displaysList: DisplayItem[];
  adminUsers: AdminUser[];
}

export default function DisplayLogin({ onLoginSuccess, displaysList = [], adminUsers = [] }: DisplayLoginProps) {
  const [displayIdInput, setDisplayIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const inputId = displayIdInput.trim();
    const inputPass = passwordInput.trim();

    if (!inputId || !inputPass) {
      setError('Semua kolom (ID Layar dan Password) wajib diisi.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // 1. Check if the display ID is registered
      const matchedDisplay = displaysList.find(d => d.id === inputId);

      if (!matchedDisplay) {
        setError('ID Layar tidak terdaftar di Manajemen Layar. Silakan hubungi Administrator untuk mendaftarkannya.');
        setIsLoading(false);
        return;
      }

      // 2. Verify Password (Must be equal to Display ID)
      const isPasswordValid = inputPass === inputId;

      if (!isPasswordValid) {
        setError('Sandi otorisasi salah. Password harus sama dengan ID Layar Anda.');
        setIsLoading(false);
        return;
      }

      // If all passed, successful login!
      onLoginSuccess(inputId);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
      {/* Cinematic grid overlay and glowing light gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute -top-40 right-10 w-96 h-96 rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Logo & Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-[0_0_35px_rgba(59,130,246,0.3)] mb-4 border border-blue-400/20">
            <Tv className="w-8 h-8 animate-pulse text-cyan-300" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white uppercase font-mono">
            Kiosk TV Signage <span className="text-cyan-400 font-bold ml-1 font-sans">Display Login</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-2">
            MENGHUBUNGKAN LAYAR MONITOR SECARA REAL-TIME
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-800/80 rounded-2xl p-7 shadow-2xl relative">
          
          <div className="flex items-center space-x-2 pb-4 mb-5 border-b border-slate-800/60">
            <Monitor className="w-4.5 h-4.5 text-blue-400" />
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Autentikasi Layar Kiosk</h2>
          </div>

          {error && (
            <div className="mb-5 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-rose-400 animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="space-y-1.5 flex-1 leading-relaxed">
                <p className="font-semibold">Otorisasi Gagal</p>
                <p className="text-[11px] text-rose-400/90">{error}</p>
                {error.includes('tidak terdaftar') && (
                  <div className="mt-2.5 pt-2 border-t border-rose-500/15 flex items-center space-x-1.5 text-[10px] text-indigo-400 bg-indigo-500/5 px-2 py-1 rounded-lg">
                    <MessageSquare className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="font-medium">Hubungi Admin Utama untuk menambahkan layar baru</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display ID Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-widest uppercase text-slate-400 block">
                ID Layar (Display ID)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <Hash className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={displayIdInput}
                  onChange={(e) => setDisplayIdInput(e.target.value)}
                  placeholder="Contoh: display_cafeteria, global_state"
                  disabled={isLoading}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors font-mono"
                />
              </div>
            </div>

            {/* Password Input */}
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
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Password"
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
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

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 text-white font-bold text-xs py-3 rounded-xl border border-blue-500/20 shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Mengotorisasi Monitor...</span>
                </>
              ) : (
                <span>Hubungkan Monitor TV ⚡</span>
              )}
            </button>
          </form>

          {/* Info banner */}
          <div className="mt-5 border-t border-slate-800/80 pt-4 flex items-start space-x-2.5 text-[10px] text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Kiosk TV ini harus didaftarkan di Panel Admin sebelum dapat diaktifkan. Gunakan ID dan Nama yang persis sama dengan yang ada di Manajemen Layar. <strong>Password Anda adalah sama dengan ID Layar (Display ID) Anda.</strong>
            </p>
          </div>
        </div>

        {/* Quick Help presets for testing */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
            SIGNAGE STUDIO • DIGITAL OUT-OF-HOME TV
          </p>
        </div>
      </div>
    </div>
  );
}
