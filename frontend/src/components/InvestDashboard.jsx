import { useState } from 'react';

const InvestDashboard = ({ onTabChange, onLogout }) => {
  const [activeTab, setActiveTab] = useState('profile');

  const financialOverview = [
    { label: 'Total Assets', value: '₹2,226', color: 'from-teal-500 to-cyan-500' },
    { label: 'Recharge', value: '₹0', color: 'from-teal-500 to-cyan-500' },
    { label: 'Withdraw', value: '₹0', color: 'from-teal-500 to-cyan-500' }
  ];

  const actionCards = [
    { icon: '💳', title: 'Bank Card', color: 'from-teal-500 to-cyan-500' },
    { icon: '🔒', title: 'Security', color: 'from-teal-500 to-cyan-500' },
    { icon: '💬', title: 'Telegram', color: 'from-teal-500 to-cyan-500' },
    { icon: '💰', title: 'Salary', color: 'from-teal-500 to-cyan-500' },
    { icon: '📄', title: 'Transaction', color: 'from-teal-500 to-cyan-500' },
    { icon: '📋', title: 'Contract Records', color: 'from-teal-500 to-cyan-500' },
    { icon: '📊', title: 'Withdrawal', color: 'from-teal-500 to-cyan-500' }
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-white font-semibold text-lg">Coral</h1>
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">VIP0</span>
              </div>
              <div className="flex items-center space-x-1">
                <p className="text-slate-400 text-sm">8888888889</p>
                <span className="text-slate-400 text-xs">📋</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <span>→</span>
            <span>Logout</span>
          </button>
        </div>

        {/* Financial Overview */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-3 gap-4">
            {financialOverview.map((item, index) => (
              <div key={index} className="text-center">
                <p className="text-white text-2xl font-bold">{item.value}</p>
                <p className="text-white/80 text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Promotional Banner */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 1px, transparent 1px),
                radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}></div>
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg mb-1">Invite Friends</h2>
              <p className="text-white/80 text-sm mb-1">Share Tcpatel</p>
              <p className="text-white/60 text-xs">Quantitative Bonus</p>
            </div>
            <div className="text-right">
              <h2 className="text-white font-bold text-lg mb-1">Wealth Contest</h2>
              <p className="text-white/80 text-sm">Participate in the event and get rewards</p>
            </div>
          </div>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-3 gap-4">
          {actionCards.map((card, index) => (
            <div key={index} className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-xl">{card.icon}</span>
              </div>
              <p className="text-white text-sm font-medium">{card.title}</p>
            </div>
          ))}
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

export default InvestDashboard;
