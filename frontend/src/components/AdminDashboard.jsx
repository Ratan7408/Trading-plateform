import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currency: '',
    percentageAmount: '',
    buyAmount: '',
    putAmount: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentSettings, setCurrentSettings] = useState(null);

  // Available currencies
  const currencies = [
    'BTC/USDT', 'ETH/USDT', 'DOGE/USDT', 'BCH/USDT', 'LTC/USDT',
    'IOTA/USDT', 'FIL/USDT', 'FLOW/USDT', 'JST/USDT', 'ETC/USDT',
    'TRX/USDT', 'ADA/USDT', 'DOT/USDT', 'BNB/USDT'
  ];

  // Fetch current settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/admin/settings');
        if (response.data) {
          setCurrentSettings(response.data);
          setFormData({
            currency: response.data.currency,
            percentageAmount: response.data.percentageAmount,
            buyAmount: response.data.buyAmount,
            putAmount: response.data.putAmount
          });
        }
      } catch (error) {
        console.error('Error fetching admin settings:', error);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('/admin/settings', {
        currency: formData.currency,
        percentageAmount: parseFloat(formData.percentageAmount),
        buyAmount: parseFloat(formData.buyAmount),
        putAmount: parseFloat(formData.putAmount)
      });

      setMessage('Settings updated successfully!');
      setCurrentSettings(response.data.settings);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage(error.response?.data?.message || 'Error updating settings. Please try again.');
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
          
          <h1 className="text-white text-xl font-semibold">Admin Dashboard</h1>
          
          <button
            onClick={handleLogout}
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

        {/* Current Settings Display */}
        {currentSettings && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h2 className="text-white text-lg font-medium mb-3">Current Settings</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-300">Currency:</span>
                <span className="text-white ml-2">{currentSettings.currency}</span>
              </div>
              <div>
                <span className="text-gray-300">Percentage:</span>
                <span className="text-white ml-2">{currentSettings.percentageAmount}%</span>
              </div>
              <div>
                <span className="text-gray-300">Buy Amount:</span>
                <span className="text-white ml-2">${currentSettings.buyAmount}</span>
              </div>
              <div>
                <span className="text-gray-300">Put Amount:</span>
                <span className="text-white ml-2">${currentSettings.putAmount}</span>
              </div>
            </div>
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Currency Selection */}
          <div>
            <label className="text-white text-sm mb-2 block">Select Currency</label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-red-400 focus:outline-none transition-colors"
              required
            >
              <option value="">Choose a currency</option>
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>

          {/* Percentage Amount */}
          <div>
            <label className="text-white text-sm mb-2 block">Percentage Amount (%)</label>
            <input
              type="number"
              name="percentageAmount"
              value={formData.percentageAmount}
              onChange={handleInputChange}
              placeholder="Enter percentage amount"
              min="0"
              max="100"
              step="0.01"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-red-400 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Buy Amount */}
          <div>
            <label className="text-white text-sm mb-2 block">Buy Amount ($)</label>
            <input
              type="number"
              name="buyAmount"
              value={formData.buyAmount}
              onChange={handleInputChange}
              placeholder="Enter buy amount"
              min="0"
              step="0.01"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-red-400 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Put Amount */}
          <div>
            <label className="text-white text-sm mb-2 block">Put Amount ($)</label>
            <input
              type="number"
              name="putAmount"
              value={formData.putAmount}
              onChange={handleInputChange}
              placeholder="Enter put amount"
              min="0"
              step="0.01"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-red-400 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Updating...' : 'Submit Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
