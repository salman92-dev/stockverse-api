// stockpicks.mjs
import express from 'express';
import axios from 'axios';

const stockpicks = express.Router();
const GHL_API_BASE = 'https://rest.gohighlevel.com/v1';
const GHL_API_KEY = process.env.GHL_API_KEY; // Set in your .env securely

// POST /create-contact: Create or update contact with a tag in GoHighLevel
stockpicks.post('/create-contact', async (req, res) => {
  // STEP 1: Extract input
  let { email, phone, tag } = req.body;

  // STEP 2: Sanitize input
  email = email?.trim();
  phone = phone?.trim();
  tag = tag?.trim();

  // STEP 3: Log input for debugging
  console.log('[Debug] Incoming request:');
  console.log(`Email: "${email}"`);
  console.log(`Phone: "${phone}"`);
  console.log(`Tag: "${tag}"`);

  // STEP 4: Validate email format using regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('[Error] Invalid email format');
    // return res.status(400).json({ error: 'Email format is invalid.' });
  }

  try {
    console.log('[Info] Checking if contact exists...');
    const searchRes = await axios.get(`${GHL_API_BASE}/contacts/lookup?email=${email}`, {
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
      },
    });

    const contactId = searchRes.data.contacts[0].id;
    // If status is 200, contact was found
    console.log('[contact is found]',contactId);
    // You can access contact details like searchRes.data.contact
    console.log('Contact found!');
     // Prepare only the fields to update
    const updateBody = {};
    if (email) updateBody.email = email;
    if (phone) updateBody.phone = phone;

    // Only proceed if at least one field is provided
    if (Object.keys(updateBody).length > 0) {
      console.log('[Info] Updating contact...');
      await axios.put(`${GHL_API_BASE}/contacts/${contactId}`, updateBody, {
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('[Success] Contact email and phone updated');
    }

    if (tag) {
      await axios.post(`${GHL_API_BASE}/contacts/${contactId}/tags`, {
        tags: [tag]
      }, {
        headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('[Success] Contact tags updated');
    }  
    return res.status(200).json({ message: 'Contact Already Exists, updated contact with new data provided.' });
  
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      const message = err.response.data?.message;
  
      if (status === 400 && message === 'This location does not allow duplicated contacts.') {
        // Specific error from GoHighLevel
        console.warn('[Warning] Duplicate phone number detected');
        return res.status(404).json({
          message: 'Phone number is already in use, please enter another.'
        });
      }
  
      if (status === 422) {
        console.log('Contact not found, logging 12...');
        console.log(12);
      
        // Build contact payload from available inputs
        const createBody = {};
        if (email) createBody.email = email;
        if (phone) createBody.phone = phone;
        if (tag) createBody.tags = [tag];
      
        if (Object.keys(createBody).length === 0) {
          console.warn('[Warning] No valid data provided to create contact.');
          return res.status(400).json({ message: 'No valid fields provided to create a contact.' });
        }
      
        try {
          console.log('[Info] Creating new contact...');
          await axios.post(`${GHL_API_BASE}/contacts/`, createBody, {
            headers: {
              Authorization: `Bearer ${GHL_API_KEY}`,
              'Content-Type': 'application/json',
            },
          });
      
          console.log('[Success] New contact created.');
          return res.status(200).json({ message: 'New Subscription created successfully.' });
      
        } catch (createErr) {
          console.error('[Create Contact Error]', createErr.response?.data || createErr.message);
          return res.status(500).json({
            error: 'Failed to create new contact',
            details: createErr.response?.data || createErr.message,
          });
        }
      }
  
      // Handle other API errors
      console.error('[API Error]', err.response.data);
      return res.status(500).json({
        error: 'Unexpected error occurred',
        details: err.response.data,
      });
    }
  
    // Fallback for other types of errors (like network issues)
    console.error('[Unexpected Error]', err.message);
    return res.status(500).json({
      error: 'An unexpected error occurred',
      details: err.message,
    });
  }
});

export default stockpicks;