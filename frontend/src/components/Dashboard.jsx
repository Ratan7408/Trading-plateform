import { useState } from 'react';
import HomeDashboard from './HomeDashboard';
import TeamDashboard from './TeamDashboard';
import MarketDashboard from './MarketDashboard';
import InvestDashboard from './InvestDashboard';
import Profile from './Profile';

const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const renderCurrentScreen = () => {
    switch (activeTab) {
      case 'team':
        return <TeamDashboard onTabChange={handleTabChange} />;
      case 'invest':
        return <MarketDashboard onTabChange={handleTabChange} />;
      case 'profile':
        return <Profile onBack={() => setActiveTab('home')} onLogout={onLogout} />;
      default:
        return <HomeDashboard onTabChange={handleTabChange} />;
    }
  };

  return renderCurrentScreen();
};

export default Dashboard;
