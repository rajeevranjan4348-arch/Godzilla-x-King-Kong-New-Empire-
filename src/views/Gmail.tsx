import React, { useState, useEffect } from 'react';
import { getAccessToken, googleSignIn, initAuth, logout } from '../services/firebaseAuth';
import { RiMailLine, RiUserLine, RiSendPlaneFill, RiLoader4Line } from 'react-icons/ri';
import type { User } from 'firebase/auth';

export default function GmailView() {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [emails, setEmails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setNeedsAuth(false);
        setUser(user);
        setToken(token);
        fetchEmails(token);
      },
      () => setNeedsAuth(true)
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
        fetchEmails(result.accessToken);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchEmails = async (authToken: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        const emailDetails = await Promise.all(
          data.messages.map(async (msg: any) => {
            const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`, {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            return msgRes.json();
          })
        );
        setEmails(emailDetails);
      } else {
        setEmails([]);
      }
    } catch (e) {
      console.error('Failed to fetch emails', e);
    }
    setIsLoading(false);
  };
  
  if (needsAuth) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0a0a0a] text-zinc-300 p-8 animate-in fade-in zoom-in duration-300">
        <RiMailLine className="text-6xl text-red-500 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Connect Gmail</h2>
        <p className="text-zinc-500 mb-8 text-center max-w-sm">Access your recent emails securely.</p>
        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {isLoggingIn ? <RiLoader4Line className="animate-spin" /> : <RiUserLine />}
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0a] text-zinc-300 animate-in fade-in duration-300">
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <RiMailLine className="text-2xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Gmail</h2>
            <div className="text-sm text-zinc-500">Recent Messages</div>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => { if(token) fetchEmails(token); }} className="text-zinc-400 hover:text-white transition-colors">
            Refresh
          </button>
          <button onClick={() => logout()} className="text-xs text-zinc-500 hover:text-white px-4 py-2 border border-white/10 rounded-full">
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-small">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-500">
            <RiLoader4Line className="animate-spin text-4xl mb-4" />
            <span className="text-zinc-500 text-sm">Fetching emails...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {emails.length === 0 ? (
              <div className="text-center text-zinc-500 mt-10">No recent emails found.</div>
            ) : (
              emails.map((email, i) => {
                const headers = email.payload?.headers || [];
                const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
                const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
                const snippet = email.snippet || '';
                
                return (
                  <div key={email.id || i} className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl flex flex-col gap-2 hover:border-red-500/30 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start gap-4">
                      <div className="font-bold truncate text-white group-hover:text-red-400 transition-colors">
                        {from}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-zinc-200">
                      {subject}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                      {snippet}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
