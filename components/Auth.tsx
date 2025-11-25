/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogIn, UserPlus } from 'lucide-react';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212] text-[#E2E2E2] p-4">
      <div className="w-full max-w-md p-8 bg-[#1E1E1E] rounded-xl shadow-lg border border-[rgba(255,255,255,0.05)]">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </h1>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#A8ABB4] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[#2C2C2C] border border-[rgba(255,255,255,0.1)] rounded-md focus:outline-none focus:ring-1 focus:ring-[#79B8FF] text-[#E2E2E2]"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#A8ABB4] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#2C2C2C] border border-[rgba(255,255,255,0.1)] rounded-md focus:outline-none focus:ring-1 focus:ring-[#79B8FF] text-[#E2E2E2]"
              required
              minLength={6}
            />
          </div>

          {error && <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded">{error}</div>}
          {message && <div className="text-green-400 text-sm bg-green-900/20 p-2 rounded">{message}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-[#79B8FF]/20 hover:bg-[#79B8FF]/30 text-[#79B8FF] rounded-md font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : isSignUp ? (
              <>
                <UserPlus size={18} /> Sign Up
              </>
            ) : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-[#A8ABB4]">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-1 text-[#79B8FF] hover:underline focus:outline-none"
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
