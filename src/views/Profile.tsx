import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RiUserLine, RiMailLine, RiCalendarLine, RiEdit2Line, RiSaveLine, RiCloseLine } from 'react-icons/ri';
import { useNotificationStore } from '../store/notificationStore';

interface UserProfile {
  name: string;
  email: string;
  bio: string;
  joinedAt: number;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const addNotification = useNotificationStore(state => state.addNotification);

  useEffect(() => {
    const fetchProfile = () => {
      try {
        const savedProfile = localStorage.getItem('iris_profile');
        
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        } else {
          const defaultProfile: UserProfile = {
            name: 'Guest User',
            email: 'guest@iris.local',
            bio: 'Exploring the IRIS system.',
            joinedAt: Date.now()
          };
          localStorage.setItem('iris_profile', JSON.stringify(defaultProfile));
          setProfile(defaultProfile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = () => {
    if (!profile) return;
    
    try {
      const updatedProfile = { ...profile, ...editForm };
      localStorage.setItem('iris_profile', JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      setIsEditing(false);
      addNotification({
        title: 'Profile Updated',
        message: 'Your profile information has been saved.',
        type: 'success'
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      addNotification({
        title: 'Error',
        message: 'Failed to update profile.',
        type: 'error'
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full text-zinc-500 font-mono text-sm">LOADING PROFILE...</div>;
  }

  if (!profile) return null;

  return (
    <div className="flex flex-col h-full bg-black text-zinc-300 font-mono p-6 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold tracking-widest text-white flex items-center gap-3">
            <RiUserLine className="text-emerald-500" />
            USER PROFILE
          </h2>
          {!isEditing ? (
            <button
              onClick={() => {
                setEditForm(profile);
                setIsEditing(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold tracking-widest transition-colors"
            >
              <RiEdit2Line /> EDIT
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold tracking-widest transition-colors"
              >
                <RiCloseLine /> CANCEL
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold tracking-widest transition-colors"
              >
                <RiSaveLine /> SAVE
              </button>
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-32 h-32 bg-zinc-800 rounded-full flex items-center justify-center border-4 border-zinc-900 shadow-xl shrink-0">
              <RiUserLine size={48} className="text-zinc-600" />
            </div>
            
            <div className="flex-1 w-full space-y-6">
              <div>
                <label className="text-[10px] font-bold tracking-widest text-zinc-500 mb-1 block">DISPLAY NAME</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none transition-colors"
                  />
                ) : (
                  <div className="text-xl font-bold text-white">{profile.name}</div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold tracking-widest text-zinc-500 mb-1 block">EMAIL ADDRESS</label>
                <div className="flex items-center gap-2 text-zinc-400">
                  <RiMailLine />
                  {profile.email}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold tracking-widest text-zinc-500 mb-1 block">BIO</label>
                {isEditing ? (
                  <textarea
                    value={editForm.bio || ''}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none transition-colors min-h-[100px] resize-y"
                  />
                ) : (
                  <div className="text-zinc-400 leading-relaxed">{profile.bio}</div>
                )}
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <RiCalendarLine />
                  Joined {new Date(profile.joinedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
