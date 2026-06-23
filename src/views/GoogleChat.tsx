import React, { useState, useEffect } from 'react';
import { getAccessToken, googleSignIn, initAuth, logout } from '../services/firebaseAuth';
import { RiWechatLine, RiUserLine, RiSendPlaneFill, RiListUnordered, RiLoader4Line } from 'react-icons/ri';
import type { User } from 'firebase/auth';

export default function GoogleChatView() {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [spaces, setSpaces] = useState<any[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setNeedsAuth(false);
        setUser(user);
        setToken(token);
        fetchSpaces(token);
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
        fetchSpaces(result.accessToken);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchSpaces = async (authToken: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('https://chat.googleapis.com/v1/spaces', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.spaces) {
        setSpaces(data.spaces);
      }
    } catch (e) {
      console.error('Failed to fetch spaces', e);
    }
    setIsLoading(false);
  };

  const fetchMessages = async (spaceName: string) => {
    setSelectedSpace(spaceName);
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      } else {
        setMessages([]);
      }
    } catch (e) {
      console.error('Failed to fetch messages', e);
    }
    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedSpace || !token) return;
    
    // Require user confirmation before sending (destructive/mutating operation rule)
    const confirmed = window.confirm(`Are you sure you want to send this message to the chat?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${selectedSpace}/messages`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: inputText
        })
      });
      if (res.ok) {
        setInputText('');
        fetchMessages(selectedSpace);
      } else {
        console.error('Failed to send message', await res.text());
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (needsAuth) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#0a0a0a] text-zinc-300 p-8">
        <RiWechatLine className="text-6xl text-emerald-500 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Connect Google Chat</h2>
        <p className="text-zinc-500 mb-8 text-center max-w-sm">Access your Google Chat spaces and messages directly within IRIS.</p>
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
    <div className="h-full w-full flex bg-[#0a0a0a] text-zinc-300 overflow-hidden">
      {/* Sidebar: Spaces */}
      <div className="w-64 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2"><RiWechatLine className="text-emerald-500" /> Spaces</h3>
          <button onClick={() => logout()} className="text-xs text-zinc-500 hover:text-white">Logout</button>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {isLoading && !spaces.length && (
            <div className="flex justify-center p-4 text-emerald-500">
              <RiLoader4Line className="animate-spin text-2xl" />
            </div>
          )}
          {spaces.map(space => (
            <button
              key={space.name}
              onClick={() => fetchMessages(space.name)}
              className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedSpace === space.name ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-zinc-900/50'}`}
            >
              <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                {space.type === 'SPACE' ? <RiUserLine /> : <RiUserLine />}
              </div>
              <div className="flex-1 truncate">
                <div className="text-sm font-medium truncate">{space.displayName || 'Direct Message'}</div>
                <div className="text-xs text-zinc-500">{space.type}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main content: Messages */}
      <div className="flex-1 flex flex-col">
        {selectedSpace ? (
          <>
            <div className="p-4 border-b border-white/10">
              <h3 className="font-bold">{spaces.find(s => s.name === selectedSpace)?.displayName || 'Chat'}</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoading && !messages.length && (
                <div className="flex justify-center p-8 text-emerald-500">
                  <RiLoader4Line className="animate-spin text-4xl" />
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.name} className="flex gap-4">
                  <img src={msg.sender?.avatarUrl || `https://ui-avatars.com/api/?name=${msg.sender?.displayName}`} className="w-10 h-10 rounded-full" alt="avatar" />
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-bold">{msg.sender?.displayName}</span>
                      <span className="text-xs text-zinc-500">{new Date(msg.createTime).toLocaleString()}</span>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded-xl rounded-tl-none border border-white/5 inline-block">
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              {!isLoading && messages.length === 0 && (
                <div className="text-center text-zinc-500 mt-10">No messages in this space yet.</div>
              )}
            </div>

            <div className="p-4 bg-zinc-950 border-t border-white/10">
              <div className="relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="w-full bg-zinc-900 border border-white/10 rounded-full py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  onClick={sendMessage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors"
                >
                  <RiSendPlaneFill />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <RiWechatLine className="text-6xl mb-4 opacity-50" />
            <p>Select a space to view messages.</p>
          </div>
        )}
      </div>
    </div>
  );
}
