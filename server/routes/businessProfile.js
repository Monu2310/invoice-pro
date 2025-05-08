const express = require('express');
const router = express.Router();
const BusinessProfile = require('../models/BusinessProfile');

// Get business profile - returns single profile or creates default if none exists
router.get('/', async (req, res) => {
  try {
    let profile = await BusinessProfile.findOne();
    
    // If no profile exists, create a default one
    if (!profile) {
      try {
        profile = new BusinessProfile({
          name: 'My Business',
          email: 'contact@mybusiness.com',
          phone: '',
          website: '',
          address: 'Default Address',
          logo: '',
          taxIdentification: {
            gstin: '',
            pan: ''
          },
          bankDetails: {
            accountName: '',
            accountNumber: '',
            bankName: '',
            ifscCode: '',
            branchName: ''
          },
          invoiceSettings: {
            prefix: 'INV',
            nextNumber: 1001,
            termsAndConditions: 'Default terms and conditions'
          }
        });
        
        await profile.save();
      } catch (saveError) {
        console.error('Error creating default business profile:', saveError);
        return res.status(500).json({ message: 'Failed to create default business profile', error: saveError.message });
      }
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching business profile:', error);
    res.status(500).json({ message: 'Failed to fetch business profile', error: error.message });
  }
});

// Update business profile
router.patch('/', async (req, res) => {
  try {
    let profile = await BusinessProfile.findOne();
    
    // If no profile exists, create one with the provided data
    if (!profile) {
      profile = new BusinessProfile(req.body);
    } else {
      // Update nested objects properly
      if (req.body.taxIdentification) {
        profile.taxIdentification = { ...profile.taxIdentification, ...req.body.taxIdentification };
        delete req.body.taxIdentification;
      }
      
      if (req.body.bankDetails) {
        profile.bankDetails = { ...profile.bankDetails, ...req.body.bankDetails };
        delete req.body.bankDetails;
      }
      
      if (req.body.invoiceSettings) {
        profile.invoiceSettings = { ...profile.invoiceSettings, ...req.body.invoiceSettings };
        delete req.body.invoiceSettings;
      }
      
      // Update all other fields
      Object.keys(req.body).forEach(key => {
        profile[key] = req.body[key];
      });
    }
    
    profile.updatedAt = Date.now();
    const updatedProfile = await profile.save();
    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating business profile:', error);
    res.status(400).json({ message: error.message });
  }
});

// Upload business logo
router.post('/logo', async (req, res) => {
  try {
    // In a real application, this would handle file uploads
    // For now, we'll assume the logo is a base64 string in req.body.logo
    
    const profile = await BusinessProfile.findOne();
    
    if (!profile) {
      return res.status(404).json({ message: 'Business profile not found' });
    }
    
    profile.logo = req.body.logo;
    profile.updatedAt = Date.now();
    const updatedProfile = await profile.save();
    
    res.json({ message: 'Logo uploaded successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;