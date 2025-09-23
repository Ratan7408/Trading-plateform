import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Signup from './components/Signup'
import HomeDashboard from './components/HomeDashboard'
import SignalDashboard from './components/SignalDashboard'
import MarketDashboard from './components/MarketDashboard'
import TeamDashboard from './components/TeamDashboard'
import TeamMemberDetail from './components/TeamMemberDetail'
import InvestDashboard from './components/InvestDashboard'
import Profile from './components/Profile'
import WithdrawRecord from './components/WithdrawRecord'
import OrderRecord from './components/OrderRecord'
import RechargeRecord from './components/RechargeRecord'
import BankSettings from './components/BankSettings'
import PasswordSettings from './components/PasswordSettings'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import TradingPage from './components/TradingPage'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleSignup = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    // Force redirect to login page
    window.location.href = '/';
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {!isLoggedIn ? (
          <>
            <Route path="/" element={<Login onLogin={handleLogin} />} />
            <Route path="/signup" element={<Signup onSignup={handleSignup} />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomeDashboard />} />
            <Route path="/signal" element={<SignalDashboard />} />
            <Route path="/team" element={<TeamDashboard />} />
            <Route path="/team/:level" element={<TeamMemberDetail />} />
            <Route path="/assets" element={<InvestDashboard />} />
            <Route path="/profile" element={<Profile onLogout={handleLogout} />} />
            <Route path="/withdraw-record" element={<WithdrawRecord />} />
            <Route path="/order-record" element={<OrderRecord />} />
            <Route path="/recharge-record" element={<RechargeRecord />} />
            <Route path="/bank-settings" element={<BankSettings />} />
            <Route path="/password-settings" element={<PasswordSettings />} />
            <Route path="/trading/*" element={<TradingPage />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </>
        )}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
