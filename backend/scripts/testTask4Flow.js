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
const PORT = 5001;

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

async function runTest() {
  console.log('=== Starting Task 4 Integration Test ===');
  const server = app.listen(PORT);
  const conn = await db.promise().getConnection();

  try {
    // 1. Create a test student user
    const testEmail = `test_student_${Date.now()}@example.com`;
    const [userRes] = await conn.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Task4 Test Student', testEmail, 'hash123', 'student']
    );
    const userId = userRes.insertId;
    const token = jwt.sign({ user_id: userId, role: 'student' }, jwtSecret);
    console.log(`Created test student user ID: ${userId}`);

    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Test Empty State when student has no attempt history
    const emptyRecRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/student/recommendations',
      method: 'GET',
      headers: authHeaders
    });
    console.log('1. Empty State Check:', emptyRecRes.body.has_data === false ? 'PASS' : 'FAIL');
    console.log('   Message:', emptyRecRes.body.message);

    // 3. Setup test exam, questions, and initial low attempt (30% score on React Dataflow)
    const [examRes] = await conn.query(
      "INSERT INTO exams (title, description, duration, status, created_by) VALUES ('Task4 Test Exam', 'Test Description', 30, 'published', 1)"
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
        await conn.query(
          'INSERT INTO options (question_id, option_label, option_text) VALUES (?, ?, ?)',
          [qId, label, `Option ${label}`]
        );
      }
    }

    // Insert an initial exam attempt with 3 correct out of 10 (30% accuracy => Weak / Focus Now)
    const [initAttempt] = await conn.query(
      'INSERT INTO attempts (user_id, exam_id, started_at, submitted_at, score, percentage) VALUES (?, ?, NOW(), NOW(), 3, 30.00)',
      [userId, examId]
    );
    const attempt1Id = initAttempt.insertId;
    const answerRows = questionIds.map((qId, idx) => [
      attempt1Id,
      qId,
      idx < 3 ? 'A' : 'B',
      idx < 3 ? 1 : 0
    ]);
    await conn.query(
      'INSERT INTO answers (attempt_id, question_id, selected_option, is_correct) VALUES ?',
      [answerRows]
    );

    // 4. Test GET /api/student/recommendations after exam (Topic should be in Focus Now)
    const recRes1 = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/student/recommendations',
      method: 'GET',
      headers: authHeaders
    });
    console.log('2. Recommendations after exam:', recRes1.body.has_data === true ? 'PASS' : 'FAIL');
    console.log('   Focus Now count:', recRes1.body.focus_now?.length);
    console.log('   Focus Topic:', recRes1.body.focus_now?.[0]?.topic, 'Percentage:', recRes1.body.focus_now?.[0]?.percentage);

    // 5. Test GET /api/student/practice?topic=React%20Dataflow
    const practiceQuestionsRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/student/practice?topic=React%20Dataflow',
      method: 'GET',
      headers: authHeaders
    });
    console.log('3. Practice questions fetched:', practiceQuestionsRes.body.questions?.length > 0 ? 'PASS' : 'FAIL');

    // 6. Test POST /api/student/practice/submit (Score 70%: 7 correct out of 10)
    const practiceAnswers = questionIds.map((qId, idx) => ({
      question_id: qId,
      selected_option: idx < 7 ? 'A' : 'B'
    }));

    const submitRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/student/practice/submit',
      method: 'POST',
      headers: authHeaders
    }, { answers: practiceAnswers });

    console.log('4. Practice Submit Response:');
    console.log('   StatusCode:', submitRes.statusCode);
    console.log('   Percentage:', submitRes.body.percentage, '%');
    console.log('   Previous Percentage:', submitRes.body.previous_percentage, '%');
    console.log('   Improvement Status:', submitRes.body.improvement_status);
    console.log('   Recommendation:', submitRes.body.recommendation);
    console.log('   Updated Category:', submitRes.body.updated_category);

    const isSubmitPass = submitRes.body.percentage === 70 &&
      submitRes.body.previous_percentage === 30 &&
      submitRes.body.improvement_status === 'Improved' &&
      submitRes.body.updated_category === 'Improve Next';
    console.log('   Submit Result Verification:', isSubmitPass ? 'PASS' : 'FAIL');

    // 7. Test Recommendations Flow Update after improvement (Topic should now be in Improve Next, not Focus Now!)
    const recRes2 = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/student/recommendations',
      method: 'GET',
      headers: authHeaders
    });
    console.log('5. Updated Recommendations Check:');
    console.log('   Focus Now count:', recRes2.body.focus_now?.length);
    console.log('   Improve Next count:', recRes2.body.improve_next?.length);
    console.log('   Improve Next Topic:', recRes2.body.improve_next?.[0]?.topic, 'New Overall Percentage:', recRes2.body.improve_next?.[0]?.percentage);

    const isFlowPass = recRes2.body.improve_next?.some((t) => t.topic === 'React Dataflow');
    console.log('   Flow Update Verification:', isFlowPass ? 'PASS' : 'FAIL');

    // Cleanup test user and data
    await conn.query('DELETE FROM answers WHERE attempt_id IN (SELECT attempt_id FROM attempts WHERE user_id = ?)', [userId]);
    await conn.query('DELETE FROM attempts WHERE user_id = ?', [userId]);
    await conn.query('DELETE FROM recommendations WHERE user_id = ?', [userId]);
    await conn.query('DELETE FROM options WHERE question_id IN (?)', [questionIds]);
    await conn.query('DELETE FROM questions WHERE exam_id = ?', [examId]);
    await conn.query('DELETE FROM exams WHERE exam_id = ?', [examId]);
    await conn.query('DELETE FROM users WHERE user_id = ?', [userId]);
    console.log('Cleaned up test data.');

    console.log('=== All Task 4 Automated Integration Tests Complete ===');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    conn.release();
    server.close();
    process.exit();
  }
}

runTest();
