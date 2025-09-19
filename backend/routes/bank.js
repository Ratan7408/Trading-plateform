import express from 'express';
import auth from '../middleware/auth.js';
import Bank from '../models/Bank.js';

const router = express.Router();

// Get bank details for authenticated user
router.get('/details', auth, async (req, res) => {
  try {
    const bankDetails = await Bank.findOne({ userId: req.userId });
    res.json(bankDetails);
  } catch (error) {
    console.error('Error fetching bank details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update bank details
router.post('/details', auth, async (req, res) => {
  try {
    const { name, bankAccount, ifsc } = req.body;
    
    // Validate required fields
    if (!name || !bankAccount || !ifsc) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if bank details already exist
    const existingBank = await Bank.findOne({ userId: req.userId });
    
    if (existingBank) {
      // Update existing bank details
      existingBank.name = name;
      existingBank.bankAccount = bankAccount;
      existingBank.ifsc = ifsc.toUpperCase();
      await existingBank.save();
      
      res.json({ 
        message: 'Bank details updated successfully',
        bankDetails: existingBank 
      });
    } else {
      // Create new bank details
      const bankDetails = new Bank({
        userId: req.userId,
        name,
        bankAccount,
        ifsc: ifsc.toUpperCase()
      });
      
      await bankDetails.save();
      
      res.status(201).json({ 
        message: 'Bank details saved successfully',
        bankDetails 
      });
    }
  } catch (error) {
    console.error('Error saving bank details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
