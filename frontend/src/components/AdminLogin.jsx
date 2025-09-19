import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setError('');

    try {
      const response = await api.post('/admin/login', formData);
      
      if (response.data.isAdmin) {
        // Store admin session
        localStorage.setItem('isAdmin', 'true');
        navigate('/admin-dashboard');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = () => {
    setFormData({
      username: 'admin',
      password: 'admin123'
    });
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#121818' }}>
      <div className="w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-2xl">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-white mb-2">Admin Panel</h2>
          <p className="text-gray-300">Access admin settings</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter admin username"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-red-400 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter admin password"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-red-400 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Logging in...' : 'Login as Admin'}
          </button>
        </form>

        {/* Quick Login Button */}
        <div className="mt-4">
          <button
            onClick={handleQuickLogin}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors text-sm"
          >
            Quick Admin Login
          </button>
        </div>

        {/* Back to App */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Back to App
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
