import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const HomeDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('home');

  const actionCards = [
    { icon: '💰', title: 'Recharge', color: 'from-blue-500 to-cyan-500' },
    { icon: '💳', title: 'Withdraw', color: 'from-blue-500 to-cyan-500' },
    { icon: '📱', title: 'APP', color: 'from-blue-500 to-cyan-500' },
    { icon: '📤', title: 'Share', color: 'from-blue-500 to-cyan-500' },
    { icon: '🛠️', title: 'Service', color: 'from-blue-500 to-cyan-500' }
  ];

  const cryptoData = [
    { name: 'BTC/USDT', price: '117560.50', change: '+1.46%', logo: '🟠' },
    { name: 'ETH/USDT', price: '4599.32', change: '+2.45%', logo: '⚪' },
    { name: 'DOGE/USDT', price: '0.282303', change: '+6.38%', logo: '🟡' },
    { name: 'BCH/USDT', price: '245.67', change: '+3.21%', logo: '🟢' },
    { name: 'LTC/USDT', price: '89.45', change: '+1.89%', logo: '🔵' },
    { name: 'IOTA/USDT', price: '0.1567', change: '+4.56%', logo: '🟣' },
    { name: 'FIL/USDT', price: '3.45', change: '+2.34%', logo: '🟤' },
    { name: 'FLOW/USDT', price: '0.89', change: '+5.67%', logo: '🔴' },
    { name: 'JST/USDT', price: '0.0234', change: '+1.23%', logo: '🟡' },
    { name: 'ETC/USDT', price: '12.34', change: '+3.45%', logo: '⚫' }
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
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            OWIN
          </span>
        </div>
        <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
          <span className="text-gray-300 text-sm">⚙️</span>
        </div>
      </div>

      {/* BIG WIN Banner */}
      <div className="relative p-6 mb-6">
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 rounded-2xl p-8 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-4 left-4 text-yellow-400 text-2xl">🪙</div>
            <div className="absolute top-8 right-8 text-yellow-400 text-xl">🪙</div>
            <div className="absolute bottom-4 left-8 text-yellow-400 text-lg">🪙</div>
            <div className="absolute bottom-6 right-4 text-yellow-400 text-xl">🪙</div>
            <div className="absolute top-1/2 left-1/4 text-blue-300 text-lg">💎</div>
            <div className="absolute top-1/3 right-1/3 text-purple-300 text-lg">💎</div>
          </div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight drop-shadow-lg">
                BIG WIN
              </h1>
              <p className="text-white/80 text-sm">Celebrate your victories</p>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              OWIN
            </div>
          </div>
        </div>
      </div>

      {/* Action Icons */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-5 gap-4">
          {actionCards.map((card, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-400 text-xl">{card.icon}</span>
              </div>
              <p className="text-white text-xs font-medium">{card.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cryptocurrency List */}
      <div className="px-6 mb-20">
        <div className="bg-gray-800/30 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="flex bg-gray-700/50 px-4 py-3 text-sm font-medium text-gray-300">
            <div className="flex-1">Name</div>
            <div className="flex-1 text-center">Latest price</div>
            <div className="flex-1 text-right">24H change</div>
          </div>
          
          {/* Crypto Rows */}
          <div className="divide-y divide-gray-700/30">
            {cryptoData.map((crypto, index) => (
              <div key={index} className="flex items-center px-4 py-3 hover:bg-gray-700/20 transition-colors">
                <div className="flex-1 flex items-center space-x-3">
                  <span className="text-lg">{crypto.logo}</span>
                  <span className="text-white font-medium">{crypto.name}</span>
                </div>
                <div className="flex-1 text-center text-white font-medium">
                  {crypto.price}
                </div>
                <div className="flex-1 text-right">
                  <span className="bg-green-500 text-white px-2 py-1 rounded text-sm font-medium">
                    {crypto.change}
                  </span>
                </div>
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
                  ? 'text-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
              {activeTab === item.id && (
                <div className="w-1 h-1 bg-blue-400 rounded-full mt-1"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
