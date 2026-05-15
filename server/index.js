const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/menu', require('./routes/menu'));
app.use('/api/events', require('./routes/events'));
app.use('/api/albums', require('./routes/albums'));
app.use('/api/performers', require('./routes/performers'));
app.use('/api/drive', require('./routes/drive'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
