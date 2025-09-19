import { useNavigate } from 'react-router-dom';

const SignalDashboard = () => {
  const navigate = useNavigate();

  const handleJoinTelegram = () => {
    console.log('Joining Telegram channel');
    // Add actual Telegram link here
  };

  const handleJoinWhatsApp = () => {
    console.log('Joining WhatsApp channel');
    // Add actual WhatsApp link here
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#121818' }}>
      {/* Header */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <button
          onClick={() => {
            try {
              navigate('/home');
            } catch (error) {
              console.log('Navigate failed, using window.location');
              window.location.href = '/home';
            }
          }}
          className="text-white p-3 rounded-lg0 transition-colors"
          style={{ 
            cursor: 'pointer',
            zIndex: 9999,
            position: 'relative'
          }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold flex-grow text-center -ml-6">Signal channel</h1>
        <div className="w-6 h-6"></div>
      </div>

      {/* Owin Logo */}
      <div className="flex justify-center my-8">
        <span className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Owin
        </span>
      </div>

      {/* Channel Cards */}
      <div className="px-4 space-y-4">
        {/* Telegram Channel */}
        <div className="bg-white rounded-lg p-4 flex items-center justify-between shadow-md">
          <span className="text-gray-900 font-medium">Telegram channel</span>
          <button
            onClick={handleJoinTelegram}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span className="text-sm font-medium mr-1">Join now</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* WhatsApp Channel */}
        <div className="bg-white rounded-lg p-4 flex items-center justify-between shadow-md">
          <span className="text-gray-900 font-medium">WhatsApp channel</span>
          <button
            onClick={handleJoinWhatsApp}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span className="text-sm font-medium mr-1">Join now</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignalDashboard;
