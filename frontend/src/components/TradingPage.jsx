import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { externalApi } from '../utils/api';
import api from '../utils/api';
import CryptoChart from './CryptoChart';

const TradingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const symbol = location.pathname.split('/trading/')[1];
  const [cryptoData, setCryptoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
  const [activeTraders, setActiveTraders] = useState(12500);
  const [userBalance, setUserBalance] = useState(0); // Will be fetched from backend
  const [hasTradeToday, setHasTradeToday] = useState(false);
  const [adminSignal, setAdminSignal] = useState('Call'); // Current admin signal
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradingLoading, setTradingLoading] = useState(false);

  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];

  // Fetch crypto data
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        // Map symbol to coin ID
        const coinMap = {
          'BTC/USDT': 'bitcoin',
          'ETH/USDT': 'ethereum',
          'DOGE/USDT': 'dogecoin',
          'BCH/USDT': 'bitcoin-cash',
          'LTC/USDT': 'litecoin',
          'IOTA/USDT': 'iota',
          'FIL/USDT': 'filecoin',
          'FLOW/USDT': 'flow',
          'JST/USDT': 'just',
          'ETC/USDT': 'ethereum-classic',
          'TRX/USDT': 'tron',
          'ADA/USDT': 'cardano',
          'DOT/USDT': 'polkadot',
          'BNB/USDT': 'binancecoin'
        };

        const coinId = coinMap[symbol] || 'bitcoin';
        const response = await externalApi.get(`https://api.coingecko.com/api/v3/coins/${coinId}`);
        const data = response.data;

        setCryptoData({
          name: data.name,
          symbol: data.symbol.toUpperCase(),
          currentPrice: data.market_data.current_price.usd,
          priceChange24h: data.market_data.price_change_percentage_24h,
          volume24h: data.market_data.total_volume.usd,
          marketCap: data.market_data.market_cap.usd,
          rank: data.market_cap_rank,
          image: data.image.small
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching crypto data:', error);
        // Fallback data
        setCryptoData({
          name: 'Dogecoin',
          symbol: 'DOGE',
          currentPrice: 0.276971,
          priceChange24h: -3.34,
          volume24h: 2000000000,
          marketCap: 40000000000,
          rank: 7162,
          image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png'
        });
        setLoading(false);
      }
    };

    fetchCryptoData();
  }, [symbol]);

  // Live price updates
  useEffect(() => {
    if (!cryptoData) return;

    const updatePrice = () => {
      const variation = (Math.random() - 0.5) * 0.001; // ±0.1% variation
      const newPrice = cryptoData.currentPrice * (1 + variation);
      const newChange = cryptoData.priceChange24h + (Math.random() - 0.5) * 0.1;

      setCryptoData(prev => ({
        ...prev,
        currentPrice: newPrice,
        priceChange24h: newChange
      }));
    };

    const interval = setInterval(updatePrice, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, [cryptoData]);

  // Live active traders updates
  useEffect(() => {
    const updateActiveTraders = () => {
      const change = (Math.random() - 0.5) * 2000; // ±1000 traders change
      setActiveTraders(prev => {
        const newCount = prev + change;
        return Math.max(8000, Math.min(20000, newCount)); // Keep between 8K-20K
      });
    };

    const interval = setInterval(updateActiveTraders, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch user balance and check if user has traded today
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user balance
        const balanceResponse = await api.get('/auth/user/balance');
        setUserBalance(balanceResponse.data.balance);

        // Check if user has traded today
        const tradeResponse = await api.get('/trade/can-trade-today');
        setHasTradeToday(tradeResponse.data.hasTradeToday);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  // Fetch current admin signal
  useEffect(() => {
    const fetchAdminSignal = async () => {
      try {
        const response = await api.get(`/trade/signal/${symbol.replace('/', '')}`);
        setAdminSignal(response.data.signalType || 'Call');
      } catch (error) {
        console.error('Error fetching admin signal:', error);
      }
    };

    fetchAdminSignal();
  }, [symbol]);

  // Trading functions
  const handleTrade = async (signal) => {
    const amount = parseFloat(tradeAmount);

    // Validation checks
    if (!amount || amount < 600) {
      alert('Minimum trade amount is ₹600');
      return;
    }

    if (amount > userBalance) {
      alert('Insufficient balance');
      return;
    }

    if (hasTradeToday) {
      alert('You can only trade once per day');
      return;
    }

    setTradingLoading(true);

    try {
      const response = await api.post('/trade/place', {
        symbol: symbol,
        tradeType: signal,
        amount: amount
      });

      const result = response.data;
      
      if (result.success) {
        alert(`Trade placed successfully!`);
        
        // Update user balance immediately (amount deducted)
        setUserBalance(result.userBalance);
        setHasTradeToday(true);
        setTradeAmount('');
        
        // Show trade details
        console.log('Trade details:', result.trade);
        
        // Refresh balance after 6 seconds (after trade completes)
        setTimeout(async () => {
          try {
            const balanceResponse = await api.get('/auth/user/balance');
            setUserBalance(balanceResponse.data.balance);
            alert('Trade completed! Check your balance and order history.');
          } catch (error) {
            console.error('Error refreshing balance:', error);
          }
        }, 6000);
      }
    } catch (error) {
      console.error('Error placing trade:', error);
      alert(error.response?.data?.message || 'Error placing trade. Please try again.');
    } finally {
      setTradingLoading(false);
    }
  };

  const handleBuy = () => {
    console.log('BUY order placed for', symbol);
    // Implement buy logic here
  };

  const handlePut = () => {
    console.log('PUT order placed for', symbol);
    // Implement put logic here
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#121818' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!cryptoData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#121818' }}>
        <div className="text-white">Crypto data not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#121818' }}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/home')}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            <img src={cryptoData.image} alt={cryptoData.name} className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-white font-semibold">{cryptoData.name}</h1>
            <p className="text-gray-400 text-sm">#{cryptoData.rank}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-gray-400 text-sm">Balance</p>
          <p className="text-white font-semibold">₹{userBalance.toLocaleString()}</p>
          {hasTradeToday && (
            <p className="text-yellow-400 text-xs">Traded today</p>
          )}
        </div>
      </div>

      {/* Timeframe Selection */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex space-x-2">
          {timeframes.map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${selectedTimeframe === timeframe
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-2xl font-bold text-white">
                ${cryptoData.currentPrice.toLocaleString()}
              </p>
              <p className={`text-sm ${cryptoData.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {cryptoData.priceChange24h >= 0 ? '+' : ''}{cryptoData.priceChange24h.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Professional Crypto Chart */}
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <CryptoChart 
              symbol={(() => {
                // Map all supported cryptocurrencies to Binance symbols
                const symbolMap = {
                  'BTC/USDT': 'BTCUSDT',
                  'ETH/USDT': 'ETHUSDT',
                  'DOGE/USDT': 'DOGEUSDT',
                  'BCH/USDT': 'BCHUSDT',
                  'LTC/USDT': 'LTCUSDT',
                  'IOTA/USDT': 'IOTAUSDT',
                  'FIL/USDT': 'FILUSDT',
                  'FLOW/USDT': 'FLOWUSDT',
                  'JST/USDT': 'JSTUSDT',
                  'ETC/USDT': 'ETCUSDT',
                  'TRX/USDT': 'TRXUSDT',
                  'ADA/USDT': 'ADAUSDT',
                  'DOT/USDT': 'DOTUSDT',
                  'BNB/USDT': 'BNBUSDT'
                };
                return symbolMap[symbol] || 'BTCUSDT';
              })()} 
              interval={selectedTimeframe}
              limit={100}
            />
          </div>
        </div>

        {/* Market Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-gray-300 text-sm">Current Price</span>
            </div>
            <p className="text-white font-semibold">${cryptoData.currentPrice.toLocaleString()}</p>
            <p className={`text-sm ${cryptoData.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {cryptoData.priceChange24h >= 0 ? '+' : ''}{cryptoData.priceChange24h.toFixed(2)}%
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-gray-300 text-sm">24h Volume</span>
            </div>
            <p className="text-white font-semibold">${(cryptoData.volume24h / 1000000000).toFixed(2)}B</p>
            <p className="text-gray-400 text-sm">Market Cap: ${(cryptoData.marketCap / 1000000000).toFixed(2)}B</p>
          </div>
        </div>

        {/* Market Information */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
            <span className="text-gray-300 text-sm">Market Information</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Rank:</span>
              <span className="text-white ml-1">#{cryptoData.rank}</span>
            </div>
            <div>
              <span className="text-gray-400">Active Traders:</span>
              <span className="text-white ml-1">{(activeTraders / 1000).toFixed(1)}K</span>
            </div>
            <div>
              <span className="text-gray-400">Success Rate:</span>
              <span className="text-white ml-1">73%</span>
            </div>
          </div>
        </div>

        {/* Trade Amount Input */}
        <div className="mb-6">
          <label className="text-white text-sm mb-2 block">Trade Amount (₹)</label>
          <input
            type="number"
            value={tradeAmount}
            onChange={(e) => setTradeAmount(e.target.value)}
            onWheel={(e) => e.target.blur()} // Prevent scroll wheel from changing value
            placeholder="Minimum ₹600"
            min="600"
            max={userBalance}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-400 focus:outline-none transition-colors"
            disabled={hasTradeToday}
          />
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-400">Minimum: ₹600</span>
            <span className="text-gray-400">Available: ₹{userBalance.toLocaleString()}</span>
          </div>
        </div>

        {/* Trading Buttons */}
        <div className="text-center">
          <h3 className="text-white font-semibold mb-4">
            {hasTradeToday ? 'Trading Complete for Today' : 'Start Trading'}
          </h3>
          
          {hasTradeToday ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-400 font-medium">You have already traded today</p>
              <p className="text-gray-400 text-sm mt-1">Come back tomorrow to trade again</p>
            </div>
          ) : (
            <>
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => handleTrade('Call')}
                  disabled={tradingLoading || !tradeAmount || parseFloat(tradeAmount) < 600}
                  className={`flex-1 font-semibold py-4 px-6 rounded-lg transition-colors flex flex-col items-center justify-center space-y-1 bg-green-500 hover:bg-green-600 text-white`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                    <span>CALL</span>
                  </div>
                  <span className="text-xs">Price will rise</span>
                </button>
                
                <button
                  onClick={() => handleTrade('Put')}
                  disabled={tradingLoading || !tradeAmount || parseFloat(tradeAmount) < 600}
                  className={`flex-1 font-semibold py-4 px-6 rounded-lg transition-colors flex flex-col items-center justify-center space-y-1 bg-red-500 hover:bg-red-600 text-white`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                    <span>PUT</span>
                  </div>
                  <span className="text-xs">Price will fall</span>
                  {adminSignal === 'Put' && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">📉 Admin Signal</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradingPage;