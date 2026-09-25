const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./src/db');
const authRoutes = require('./routes/authRoutes');

// Load environment variables
dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Body parser middleware with generous payload limit for base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', require('./routes/task.routes'));
app.use('/api/habits', require('./routes/habit.routes'));
app.use('/api/goals', require('./routes/goal.routes'));
app.use('/api/health', require('./routes/health.routes'));
app.use('/api/medications', require('./routes/medication.routes'));
app.use('/api/calendar', require('./routes/calendar.routes'));
app.use('/api/finance', require('./routes/finance.routes'));
app.use('/api/notes', require('./routes/note.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Root test route
app.get('/', (req, res) => {
  res.json({
    message: 'HumanOS API is running',
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler (Prevents crashes on unexpected payloads or errors)
app.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});