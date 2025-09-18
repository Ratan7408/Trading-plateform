import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const InvestDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
        
        <h1 className="text-white text-xl font-semibold mb-8">Financial history</h1>

        {/* Financial Summary */}
        <div className="flex justify-between mb-12">
          <div className="text-center">
            <p className="text-white text-sm mb-1">Available</p>
            <p className="text-white text-lg font-semibold">0.00</p>
          </div>
          <div className="text-center">
            <p className="text-white text-sm mb-1">Total recharge</p>
            <p className="text-white text-lg font-semibold">0.00</p>
          </div>
          <div className="text-center">
            <p className="text-white text-sm mb-1">Total withdraw</p>
            <p className="text-white text-lg font-semibold">0.00</p>
          </div>
        </div>

        {/* No Data State */}
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">no data</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-6" style={{ backgroundColor: '#121818' }}>
        <div className="flex space-x-4">
          <button className="flex-1 bg-blue-500 text-white py-4 rounded-lg font-semibold text-lg">
            Recharge
          </button>
          <button className="flex-1 bg-blue-500 text-white py-4 rounded-lg font-semibold text-lg">
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvestDashboard;
