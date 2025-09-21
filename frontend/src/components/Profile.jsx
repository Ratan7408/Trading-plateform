import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import PaymentModal from './PaymentModal';
import WithdrawModal from './WithdrawModal';

const Profile = ({ onLogout }) => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    phone: 'Loading...',
    vipLevel: 'VIP0',
    inviteCode: 'Loading...'
  });
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Fetch user data from User model
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch complete user profile with balance
        const response = await api.get('/auth/user/profile');
        const userData = response.data.user;
        
        setUserInfo({
          phone: userData.phone, // Use username as phone display
          vipLevel: 'VIP0', // Keep VIP0 as default
          inviteCode: userData.inviteCode
        });
        setBalance(userData.balance);
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to just balance if profile fails
        try {
          const balanceResponse = await api.get('/auth/user/balance');
          setBalance(balanceResponse.data.balance);
        } catch (balanceError) {
          console.error('Error fetching balance:', balanceError);
          setBalance(1000); // Default balance from User model
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const menuItems = [
    {
      id: 'order-record',
      icon: '📋',
      label: 'Order record',
      action: () => navigate('/order-record')
    },
    {
      id: 'recharge-record',
      icon: '💰',
      label: 'Recharge record',
      action: () => navigate('/recharge-record')
    },
    {
      id: 'withdraw-record',
      icon: '💸',
      label: 'Withdraw record',
      action: () => navigate('/withdraw-record')
    },
    {
      id: 'bank-settings',
      icon: '🏦',
      label: 'Bank settings',
      action: () => navigate('/bank-settings')
    },
    {
      id: 'password-settings',
      icon: '🔒',
      label: 'Password settings',
      action: () => navigate('/password-settings')
    },
    {
      id: 'logout',
      icon: '🚪',
      label: 'Logout',
      action: onLogout
    }
  ];

  const copyInviteCode = () => {
    navigator.clipboard.writeText(userInfo.inviteCode);
    // You could add a toast notification here
    console.log('Invite code copied to clipboard');
  };

  // Handle successful recharge
  const handleRechargeSuccess = (paymentData) => {
    console.log('Recharge successful:', paymentData);
    setBalance(prev => prev + paymentData.amount);
    alert(`Recharge successful! ₹${paymentData.amount} added to your account.`);
  };

  // Handle successful withdrawal
  const handleWithdrawSuccess = (payoutData) => {
    console.log('Withdrawal successful:', payoutData);
    setBalance(payoutData.newBalance);
    alert(`Withdrawal request submitted! ₹${payoutData.amount} will be processed in ${payoutData.estimatedTime}.`);
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#121818' }}>
      {/* Header with Back Button */}
      <div className="p-6 pb-4">
        <button 
          onClick={() => navigate('/home')}
          className="flex items-center text-white hover:text-gray-300 transition-colors mb-6"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Profile Section */}
        <div className="flex items-center space-x-4 mb-8">
          {/* Owin Logo */}
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Owin
            </span>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h2 className="text-white text-lg font-semibold">
                {userInfo.phone} ({userInfo.vipLevel})
              </h2>
            </div>
            
            {/* Balance Display */}
            <div className="mb-3">
              <span className="text-gray-300 text-sm">Balance: </span>
              <span className="text-green-400 text-lg font-semibold">
                {loading ? '...' : `₹${balance.toLocaleString()}`}
              </span>
              
              {/* Quick Action Buttons */}
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => setShowRechargeModal(true)}
                  className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                >
                  + Recharge
                </button>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                >
                  - Withdraw
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-300 text-sm">Invite code: {userInfo.inviteCode}</span>
              <button 
                onClick={copyInviteCode}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full flex items-center justify-between py-4 px-4 hover:bg-gray-800/30 transition-colors group rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 flex items-center justify-center">
                  <span className="text-xl text-gray-300">{item.icon}</span>
                </div>
                <span className="text-white font-medium text-base">{item.label}</span>
              </div>
              <svg 
                className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showRechargeModal}
          onClose={() => setShowRechargeModal(false)}
          onSuccess={handleRechargeSuccess}
        />

        {/* Withdraw Modal */}
        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={handleWithdrawSuccess}
          userBalance={balance}
        />
      </div>
    </div>
  );
};

export default Profile;
