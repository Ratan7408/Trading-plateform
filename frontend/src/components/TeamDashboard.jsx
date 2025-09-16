import { useState } from 'react';

const TeamDashboard = ({ onTabChange }) => {
  const [activeTab, setActiveTab] = useState('team');

  const teamLevels = [
    { level: 1, members: 7, active: 1, commission: '10%', color: 'from-orange-500 to-red-500' },
    { level: 2, members: 67, active: 11, commission: '0%', color: 'from-purple-500 to-purple-600' },
    { level: 3, members: 106, active: 11, commission: '0%', color: 'from-green-500 to-green-600' }
  ];

  const recentMembers = [
    { id: '9350825580', level: 1, status: '₹0 Inactive' },
    { id: '8383887588', level: 1, status: '₹0 Inactive' },
    { id: '9368409088', level: 1, status: '₹0 Inactive' },
    { id: '8630586185', level: 1, status: '₹0 Inactive' }
  ];

  const navigationItems = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'team', icon: '👥', label: 'Team' },
    { id: 'telegram', icon: '✈️', label: 'Telegram' },
    { id: 'invest', icon: '📊', label: 'Invest' },
    { id: 'profile', icon: '👤', label: 'Profile' }
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    onTabChange(tabId);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg">Team Network</h1>
            <p className="text-slate-400 text-sm">Build Your Community</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex space-x-4 mb-6">
          <div className="flex-1 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">👥</span>
              </div>
              <div>
                <p className="text-white text-2xl font-bold">180</p>
                <p className="text-white/80 text-sm">Total Members</p>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">💰</span>
              </div>
              <div>
                <p className="text-white text-2xl font-bold">₹20600</p>
                <p className="text-white/80 text-sm">Total Earned</p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Code */}
        <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium">Your Referral Code</h3>
            <span className="text-slate-400">📤</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="bg-slate-700 rounded-lg px-4 py-3 flex-1 mr-3">
              <p className="text-green-400 text-lg font-mono">VW8CQ05S</p>
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm mr-2 flex items-center space-x-1">
              <span>📋</span>
              <span>Copy</span>
            </button>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-1">
              <span>📤</span>
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Team Levels */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-white font-medium">Team Levels</span>
            <span className="text-slate-400">👑</span>
          </div>
          <div className="space-y-3">
            {teamLevels.map((level) => (
              <div key={level.level} className="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 bg-gradient-to-br ${level.color} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-bold">{level.level}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Level {level.level}</p>
                    <p className="text-slate-400 text-sm">{level.members} members ({level.active} active)</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{level.commission} Commission</span>
                  <span className="text-slate-400">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Members */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-white font-medium">Recent Members</span>
            <span className="text-slate-400">👥</span>
          </div>
          <div className="space-y-3">
            {recentMembers.map((member, index) => (
              <div key={index} className="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{member.id}</p>
                  <p className="text-slate-400 text-sm">Level {member.level}</p>
                </div>
                <span className="text-green-400 text-sm">{member.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800/90 backdrop-blur-sm border-t border-slate-700">
        <div className="flex justify-around py-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'text-teal-400' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
              {activeTab === item.id && (
                <div className="w-1 h-1 bg-teal-400 rounded-full mt-1"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamDashboard;
