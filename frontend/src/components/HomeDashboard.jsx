import { useState } from 'react';

const HomeDashboard = ({ onTabChange }) => {
  const [activeTab, setActiveTab] = useState('home');

  const actionCards = [
    { icon: '💰', title: 'Deposit', color: 'from-teal-500 to-cyan-500' },
    { icon: '💸', title: 'Withdraw cash', color: 'from-teal-500 to-cyan-500' },
    { icon: '👥', title: 'Invite friends', color: 'from-teal-500 to-cyan-500' },
    { icon: '💳', title: 'Bank Card', color: 'from-teal-500 to-cyan-500' },
    { icon: '❓', title: 'Instruction', color: 'from-teal-500 to-cyan-500' },
    { icon: '📞', title: 'Help', color: 'from-teal-500 to-cyan-500' }
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
      <div className="flex justify-between items-center p-4 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="text-white font-semibold text-lg">Coral</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
            <span className="text-slate-300 text-sm">📅</span>
          </div>
          <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
            <span className="text-slate-300 text-sm">🎮</span>
          </div>
          <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
            <span className="text-slate-300 text-sm">📱</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative p-6">
        {/* Circuit Pattern Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(90deg, transparent 98%, #10b981 100%),
              linear-gradient(0deg, transparent 98%, #10b981 100%)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-slate-400 text-sm mb-2">For the future and intelligently control every risk</p>
            <h1 className="text-3xl md:text-4xl font-bold text-teal-400 mb-2 leading-tight">
              INTELLIGENT RISK MANAGEMENT<br />
              SECURES EVERY STEP
            </h1>
            <p className="text-slate-400 text-sm">Our multi-dimensional risk control model provides</p>
          </div>
          <div className="hidden md:block">
            <div className="w-32 h-32 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl shadow-teal-500/30">
              <div className="w-24 h-24 bg-teal-500/20 rounded-full flex items-center justify-center">
                <div className="w-16 h-16 bg-teal-400/30 rounded-full flex items-center justify-center">
                  <span className="text-teal-200 text-2xl">🛡️</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-3 gap-4">
          {actionCards.map((card, index) => (
            <div key={index} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 text-center border border-slate-700/50 hover:border-teal-500/50 transition-all duration-200">
              <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                <span className="text-white text-xl">{card.icon}</span>
              </div>
              <p className="text-white text-sm font-medium">{card.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Promotional Video Section */}
      <div className="px-6 mb-20">
        <h3 className="text-slate-400 text-sm mb-4">Promotional Video</h3>
        <div className="bg-gradient-to-r from-teal-500 to-purple-600 rounded-xl p-6 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-xl">QUANTUM LEAP</h2>
          </div>
          <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <span className="text-white text-lg">⬇️</span>
          </button>
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

export default HomeDashboard;
