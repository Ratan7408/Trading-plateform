import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const BankSettings = () => {
  const navigate = useNavigate();
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bankAccount: '',
    ifsc: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch bank details on component mount
  useEffect(() => {
    const fetchBankDetails = async () => {
      try {
        const response = await api.get('/bank/details');
        if (response.data) {
          setBankDetails(response.data);
          setFormData({
            name: response.data.name,
            bankAccount: response.data.bankAccount,
            ifsc: response.data.ifsc
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching bank details:', error);
        setLoading(false);
      }
    };

    fetchBankDetails();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const response = await api.post('/bank/details', formData);
      setBankDetails(response.data.bankDetails);
      setIsEditing(false);
      setMessage(bankDetails ? 'Bank details updated successfully!' : 'Bank details saved successfully!');
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving bank details:', error);
      setMessage('Error saving bank details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setMessage('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (bankDetails) {
      setFormData({
        name: bankDetails.name,
        bankAccount: bankDetails.bankAccount,
        ifsc: bankDetails.ifsc
      });
    }
    setMessage('');
  };

  if (loading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center" style={{ backgroundColor: '#121818' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

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
        
        <h1 className="text-white text-xl font-semibold mb-8">Bank</h1>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-3 rounded-lg ${
            message.includes('Error') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
          }`}>
            {message}
          </div>
        )}

        {/* Bank Details Display */}
        {bankDetails && !isEditing && (
          <div className="mb-8">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-white text-lg font-medium">Bank Details</h2>
                <button
                  onClick={handleEdit}
                  className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                >
                  Edit
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Name</label>
                  <p className="text-white font-medium">{bankDetails.name}</p>
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Bank account</label>
                  <p className="text-white font-medium">{bankDetails.bankAccount}</p>
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">IFSC</label>
                  <p className="text-white font-medium">{bankDetails.ifsc}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bank Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-white text-sm mb-2 block">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Please enter name"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-400 focus:outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-white text-sm mb-2 block">Bank account</label>
            <input
              type="text"
              name="bankAccount"
              value={formData.bankAccount}
              onChange={handleInputChange}
              placeholder="Please enter bank account"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-400 focus:outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="text-white text-sm mb-2 block">IFSC</label>
            <input
              type="text"
              name="ifsc"
              value={formData.ifsc}
              onChange={handleInputChange}
              placeholder="Please enter IFSC"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-400 focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {submitting ? 'Saving...' : 'Submit'}
            </button>
            
            {isEditing && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankSettings;
