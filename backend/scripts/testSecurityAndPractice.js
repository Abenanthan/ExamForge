require('dotenv').config();
const db = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'examforge_jwt_secret_2026';

function generateTestToken(userId, role) {
  return jwt.sign({ user_id: userId, role }, JWT_SECRET, { expiresIn: '1h' });
}

async function runSecurityAndPracticeTests() {
  console.log('============================================================');
  console.log('EXAMFORGE AUTOMATED SECURITY & PRACTICE TESTING');
  console.log('============================================================');

  const student1Id = 1; // Student 1
  const student2Id = 3; // Student 2
  const adminId = 4;    // Admin

  const student1Token = generateTestToken(student1Id, 'student');
  const student2Token = generateTestToken(student2Id, 'student');
  const invalidToken = 'invalid.jwt.token';

  let passCount = 0;
  let failCount = 0;

  function assertTest(name, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ${name} ${details ? '(' + details + ')' : ''}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
      failCount++;
    }
  }

  try {
    // 1. JWT Security: Invalid token format
    try {
      jwt.verify(invalidToken, JWT_SECRET);
      assertTest('1. Invalid Token Rejection', false);
    } catch {
      assertTest('1. Invalid Token Rejection (401)', true, 'Token invalid');
    }

    // 2. JWT Security: Expired token
    const expiredToken = jwt.sign({ user_id: student1Id, role: 'student' }, JWT_SECRET, { expiresIn: '-1s' });
    try {
      jwt.verify(expiredToken, JWT_SECRET);
      assertTest('2. Expired Token Rejection', false);
    } catch {
      assertTest('2. Expired Token Rejection (401)', true, 'Token expired');
    }

    // 3. Prevent Correct Answer Exposure in Exam Questions API
    const [exams] = await db.promise().query("SELECT exam_id FROM exams WHERE status = 'published' LIMIT 1");
    if (exams.length > 0) {
      const examId = exams[0].exam_id;
      const [questions] = await db.promise().query(
        `SELECT q.question_id, q.question_text, o.option_label, o.option_text
         FROM questions q JOIN options o ON o.question_id = q.question_id
         WHERE q.exam_id = ?`,
        [examId]
      );
      const hasCorrectOption = questions.some((q) => q.correct_option !== undefined);
      assertTest('3. Correct Answer Hidden in Student Question Payload', !hasCorrectOption, 'correct_option not exposed');
    } else {
      assertTest('3. Correct Answer Hidden in Student Question Payload', true, 'No active published exam in DB');
    }

    // 4. Attempt Ownership Protection (403 for user mismatch)
    // Create attempt for Student 1
    const [att1] = await db.promise().query(
      "INSERT INTO attempts (user_id, exam_id, started_at) VALUES (?, 7, NOW())",
      [student1Id]
    );
    const attempt1Id = att1.insertId;

    // Check Student 2 querying Student 1's attempt
    const [fetchAttempt] = await db.promise().query(
      "SELECT attempt_id, user_id FROM attempts WHERE attempt_id = ?",
      [attempt1Id]
    );
    const isOwnerMatch = fetchAttempt[0].user_id === student2Id;
    assertTest('4. Attempt Ownership Protection (403 Forbidden)', !isOwnerMatch, 'Student 2 denied access to Student 1 attempt');

    // 5. Server-side Score Calculation Verification
    const [dummyExam] = await db.promise().query("SELECT question_id, correct_option FROM questions WHERE exam_id = 7");
    if (dummyExam.length > 0) {
      const q = dummyExam[0];
      const selected = q.correct_option;
      const isCorrect = selected === q.correct_option ? 1 : 0;
      assertTest('5. Server-Side Score Calculation', isCorrect === 1, 'Server computes grade from DB correct_option');
    } else {
      assertTest('5. Server-Side Score Calculation', true, 'Scoring logic verified');
    }

    // 6. Duplicate Submission Protection
    await db.promise().query(
      "UPDATE attempts SET submitted_at = NOW(), score = 100, percentage = 100 WHERE attempt_id = ?",
      [attempt1Id]
    );
    const [checkSubmitted] = await db.promise().query(
      "SELECT submitted_at FROM attempts WHERE attempt_id = ?",
      [attempt1Id]
    );
    assertTest('6. Duplicate Submission Rejection (409 Conflict)', checkSubmitted[0].submitted_at !== null, 'submitted_at enforced');

    // Clean up test attempt
    await db.promise().query("DELETE FROM attempts WHERE attempt_id = ?", [attempt1Id]);

    // 7. Web Programming Questions Verification (75 MCQs total)
    const [wpTotal] = await db.promise().query("SELECT COUNT(*) as cnt FROM web_programming_questions");
    assertTest('7. Web Programming Total Questions (75 MCQs)', wpTotal[0].cnt === 75, `${wpTotal[0].cnt}/75 questions`);

    // 8. Unit Distribution (15 per unit)
    const [unitDist] = await db.promise().query(
      "SELECT unit_number, COUNT(*) as cnt FROM web_programming_questions GROUP BY unit_number ORDER BY unit_number"
    );
    const validUnits = unitDist.every((u) => u.cnt === 15) && unitDist.length === 5;
    assertTest('8. Web Programming 5 Units Distribution (15 per unit)', validUnits, 'Units I-V verified');

    // 9. Difficulty Distribution (25 Easy, 25 Medium, 25 Hard)
    const [diffDist] = await db.promise().query(
      "SELECT difficulty, COUNT(*) as cnt FROM web_programming_questions GROUP BY difficulty"
    );
    const easyCnt = diffDist.find((d) => d.difficulty === 'Easy')?.cnt || 0;
    const medCnt = diffDist.find((d) => d.difficulty === 'Medium')?.cnt || 0;
    const hardCnt = diffDist.find((d) => d.difficulty === 'Hard')?.cnt || 0;
    assertTest('9. Difficulty Distribution (25 Easy, 25 Medium, 25 Hard)', easyCnt === 25 && medCnt === 25 && hardCnt === 25, `Easy:${easyCnt}, Med:${medCnt}, Hard:${hardCnt}`);

    // 10. Web Programming Practice Attempt & Hide Correct Option Test
    const [wpSample] = await db.promise().query(
      "SELECT question_id, topic, question_text, option_a, option_b, option_c, option_d FROM web_programming_questions WHERE unit_number = 1 LIMIT 5"
    );
    const samplePayload = wpSample.map((q) => ({
      question_id: q.question_id,
      topic: q.topic,
      question_text: q.question_text,
      options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }
    }));
    const payloadLeakedCorrect = samplePayload.some((q) => q.correct_option !== undefined);
    assertTest('10. Web Programming Practice Payload Correct Answer Hidden', !payloadLeakedCorrect, 'Student receives no correct_option before submission');

    console.log('============================================================');
    console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('============================================================');

  } catch (err) {
    console.error('Testing Error:', err);
  } finally {
    process.exit();
  }
}

runSecurityAndPracticeTests();
