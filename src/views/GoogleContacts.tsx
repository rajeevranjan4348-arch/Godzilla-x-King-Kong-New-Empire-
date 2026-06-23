import React, { useState, useEffect } from 'react';
import { getAccessToken, googleSignIn, initAuth, logout } from '../services/firebaseAuth';
import { RiContactsBook2Line, RiUserLine, RiMailLine, RiLoader4Line } from 'react-icons/ri';
import type { User } from 'firebase/auth';

export default function GoogleContactsView() {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setNeedsAuth(false);
        setUser(user);
        setToken(token);
        fetchContacts(token);
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
        fetchContacts(result.accessToken);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchContacts = async (authToken: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,photos&pageSize=100', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.connections) {
        setContacts(data.connections);
      }
    } catch (e) {
      console.error('Failed to fetch contacts', e);
    }
    setIsLoading(false);
  };
  
  if (needsAuth) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0a0a0a] text-zinc-300 p-8">
        <RiContactsBook2Line className="text-6xl text-emerald-500 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Connect Google Contacts</h2>
        <p className="text-zinc-500 mb-8 text-center max-w-sm">Access your Google Contacts directory securely.</p>
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

  const filteredContacts = contacts.filter(contact => {
    const name = contact.names?.[0]?.displayName || '';
    const email = contact.emailAddresses?.[0]?.value || '';
    const term = searchQuery.toLowerCase();
    return name.toLowerCase().includes(term) || email.toLowerCase().includes(term);
  });

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0a] text-zinc-300">
      <div className="p-6 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <RiContactsBook2Line className="text-2xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Contacts</h2>
            <div className="text-sm text-zinc-500">{contacts.length} Contacts</div>
          </div>
        </div>
        <button onClick={() => logout()} className="text-xs text-zinc-500 hover:text-white px-4 py-2 border border-white/10 rounded-full">
          Logout
        </button>
      </div>

      <div className="p-6 pb-0">
        <input 
          type="text" 
          placeholder="Search contacts..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-emerald-500">
            <RiLoader4Line className="animate-spin text-4xl mb-4" />
            <span className="text-zinc-500 text-sm">Syncing contacts...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact, i) => {
              const name = contact.names?.[0]?.displayName || 'Unknown Name';
              const email = contact.emailAddresses?.[0]?.value || 'No email';
              const photo = contact.photos?.[0]?.url;

              return (
                <div key={contact.resourceName || i} className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-emerald-500/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 shrink-0 overflow-hidden">
                    {photo ? (
                      <img src={photo} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500">
                        <RiUserLine />
                      </div>
                    )}
                  </div>
                  <div className="truncate">
                    <div className="font-bold truncate">{name}</div>
                    <div className="text-xs text-zinc-400 flex items-center gap-1 mt-1 truncate">
                      <RiMailLine className="shrink-0" /> {email}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
