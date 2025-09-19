import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { externalApi } from '../utils/api';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TradingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const symbol = location.pathname.split('/trading/')[1];
  const [cryptoData, setCryptoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
  const [chartData, setChartData] = useState([]);
  const [activeTraders, setActiveTraders] = useState(12500);

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

        // Generate mock chart data
        generateChartData(data.market_data.current_price.usd);
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
        generateChartData(0.276971);
        setLoading(false);
      }
    };

    fetchCryptoData();
  }, [symbol]);

  const generateChartData = (currentPrice, timeframe = '15m') => {
    const data = [];
    const basePrice = currentPrice || 0.276971; // Fallback price
    let lastPrice = basePrice;
    
    // Define timeframe intervals in milliseconds
    const timeframeIntervals = {
      '1m': 60000,      // 1 minute
      '5m': 300000,     // 5 minutes
      '15m': 900000,    // 15 minutes
      '1h': 3600000,    // 1 hour
      '4h': 14400000,   // 4 hours
      '1d': 86400000    // 1 day
    };
    
    const interval = timeframeIntervals[timeframe] || 900000;
    const dataPoints = timeframe === '1d' ? 30 : 50; // Fewer points for daily view
    
    for (let i = 0; i < dataPoints; i++) {
      const time = new Date(Date.now() - (dataPoints - 1 - i) * interval).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        ...(timeframe === '1d' && { month: 'short', day: 'numeric' })
      });
      
      // Create realistic price movements based on timeframe
      const volatility = timeframe === '1m' ? 0.02 : 
                        timeframe === '5m' ? 0.03 : 
                        timeframe === '15m' ? 0.04 : 
                        timeframe === '1h' ? 0.06 : 
                        timeframe === '4h' ? 0.08 : 0.12; // Daily has more volatility
      
      const trend = (Math.random() - 0.5) * volatility;
      const price = lastPrice * (1 + trend);
      
      // Allow for reasonable price swings
      const finalPrice = Math.max(price, basePrice * 0.5);
      
      // Determine if price went up or down
      const isUp = finalPrice > lastPrice;
      lastPrice = finalPrice;
      
      data.push({
        time,
        price: finalPrice,
        high: finalPrice * (1 + Math.random() * 0.03),
        low: finalPrice * (1 - Math.random() * 0.03),
        open: i === 0 ? finalPrice : data[i-1].price,
        close: finalPrice,
        isUp: isUp
      });
    }
    
    setChartData(data);
  };

  // Initialize chart data immediately
  useEffect(() => {
    generateChartData(0.276971);
  }, []);

  // Update chart when crypto data changes
  useEffect(() => {
    if (cryptoData && cryptoData.currentPrice) {
      generateChartData(cryptoData.currentPrice, selectedTimeframe);
    }
  }, [cryptoData?.id]);

  // Update chart when timeframe changes
  useEffect(() => {
    if (cryptoData && cryptoData.currentPrice) {
      generateChartData(cryptoData.currentPrice, selectedTimeframe);
    }
  }, [selectedTimeframe]);

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

      // Only update the latest bar, don't regenerate all data
      setChartData(prev => {
        const newData = [...prev];
        const lastIndex = newData.length - 1;
        const previousPrice = newData[lastIndex - 1]?.price || newData[lastIndex].price;
        
        // Update the last bar with new price and color
        newData[lastIndex] = {
          ...newData[lastIndex],
          price: newPrice,
          isUp: newPrice > previousPrice,
          time: new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          high: newPrice * (1 + Math.random() * 0.03),
          low: newPrice * (1 - Math.random() * 0.03),
          close: newPrice
        };
        
        return newData;
      });
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
          <p className="text-white font-semibold">₹0</p>
        </div>
      </div>

      {/* Timeframe Selection */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex space-x-2">
          {timeframes.map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe
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
          
          {/* Recharts Bar Chart */}
          <div className="h-64 bg-gray-900 rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData.slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#FFFFFF"
                  fontSize={12}
                  tick={{ fill: '#FFFFFF', fontSize: 12 }}
                  axisLine={{ stroke: '#FFFFFF' }}
                  domain={['dataMin - 0.01', 'dataMax + 0.01']}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#FFFFFF'
                  }}
                  labelStyle={{ color: '#FFFFFF' }}
                  formatter={(value, name) => [`$${value.toFixed(6)}`, 'Price']}
                />
                <Bar 
                  dataKey="price" 
                  radius={[2, 2, 0, 0]}
                >
                  {chartData.slice(-20).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isUp ? '#10B981' : '#EF4444'} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
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

        {/* Trading Buttons */}
        <div className="text-center">
          <h3 className="text-white font-semibold mb-4">Start Trading</h3>
          <div className="flex space-x-4">
            <button
              onClick={handleBuy}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <div className="w-4 h-4 bg-white rounded-full"></div>
              <span>BUY</span>
              <span className="text-sm">Price will rise</span>
            </button>
            
            <button
              onClick={handlePut}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <div className="w-4 h-4 bg-white rounded-full"></div>
              <span>PUT</span>
              <span className="text-sm">Price will fall</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingPage;
