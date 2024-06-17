const express = require('express');
const mongoose = require('mongoose');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = 'mongodb+srv://seifadelelpop:QWEg9jGZSJeAEzQM@mernmed.d6kaain.mongodb.net/?retryWrites=true&w=majority&appName=mernmed';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.use(express.json());
    app.use('/api', routes);
    app.listen(PORT, () => console.log('https://mern-medco22.onrender.com'));
  })
  .catch(err => console.error('Error connecting to MongoDB:', err));