import axios from 'axios';

try {
  const response = await axios.post('http://localhost:5000/api/payments/create', {
    amount: 500,
    paymentMethod: 'upi',
    gateway: 'watchglb'
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGNjZTVmYmVjZDkxYTc0OTQ1OTI5NDQiLCJ1c2VybmFtZSI6IlRlc3QiLCJpYXQiOjE3NTg0Nzk0MjQsImV4cCI6MTc1OTA4NDIyNH0.pVL3_j8QyQUDsbyMM-ct5_YsS73gbs4nu8-LByBoTxA'
    }
  });
  console.log('SUCCESS:', response.data);
} catch (error) {
  console.log('ERROR RESPONSE:', error.response?.data);
  console.log('ERROR STATUS:', error.response?.status);
}
