const express = require('express');
const db = require('../db');

const router = express.Router();
const difficulties = ['Easy', 'Medium', 'Hard'];
const modes = [...difficulties, 'Mixed'];
const options = ['A', 'B', 'C', 'D'];

function positiveId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validQuestionCount(value) {
  const count = Number(value);
  return Number.isInteger(count) && [5, 10, 15].includes(count) ? count : null;
}

function shuffled(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

router.get('/topics/:topicId/questions', async (req, res) => {
  const topicId = positiveId(req.params.topicId);
  if (!topicId) return res.status(400).json({ message: 'A valid aptitude topic is required.' });
  try {
    const [topics] = await db.promise().query(
      'SELECT topic_id, name, difficulty FROM aptitude_topics WHERE topic_id = ?',
      [topicId]
    );
    if (!topics.length) return res.status(404).json({ message: 'Aptitude topic was not found.' });
    const [counts] = await db.promise().query(
      `SELECT difficulty, COUNT(*) AS available
       FROM aptitude_practice_questions WHERE topic_id = ? GROUP BY difficulty`,
      [topicId]
    );
    res.json({
      topic: topics[0],
      available_questions: counts.reduce((total, row) => total + Number(row.available), 0),
      by_difficulty: Object.fromEntries(difficulties.map((difficulty) => [
        difficulty,
        Number(counts.find((row) => row.difficulty === difficulty)?.available || 0)
      ]))
    });
  } catch (error) {
    console.error('Unable to load aptitude practice question counts:', error.message);
    res.status(500).json({ message: 'Unable to load practice questions.' });
  }
});

router.post('/attempts', async (req, res) => {
  const topicId = positiveId(req.body?.topic_id);
  const count = validQuestionCount(req.body?.count);
  const mode = req.body?.difficulty_mode;
  const timerSeconds = req.body?.timer_seconds === null || req.body?.timer_seconds === undefined
    ? null
    : Number(req.body.timer_seconds);
  if (!topicId || !count || !modes.includes(mode)) {
    return res.status(400).json({ message: 'Choose a valid topic, question count, and difficulty.' });
  }
  if (timerSeconds !== null && (!Number.isInteger(timerSeconds) || timerSeconds < 60 || timerSeconds > 3600)) {
    return res.status(400).json({ message: 'Timer duration must be between 1 and 60 minutes.' });
  }

  let connection;
  let started = false;
  try {
    const [topics] = await db.promise().query(
      'SELECT topic_id, name, difficulty FROM aptitude_topics WHERE topic_id = ?',
      [topicId]
    );
    if (!topics.length) return res.status(404).json({ message: 'Aptitude topic was not found.' });
    const [counts] = await db.promise().query(
      'SELECT COUNT(*) AS available FROM aptitude_practice_questions WHERE topic_id = ?',
      [topicId]
    );
    const available = Number(counts[0].available);
    if (available < count) return res.status(409).json({ message: 'Not enough stored practice questions are available yet.' });

    const mixedBase = Math.floor(count / difficulties.length);
    let mixedRemainder = count % difficulties.length;
    const difficultyCounts = mode === 'Mixed'
      ? Object.fromEntries(difficulties.map((difficulty) => {
        const extra = mixedRemainder > 0 ? 1 : 0;
        mixedRemainder -= extra;
        return [difficulty, mixedBase + extra];
      }))
      : { [mode]: count };
    let selected = [];
    const [recentRows] = await db.promise().query(
      `SELECT DISTINCT aq.question_id
       FROM aptitude_practice_attempts a
       JOIN aptitude_practice_attempt_questions aq ON aq.attempt_id = a.attempt_id
       WHERE a.user_id = ? AND a.topic_id = ?
         AND a.started_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       ORDER BY aq.question_id`,
      [req.user.user_id, topicId]
    );
    const recentlySeen = recentRows.map((row) => Number(row.question_id));

    for (const difficulty of difficulties) {
      const needed = difficultyCounts[difficulty] || 0;
      if (!needed) continue;
      const excludeIds = recentlySeen.length ? ` AND question_id NOT IN (${recentlySeen.map(() => '?').join(',')})` : '';
      const params = [topicId, difficulty, ...recentlySeen];
      const [fresh] = await db.promise().query(
        `SELECT question_id, difficulty, question_text, option_a, option_b, option_c, option_d
         FROM aptitude_practice_questions WHERE topic_id = ? AND difficulty = ?${excludeIds}
         ORDER BY RAND() LIMIT ?`,
        [...params, needed]
      );
      selected.push(...fresh);
      if (fresh.length < needed) {
        const missing = needed - fresh.length;
        const [fallback] = await db.promise().query(
          `SELECT question_id, difficulty, question_text, option_a, option_b, option_c, option_d
           FROM aptitude_practice_questions
           WHERE topic_id = ? AND difficulty = ?${fresh.length ? ` AND question_id NOT IN (${fresh.map(() => '?').join(',')})` : ''}
           ORDER BY RAND() LIMIT ?`,
          [topicId, difficulty, ...fresh.map((row) => row.question_id), missing]
        );
        selected.push(...fallback);
      }
    }
    selected = shuffled(selected).slice(0, count);
    if (selected.length !== count) return res.status(409).json({ message: 'Not enough questions match the selected difficulty.' });

    connection = await db.promise().getConnection();
    await connection.beginTransaction();
    started = true;
    const actualDifficulty = mode === 'Mixed'
      ? null
      : mode;
    const [attempt] = await connection.query(
      `INSERT INTO aptitude_practice_attempts
       (user_id, topic_id, difficulty, difficulty_mode, total_questions, timer_seconds)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.user_id, topicId, actualDifficulty, mode, count, timerSeconds]
    );
    await connection.query(
      'INSERT INTO aptitude_practice_attempt_questions (attempt_id, question_id) VALUES ?',
      [selected.map((question) => [attempt.insertId, question.question_id])]
    );
    await connection.commit();
    started = false;
    res.status(201).json({
      attempt_id: attempt.insertId,
      topic_id: topicId,
      topic: topics[0].name,
      topic_difficulty: topics[0].difficulty,
      difficulty: actualDifficulty,
      difficulty_mode: mode,
      total_questions: count,
      timer_seconds: timerSeconds,
      questions: selected.map((question, index) => ({
        question_id: question.question_id,
        question: question.question_text,
        difficulty: question.difficulty,
        options: { A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d },
        position: index + 1
      }))
    });
  } catch (error) {
    if (connection && started) {
      try { await connection.rollback(); } catch {}
    }
    console.error('Unable to start aptitude practice:', error.message);
    res.status(500).json({ message: 'Unable to start practice right now.' });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/attempts/:attemptId', async (req, res) => {
  const attemptId = positiveId(req.params.attemptId);
  if (!attemptId) return res.status(400).json({ message: 'A valid practice attempt is required.' });
  try {
    const [attempts] = await db.promise().query(
      `SELECT a.attempt_id, a.topic_id, t.name AS topic, a.difficulty, a.difficulty_mode,
              a.total_questions, a.correct_answers, a.score, a.timer_seconds,
              a.time_taken_seconds, a.started_at, a.completed_at
       FROM aptitude_practice_attempts a
       JOIN aptitude_topics t ON t.topic_id = a.topic_id
       WHERE a.attempt_id = ? AND a.user_id = ?`,
      [attemptId, req.user.user_id]
    );
    if (!attempts.length) return res.status(404).json({ message: 'Practice attempt was not found.' });
    const [questions] = await db.promise().query(
      `SELECT q.question_id, q.question_text AS question, q.difficulty,
              q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option,
              q.explanation, aq.selected_option
       FROM aptitude_practice_attempt_questions aq
       JOIN aptitude_practice_questions q ON q.question_id = aq.question_id
       WHERE aq.attempt_id = ? ORDER BY aq.attempt_question_id`,
      [attemptId]
    );
    const completed = Boolean(attempts[0].completed_at);
    res.json({
      attempt: attempts[0],
      questions: questions.map((question) => ({
        question_id: question.question_id,
        question: question.question,
        difficulty: question.difficulty,
        options: { A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d },
        ...(completed ? {
          selected_option: question.selected_option,
          correct_option: question.correct_option,
          is_correct: question.selected_option !== null && question.selected_option === question.correct_option,
          explanation: question.explanation
        } : {})
      }))
    });
  } catch (error) {
    console.error('Unable to load aptitude practice attempt:', error.message);
    res.status(500).json({ message: 'Unable to load this practice attempt.' });
  }
});

router.post('/attempts/:attemptId/submit', async (req, res) => {
  const attemptId = positiveId(req.params.attemptId);
  const answers = req.body?.answers;
  const timedOut = req.body?.timed_out === true;
  const timeTaken = req.body?.time_taken_seconds === undefined ? null : Number(req.body.time_taken_seconds);
  if (!attemptId || !Array.isArray(answers) || answers.length < 5 || answers.length > 15 ||
    (timeTaken !== null && (!Number.isInteger(timeTaken) || timeTaken < 0 || timeTaken > 86400))) {
    return res.status(400).json({ message: 'The submitted practice answers are invalid.' });
  }
  const answerMap = new Map();
  for (const answer of answers) {
    const questionId = positiveId(answer?.question_id);
    const validSelection = options.includes(answer?.selected_option) || (timedOut && answer?.selected_option === null);
    if (!questionId || !validSelection || answerMap.has(questionId)) {
      return res.status(400).json({ message: 'The submitted practice answers are invalid.' });
    }
    answerMap.set(questionId, answer.selected_option);
  }

  let connection;
  let started = false;
  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();
    started = true;
    const [attempts] = await connection.query(
      `SELECT attempt_id, topic_id, difficulty, difficulty_mode, total_questions,
              timer_seconds, completed_at
       FROM aptitude_practice_attempts
       WHERE attempt_id = ? AND user_id = ? FOR UPDATE`,
      [attemptId, req.user.user_id]
    );
    if (!attempts.length) {
      await connection.rollback();
      started = false;
      return res.status(404).json({ message: 'Practice attempt was not found.' });
    }
    if (attempts[0].completed_at) {
      await connection.rollback();
      started = false;
      return res.status(409).json({ message: 'This practice attempt has already been submitted.' });
    }
    const [questions] = await connection.query(
      `SELECT q.question_id, q.question_text AS question, q.difficulty,
              q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option,
              q.explanation, aq.selected_option
       FROM aptitude_practice_attempt_questions aq
       JOIN aptitude_practice_questions q ON q.question_id = aq.question_id
       WHERE aq.attempt_id = ? ORDER BY aq.attempt_question_id`,
      [attemptId]
    );
    if (questions.length !== Number(attempts[0].total_questions) || answerMap.size !== questions.length ||
      questions.some((question) => !answerMap.has(question.question_id))) {
      await connection.rollback();
      started = false;
      return res.status(400).json({ message: 'Submit an answer for every practice question.' });
    }
    const correct = questions.filter((question) => answerMap.get(question.question_id) === question.correct_option).length;
    const score = Math.round((correct / questions.length) * 10000) / 100;
    for (const question of questions) {
      await connection.query(
        'UPDATE aptitude_practice_attempt_questions SET selected_option = ? WHERE attempt_id = ? AND question_id = ?',
        [answerMap.get(question.question_id), attemptId, question.question_id]
      );
    }
    await connection.query(
      `UPDATE aptitude_practice_attempts
       SET correct_answers = ?, score = ?, time_taken_seconds = ?, completed_at = NOW()
       WHERE attempt_id = ? AND user_id = ?`,
      [correct, score, timeTaken, attemptId, req.user.user_id]
    );
    await connection.commit();
    started = false;
    res.json({
      attempt_id: attemptId,
      topic_id: attempts[0].topic_id,
      difficulty: attempts[0].difficulty,
      difficulty_mode: attempts[0].difficulty_mode,
      total_questions: questions.length,
      correct_answers: correct,
      wrong_answers: questions.filter((question) => answerMap.get(question.question_id) !== null &&
        answerMap.get(question.question_id) !== question.correct_option).length,
      unanswered: questions.filter((question) => answerMap.get(question.question_id) === null).length,
      score,
      time_taken_seconds: timeTaken,
      questions: questions.map((question) => {
        const selected = answerMap.get(question.question_id);
        return {
          question_id: question.question_id,
          question: question.question,
          difficulty: question.difficulty,
          options: { A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d },
          selected_option: selected,
          correct_option: question.correct_option,
          is_correct: selected !== null && selected === question.correct_option,
          explanation: question.explanation
        };
      })
    });
  } catch (error) {
    if (connection && started) {
      try { await connection.rollback(); } catch {}
    }
    console.error('Unable to submit aptitude practice:', error.message);
    res.status(500).json({ message: 'Unable to submit this practice attempt.' });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/history', async (req, res) => {
  try {
    const [attempts] = await db.promise().query(
      `SELECT a.attempt_id, a.topic_id, t.name AS topic, c.name AS category,
              a.difficulty, a.difficulty_mode, a.total_questions, a.correct_answers,
              a.score, a.started_at, a.completed_at, a.time_taken_seconds
       FROM aptitude_practice_attempts a
       JOIN aptitude_topics t ON t.topic_id = a.topic_id
       JOIN aptitude_categories c ON c.category_id = t.category_id
       WHERE a.user_id = ? AND a.completed_at IS NOT NULL
       ORDER BY a.completed_at DESC, a.attempt_id DESC LIMIT 100`,
      [req.user.user_id]
    );
    res.json({ attempts: attempts.map((attempt) => ({ ...attempt, source: 'practice' })) });
  } catch (error) {
    console.error('Unable to load aptitude practice history:', error.message);
    res.status(500).json({ message: 'Unable to load practice history.' });
  }
});

router.get('/performance', async (req, res) => {
  try {
    const [summaryRows] = await db.promise().query(
      `SELECT COUNT(*) AS quizzes_completed, COALESCE(AVG(score), 0) AS average_score,
              COALESCE(SUM(total_questions), 0) AS questions_solved
       FROM aptitude_practice_attempts WHERE user_id = ? AND completed_at IS NOT NULL`,
      [req.user.user_id]
    );
    const [topics] = await db.promise().query(
      `SELECT t.topic_id, t.name AS topic, SUM(a.correct_answers) AS correct_answers,
              SUM(a.total_questions) AS questions_solved, COUNT(a.attempt_id) AS quizzes_completed,
              ROUND(SUM(a.correct_answers)*100/NULLIF(SUM(a.total_questions),0),2) AS accuracy
       FROM aptitude_practice_attempts a JOIN aptitude_topics t ON t.topic_id=a.topic_id
       WHERE a.user_id=? AND a.completed_at IS NOT NULL
       GROUP BY t.topic_id,t.name ORDER BY accuracy,t.name`,
      [req.user.user_id]
    );
    const summary = summaryRows[0];
    res.json({
      summary: {
        quizzes_completed: Number(summary.quizzes_completed),
        average_score: Number(Number(summary.average_score).toFixed(2)),
        questions_solved: Number(summary.questions_solved)
      },
      topics: topics.map((topic) => ({
        ...topic,
        correct_answers: Number(topic.correct_answers),
        questions_solved: Number(topic.questions_solved),
        quizzes_completed: Number(topic.quizzes_completed),
        accuracy: Number(topic.accuracy),
        source: 'practice'
      }))
    });
  } catch (error) {
    console.error('Unable to load aptitude practice performance:', error.message);
    res.status(500).json({ message: 'Unable to load practice performance.' });
  }
});

module.exports = router;
