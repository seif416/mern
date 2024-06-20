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
const Request = require('./request.js');
const Notification = require('./notification.js');


dotenv.config();


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



// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key', (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.user = user;
    next(); // Proceed to the next middleware or route handler
  });
};



// Donation Endpoint - Example using authenticateToken middleware
router.post('/donate', authenticateToken, async (req, res) => {
  try {
    const { medicinename, exp_date, address, phone, photo, description } = req.body;
    const userId = req.user.userId; // Extract userId from authenticated user

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
      description,
      userId // Assign the userId to the medicine
    });

    // Save medicine document to the database
    await medicine.save();

    res.status(201).json({ message: 'Medicine donated successfully' });
  } catch (error) {
    console.error('Error donating medicine:', error);
    res.status(500).json({ error: 'Failed to donate medicine' });
  }
});




router.post('/request/:medicinename', authenticateToken, async (req, res) => {
  try {
    const { medicinename } = req.params;
    const userId = req.user.userId; // Extract userId from authenticated user
    const { address, phone, photo, description } = req.body;

    // Check if the medicine is already requested
    const existingRequest = await Request.findOne({ medicinename, userId });
    if (existingRequest) {
      return res.status(400).json({ error: 'Medicine is already requested' });
    }

    // Find the donor's email
    const donorMedicine = await Medicine.findOne({ medicinename }).populate('userId');
    if (!donorMedicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }
    const donorId = donorMedicine.userId._id;

    // Create new request instance
    const newRequest = new Request({
      medicinename,
      userId,
      address,
      phone,
      photo,
      description,
      requested: true
    });

    // Save the request to the database
    await newRequest.save();

    // Save notification for the donor
    const donorNotification = new Notification({
      userId: donorId,
      message:`You have a new request for the medicine: ${medicinename}.`
    });

    await donorNotification.save();

    // Save notification for the requester
    const requesterNotification = new Notification({
      userId,
      message: `Your request for the medicine: ${medicinename} has been submitted.`
    });

    await requesterNotification.save();

    res.status(200).json({ message: 'Medicine requested successfully', newRequest });
  } catch (error) {
    console.error('Error requesting medicine:', error);
    res.status(500).json({ error: 'Failed to request medicine' });
  }
});


router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch notifications for the user
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});








// Home Page Endpoint with Donor Names and IDs
router.get('/login/home', async (req, res) => {
  try {
    // Fetch all donated medicines with donor names and IDs from the database
    const donatedMedicines = await Medicine.find({}).populate('userId', 'name _id'); // Include userId in the population
    
    // Extract relevant information for the response
    const formattedMedicines = donatedMedicines.map(medicine => ({
      donorId: medicine.userId ? medicine.userId._id : 'Unknown ID', // Include donor ID
      donorName: medicine.userId ? medicine.userId.name : 'Unknown Donor', // Handle null references
      medicinename: medicine.medicinename,
      exp_date: medicine.exp_date,
      address: medicine.address,
      phone: medicine.phone,
      photo: medicine.photo,
      description: medicine.description
    }));

    res.json(formattedMedicines);
  } catch (error) {
    console.error('Error fetching donated medicines with donor names and IDs:', error.message);
    res.status(500).json({ error: 'Failed to fetch donated medicines with donor names and IDs', details: error.message });
  }
});



// Get all medicine requests endpoint
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    // Fetch all medicine requests from the database
    const requests = await Request.find({}).populate('userId', 'name email'); // Populate user details if needed

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching medicine requests:', error);
    res.status(500).json({ error: 'Failed to fetch medicine requests' });
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
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    const { ratedUserId, rating, comment } = req.body;
    const userId = req.user.userId; // Extract userId from authenticated user

    // Create new feedback instance
    const feedback = new Feedback({
      userId,
      ratedUserId,
      rating,
      comment // Include comment in the feedback object
    });

    // Save the feedback to the database
    await feedback.save();

    res.status(201).json({ message: 'Feedback submitted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Error submitting feedback.' });
  }
});


// Endpoint for retrieving user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Extract userId from authenticated user

    // Fetch user profile
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch feedback for the user
    const feedback = await Feedback.find({ ratedUserId: userId }).select('rating comment');
    const totalRating = feedback.length > 0 ? feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length : 0;

    // Fetch donated medicines by the user (only select name field)
    const donatedMedicines = await Medicine.find({ userId }).select('medicinename');

    // Fetch requested medicines for the user (only select name field)
    const requestedMedicines = await Request.find({ userId }).select('medicinename');

    // Include user profile, rating, donated medicines, requested medicines, and feedback with comments in the response
    const { name, address, phone } = user;
    const profileData = {
      name,
      address,
      phone,
      rating: totalRating,
      feedback: feedback.map(item => ({ rating: item.rating, comment: item.comment })),
      donatedMedicines: donatedMedicines.map(item => item.medicinename), // Include only medicine names
      requestedMedicines: requestedMedicines.map(item => item.medicinename), // Include only medicine names
    };
    res.json(profileData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});








// Endpoint for retrieving user profile by ID
router.get('/profile/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id; // Extract userId from the URL parameter

    // Fetch user profile by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch feedback for the user
    const feedback = await Feedback.find({ ratedUserId: userId }).select('rating comment');
    const totalRating = feedback.length > 0 ? feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length : 0;

    // Fetch donated medicines by the user (only select name field)
    const donatedMedicines = await Medicine.find({ userId }).select('medicinename');

    // Fetch requested medicines for the user (only select name field)
    const requestedMedicines = await Request.find({ userId }).select('medicinename');

    // Include user profile, rating, donated medicines, requested medicines, and feedback with comments in the response
    const { name, address, phone } = user;
    const profileData = {
      name,
      address,
      phone,
      rating: totalRating,
      feedback: feedback.map(item => ({ rating: item.rating, comment: item.comment })),
      donatedMedicines: donatedMedicines.map(item => item.medicinename), // Include only medicine names
      requestedMedicines: requestedMedicines.map(item => item.medicinename), // Include only medicine names
    };

    res.json(profileData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});










module.exports = router;





