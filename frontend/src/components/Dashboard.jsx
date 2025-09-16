import { useState } from 'react';
import HomeDashboard from './HomeDashboard';
import TeamDashboard from './TeamDashboard';
import MarketDashboard from './MarketDashboard';
import InvestDashboard from './InvestDashboard';

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
        return <InvestDashboard onTabChange={handleTabChange} onLogout={onLogout} />;
      default:
        return <HomeDashboard onTabChange={handleTabChange} />;
    }
  };

  return renderCurrentScreen();
};

export default Dashboard;
