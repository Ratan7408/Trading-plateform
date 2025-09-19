import { useNavigate, useParams } from 'react-router-dom';

const TeamMemberDetail = () => {
  const navigate = useNavigate();
  const { level } = useParams();

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#121818' }}>
      {/* Header */}
      <div className="p-6">
        <button 
          onClick={() => navigate('/team')}
          className="flex items-center text-white hover:text-gray-300 transition-colors mb-6"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="text-white text-xl font-semibold mb-8">Level {level} Member</h1>

        {/* No Member State */}
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
          
          <p className="text-white text-lg font-medium">no member</p>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberDetail;
