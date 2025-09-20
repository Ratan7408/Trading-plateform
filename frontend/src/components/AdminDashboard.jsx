import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tradeName: '',
    tradeSignal: '',
    oldTrade: '',
    oldSignal: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [affectedUsers, setAffectedUsers] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // Available options for dropdowns
  const tradeNames = [
    'Bitcoin', 'Ethereum', 'Dogecoin', 'Bitcoin Cash', 'Litecoin',
    'IOTA', 'Filecoin', 'Flow', 'JUST', 'Ethereum Classic',
    'TRON', 'Cardano', 'Polkadot', 'Binance Coin'
  ];

  const signals = ['Call', 'Put'];
  const oldTrades = ['BTC', 'ETH', 'DOGE', 'BCH', 'LTC', 'IOTA', 'FIL', 'FLOW', 'JST', 'ETC', 'TRX', 'ADA', 'DOT', 'BNB'];
  const oldSignals = ['call', 'put'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Preview affected users and calculate profits
  const handlePreview = async () => {
    if (!formData.tradeName || !formData.tradeSignal) {
      setMessage('Please select Trade Name and Trade Signal first');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/admin/preview-trade-results', {
        tradeName: formData.tradeName,
        tradeSignal: formData.tradeSignal
      });

      const users = response.data.affectedUsers || [];
      // Calculate 6% profit for users with minimum ₹600 trade
      const usersWithProfit = users.map(user => ({
        ...user,
        profit: user.tradeAmount >= 600 ? user.tradeAmount * 0.06 : 0,
        eligible: user.tradeAmount >= 600
      }));

      setAffectedUsers(usersWithProfit);
      setShowPreview(true);
      setMessage('');
    } catch (error) {
      console.error('Error previewing trade results:', error);
      setMessage('Error fetching trade preview. Using demo data.');
      
      // Demo data for preview
      const demoUsers = [
        { username: 'user1', tradeAmount: 1000, eligible: true, profit: 60 },
        { username: 'user2', tradeAmount: 500, eligible: false, profit: 0 },
        { username: 'user3', tradeAmount: 1500, eligible: true, profit: 90 },
        { username: 'user4', tradeAmount: 800, eligible: true, profit: 48 },
      ];
      setAffectedUsers(demoUsers);
      setShowPreview(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('/admin/manage-trade', {
        tradeName: formData.tradeName,
        tradeSignal: formData.tradeSignal,
        oldTrade: formData.oldTrade,
        oldSignal: formData.oldSignal,
        profitPercentage: 6, // 6% profit
        minimumAmount: 600 // ₹600 minimum
      });

      setMessage(`Trade confirmed! ${affectedUsers.filter(u => u.eligible).length} users will receive profits.`);
      setShowPreview(false);
      setAffectedUsers([]);
      
      // Clear form
      setFormData({
        tradeName: '',
        tradeSignal: '',
        oldTrade: '',
        oldSignal: ''
      });
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error updating trade management:', error);
      setMessage(error.response?.data?.message || 'Error updating trade management. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/admin-login');
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#121818' }}>
      {/* Header */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => navigate('/admin-login')}
            className="flex items-center text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-white text-xl font-semibold">Manage Trade</h1>
          
          <button
            onClick={() => {
              localStorage.removeItem('isAdmin');
              navigate('/admin-login');
            }}
            className="text-red-400 hover:text-red-300 transition-colors text-sm"
          >
            Logout
          </button>
        </div>
        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-3 rounded-lg ${
            message.includes('Error') 
              ? 'bg-red-500/20 text-red-400' 
              : 'bg-green-500/20 text-green-400'
          }`}>
            {message}
          </div>
        )}

        {/* Manage Trade Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trade Name */}
          <div>
            <label className="text-white text-sm mb-2 block">Trade Name</label>
            <select
              name="tradeName"
              value={formData.tradeName}
              onChange={handleInputChange}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-400 focus:outline-none transition-colors"
              required
            >
              <option value="">Select Trade Name</option>
              {tradeNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Trade Signal */}
          <div>
            <label className="text-white text-sm mb-2 block">Trade Signal</label>
            <select
              name="tradeSignal"
              value={formData.tradeSignal}
              onChange={handleInputChange}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-400 focus:outline-none transition-colors"
              required
            >
              <option value="">Select Signal</option>
              {signals.map((signal) => (
                <option key={signal} value={signal}>
                  {signal}
                </option>
              ))}
            </select>
          </div>

          {/* Old Trade */}
          <div>
            <label className="text-white text-sm mb-2 block">Old Trade</label>
            <select
              name="oldTrade"
              value={formData.oldTrade}
              onChange={handleInputChange}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-400 focus:outline-none transition-colors"
              required
            >
              <option value="">Select Old Trade</option>
              {oldTrades.map((trade) => (
                <option key={trade} value={trade}>
                  {trade}
                </option>
              ))}
            </select>
          </div>

          {/* Old Signal */}
          <div>
            <label className="text-white text-sm mb-2 block">Old Signal</label>
            <select
              name="oldSignal"
              value={formData.oldSignal}
              onChange={handleInputChange}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-400 focus:outline-none transition-colors"
              required
            >
              <option value="">Select Old Signal</option>
              {oldSignals.map((signal) => (
                <option key={signal} value={signal}>
                  {signal}
                </option>
              ))}
            </select>
          </div>

          {/* Preview Button */}
          <button
            type="button"
            onClick={handlePreview}
            disabled={loading || !formData.tradeName || !formData.tradeSignal}
            className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-colors mb-4"
          >
            {loading ? 'Loading Preview...' : 'Preview Affected Users'}
          </button>

          {/* Confirm Button */}
          <button
            type="submit"
            disabled={loading || !showPreview}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Processing...' : 'Confirm Trade Results'}
          </button>
        </form>

        {/* Profit Preview Section */}
        {showPreview && affectedUsers.length > 0 && (
          <div className="mt-6 bg-gray-800 rounded-lg p-4">
            <h3 className="text-white text-lg font-semibold mb-4">
              Profit Distribution Preview
            </h3>
            
            {/* Summary */}
            <div className="bg-gray-700 rounded-lg p-3 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-300">Selected Trade:</span>
                  <span className="text-white ml-2">{formData.tradeName} → {formData.tradeSignal}</span>
                </div>
                <div>
                  <span className="text-gray-300">Profit Rate:</span>
                  <span className="text-green-400 ml-2">6%</span>
                </div>
                <div>
                  <span className="text-gray-300">Minimum Amount:</span>
                  <span className="text-yellow-400 ml-2">₹600</span>
                </div>
                <div>
                  <span className="text-gray-300">Eligible Users:</span>
                  <span className="text-blue-400 ml-2">{affectedUsers.filter(u => u.eligible).length}</span>
                </div>
              </div>
            </div>

            {/* User List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {affectedUsers.map((user, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    user.eligible 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{user.username}</p>
                      <p className="text-gray-400 text-sm">
                        Trade: ₹{user.tradeAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {user.eligible ? (
                        <>
                          <p className="text-green-400 font-semibold">
                            +₹{user.profit.toLocaleString()}
                          </p>
                          <p className="text-gray-400 text-xs">6% profit</p>
                        </>
                      ) : (
                        <>
                          <p className="text-red-400 font-semibold">₹0</p>
                          <p className="text-gray-400 text-xs">Below ₹600 min</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-400 font-medium">Total Profit to Distribute:</span>
                <span className="text-white font-bold text-lg">
                  ₹{affectedUsers.filter(u => u.eligible).reduce((sum, user) => sum + user.profit, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
