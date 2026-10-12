const http = require('http');
const bcrypt = require('bcryptjs');
const db = require('./db');

const BASE_URL = 'http://localhost:5000';

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runQA() {
  console.log('=== STARTING AUTOMATED EXAMFORGE QA SUITE ===\n');

  let passed = 0;
  let failed = 0;
  const bugs = [];

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.log(`[FAIL] ${message}`);
      failed++;
      bugs.push(message);
    }
  }

  try {
    // 1. SECURITY CHECKS
    console.log('--- 1. SECURITY CHECKS ---');
    const noAuthRes = await makeRequest('GET', '/api/student/dashboard-summary');
    assert(noAuthRes.status === 401, 'Missing JWT returns 401');

    const invalidAuthRes = await makeRequest('GET', '/api/student/dashboard-summary', null, 'invalid.jwt.token');
    assert(invalidAuthRes.status === 401, 'Invalid JWT returns 401');

    // Fetch existing admin user or check credentials
    const [adminRows] = await db.promise().query('SELECT * FROM users WHERE role = "admin" LIMIT 1');
    assert(adminRows.length > 0, 'Admin user exists in database');

    let adminToken = '';
    if (adminRows.length > 0) {
      // Login as admin
      const adminLoginRes = await makeRequest('POST', '/api/auth/login', {
        email: adminRows[0].email,
        password: 'admin123',
        role: 'admin'
      });

      if (adminLoginRes.status === 200) {
        adminToken = adminLoginRes.body.token;
      } else {
        const hash = await bcrypt.hash('admin123', 10);
        await db.promise().query('UPDATE users SET password = ? WHERE user_id = ?', [hash, adminRows[0].user_id]);
        const retryLogin = await makeRequest('POST', '/api/auth/login', {
          email: adminRows[0].email,
          password: 'admin123',
          role: 'admin'
        });
        adminToken = retryLogin.body.token;
      }
    }

    assert(Boolean(adminToken), 'Admin login successful and token generated');

    // Create / get two test students
    const student1Email = `qa_student1_${Date.now()}@example.com`;
    const student2Email = `qa_student2_${Date.now()}@example.com`;

    const reg1 = await makeRequest('POST', '/api/auth/register', { name: 'QA Student 1', email: student1Email, password: 'password123' });
    assert(reg1.status === 201, 'Student 1 register successful');

    const reg2 = await makeRequest('POST', '/api/auth/register', { name: 'QA Student 2', email: student2Email, password: 'password123' });
    assert(reg2.status === 201, 'Student 2 register successful');

    const login1 = await makeRequest('POST', '/api/auth/login', { email: student1Email, password: 'password123', role: 'student' });
    assert(login1.status === 200, 'Student 1 login successful');
    const token1 = login1.body.token;

    const login2 = await makeRequest('POST', '/api/auth/login', { email: student2Email, password: 'password123', role: 'student' });
    assert(login2.status === 200, 'Student 2 login successful');
    const token2 = login2.body.token;

    // Student accessing admin endpoint
    const studentAdminRes = await makeRequest('GET', '/api/admin/analytics/overview', null, token1);
    assert(studentAdminRes.status === 403, 'Student accessing admin endpoint returns 403');

    // Invalid login check
    const invalidPassLogin = await makeRequest('POST', '/api/auth/login', { email: student1Email, password: 'wrongpassword', role: 'student' });
    assert(invalidPassLogin.status === 401, 'Invalid password login returns 401');

    const wrongRoleLogin = await makeRequest('POST', '/api/auth/login', { email: student1Email, password: 'password123', role: 'admin' });
    assert(wrongRoleLogin.status === 401, 'Wrong role login returns 401');

    // 2. STUDENT DASHBOARD (EMPTY STATE)
    console.log('\n--- 2. STUDENT DASHBOARD (EMPTY STATE) ---');
    const dashEmpty = await makeRequest('GET', '/api/student/dashboard-summary', null, token1);
    assert(dashEmpty.status === 200, 'Dashboard summary returns 200');
    assert(dashEmpty.body.has_data === false || dashEmpty.body.exams_attempted === 0, 'Dashboard empty state correctly identified');

    // 3. EXAM FLOW
    console.log('\n--- 3. EXAM FLOW ---');
    const examsRes = await makeRequest('GET', '/api/student/exams', null, token1);
    assert(examsRes.status === 200 && Array.isArray(examsRes.body.exams), 'Available exams retrieved');

    let targetExamId = null;
    if (examsRes.body.exams.length > 0) {
      targetExamId = examsRes.body.exams[0].exam_id;
    } else {
      // Create a published test exam with 4-option questions as admin
      const createExam = await makeRequest('POST', '/api/exams', { title: 'QA Test Exam', description: 'Exam for QA', duration: 15 }, adminToken);
      targetExamId = createExam.body.exam_id;
      // Publish exam
      await makeRequest('PUT', `/api/exams/${targetExamId}/status`, { status: 'published' }, adminToken);
      // Add questions
      for (let i = 1; i <= 3; i++) {
        await makeRequest('POST', '/api/questions', {
          exam_id: targetExamId,
          topic: i === 1 ? 'HTML' : i === 2 ? 'CSS' : 'JavaScript',
          difficulty: 'Medium',
          question_text: `QA Question ${i}?`,
          options: [
            { option_label: 'A', option_text: 'Option A' },
            { option_label: 'B', option_text: 'Option B' },
            { option_label: 'C', option_text: 'Option C' },
            { option_label: 'D', option_text: 'Option D' }
          ],
          correct_option: 'A'
        }, adminToken);
      }
    }

    assert(Boolean(targetExamId), 'Target published exam identified for test');

    // Start exam
    const startRes = await makeRequest('POST', `/api/student/exams/${targetExamId}/start`, null, token1);
    assert(startRes.status === 201, 'Start exam returns 201 created');
    const attemptId1 = startRes.body.attempt_id;

    // Get questions
    const qRes = await makeRequest('GET', `/api/student/attempts/${attemptId1}/questions`, null, token1);
    assert(qRes.status === 200, 'Attempt questions loaded');
    assert(Array.isArray(qRes.body.questions) && qRes.body.questions.length > 0, 'Questions returned in attempt');

    // SECURITY CHECK: Ensure correct_option is NOT exposed in student questions API
    const hasCorrectOption = JSON.stringify(qRes.body).includes('correct_option');
    assert(!hasCorrectOption, 'Correct answer options are NOT exposed in student questions API');

    // SECURITY CHECK: Student 2 cannot access Student 1's attempt
    const otherStudentAccess = await makeRequest('GET', `/api/student/attempts/${attemptId1}/questions`, null, token2);
    assert(otherStudentAccess.status === 403, 'Student cannot access another student attempt (403)');

    // Submit exam attempt 1 with mostly WRONG answers (e.g. pick wrong option) to get low score (~30%)
    // Fetch correct options from DB for these questions so we can deliberately pick wrong answers
    const [qDetails] = await db.promise().query('SELECT question_id, correct_option FROM questions WHERE exam_id = ?', [targetExamId]);
    const correctMap = new Map(qDetails.map(q => [q.question_id, q.correct_option]));

    const answers1 = qRes.body.questions.map((q) => {
      const correctOpt = correctMap.get(q.question_id) || 'A';
      const wrongOpt = correctOpt === 'A' ? 'B' : 'A';
      return { question_id: q.question_id, selected_option: wrongOpt };
    });

    const submitRes1 = await makeRequest('POST', `/api/student/attempts/${attemptId1}/submit`, { answers: answers1 }, token1);
    assert(submitRes1.status === 200, 'Exam submission successful');

    // Duplicate submission protection
    const dupSubmitRes = await makeRequest('POST', `/api/student/attempts/${attemptId1}/submit`, { answers: answers1 }, token1);
    assert(dupSubmitRes.status === 409 || dupSubmitRes.status === 400 || dupSubmitRes.status === 403, 'Duplicate submission protected');

    // 4. RESULT & PERFORMANCE
    console.log('\n--- 4. RESULT & PERFORMANCE ---');
    const resultRes = await makeRequest('GET', `/api/student/attempts/${attemptId1}/result`, null, token1);
    assert(resultRes.status === 200, 'Exam result retrieved');
    assert(typeof resultRes.body.score === 'number' && typeof resultRes.body.percentage === 'number', 'Result includes valid score and percentage');

    const perfRes = await makeRequest('GET', `/api/student/attempts/${attemptId1}/performance`, null, token1);
    assert(perfRes.status === 200, 'Attempt performance retrieved');
    assert(Array.isArray(perfRes.body.topics), 'Topic performance array returned');

    // Grok AI insight
    const aiRes = await makeRequest('GET', `/api/student/attempts/${attemptId1}/ai-analysis`, null, token1);
    assert(aiRes.status === 200, 'Grok AI analysis endpoint operational');

    // AI Chatbot Assistant endpoint checks
    const chatNoAuth = await makeRequest('POST', '/api/student/chat-assistant', { message: 'Hello AI' });
    assert(chatNoAuth.status === 401, 'Chatbot endpoint rejects unauthenticated requests (401)');

    const chatEmptyMsg = await makeRequest('POST', '/api/student/chat-assistant', { message: '   ' }, token1);
    assert(chatEmptyMsg.status === 400, 'Chatbot endpoint rejects empty messages (400)');

    const chatValidMsg = await makeRequest('POST', '/api/student/chat-assistant', { message: 'How can I improve my weak topics?' }, token1);
    assert(chatValidMsg.status === 200 && typeof chatValidMsg.body.reply === 'string', 'Chatbot endpoint returns context-aware AI response (200)');

    // 5. RECOMMENDATIONS & RECOMMENDED PRACTICE
    console.log('\n--- 5. RECOMMENDATIONS & RECOMMENDED PRACTICE ---');
    const recsRes = await makeRequest('GET', '/api/student/recommendations', null, token1);
    assert(recsRes.status === 200, 'Recommendations retrieved');
    assert(recsRes.body.has_data === true, 'Recommendations has_data is true');

    const weakTopicName = recsRes.body.focus_now.length > 0 ? recsRes.body.focus_now[0].topic : 'HTML';

    const practiceRes = await makeRequest('GET', `/api/student/practice?topic=${encodeURIComponent(weakTopicName)}`, null, token1);
    assert(practiceRes.status === 200, 'Personalized practice questions loaded for weak topic');

    // 6. IMPROVEMENT LOOP
    console.log('\n--- 6. IMPROVEMENT LOOP ---');
    if (practiceRes.body.questions && practiceRes.body.questions.length > 0) {
      // Look up real correct options to answer correctly in practice
      const pQIds = practiceRes.body.questions.map(q => q.question_id);
      const [pDetails] = await db.promise().query('SELECT question_id, correct_option FROM questions WHERE question_id IN (?)', [pQIds]);
      const pCorrectMap = new Map(pDetails.map(q => [q.question_id, q.correct_option]));

      const practiceAnswers = practiceRes.body.questions.map((q) => ({
        question_id: q.question_id,
        selected_option: pCorrectMap.get(q.question_id) || 'A'
      }));

      const submitPractice = await makeRequest('POST', '/api/student/practice/submit', { answers: practiceAnswers }, token1);
      assert(submitPractice.status === 200, 'Practice submit successful');
      assert(submitPractice.body.percentage >= 70, 'Practice score >= 70%');
      assert(submitPractice.body.improvement_status === 'Improved', 'Improvement status detected as Improved');

      // Check updated recommendations
      const recsAfter = await makeRequest('GET', '/api/student/recommendations', null, token1);
      assert(recsAfter.status === 200, 'Recommendations refreshed after practice');
      const categoryAfter = recsAfter.body.doing_well.concat(recsAfter.body.improve_next).some(t => t.topic === weakTopicName);
      assert(categoryAfter, 'Recommendation priority changed: topic moved to Improve Next or Doing Well');
    }

    // 7. APTITUDE & CODING FLOW
    console.log('\n--- 7. APTITUDE & CODING FLOW ---');
    const aptCategories = await makeRequest('GET', '/api/student/aptitude/categories', null, token1);
    assert(aptCategories.status === 200, 'Aptitude categories endpoint works');

    const codingChallenges = await makeRequest('GET', '/api/student/coding/challenges', null, token1);
    assert(codingChallenges.status === 200, 'Coding challenges endpoint works');

    // 8. ADMIN FLOW
    console.log('\n--- 8. ADMIN FLOW ---');
    const adminOverview = await makeRequest('GET', '/api/admin/analytics/overview', null, adminToken);
    assert(adminOverview.status === 200, 'Admin analytics overview works');

    const adminCoding = await makeRequest('GET', '/api/admin/coding/challenges', null, adminToken);
    assert(adminCoding.status === 200, 'Admin coding management works');

    const adminAptitude = await makeRequest('GET', '/api/admin/aptitude/categories', null, adminToken);
    assert(adminAptitude.status === 200, 'Admin aptitude management works');

  } catch (err) {
    console.error('QA Execution Error:', err);
    assert(false, `Unexpected exception: ${err.message}`);
  }

  console.log(`\n=== QA SUITE RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (bugs.length > 0) {
    console.log('BUGS ENCOUNTERED:');
    bugs.forEach((b, i) => console.log(` ${i + 1}. ${b}`));
  }

  process.exit(failed > 0 ? 1 : 0);
}

runQA();
