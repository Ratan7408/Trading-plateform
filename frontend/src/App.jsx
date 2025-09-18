import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import HomeDashboard from './components/HomeDashboard'
import SignalDashboard from './components/SignalDashboard'
import MarketDashboard from './components/MarketDashboard'
import TeamDashboard from './components/TeamDashboard'
import InvestDashboard from './components/InvestDashboard'
import Profile from './components/Profile'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  return (
    <BrowserRouter>
      <Routes>
        {!isLoggedIn ? (
          <Route path="/" element={<Login onLogin={handleLogin} />} />
        ) : (
          <>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomeDashboard />} />
            <Route path="/signal" element={<SignalDashboard />} />
            <Route path="/team" element={<TeamDashboard />} />
            <Route path="/assets" element={<InvestDashboard />} />
            <Route path="/profile" element={<Profile onLogout={handleLogout} />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}

export default App
