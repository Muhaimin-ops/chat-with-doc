
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogIn, UserPlus, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { ThemeMode, ColorScheme } from './ThemeSwitcher';

interface AuthProps {
  themeMode?: ThemeMode;
  setThemeMode?: (mode: ThemeMode) => void;
  colorScheme?: ColorScheme;
  setColorScheme?: (color: ColorScheme) => void;
}

const Auth: React.FC<AuthProps> = ({ themeMode, setThemeMode, colorScheme, setColorScheme }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)] p-4 transition-colors duration-200">
      <div className="w-full max-w-md p-8 bg-[var(--panel-bg)] rounded-xl shadow-lg border border-[var(--border)] relative">
        
        {/* Logo Placeholder */}
        <div className="flex justify-center mb-6">
           <div className="w-16 h-12 border-2 border-dashed border-[var(--accent)] rounded flex items-center justify-center bg-[var(--accent-dim)]">
             <span className="text-xs text-[var(--accent-text)] font-medium">Logo</span>
           </div>
        </div>

        <h1 className="text-2xl font-bold mb-8 text-center text-[var(--text-primary)] tracking-tight">
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </h1>
        
        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2.5 bg-[var(--element-bg)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors text-sm"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2.5 bg-[var(--element-bg)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors text-sm pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          {!isSignUp && (
             <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="remember" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] bg-[var(--element-bg)] accent-[var(--accent)]"
                />
                <label htmlFor="remember" className="text-sm text-[var(--text-secondary)] cursor-pointer select-none">Remember me</label>
             </div>
          )}

          {error && (
            <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] text-sm p-3 rounded-lg">
              {error}
            </div>
          )}
          {message && (
             <div className="bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)] text-sm p-3 rounded-lg">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[var(--element-hover)] hover:bg-[var(--accent)] text-[var(--text-primary)] hover:text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm border border-[var(--border)] hover:border-transparent"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : isSignUp ? (
              <>
                 Sign Up <ArrowRight size={18} />
              </>
            ) : (
              <>
                 <ArrowRight size={18} /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <button
              onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setMessage(null);
              }}
              className="ml-1 text-[var(--accent-text)] hover:underline focus:outline-none font-medium"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
