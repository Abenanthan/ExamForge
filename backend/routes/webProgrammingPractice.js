const express = require('express');
const db = require('../db');
const { authenticateToken, requireStudent } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken, requireStudent);

const validDifficulties = ['Easy', 'Medium', 'Hard', 'Mixed'];

async function getUnitsOverview() {
  const [units] = await db.promise().query(
    `SELECT unit_number, unit_name, COUNT(*) as total_questions,
            SUM(difficulty = 'Easy') as easy_count,
            SUM(difficulty = 'Medium') as medium_count,
            SUM(difficulty = 'Hard') as hard_count
     FROM web_programming_questions
     GROUP BY unit_number, unit_name
     ORDER BY unit_number`
  );

  return units.map((u) => ({
    unit_number: Number(u.unit_number),
    unit_name: u.unit_name,
    total_questions: Number(u.total_questions),
    easy_count: Number(u.easy_count),
    medium_count: Number(u.medium_count),
    hard_count: Number(u.hard_count)
  }));
}

function getQuestionPayload(rows) {
  return rows.map((q) => ({
    question_id: q.question_id,
    unit_number: q.unit_number,
    unit_name: q.unit_name,
    topic: q.topic,
    difficulty: q.difficulty,
    question_text: q.question_text,
    options: {
      A: q.option_a,
      B: q.option_b,
      C: q.option_c,
      D: q.option_d
    }
  }));
}
const validOptions = ['A', 'B', 'C', 'D'];
const validCounts = [5, 10, 15];

function parsePositiveId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function shuffled(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

// GET Units Overview
async function handleUnitsQuery(req, res) {
  try {
    const units = await getUnitsOverview();
    res.json({ subject: 'Web Programming', units });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load Web Programming units.', error: error.message });
  }
}

router.get('/units', handleUnitsQuery);
router.get('/web-programming/units', handleUnitsQuery);
router.get('/practice/web-programming/units', handleUnitsQuery);

router.get('/web-programming', async (req, res) => {
  try {
    const rawUnit = req.query.unit;
    const requestedCount = Number(req.query.count ?? req.query.questionCount ?? 15);
    const count = Number.isInteger(requestedCount) && requestedCount > 0 ? requestedCount : 15;
    const isAllUnits = rawUnit === 'All' || rawUnit === undefined || rawUnit === null || rawUnit === '';
    const unitNumber = isAllUnits ? null : Number(rawUnit);

    if (!isAllUnits && (!Number.isInteger(unitNumber) || unitNumber < 1 || unitNumber > 5)) {
      return res.status(400).json({ message: 'Select a valid Web Programming Unit (1-5 or All Units).' });
    }

    let query = 'SELECT q.question_id, q.unit_number, q.unit_name, q.topic, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.difficulty FROM web_programming_questions q WHERE 1=1';
    const params = [];

    if (!isAllUnits) {
      query += ' AND q.unit_number = ?';
      params.push(unitNumber);
    }

    const [questions] = await db.promise().query(`${query} ORDER BY q.question_id`, params);
    const selected = questions.slice(0, count);

    if (selected.length === 0) {
      return res.status(200).json({ subject: 'Web Programming', questions: [], unit_number: unitNumber, question_count: 0 });
    }

    res.json({
      subject: 'Web Programming',
      unit_number: unitNumber,
      unit_name: selected[0]?.unit_name || (isAllUnits ? 'All Units — Web Programming' : `Unit ${unitNumber} — Web Programming`),
      question_count: selected.length,
      questions: getQuestionPayload(selected)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load Web Programming questions.', error: error.message });
  }
});

// START Practice Attempt
async function handleStartAttempt(req, res) {
  const userId = req.user.user_id;
  const unitParam = req.body?.unit_number;
  const difficulty = req.body?.difficulty || 'Mixed';
  const count = Number(req.body?.count) || 10;
  const timerSeconds = req.body?.timer_seconds === null || req.body?.timer_seconds === undefined
    ? null
    : Number(req.body.timer_seconds);

  if (!validDifficulties.includes(difficulty)) {
    return res.status(400).json({ message: 'Select a valid difficulty (Easy, Medium, Hard, or Mixed).' });
  }
  if (!validCounts.includes(count)) {
    return res.status(400).json({ message: 'Select a valid question count (5, 10, or 15).' });
  }
  if (timerSeconds !== null && (!Number.isInteger(timerSeconds) || timerSeconds < 60 || timerSeconds > 3600)) {
    return res.status(400).json({ message: 'Timer duration must be between 1 and 60 minutes.' });
  }

  const isAllUnits = unitParam === 'All' || unitParam === null || unitParam === undefined;
  const unitNumber = isAllUnits ? null : Number(unitParam);

  if (!isAllUnits && (!Number.isInteger(unitNumber) || unitNumber < 1 || unitNumber > 5)) {
    return res.status(400).json({ message: 'Select a valid Web Programming Unit (1-5 or All Units).' });
  }

  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    let query = 'SELECT question_id, unit_number, unit_name, topic, question_text, option_a, option_b, option_c, option_d, difficulty FROM web_programming_questions WHERE 1=1';
    const params = [];

    if (!isAllUnits) {
      query += ' AND unit_number = ?';
      params.push(unitNumber);
    }

    if (difficulty !== 'Mixed') {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    const [availableQuestions] = await connection.query(query, params);

    if (availableQuestions.length < count) {
      await connection.rollback();
      return res.status(409).json({ message: `Only ${availableQuestions.length} questions match your selection. Choose a smaller count or mixed difficulty.` });
    }

    let selectedQuestions = [];
    if (difficulty === 'Mixed') {
      // Pick balanced across difficulties
      const easyList = shuffled(availableQuestions.filter((q) => q.difficulty === 'Easy'));
      const medList = shuffled(availableQuestions.filter((q) => q.difficulty === 'Medium'));
      const hardList = shuffled(availableQuestions.filter((q) => q.difficulty === 'Hard'));

      const perDiff = Math.floor(count / 3);
      let remainder = count % 3;

      const takeEasy = Math.min(easyList.length, perDiff + (remainder > 0 ? 1 : 0));
      if (remainder > 0 && takeEasy > perDiff) remainder--;

      const takeMed = Math.min(medList.length, perDiff + (remainder > 0 ? 1 : 0));
      if (remainder > 0 && takeMed > perDiff) remainder--;

      const takeHard = Math.min(hardList.length, count - takeEasy - takeMed);

      selectedQuestions = [
        ...easyList.slice(0, takeEasy),
        ...medList.slice(0, takeMed),
        ...hardList.slice(0, takeHard)
      ];

      if (selectedQuestions.length < count) {
        const selectedSet = new Set(selectedQuestions.map((q) => q.question_id));
        const extra = shuffled(availableQuestions.filter((q) => !selectedSet.has(q.question_id)));
        selectedQuestions.push(...extra.slice(0, count - selectedQuestions.length));
      }
    } else {
      selectedQuestions = shuffled(availableQuestions).slice(0, count);
    }

    const unitNameLabel = isAllUnits ? 'All Units — Web Programming' : `Unit ${unitNumber} — ${selectedQuestions[0]?.unit_name || 'Web Programming'}`;

    const [attemptRes] = await connection.query(
      `INSERT INTO web_programming_practice_attempts 
       (user_id, unit_number, unit_name, difficulty, question_count, timer_seconds, started_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [userId, unitNumber, unitNameLabel, difficulty, selectedQuestions.length, timerSeconds]
    );

    const attemptId = attemptRes.insertId;

    const attemptQuestionsRows = selectedQuestions.map((q) => [attemptId, q.question_id]);
    await connection.query(
      'INSERT INTO web_programming_practice_attempt_questions (attempt_id, question_id) VALUES ?',
      [attemptQuestionsRows]
    );

    await connection.commit();

    // Return question payload WITHOUT correct_option or explanation (Security Requirement)
    res.status(201).json({
      attempt_id: attemptId,
      subject: 'Web Programming',
      unit_number: unitNumber,
      unit_name: unitNameLabel,
      difficulty,
      question_count: selectedQuestions.length,
      timer_seconds: timerSeconds,
      questions: selectedQuestions.map((q) => ({
        question_id: q.question_id,
        unit_number: q.unit_number,
        topic: q.topic,
        difficulty: q.difficulty,
        question_text: q.question_text,
        options: {
          A: q.option_a,
          B: q.option_b,
          C: q.option_c,
          D: q.option_d
        }
      }))
    });

  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ message: 'Failed to start practice attempt.', error: error.message });
  } finally {
    if (connection) connection.release();
  }
}

router.post('/attempts', handleStartAttempt);
router.post('/web-programming/attempts', handleStartAttempt);
router.post('/practice/web-programming/attempts', handleStartAttempt);

// SUBMIT Practice Attempt
async function handleSubmitAttempt(req, res) {
  const attemptId = parsePositiveId(req.params.attemptId);
  const userId = req.user.user_id;
  const { answers, time_taken_seconds } = req.body || {};

  if (!attemptId || !Array.isArray(answers)) {
    return res.status(400).json({ message: 'A valid attempt ID and answers array are required.' });
  }

  const timeTaken = Number.isInteger(Number(time_taken_seconds)) && Number(time_taken_seconds) >= 0
    ? Number(time_taken_seconds)
    : 0;

  const answerMap = new Map();
  for (const item of answers) {
    const qId = parsePositiveId(item?.question_id);
    const opt = item?.selected_option;
    if (qId && (opt === null || validOptions.includes(opt))) {
      answerMap.set(qId, opt);
    }
  }

  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    const [attempts] = await connection.query(
      `SELECT attempt_id, user_id, unit_number, unit_name, difficulty, question_count, timer_seconds, completed_at
       FROM web_programming_practice_attempts
       WHERE attempt_id = ? AND user_id = ? FOR UPDATE`,
      [attemptId, userId]
    );

    if (attempts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Practice attempt was not found.' });
    }

    const attempt = attempts[0];
    if (attempt.completed_at) {
      await connection.rollback();
      return res.status(409).json({ message: 'This practice attempt has already been submitted.' });
    }

    const [questions] = await connection.query(
      `SELECT q.question_id, q.unit_number, q.topic, q.difficulty, q.question_text,
              q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.explanation
       FROM web_programming_practice_attempt_questions aq
       JOIN web_programming_questions q ON q.question_id = aq.question_id
       WHERE aq.attempt_id = ?
       ORDER BY aq.id`,
      [attemptId]
    );

    let correctCount = 0;
    let unansweredCount = 0;

    for (const q of questions) {
      const selected = answerMap.get(q.question_id) || null;
      const isCorrect = selected === q.correct_option ? 1 : 0;

      if (isCorrect) correctCount++;
      if (!selected) unansweredCount++;

      await connection.query(
        'UPDATE web_programming_practice_attempt_questions SET selected_option = ?, is_correct = ? WHERE attempt_id = ? AND question_id = ?',
        [selected, isCorrect, attemptId, q.question_id]
      );
    }

    const totalQ = questions.length;
    const wrongCount = totalQ - correctCount - unansweredCount;
    const score = Number(((correctCount / totalQ) * 100).toFixed(2));

    await connection.query(
      `UPDATE web_programming_practice_attempts
       SET correct_answers = ?, total_questions = ?, score = ?, time_taken_seconds = ?, completed_at = NOW()
       WHERE attempt_id = ?`,
      [correctCount, totalQ, score, timeTaken, attemptId]
    );

    await connection.commit();

    res.json({
      attempt_id: attemptId,
      subject: 'Web Programming',
      unit_number: attempt.unit_number,
      unit_name: attempt.unit_name,
      difficulty: attempt.difficulty,
      total_questions: totalQ,
      correct_answers: correctCount,
      wrong_answers: wrongCount,
      unanswered: unansweredCount,
      score,
      percentage: score,
      time_taken_seconds: timeTaken,
      questions: questions.map((q) => {
        const sel = answerMap.get(q.question_id) || null;
        return {
          question_id: q.question_id,
          topic: q.topic,
          difficulty: q.difficulty,
          question_text: q.question_text,
          options: {
            A: q.option_a,
            B: q.option_b,
            C: q.option_c,
            D: q.option_d
          },
          selected_option: sel,
          correct_option: q.correct_option,
          is_correct: sel === q.correct_option,
          explanation: q.explanation
        };
      })
    });

  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ message: 'Failed to submit practice attempt.', error: error.message });
  } finally {
    if (connection) connection.release();
  }
}

// GET Practice History
async function handleHistoryQuery(req, res) {
  try {
    const [attempts] = await db.promise().query(
      `SELECT attempt_id, unit_number, unit_name, difficulty, question_count,
              correct_answers, total_questions, score, time_taken_seconds, started_at, completed_at
       FROM web_programming_practice_attempts
       WHERE user_id = ? AND completed_at IS NOT NULL
       ORDER BY completed_at DESC, attempt_id DESC
       LIMIT 50`,
      [req.user.user_id]
    );

    res.json({
      subject: 'Web Programming',
      attempts: attempts.map((a) => ({
        attempt_id: a.attempt_id,
        subject: 'Web Programming',
        unit_number: a.unit_number,
        unit_name: a.unit_name,
        difficulty: a.difficulty,
        question_count: a.question_count,
        correct_answers: a.correct_answers,
        total_questions: a.total_questions,
        score: Number(a.score),
        percentage: Number(a.score),
        time_taken_seconds: a.time_taken_seconds,
        completed_at: a.completed_at
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve Web Programming practice history.', error: error.message });
  }
}

router.post('/web-programming/attempts/:attemptId/submit', handleSubmitAttempt);
router.post('/attempts/:attemptId/submit', handleSubmitAttempt);
router.post('/practice/web-programming/attempts/:attemptId/submit', handleSubmitAttempt);

router.get('/history', handleHistoryQuery);
router.get('/web-programming/history', handleHistoryQuery);
router.get('/practice/web-programming/history', handleHistoryQuery);

module.exports = router;
