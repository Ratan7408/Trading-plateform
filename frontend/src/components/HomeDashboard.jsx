import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { externalApi } from '../utils/api';
import heroImg from '../assets/hero-img.png';
import PaymentModal from './PaymentModal';
import WithdrawModal from './WithdrawModal';

const HomeDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('home');
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [userBalance, setUserBalance] = useState(1000);

  // Handle share functionality
  const handleShare = async () => {
    const shareData = {
      title: 'Owin Trading Platform',
      text: 'Check out Owin - Your AI Trading Platform for cryptocurrency trading!',
      url: window.location.href
    };

    try {
      // Check if Web Share API is supported (mainly mobile devices)
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for desktop browsers
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(window.location.href);
          alert('Website link copied to clipboard!');
        } else {
          // Final fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = window.location.href;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('Website link copied to clipboard!');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to copying to clipboard
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(window.location.href);
          alert('Website link copied to clipboard!');
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = window.location.href;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('Website link copied to clipboard!');
        }
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
        alert('Unable to share. Please copy the URL manually: ' + window.location.href);
      }
    }
  };

  // Handle service modal
  const handleServiceClick = () => {
    setShowServiceModal(true);
  };

  const closeServiceModal = () => {
    setShowServiceModal(false);
  };

  // Handle successful recharge
  const handleRechargeSuccess = (paymentData) => {
    console.log('Recharge successful:', paymentData);
    setUserBalance(prev => prev + paymentData.amount);
    alert(`Recharge successful! ₹${paymentData.amount} added to your account.`);
  };

  // Handle successful withdrawal
  const handleWithdrawSuccess = (payoutData) => {
    console.log('Withdrawal successful:', payoutData);
    setUserBalance(payoutData.newBalance);
    alert(`Withdrawal request submitted! ₹${payoutData.amount} will be processed in ${payoutData.estimatedTime}.`);
  };

  const actionCards = [
    { 
      title: 'Recharge', 
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      ),
      onClick: () => setShowRechargeModal(true)
    },
    { 
      title: 'Withdraw', 
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
          <path d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 2.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5z"/>
        </svg>
      ),
      onClick: () => setShowWithdrawModal(true)
    },
    { 
      title: 'APP', 
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          <path d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 2.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5z"/>
        </svg>
      ),
      onClick: () => console.log('APP clicked')
    },
    { 
      title: 'Share', 
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
        </svg>
      ),
      onClick: handleShare
    },
    { 
      title: 'Service', 
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"/>
        </svg>
      ),
      onClick: handleServiceClick
    }
  ];

  // Fetch crypto data from API
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        // Specific coin IDs you requested
        const coinIds = [
          'bitcoin', 'ethereum', 'dogecoin', 'bitcoin-cash', 'litecoin',
          'iota', 'filecoin', 'flow', 'just', 'ethereum-classic',
          'tron', 'cardano', 'polkadot', 'binancecoin'
        ];
        
        const response = await externalApi.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&per_page=20&page=1&sparkline=false`);
        const marketData = response.data;
        
        const formattedData = marketData.map((coin) => ({
          name: `${coin.symbol.toUpperCase()}/USDT`,
          price: coin.current_price?.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 6 
          }) || '0',
          change: `${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h?.toFixed(2) || '0'}%`,
          changeType: coin.price_change_percentage_24h >= 0 ? 'up' : 'down',
          image: coin.image,
          id: coin.id
        }));
        
        setCryptoData(formattedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching crypto data:', error);
        // Fallback to your exact data if API fails
        setCryptoData([
          { name: 'BTC/USDT', price: '117,010.51', change: '-0.49%', changeType: 'down', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', id: 'bitcoin' },
          { name: 'ETH/USDT', price: '4,548.84', change: '-1.09%', changeType: 'down', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', id: 'ethereum' },
          { name: 'DOGE/USDT', price: '0.276971', change: '-3.34%', changeType: 'down', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', id: 'dogecoin' },
          { name: 'BCH/USDT', price: '609.91', change: '-4.39%', changeType: 'down', image: 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash.png', id: 'bitcoin-cash' },
          { name: 'LTC/USDT', price: '117.31', change: '+0.24%', changeType: 'up', image: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png', id: 'litecoin' },
          { name: 'IOTA/USDT', price: '0.1938', change: '-0.77%', changeType: 'down', image: 'https://assets.coingecko.com/coins/images/692/large/IOTA_Swirl.png', id: 'iota' },
          { name: 'FIL/USDT', price: '2.5684', change: '+0.43%', changeType: 'up', image: 'https://assets.coingecko.com/coins/images/12817/large/filecoin.png', id: 'filecoin' },
          { name: 'FLOW/USDT', price: '0.4179', change: '+0.53%', changeType: 'up', image: 'https://assets.coingecko.com/coins/images/13446/large/5f6294c0c7a8cda55cb1c936_Flow_Wordmark.png', id: 'flow' },
          { name: 'JST/USDT', price: '0.033647', change: '+0.01%', changeType: 'up', image: 'https://assets.coingecko.com/coins/images/12495/large/just_icon.png', id: 'just' },
          { name: 'ETC/USDT', price: '20.7720', change: '-1.01%', changeType: 'down', image: 'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png', id: 'ethereum-classic' },
          { name: 'TRX/USDT', price: '0.347827', change: '+0.09%', changeType: 'up', image: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png', id: 'tron' },
          { name: 'ADA/USDT', price: '0.922891', change: '-0.42%', changeType: 'down', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', id: 'cardano' },
          { name: 'DOT/USDT', price: '4.6490', change: '+2.24%', changeType: 'up', image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png', id: 'polkadot' },
          { name: 'BNB/USDT', price: '992.64', change: '-0.07%', changeType: 'down', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', id: 'binancecoin' }
        ]);
        setLoading(false);
      }
    };

    fetchCryptoData();
  }, []);

  const navigationItems = [
    { 
      id: 'home', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ), 
      label: 'Home' 
    },
    { 
      id: 'signal', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ), 
      label: 'Signal' 
    },
    { 
      id: 'team', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ), 
      label: 'Team' 
    },
    { 
      id: 'assets', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ), 
      label: 'Assets' 
    },
    { 
      id: 'profile', 
      icon: (
        <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ), 
      label: 'Account' 
    }
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    navigate(`/${tabId}`);
  };

  return (
    <div className="min-h-screen text-white pb-20" style={{ backgroundColor: '#121818' }}>
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Owin
          </span>
        </div>
      </div>

      {/* Hero Image Banner */}
      <div className="relative p-6 mb-6">
        <div className="relative rounded-2xl overflow-hidden">
          <img 
            src={heroImg} 
            alt="Trading Platform Hero" 
            className="w-full h-52"
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/20"></div>
          
          {/* Content overlay */}
          <div className="absolute inset-0 flex items-center justify-between p-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight drop-shadow-lg">
                Welcome to Owin
              </h1>
              <p className="text-white/90 text-sm font-medium">Your AI Trading Platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Icons */}
      <div className="px-6 mb-8">
        <div className="flex justify-between items-center">
          {actionCards.map((card, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={card.onClick}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
                <span className="text-white">{card.icon}</span>
              </div>
              <p className="text-white text-xs font-medium">{card.title}</p>
            </div>
          ))}
        </div>
        {/* Bottom border line */}
        <div className="mt-4 border-t border-gray-600/30"></div>
      </div>

      {/* Cryptocurrency List */}
      <div className="px-6 mb-20">
        <div className="bg-gray-800/30 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="flex bg-gray-700/50 px-4 py-3 text-sm font-medium text-gray-300">
            <div className="flex-1">Name</div>
            <div className="flex-1 text-center">Latest price</div>
            <div className="flex-1 text-right">24H change</div>
          </div>
          
          {/* Crypto Rows */}
          <div className="divide-y divide-gray-700/30">
            {cryptoData.map((crypto, index) => (
              <div 
                key={crypto.id || index} 
                className="flex items-center px-4 py-3 hover:bg-gray-700/20 transition-colors cursor-pointer"
                onClick={() => {
                  console.log('Navigating to:', `/trading/${crypto.name}`);
                  navigate(`/trading/${crypto.name}`);
                }}
              >
                <div className="flex-1 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                    <img 
                      src={crypto.image} 
                      alt={crypto.name}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <span className="text-lg hidden">🪙</span>
                  </div>
                  <span className="text-white font-medium">{crypto.name}</span>
                </div>
                <div className="flex-1 text-center text-white font-medium">
                  ${crypto.price}
                </div>
                <div className="flex-1 text-right">
                  <span className={`p-2 rounded text-sm font-medium ${
                    crypto.changeType === 'up' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-700 text-white'
                  }`}>
                    {crypto.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm border-t border-gray-700">
        <div className="flex justify-around py-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                (activeTab === item.id) || (item.id === 'home' && activeTab === 'home')
                  ? 'text-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
              {activeTab === item.id && (
                <div className="w-1 h-1 bg-blue-400 rounded-full mt-1"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md mx-4 relative max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 overflow-y-auto" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#4B5563 #374151'
            }}>
            {/* Close Button */}
            <button
              onClick={closeServiceModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Customer Service</h2>
              <p className="text-gray-300">We're here to help you 24/7</p>
            </div>

            {/* Service Details */}
            <div className="space-y-4">
              {/* Contact Information */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-3 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                    <div>
                      <p className="text-white font-medium">Phone Support</p>
                      <p className="text-gray-300 text-sm">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-3 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                    <div>
                      <p className="text-white font-medium">Email Support</p>
                      <p className="text-gray-300 text-sm">support@owin.com</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-3 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.5 12c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5S8.5 13.38 8.5 12zm7.5 0c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5 5-2.24 5-5zm2 0c0 3.87-3.13 7-7 7s-7-3.13-7-7 3.13-7 7-7 7 3.13 7 7z"/>
                    </svg>
                    <div>
                      <p className="text-white font-medium">Live Chat</p>
                      <p className="text-gray-300 text-sm">Available 24/7</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Hours */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  Service Hours
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Monday - Friday</span>
                    <span className="text-white">24/7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Weekend</span>
                    <span className="text-white">24/7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Response Time</span>
                    <span className="text-green-400">&lt; 5 minutes</span>
                  </div>
                </div>
              </div>

              {/* Services Offered */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  Our Services
                </h3>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    <span className="text-gray-300">Trading Support</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                    <span className="text-gray-300">Account Management</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                    <span className="text-gray-300">Technical Issues</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                    <span className="text-gray-300">Payment & Withdrawal</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                    <span className="text-gray-300">Platform Tutorial</span>
                  </div>
                </div>
              </div>
            </div>

           
            </div>
          </div>
        </div>
      )}

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
        userBalance={userBalance}
      />
    </div>
  );
};

export default HomeDashboard;
