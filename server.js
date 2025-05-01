const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB setup
const dbUri = 'mongodb+srv://gniresults:gni1234@cluster0.iqgr5ty.mongodb.net/Results?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'Results';
const collectionName = 'StudentResults';

let dbClient;

// Connect to MongoDB
async function connectMongo() {
  try {
    dbClient = await MongoClient.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Connected to MongoDB Atlas");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}
connectMongo();

// Middlewares
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, 'frontend')));

// Rate limiter (optional but good practice)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// GET all student results
app.get('/api/data', async (req, res) => {
  try {
    const db = dbClient.db(dbName);
    const collection = db.collection(collectionName);
    const results = await collection.find().toArray();

    res.json(results || []);
  } catch (error) {
    console.error('Error fetching all data:', error.message);
    res.status(500).json([]);
  }
});

// POST: Get result by roll number
app.post('/getResults', async (req, res) => {
  const { rollNumber } = req.body;

  if (!rollNumber) {
    return res.status(400).send('Roll Number is required');
  }

  try {
    const db = dbClient.db(dbName);
    const collection = db.collection(collectionName);

    const result = await collection.find({ rollNumber });

    if (!result) {
      return res.status(404).send('Result not found for the given Roll Number');
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching result by roll number:', error.message);
    res.status(500).send('Server error while fetching result');
  }
});

// Fallback route (optional)
app.get('*', (req, res) => {
  res.status(404).send('Route not found');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
