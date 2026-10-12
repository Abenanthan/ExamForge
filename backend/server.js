require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required. Set it in the environment or backend/.env.');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');

const db = require('./db');
const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exams');
const questionRoutes = require('./routes/questions');
const studentRoutes = require('./routes/student');
const adminAnalyticsRoutes = require('./routes/adminAnalytics');
const codingAdminRoutes = require('./routes/codingAdmin');
const codingStudentRoutes = require('./routes/codingStudent');
const aptitudeAdminRoutes = require('./routes/aptitudeAdmin');
const aptitudeStudentRoutes = require('./routes/aptitudeStudent');
const aptitudePracticeRoutes = require('./routes/aptitudePractice');
const webProgrammingPracticeRoutes = require('./routes/webProgrammingPractice');
const { authenticateToken, requireAdmin, requireStudent } = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', authenticateToken, requireAdmin, examRoutes);
app.use('/api/questions', authenticateToken, requireAdmin, questionRoutes);
// Student module sub-routes (Must be registered BEFORE general studentRoutes catch-all)
app.use('/api/student/web-programming', authenticateToken, requireStudent, webProgrammingPracticeRoutes);
app.use('/api/student/practice', authenticateToken, requireStudent, webProgrammingPracticeRoutes);
app.use('/api/student/coding', authenticateToken, requireStudent, codingStudentRoutes);
app.use('/api/student/aptitude/practice', authenticateToken, requireStudent, aptitudePracticeRoutes);
app.use('/api/student/aptitude', authenticateToken, requireStudent, aptitudeStudentRoutes);

// General student routes
app.use('/api/student', studentRoutes);
app.use('/api/admin/analytics', authenticateToken, requireAdmin, adminAnalyticsRoutes);
app.use('/api/admin/coding', authenticateToken, requireAdmin, codingAdminRoutes);
app.use('/api/admin/aptitude', authenticateToken, requireAdmin, aptitudeAdminRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'ExamForge Backend is running!'
  });
});

// Test database connection
app.get('/api/test-db', (req, res) => {
  db.query('SELECT 1 AS test', (err, results) => {
    if (err) {
      return res.status(500).json({
        message: 'Database connection failed',
        error: err.message
      });
    }

    res.json({
      message: 'Database connected successfully!',
      result: results
    });
  });
});

// Start server
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`ExamForge backend running on http://localhost:${PORT}`);
});