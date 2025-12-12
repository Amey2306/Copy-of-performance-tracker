
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ShieldCheck, User as UserIcon, Briefcase, LayoutDashboard } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

const MOCK_USERS: User[] = [
  { id: 'gm-1', name: 'Rohan (Head of Marketing)', role: UserRole.GM },
  { id: 'sm-1', name: 'Vikram (Cluster Head)', role: UserRole.SM },
  { id: 'mgr-1', name: 'Amey (Project SPOC)', role: UserRole.MANAGER },
  { id: 'mgr-2', name: 'Pratham (Project SPOC)', role: UserRole.MANAGER },
];

export const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [selectedUser, setSelectedUser] = useState<User>(MOCK_USERS[0]);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.GM: return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case UserRole.SM: return <Briefcase className="w-5 h-5 text-amber-400" />;
      case UserRole.MANAGER: return <UserIcon className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-tr from-brand-600 to-brand-400 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20">
            <LayoutDashboard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">GPL Performance Tracker</h1>
          <p className="text-slate-500 text-sm mt-2">Select your role to access the dashboard</p>
        </div>

        <div className="space-y-3">
          {MOCK_USERS.map(user => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all duration-200 group ${selectedUser.id === user.id ? 'bg-slate-800 border-brand-500 shadow-lg shadow-brand-900/20' : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800 hover:border-slate-700'}`}
            >
              <div className={`p-2 rounded-lg ${selectedUser.id === user.id ? 'bg-slate-700' : 'bg-slate-900 group-hover:bg-slate-700'}`}>
                {getRoleIcon(user.role)}
              </div>
              <div className="text-left">
                <div className={`font-bold ${selectedUser.id === user.id ? 'text-white' : 'text-slate-300'}`}>{user.name}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">{user.role}</div>
              </div>
              {selectedUser.id === user.id && (
                <div className="ml-auto w-3 h-3 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => onLogin(selectedUser)}
          className="w-full mt-8 bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-900/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Access Dashboard
        </button>
        
        <div className="mt-6 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">
                {selectedUser.role === UserRole.GM ? 'Full Admin Access' : 
                 selectedUser.role === UserRole.SM ? 'Strategic View & Media Edit' : 'Assigned Project Execution'}
            </p>
        </div>
      </div>
    </div>
  );
};
