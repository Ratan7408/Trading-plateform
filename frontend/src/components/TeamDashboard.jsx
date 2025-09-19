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
    <div className="min-h-screen text-white" style={{ backgroundColor: '#121818' }}>
      {/* Header */}
      <div className="p-6">
        <button 
          onClick={() => navigate('/home')}
          className="flex items-center text-white hover:text-gray-300 transition-colors mb-6"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="text-white text-xl font-semibold mb-8">Team</h1>

        {/* Level1 Member */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/team/1')}
            className="w-full text-left"
          >
            <h2 className="text-white text-lg font-medium mb-4">Level1 Member</h2>
            <div className="flex space-x-4">
              <div className="flex-1 bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
                <p className="text-white text-sm mb-2">Valid member</p>
                <p className="text-white text-2xl font-bold text-center">0</p>
              </div>
              <div className="flex-1 bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
                <p className="text-white text-sm mb-2">Total member</p>
                <p className="text-white text-2xl font-bold text-center">0</p>
              </div>
            </div>
          </button>
        </div>

        {/* Level2 Member */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/team/2')}
            className="w-full text-left"
          >
            <h2 className="text-white text-lg font-medium mb-4">Level2 Member</h2>
            <div className="flex space-x-4">
              <div className="flex-1 bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
                <p className="text-white text-sm mb-2">Valid member</p>
                <p className="text-white text-2xl font-bold text-center">0</p>
              </div>
              <div className="flex-1 bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
                <p className="text-white text-sm mb-2">Total member</p>
                <p className="text-white text-2xl font-bold text-center">0</p>
              </div>
            </div>
          </button>
        </div>

        {/* Level3 Member */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/team/3')}
            className="w-full text-left"
          >
            <h2 className="text-white text-lg font-medium mb-4">Level3 Member</h2>
            <div className="flex space-x-4">
              <div className="flex-1 bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
                <p className="text-white text-sm mb-2">Valid member</p>
                <p className="text-white text-2xl font-bold text-center">0</p>
              </div>
              <div className="flex-1 bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
                <p className="text-white text-sm mb-2">Total member</p>
                <p className="text-white text-2xl font-bold text-center">0</p>
              </div>
            </div>
          </button>
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

export default TeamDashboard;
