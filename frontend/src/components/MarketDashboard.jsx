import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const MarketDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('invest');
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [priceChanges, setPriceChanges] = useState({});
  const [marketStats, setMarketStats] = useState([
    { label: 'Total Coins', value: 'Loading...', icon: '📈', color: 'from-blue-500 to-cyan-500' },
    { label: '24h Volume', value: 'Loading...', icon: '💜', color: 'from-purple-500 to-purple-600' },
    { label: 'Market Cap', value: 'Loading...', icon: '⭐', color: 'from-pink-500 to-purple-500' }
  ]);

  // Simulate real-time price changes
  useEffect(() => {
    const simulatePriceChanges = () => {
      setCryptoData(prevData => {
        const newData = prevData.map(coin => {
          // Simulate small price fluctuations
          const changePercent = (Math.random() - 0.5) * 0.02; // ±1% change
          const newPrice = coin.rawPrice * (1 + changePercent);
          const priceChanged = Math.abs(newPrice - coin.rawPrice) > 0.01;
          
          return {
            ...coin,
            rawPrice: newPrice,
            price: `₹${newPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
            priceChanged: priceChanged
          };
        });
        
        // Set price changes for animation
        const newPriceChanges = {};
        newData.forEach(coin => {
          if (coin.priceChanged) {
            newPriceChanges[coin.id] = true;
          }
        });
        setPriceChanges(newPriceChanges);
        
        // Clear price change indicators after animation
        setTimeout(() => {
          setPriceChanges({});
        }, 2000);
        
        return newData;
      });
      
      setLastUpdated(new Date());
    };

    // Initial data load
    const fetchInitialData = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr&order=market_cap_desc&per_page=50&page=1&sparkline=false');
        const marketData = await response.json();
        
        const formattedData = marketData.map((coin, index) => ({
          id: coin.id,
          name: coin.name,
          ticker: coin.symbol.toUpperCase(),
          rank: coin.market_cap_rank,
          price: `₹${coin.current_price?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}`,
          rawPrice: coin.current_price,
          change: `${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h?.toFixed(2) || '0'}%`,
          changeType: coin.price_change_percentage_24h >= 0 ? 'up' : 'down',
          image: coin.image,
          isTop: index < 5,
          isTop3: index < 3,
          priceChanged: false
        }));
        
        setCryptoData(formattedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching crypto data:', error);
        // Use fallback data
        setCryptoData([
          { id: 'bitcoin', name: 'Bitcoin', ticker: 'BTC', rank: 1, price: '₹101,941', change: '-1.73%', changeType: 'down', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', isTop: true, isTop3: true, rawPrice: 101941, priceChanged: false },
          { id: 'ethereum', name: 'Ethereum', ticker: 'ETH', rank: 2, price: '₹2,518', change: '-7.27%', changeType: 'down', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', isTop: true, isTop3: true, rawPrice: 2518, priceChanged: false },
          { id: 'binancecoin', name: 'BNB', ticker: 'BNB', rank: 3, price: '₹648', change: '+7.91%', changeType: 'up', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', isTop: true, isTop3: true, rawPrice: 648, priceChanged: false },
          { id: 'solana', name: 'Solana', ticker: 'SOL', rank: 4, price: '₹169', change: '-3.73%', changeType: 'down', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', isTop: true, isTop3: false, rawPrice: 169, priceChanged: false },
          { id: 'ripple', name: 'XRP', ticker: 'XRP', rank: 5, price: '₹2.43', change: '-11.42%', changeType: 'down', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', isTop: true, isTop3: false, rawPrice: 2.43, priceChanged: false }
        ]);
        setLoading(false);
      }
    };

    fetchInitialData();
    
    // Simulate price changes every 3 seconds
    const priceInterval = setInterval(simulatePriceChanges, 3000);
    
    return () => clearInterval(priceInterval);
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
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
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
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg">Market</h1>
              <p className="text-gray-400 text-sm">Live Crypto Prices</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-gray-300 text-sm">🔍</span>
            </button>
            <button className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-gray-300 text-sm">🔽</span>
            </button>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {marketStats.map((stat, index) => (
            <div key={index} className="bg-gray-800/50 rounded-xl p-4 text-center">
              <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                <span className="text-white text-lg">{stat.icon}</span>
              </div>
              <p className="text-white text-lg font-bold">{stat.value}</p>
              <p className="text-gray-400 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Live Prices Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h2 className="text-white font-semibold">Live Prices</h2>
            </div>
            <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium">
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Real-time'}
            </div>
          </div>

          {/* Crypto List */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
                <span className="ml-3 text-gray-400">Loading live prices...</span>
              </div>
            ) : (
              cryptoData.map((crypto, index) => (
                <div key={crypto.id || index} className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between hover:bg-gray-800/70 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                        <img 
                          src={crypto.image} 
                          alt={crypto.name}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <span className="text-lg hidden">🪙</span>
                      </div>
                      {crypto.isTop3 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">👑</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-white font-medium">{crypto.name}</p>
                        {crypto.isTop && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">TOP</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-400 text-sm">⭐</span>
                        <p className="text-gray-400 text-sm">{crypto.ticker} #{crypto.rank}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-white font-medium transition-all duration-500 ${
                      priceChanges[crypto.id] ? 'scale-110 text-yellow-400' : ''
                    }`}>
                      {crypto.price}
                      {priceChanges[crypto.id] && (
                        <span className="ml-2 text-yellow-400 animate-pulse">●</span>
                      )}
                    </p>
                    <div className={`flex items-center space-x-1 ${
                      crypto.changeType === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <span className="text-xs">
                        {crypto.changeType === 'up' ? '↑' : '↓'}
                      </span>
                      <span className="text-sm font-medium">{crypto.change}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
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
                activeTab === item.id 
                  ? 'text-purple-400 bg-purple-500/20' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
              {activeTab === item.id && (
                <div className="w-1 h-1 bg-purple-400 rounded-full mt-1"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketDashboard;
