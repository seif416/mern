const express = require('express');
const router = express.Router();
const User = require('./user.js');
const Medicine = require('./medicine.js');
const Feedback = require('./feedback.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');


router.use(express.json());
router.use(bodyParser.json());
router.use(cors());



// Registration endpoint  
router.post('/signup', async (req, res) => {
  try {
    // Validate incoming data
    const { name, email, password, address, phone } = req.body;
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      address,
      phone
    });
    // Save user to database
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    // Validate incoming data
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, 'your_secret_key');
    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Donation Endpoint
router.post('/donate', async (req, res) => {
  try {
    const { medicinename, exp_date, address, phone, photo, description} = req.body;

    // Check if all required fields are provided
    if (!medicinename || !exp_date || !address || !phone || !photo || !description) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Create new medicine document
    const medicine = new Medicine({
      medicinename,
      exp_date,
      address,
      phone,
      photo,
      description
    });

    // Save medicine document to the database
    await medicine.save();

    res.status(201).json({ message: 'Medicine donated successfully' });
  } catch (error) {
    console.error('Error donating medicine:', error);
    res.status(500).json({ error: 'Failed to donate medicine' });
  }
});

// Home Page Endpoint
router.get('/login/home', async (req, res) => {
  try {
    // Fetch all donated medicines from the database
    const donatedMedicines = await Medicine.find({});
    res.json(donatedMedicines);
    // Render the home page template and pass the donated medicines data to it
    // res.render('home', { donatedMedicines });
  } catch (error) {
    console.error('Error fetching donated medicines:', error.message);
    res.status(500).json({ error: 'Failed to fetch donated medicines' });
  }
});

// Collect Medicine Endpoint
router.get('/collect-medicine/:address', async (req, res) => {
  const address = req.params.address;

  try {
    // Fetch donated medicines based on the provided address
    const donatedMedicines = await Medicine.find({address});
    res.json(donatedMedicines);
  } catch (error) {
    console.error('Error fetching donated medicines:', error.message);
    res.status(500).json({ error: 'Failed to fetch donated medicines' });
  }
});



// Deletion Endpoint
router.delete('/delete/:medicinename', async (req, res) => {
  try {
    const medicinename = req.params.medicinename;
    const deletedMedicine = await Medicine.deleteOne({ medicinename });
    if (deletedMedicine.deletedCount > 0) {
      res.status(200).json({ message: 'Medicine deleted successfully' });
    } else {
      res.status(404).json({ error: 'Medicine not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete medicine' });
  }
});



router.get('/request/:medicinename', async (req, res) => {
  try {
    const medicinename = req.params.medicinename;
    const requestedMedicine = await Medicine.findOne({ medicinename });
    if (requestedMedicine) {
      res.status(200).json(requestedMedicine);
    } else {
      res.status(404).json({ error: 'Medicine not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to request medicine' });
  }
});






// Endpoint for auto-complete
router.get('/autocomplete/:query', async (req, res) => {
  try {
      const query = req.params.query.toLowerCase();
      // Find medicines that match the partial input query
      const autoCompleteResults = await Medicine.find({ medicinename: { $regex: new RegExp(query, 'i') } });
      res.json({ suggestions: autoCompleteResults.map(medicine => medicine.medicinename) });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
  }
});


// POST endpoint for submitting feedback
router.post('/feedback', async (req, res) => {
  try {
    const { userId, ratedUserId, rating} = req.body;
    
    // Create new feedback instance
    const feedback = new Feedback({
      userId,
      ratedUserId,
      rating
    });

    // Save the feedback to the database
    await feedback.save();

    res.status(201).json({ message: 'Feedback submitted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Error submitting feedback.' });
  }
});

// Get Feedback by User ID
router.get('/api/feedback/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const feedback = await Feedback.find({ ratedUserId: userId });
    res.status(200).json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




module.exports = router;