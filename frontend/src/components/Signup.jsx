import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Signup = ({ onSignup }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.post('/auth/register', {
        username: formData.username,
        phone: formData.phone,
        password: formData.password,
      });

      // Show success message
      setSuccess(true);
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Signup error:', error);
      if (error.response) {
        if (error.response.data.message) {
          setErrors({ general: error.response.data.message });
        } else {
          setErrors({ general: 'Signup failed. Please try again.' });
        }
      } else {
        setErrors({ general: 'Network error. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen relative' style={{ backgroundColor: '#121818' }}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, #6b7280 1px, transparent 0)`,
        backgroundSize: '30px 30px'
      }}></div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800/20 via-transparent to-gray-700/20"></div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start p-6 md:p-8">
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">Welcome</h1>
            <p className="text-xl md:text-2xl text-gray-300 font-medium tracking-wide">Join Owin</p>
          </div>
          <div className="w-12 h-12 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl flex items-center justify-center shadow-lg">
            <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-md">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-8">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">Owin</h2>
            <p className="text-lg md:text-xl text-gray-300 mb-2 tracking-widest font-light">TRADING PLATFORM</p>
            <p className="text-lg md:text-xl text-white font-medium tracking-wide">Create Your Account</p>
          </div>

          {/* Signup Form */}
          <div className="w-full max-w-md">
            {success && (
              <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl mb-6 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Account created successfully! Redirecting to login...</span>
                </div>
              </div>
            )}
            
            {errors.general && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 text-center">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-white text-sm font-medium mb-3 tracking-wide">
                  Username
                </label>
                <div className="relative">
                  <div className="flex items-center bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-xl px-4 py-4 shadow-lg hover:border-gray-500/50 transition-all duration-200">
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={success}
                      className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg disabled:opacity-50"
                      placeholder="Enter your username"
                    />
                  </div>
                  {errors.username && (
                    <p className="text-red-400 text-sm mt-2">{errors.username}</p>
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-white text-sm font-medium mb-3 tracking-wide">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="flex items-center bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-xl px-4 py-4 shadow-lg hover:border-gray-500/50 transition-all duration-200">
                    <span className="text-white mr-3 font-medium">+91</span>
                    <div className="w-px h-6 bg-gray-600 mr-3"></div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={success}
                      className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg disabled:opacity-50"
                      placeholder="Enter your phone number"
                      maxLength="10"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-400 text-sm mt-2">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-white text-sm font-medium mb-3 tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <div className="flex items-center bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-xl px-4 py-4 shadow-lg hover:border-gray-500/50 transition-all duration-200">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={success}
                      className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg disabled:opacity-50"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-2">{errors.password}</p>
                  )}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-white text-sm font-medium mb-3 tracking-wide">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="flex items-center bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-xl px-4 py-4 shadow-lg hover:border-gray-500/50 transition-all duration-200">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={success}
                      className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg disabled:opacity-50"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm mt-2">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 shadow-2xl hover:shadow-gray-500/25 hover:scale-[1.02] transition-all duration-200 border border-gray-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span className="text-lg tracking-wide">Creating Account...</span>
                  </>
                ) : success ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg tracking-wide">Account Created!</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg tracking-wide">Sign Up</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 text-center space-y-4">
              <p className="text-white text-lg">
                Already have an account?{' '}
                <Link to="/" className="text-gray-400 hover:text-gray-300 transition-colors font-medium underline decoration-gray-400/50 hover:decoration-gray-300">
                  Sign In
                </Link>
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                By signing up, you agree to our{' '}
                <a href="#" className="text-gray-400 hover:text-gray-300 transition-colors underline decoration-gray-400/50 hover:decoration-gray-300">
                  Terms
                </a>
                {' '}and{' '}
                <a href="#" className="text-gray-400 hover:text-gray-300 transition-colors underline decoration-gray-400/50 hover:decoration-gray-300">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Features */}
        <div className="flex justify-center items-center space-x-12 py-10">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-gradient-to-r from-gray-500 to-gray-400 rounded-full shadow-lg shadow-gray-500/30"></div>
            <span className="text-white text-sm font-medium tracking-wide">AI Powered</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-gradient-to-r from-gray-500 to-gray-400 rounded-full shadow-lg shadow-gray-500/30"></div>
            <span className="text-white text-sm font-medium tracking-wide">Secure</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-gradient-to-r from-gray-500 to-gray-400 rounded-full shadow-lg shadow-gray-500/30"></div>
            <span className="text-white text-sm font-medium tracking-wide">Fast Trading</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
