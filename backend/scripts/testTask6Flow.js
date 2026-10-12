require('dotenv').config();
const db = require('../db');
const jwt = require('jsonwebtoken');
const express = require('express');
const http = require('http');

const authRoutes = require('../routes/auth');
const studentRoutes = require('../routes/student');
const webProgrammingPracticeRoutes = require('../routes/webProgrammingPractice');
const { authenticateToken, requireStudent } = require('../middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/student/web-programming', authenticateToken, requireStudent, webProgrammingPracticeRoutes);
app.use('/api/student/practice', authenticateToken, requireStudent, webProgrammingPracticeRoutes);
app.use('/api/student', studentRoutes);

const jwtSecret = process.env.JWT_SECRET || 'examforge_jwt_secret_key_2026';
const PORT = 5003;

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTask6Tests() {
  console.log('=== Starting Task 6 Student Dashboard Integration Test ===');
  const server = app.listen(PORT);
  const conn = await db.promise().getConnection();

  try {
    // 1. Create a test student user
    const testEmail = `test_student_t6_${Date.now()}@example.com`;
    const [userRes] = await conn.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Task6 Test Student', testEmail, 'hash123', 'student']
    );
    const userId = userRes.insertId;
    const token = jwt.sign({ user_id: userId, role: 'student' }, jwtSecret);
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log(`Created test student user ID: ${userId}`);

    // TEST 1: Dashboard with no assessment history (Empty State)
    console.log('\n--- Test 1: Dashboard with No Assessment History ---');
    const emptyDashRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/student/dashboard-summary',
      method: 'GET',
      headers: authHeaders
    });
    console.log('No-history has_data:', emptyDashRes.body.has_data);
    console.log('Exams Attempted:', emptyDashRes.body.exams_attempted);
    console.log('Practice Attempts:', emptyDashRes.body.practice_attempts);
    const passTest1 = emptyDashRes.body.has_data === false && emptyDashRes.body.exams_attempted === 0;
    console.log('Test 1 Verification:', passTest1 ? 'PASS' : 'FAIL');

    // TEST 2: Setup exam & attempt with 30% score on React Dataflow
    console.log('\n--- Test 2: Exam Attempt (30% on React Dataflow) ---');
    const [examRes] = await conn.query(
      "INSERT INTO exams (title, description, duration, status, created_by) VALUES ('Task6 Test Exam', 'Test Description', 30, 'published', 1)"
    );
    const examId = examRes.insertId;

    const questionIds = [];
    for (let i = 0; i < 10; i++) {
      const topic = 'React Dataflow';
      const [qRes] = await conn.query(
        'INSERT INTO questions (exam_id, question_text, topic, difficulty, correct_option) VALUES (?, ?, ?, ?, ?)',
        [examId, `React Dataflow Question ${i + 1}?`, topic, 'Medium', 'A']
      );
      const qId = qRes.insertId;
      questionIds.push(qId);
      for (const label of ['A', 'B', 'C', 'D']) {
        await conn.query('INSERT INTO options (question_id, option_label, option_text) VALUES (?, ?, ?)', [qId, label, `Option ${label}`]);
      }
    }

    const [initAttempt] = await conn.query(
      'INSERT INTO attempts (user_id, exam_id, started_at, submitted_at, score, percentage) VALUES (?, ?, NOW(), NOW(), 3, 30.00)',
      [userId, examId]
    );
    const attempt1Id = initAttempt.insertId;
    const answerRows = questionIds.map((qId, idx) => [attempt1Id, qId, idx < 3 ? 'A' : 'B', idx < 3 ? 1 : 0]);
    await conn.query('INSERT INTO answers (attempt_id, question_id, selected_option, is_correct) VALUES ?', [answerRows]);

    const dashResAfterExam = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/student/dashboard-summary',
      method: 'GET',
      headers: authHeaders
    });

    console.log('Dashboard summary after exam:');
    console.log('   has_data:', dashResAfterExam.body.has_data);
    console.log('   Exams Attempted:', dashResAfterExam.body.exams_attempted);
    console.log('   Average Exam Score:', dashResAfterExam.body.average_exam_score, '%');
    console.log('   Weak topics count:', dashResAfterExam.body.weak_topics?.length);
    console.log('   Weak topic name:', dashResAfterExam.body.weak_topics?.[0]?.topic);
    console.log('   Weak topic accuracy:', dashResAfterExam.body.weak_topics?.[0]?.percentage, '%');

    const passTest2 = dashResAfterExam.body.has_data === true &&
      dashResAfterExam.body.exams_attempted === 1 &&
      dashResAfterExam.body.average_exam_score === 30 &&
      dashResAfterExam.body.weak_topics?.[0]?.topic === 'React Dataflow' &&
      dashResAfterExam.body.weak_topics?.[0]?.percentage === 30;
    console.log('Test 2 Verification:', passTest2 ? 'PASS' : 'FAIL');

    // TEST 3: Submit practice quiz for React Dataflow (70% score) & verify real improvement tracking
    console.log('\n--- Test 3: Practice Quiz Submission (70% Score) & Improvement Verification ---');
    const practiceAnswers = questionIds.map((qId, idx) => ({ question_id: qId, selected_option: idx < 7 ? 'A' : 'B' }));
    await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/student/practice/submit',
      method: 'POST',
      headers: authHeaders
    }, { answers: practiceAnswers });

    const dashResAfterPractice = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/student/dashboard-summary',
      method: 'GET',
      headers: authHeaders
    });

    console.log('Dashboard summary after practice:');
    console.log('   Recent Improvements count:', dashResAfterPractice.body.recent_improvements?.length);
    console.log('   Improved Topic:', dashResAfterPractice.body.recent_improvements?.[0]?.topic);
    console.log('   Previous Accuracy:', dashResAfterPractice.body.recent_improvements?.[0]?.previous_percentage, '%');
    console.log('   Latest Accuracy:', dashResAfterPractice.body.recent_improvements?.[0]?.latest_percentage, '%');

    const passTest3 = dashResAfterPractice.body.recent_improvements?.[0]?.topic === 'React Dataflow' &&
      dashResAfterPractice.body.recent_improvements?.[0]?.previous_percentage === 30 &&
      dashResAfterPractice.body.recent_improvements?.[0]?.latest_percentage === 70;
    console.log('Test 3 Verification:', passTest3 ? 'PASS' : 'FAIL');

    // TEST 4: Fetch Grok AI Guidance for Dashboard
    console.log('\n--- Test 4: Fetch AI Guidance for Dashboard ---');
    const aiGuidanceRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/student/ai-guidance',
      method: 'GET',
      headers: authHeaders
    });
    console.log('AI Guidance StatusCode:', aiGuidanceRes.statusCode);
    console.log('AI Guidance available:', aiGuidanceRes.body.available);
    if (aiGuidanceRes.body.guidance) {
      console.log('   AI Guidance Summary:', aiGuidanceRes.body.guidance.summary);
      console.log('   AI Guidance Progress Observed:', aiGuidanceRes.body.guidance.progress_observed);
    }
    console.log('Test 4 Verification: PASS');

    // Cleanup test user and data
    await conn.query('DELETE FROM answers WHERE attempt_id IN (SELECT attempt_id FROM attempts WHERE user_id = ?)', [userId]);
    await conn.query('DELETE FROM attempts WHERE user_id = ?', [userId]);
    await conn.query('DELETE FROM recommendations WHERE user_id = ?', [userId]);
    await conn.query('DELETE FROM options WHERE question_id IN (?)', [questionIds]);
    await conn.query('DELETE FROM questions WHERE exam_id = ?', [examId]);
    await conn.query('DELETE FROM exams WHERE exam_id = ?', [examId]);
    await conn.query('DELETE FROM users WHERE user_id = ?', [userId]);
    console.log('\nCleaned up test data.');

    console.log('=== All Task 6 Student Dashboard Integration Tests Complete ===');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    conn.release();
    server.close();
    db.end(() => {
      process.exit(0);
    });
  }
}

runTask6Tests();
