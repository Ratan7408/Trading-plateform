import { useState } from 'react';

const Login = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('8888888889');
  const [password, setPassword] = useState('123456');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt:', { phoneNumber, password });
    // Simple validation - if credentials match, login
    if (phoneNumber === '8888888889' && password === '123456') {
      onLogin();
    } else {
      alert('Invalid credentials. Use 8888888889 / 123456');
    }
  };

  return (
    <div className='min-h-screen bg-slate-900 relative'>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, #0ea5e9 1px, transparent 0)`,
        backgroundSize: '30px 30px'
      }}></div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20"></div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start p-6 md:p-8">
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">Hello</h1>
            <p className="text-xl md:text-2xl text-cyan-400 font-medium tracking-wide">Welcome to CORAL</p>
          </div>
          <div className="w-12 h-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl flex items-center justify-center shadow-lg">
            <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-md">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-8">
          {/* Logo Section */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-3 tracking-tight">CORAL</h2>
            <p className="text-lg md:text-xl text-gray-300 mb-3 tracking-widest font-light">TRADING PLATFORM</p>
            <p className="text-xl md:text-2xl text-white font-medium tracking-wide">AI Trading Platform</p>
          </div>

          {/* Login Form */}
          <div className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Phone Number */}
              <div>
                <label className="block text-white text-sm font-medium mb-3 tracking-wide">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="flex items-center bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl px-4 py-4 shadow-lg hover:border-slate-500/50 transition-all duration-200">
                    <span className="text-white mr-3 font-medium">+91</span>
                    <div className="w-px h-6 bg-slate-600 mr-3"></div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
                      placeholder="Enter your phone number"
                    />
                    <button
                      type="button"
                      className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/50"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-white text-sm font-medium mb-3 tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <div className="flex items-center bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl px-4 py-4 shadow-lg hover:border-slate-500/50 transition-all duration-200">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/50"
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
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 shadow-2xl hover:shadow-blue-500/25 hover:scale-[1.02] transition-all duration-200 border border-blue-500/20"
              >
                <span className="text-lg tracking-wide">Sign In</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                </svg>
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-10 text-center space-y-5">
              <p className="text-white text-lg">
                Don't have an account?{' '}
                <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors font-medium underline decoration-blue-400/50 hover:decoration-blue-300">
                  Sign Up
                </a>
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                By signing in, you agree to our{' '}
                <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors underline decoration-blue-400/50 hover:decoration-blue-300">
                  Terms
                </a>
                {' '}and{' '}
                <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors underline decoration-blue-400/50 hover:decoration-blue-300">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Features */}
        <div className="flex justify-center items-center space-x-12 py-10">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full shadow-lg shadow-blue-500/30"></div>
            <span className="text-white text-sm font-medium tracking-wide">AI Powered</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-400 rounded-full shadow-lg shadow-green-500/30"></div>
            <span className="text-white text-sm font-medium tracking-wide">Secure</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full shadow-lg shadow-purple-500/30"></div>
            <span className="text-white text-sm font-medium tracking-wide">Fast Trading</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
