import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const OrderRecord = () => {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch order data from backend
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const response = await api.get('/order/records');
        setOrderData(response.data.orders || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching order data:', error);
        // If no data or error, show empty state
        setOrderData([]);
        setLoading(false);
      }
    };

    fetchOrderData();
  }, []);

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#121818' }}>
      {/* Header */}
      <div className="p-6">
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center text-white hover:text-gray-300 transition-colors mb-6"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="text-white text-xl font-semibold mb-8">Order record</h1>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        ) : orderData.length > 0 ? (
          /* Order Records List */
          <div className="space-y-4">
            {orderData.map((order, index) => (
              <div key={order.id || index} className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-white font-medium">{order.symbol}</p>
                    <p className="text-gray-400 text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">₹{order.amount.toLocaleString()}</p>
                    <p className={`text-sm font-medium ${
                      order.status === 'completed' ? 'text-green-400' : 
                      order.status === 'active' ? 'text-blue-400' :
                      order.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {order.status.toUpperCase()}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-400">Type:</p>
                    <p className={`font-medium ${
                      order.type === 'Call' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {order.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Entry Price:</p>
                    <p className="text-white">${order.entryPrice?.toFixed(4) || 'N/A'}</p>
                  </div>
                  {order.exitPrice && (
                    <>
                      <div>
                        <p className="text-gray-400">Exit Price:</p>
                        <p className="text-white">${order.exitPrice.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">P&L:</p>
                        <p className={`font-medium ${
                          order.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {order.profitLoss >= 0 ? '+' : ''}₹{order.profitLoss?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                
                {order.followedSignal !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">Signal:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.followedSignal ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {order.followedSignal ? '✓ Followed' : '✗ Not Followed'}
                      </span>
                    </div>
                    <div className="text-gray-400">
                      Admin: {order.adminSignal}
                    </div>
                  </div>
                )}
                
                {order.status === 'completed' && order.isWin !== null && (
                  <div className={`mt-2 text-center text-sm font-medium ${
                    order.isWin ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {order.isWin ? '🎉 WIN' : '📉 LOSS'}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* No Data State */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-8">
              {/* Main document icon */}
              <div className="w-24 h-24 bg-gray-600 rounded-lg flex items-center justify-center mx-auto">
                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
              </div>
              
              {/* Decorative cloud shapes around the main icon */}
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-gray-500 rounded-full opacity-60"></div>
              <div className="absolute -top-1 -right-3 w-6 h-6 bg-gray-500 rounded-full opacity-40"></div>
              <div className="absolute -bottom-2 -left-1 w-7 h-7 bg-gray-500 rounded-full opacity-50"></div>
              <div className="absolute -bottom-1 -right-2 w-5 h-5 bg-gray-500 rounded-full opacity-30"></div>
              <div className="absolute top-1/2 -left-4 w-4 h-4 bg-gray-500 rounded-full opacity-35"></div>
              <div className="absolute top-1/2 -right-4 w-5 h-5 bg-gray-500 rounded-full opacity-45"></div>
            </div>
            
            <p className="text-white text-lg font-medium">no data</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderRecord;
