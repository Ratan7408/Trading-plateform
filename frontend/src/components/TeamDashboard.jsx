import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TeamDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
    { 
      id: 'home', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ), 
      label: 'Home' 
    },
    { 
      id: 'signal', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ), 
      label: 'Signal' 
    },
    { 
      id: 'team', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ), 
      label: 'Team' 
    },
    { 
      id: 'assets', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ), 
      label: 'Assets' 
    },
    { 
      id: 'profile', 
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ), 
      label: 'Account' 
    }
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    navigate(`/${tabId}`);
  };

  return (
    <div className="min-h-screen text-white pb-20" style={{ backgroundColor: '#121818' }}>
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg">Team Network</h1>
            <p className="text-gray-400 text-sm">Build Your Community</p>
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
        <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium">Your Referral Code</h3>
            <span className="text-gray-400">📤</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="bg-gray-700 rounded-lg px-4 py-3 flex-1 mr-3">
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
            <span className="text-gray-400">👑</span>
          </div>
          <div className="space-y-3">
            {teamLevels.map((level) => (
              <div key={level.level} className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 bg-gradient-to-br ${level.color} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-bold">{level.level}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Level {level.level}</p>
                    <p className="text-gray-400 text-sm">{level.members} members ({level.active} active)</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{level.commission} Commission</span>
                  <span className="text-gray-400">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Members */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-white font-medium">Recent Members</span>
            <span className="text-gray-400">👥</span>
          </div>
          <div className="space-y-3">
            {recentMembers.map((member, index) => (
              <div key={index} className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{member.id}</p>
                  <p className="text-gray-400 text-sm">Level {member.level}</p>
                </div>
                <span className="text-green-400 text-sm">{member.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm border-t border-gray-700">
        <div className="flex justify-around py-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'text-teal-400' 
                  : 'text-gray-400 hover:text-gray-300'
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
