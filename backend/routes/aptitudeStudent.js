const express = require('express');

const db = require('../db');
const { generateQuestions, QuizGenerationError } = require('../services/aiQuizService');
const { renderNotesPdf } = require('../services/aptitudeNotesPdf');

const router = express.Router();
const validDifficulties = ['Easy', 'Medium', 'Hard'];
const validOptions = ['A', 'B', 'C', 'D'];

function parsePositiveId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function sendFailure(res, error, fallback) {
  if (error instanceof QuizGenerationError) {
    return res.status(error.status).json({ message: error.message });
  }
  console.error(fallback, error.message);
  return res.status(500).json({ message: fallback });
}

router.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.promise().query(
      `SELECT c.category_id, c.name, c.description, COUNT(t.topic_id) AS topic_count
       FROM aptitude_categories c
       LEFT JOIN aptitude_topics t ON t.category_id = c.category_id
       GROUP BY c.category_id, c.name, c.description
       ORDER BY c.category_id`
    );
    res.json({ categories });
  } catch (error) {
    sendFailure(res, error, 'Unable to load aptitude categories.');
  }
});

  router.get('/topics', async (req, res) => {
    try {
      const [topics] = await db.promise().query(
        `SELECT t.topic_id, t.category_id, t.name, t.description, t.difficulty, c.name AS category_name
         FROM aptitude_topics t JOIN aptitude_categories c ON c.category_id=t.category_id
         ORDER BY c.name,t.name`
      );
      res.json({ topics });
    } catch (error) {
      sendFailure(res, error, 'Unable to load aptitude topics.');
    }
  });

router.get('/topics/:categoryId', async (req, res) => {
  const categoryId = parsePositiveId(req.params.categoryId);
  if (!categoryId) return res.status(400).json({ message: 'A valid category ID is required.' });

  try {
    const [categories] = await db.promise().query(
      'SELECT category_id, name, description FROM aptitude_categories WHERE category_id = ?',
      [categoryId]
    );
    if (categories.length === 0) return res.status(404).json({ message: 'Aptitude category was not found.' });
    const [topics] = await db.promise().query(
      `SELECT topic_id, category_id, name, description, difficulty
       FROM aptitude_topics WHERE category_id = ? ORDER BY topic_id`,
      [categoryId]
    );
    res.json({ category: categories[0], topics });
  } catch (error) {
    sendFailure(res, error, 'Unable to load aptitude topics.');
  }
});

router.get('/topics/:topicId/notes', async (req, res) => {
  const topicId = parsePositiveId(req.params.topicId);
  if (!topicId) return res.status(400).json({ message: 'A valid topic ID is required.' });

  try {
    const [topics] = await db.promise().query(
      `SELECT t.topic_id, t.name, t.description, t.difficulty, c.category_id, c.name AS category_name
       FROM aptitude_topics t
       JOIN aptitude_categories c ON c.category_id = t.category_id
       WHERE t.topic_id = ?`,
      [topicId]
    );
    if (topics.length === 0) return res.status(404).json({ message: 'Aptitude topic was not found.' });

    const [notes] = await db.promise().query(
      `SELECT note_id, title, content, created_at, updated_at
       FROM aptitude_notes WHERE topic_id = ? ORDER BY created_at, note_id`,
      [topicId]
    );
    res.json({ topic: topics[0], notes });
  } catch (error) {
    sendFailure(res, error, 'Unable to load aptitude notes.');
  }
});

router.get('/topics/:topicId/notes/pdf', async (req, res) => {
  const topicId = parsePositiveId(req.params.topicId);
  if (!topicId) return res.status(400).json({ message: 'A valid aptitude topic ID is required.' });
  try {
    const [topics] = await db.promise().query(
      `SELECT t.topic_id, t.name, t.difficulty, c.name AS category_name
       FROM aptitude_topics t JOIN aptitude_categories c ON c.category_id=t.category_id
       WHERE t.topic_id=?`,
      [topicId]
    );
    if (!topics.length) return res.status(404).json({ message: 'Aptitude topic was not found.' });
    const [notes] = await db.promise().query(
      'SELECT title, content FROM aptitude_notes WHERE topic_id=? ORDER BY created_at, note_id LIMIT 1',
      [topicId]
    );
    if (!notes.length) return res.status(404).json({ message: 'Learning notes were not found.' });
    const filename = `${topics[0].name} - Aptitude Notes.pdf`.replace(/[\\/:*?"<>|]/g, '-');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    renderNotesPdf({ topic: topics[0], note: notes[0], response: res });
  } catch (error) {
    console.error('Unable to generate aptitude notes PDF:', error.message);
    if (!res.headersSent) res.status(500).json({ message: 'Unable to download these notes.' });
  }
});

router.post('/quiz/generate', async (req, res) => {
  const topicId = parsePositiveId(req.body?.topic_id);
  const difficulty = req.body?.difficulty;
  const count = Number(req.body?.total_questions);
  if (!topicId) return res.status(400).json({ message: 'Choose a valid aptitude topic.' });
  if (!validDifficulties.includes(difficulty)) {
    return res.status(400).json({ message: 'Choose Easy, Medium, or Hard difficulty.' });
  }
  if (count !== 5) {
    return res.status(400).json({ message: 'AI aptitude quizzes currently require exactly 5 questions.' });
  }

  let connection;
  let transactionStarted = false;
  try {
    const [topics] = await db.promise().query(
      `SELECT t.topic_id, t.name, c.name AS category_name
       FROM aptitude_topics t
       JOIN aptitude_categories c ON c.category_id = t.category_id
       WHERE t.topic_id = ?`,
      [topicId]
    );
    if (topics.length === 0) return res.status(404).json({ message: 'Aptitude topic was not found.' });

    const questions = await generateQuestions({
      category: topics[0].category_name,
      topic: topics[0].name,
      difficulty,
      count
    });

    connection = await db.promise().getConnection();
    await connection.beginTransaction();
    transactionStarted = true;
    const [attempt] = await connection.query(
      `INSERT INTO aptitude_quiz_attempts
       (user_id, topic_id, difficulty, total_questions, started_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [req.user.user_id, topicId, difficulty, count]
    );
    const questionValues = questions.map((question) => [
      attempt.insertId,
      question.question,
      question.options.A,
      question.options.B,
      question.options.C,
      question.options.D,
      question.correct_option,
      question.explanation
    ]);
    await connection.query(
      `INSERT INTO aptitude_quiz_questions
       (attempt_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
       VALUES ?`,
      [questionValues]
    );
    const [savedQuestions] = await connection.query(
      `SELECT question_id, question_text AS question,
              option_a, option_b, option_c, option_d
       FROM aptitude_quiz_questions WHERE attempt_id = ? ORDER BY question_id`,
      [attempt.insertId]
    );
    await connection.commit();
    transactionStarted = false;

    res.status(201).json({
      attempt_id: attempt.insertId,
      topic: topics[0].name,
      difficulty,
      questions: savedQuestions.map((question) => ({
        question_id: question.question_id,
        question: question.question,
        options: {
          A: question.option_a,
          B: question.option_b,
          C: question.option_c,
          D: question.option_d
        }
      }))
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Aptitude quiz rollback failed:', rollbackError.message);
      }
    }
    res.status(error instanceof QuizGenerationError ? error.status : 500).json({
      message: 'Unable to generate the quiz right now. Please try again.'
    });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/quiz/:attemptId', async (req, res) => {
  const attemptId = parsePositiveId(req.params.attemptId);
  if (!attemptId) return res.status(400).json({ message: 'A valid quiz attempt ID is required.' });

  try {
    const [attempts] = await db.promise().query(
      `SELECT a.attempt_id, a.topic_id, t.name AS topic, a.difficulty,
              a.total_questions, a.correct_answers, a.score, a.completed_at
       FROM aptitude_quiz_attempts a
       JOIN aptitude_topics t ON t.topic_id = a.topic_id
       WHERE a.attempt_id = ? AND a.user_id = ?`,
      [attemptId, req.user.user_id]
    );
    if (attempts.length === 0) return res.status(404).json({ message: 'Quiz attempt was not found.' });

    const [questions] = await db.promise().query(
      `SELECT question_id, question_text AS question,
              option_a, option_b, option_c, option_d, selected_option,
              correct_option, explanation
       FROM aptitude_quiz_questions WHERE attempt_id = ? ORDER BY question_id`,
      [attemptId]
    );
    const completed = Boolean(attempts[0].completed_at);
    res.json({
      attempt: attempts[0],
      questions: questions.map((question) => ({
        question_id: question.question_id,
        question: question.question,
        options: { A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d },
        ...(completed ? {
          selected_option: question.selected_option,
          correct_option: question.correct_option,
          is_correct: question.selected_option === question.correct_option,
          explanation: question.explanation
        } : {})
      }))
    });
  } catch (error) {
    sendFailure(res, error, 'Unable to load the aptitude quiz.');
  }
});

router.post('/quiz/:attemptId/submit', async (req, res) => {
  const attemptId = parsePositiveId(req.params.attemptId);
  const submittedAnswers = req.body?.answers;
  const timedOut = req.body?.timed_out === true;
  if (!attemptId) return res.status(400).json({ message: 'A valid quiz attempt ID is required.' });
  if (!Array.isArray(submittedAnswers) || submittedAnswers.length < 5 || submittedAnswers.length > 15) {
    return res.status(400).json({ message: 'Submit an answer for every quiz question.' });
  }

  const answerMap = new Map();
  for (const answer of submittedAnswers) {
    const questionId = parsePositiveId(answer?.question_id);
    const validSelection = validOptions.includes(answer?.selected_option) ||
      (timedOut && answer?.selected_option === null);
    if (!questionId || !validSelection || answerMap.has(questionId)) {
      return res.status(400).json({ message: 'The submitted answers are invalid.' });
    }
    answerMap.set(questionId, answer.selected_option);
  }

  let connection;
  let transactionStarted = false;
  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();
    transactionStarted = true;
    const [attempts] = await connection.query(
      `SELECT a.attempt_id, a.topic_id, a.difficulty, a.total_questions,
              a.correct_answers, a.score, a.completed_at, t.name AS topic
       FROM aptitude_quiz_attempts a
       JOIN aptitude_topics t ON t.topic_id = a.topic_id
       WHERE a.attempt_id = ? AND a.user_id = ? FOR UPDATE`,
      [attemptId, req.user.user_id]
    );
    if (attempts.length === 0) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(404).json({ message: 'Quiz attempt was not found.' });
    }
    const attempt = attempts[0];
    if (attempt.completed_at) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(409).json({ message: 'This quiz has already been submitted.' });
    }

    const [questions] = await connection.query(
      `SELECT question_id, question_text, option_a, option_b, option_c, option_d,
              correct_option, explanation
       FROM aptitude_quiz_questions WHERE attempt_id = ? ORDER BY question_id`,
      [attemptId]
    );
    if (questions.length !== Number(attempt.total_questions) || answerMap.size !== questions.length ||
      questions.some((question) => !answerMap.has(question.question_id))) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(400).json({ message: 'Submit an answer for every quiz question.' });
    }

    const correctAnswers = questions.filter((question) => (
      answerMap.get(question.question_id) === question.correct_option
    )).length;
    const score = Math.round((correctAnswers / questions.length) * 10000) / 100;
    for (const question of questions) {
      await connection.query(
        'UPDATE aptitude_quiz_questions SET selected_option = ? WHERE question_id = ? AND attempt_id = ?',
        [answerMap.get(question.question_id), question.question_id, attemptId]
      );
    }
    await connection.query(
      `UPDATE aptitude_quiz_attempts
       SET correct_answers = ?, score = ?, completed_at = NOW()
       WHERE attempt_id = ? AND user_id = ?`,
      [correctAnswers, score, attemptId, req.user.user_id]
    );
    await connection.commit();
    transactionStarted = false;

    res.json({
      attempt_id: attemptId,
      topic_id: attempt.topic_id,
      topic: attempt.topic,
      difficulty: attempt.difficulty,
      total_questions: questions.length,
      correct_answers: correctAnswers,
      wrong_answers: questions.length - correctAnswers,
      score,
      questions: questions.map((question) => {
        const selected = answerMap.get(question.question_id);
        return {
          question_id: question.question_id,
          question: question.question_text,
          options: {
            A: question.option_a,
            B: question.option_b,
            C: question.option_c,
            D: question.option_d
          },
          selected_option: selected,
          correct_option: question.correct_option,
          is_correct: selected === question.correct_option,
          explanation: question.explanation
        };
      })
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Aptitude submission rollback failed:', rollbackError.message);
      }
    }
    sendFailure(res, error, 'Unable to submit the quiz. Please try again.');
  } finally {
    if (connection) connection.release();
  }
});

router.get('/history', async (req, res) => {
  try {
    const [attempts] = await db.promise().query(
      `SELECT a.attempt_id, a.topic_id, t.name AS topic, c.name AS category,
              a.difficulty, a.total_questions, a.correct_answers, a.score,
              a.started_at, a.completed_at
       FROM aptitude_quiz_attempts a
       JOIN aptitude_topics t ON t.topic_id = a.topic_id
       JOIN aptitude_categories c ON c.category_id = t.category_id
       WHERE a.user_id = ? AND a.completed_at IS NOT NULL
       ORDER BY a.completed_at DESC, a.attempt_id DESC`,
      [req.user.user_id]
    );
    const [practiceAttempts] = await db.promise().query(
      `SELECT a.attempt_id, a.topic_id, t.name AS topic, c.name AS category,
              COALESCE(a.difficulty, a.difficulty_mode) AS difficulty,
              a.difficulty_mode, a.total_questions, a.correct_answers, a.score,
              a.started_at, a.completed_at, a.time_taken_seconds
       FROM aptitude_practice_attempts a
       JOIN aptitude_topics t ON t.topic_id=a.topic_id
       JOIN aptitude_categories c ON c.category_id=t.category_id
       WHERE a.user_id=? AND a.completed_at IS NOT NULL`,
      [req.user.user_id]
    );
    res.json({ attempts: [
      ...attempts.map((attempt) => ({ ...attempt, source: 'ai' })),
      ...practiceAttempts.map((attempt) => ({ ...attempt, source: 'practice' }))
    ].sort((left, right) => new Date(right.completed_at) - new Date(left.completed_at)) });
  } catch (error) {
    sendFailure(res, error, 'Unable to load aptitude history.');
  }
});

router.get('/performance', async (req, res) => {
  try {
    const [summaryRows] = await db.promise().query(
      `SELECT COUNT(*) AS quizzes_completed,
              COALESCE(AVG(score), 0) AS average_score,
              COALESCE(SUM(total_questions), 0) AS questions_solved
       FROM aptitude_quiz_attempts
       WHERE user_id = ? AND completed_at IS NOT NULL`,
      [req.user.user_id]
    );
    const [topics] = await db.promise().query(
      `SELECT t.topic_id, t.name AS topic,
              SUM(a.correct_answers) AS correct_answers,
              SUM(a.total_questions) AS questions_solved,
              COUNT(a.attempt_id) AS quizzes_completed,
              ROUND(SUM(a.correct_answers) * 100 / NULLIF(SUM(a.total_questions), 0), 2) AS accuracy
       FROM aptitude_quiz_attempts a
       JOIN aptitude_topics t ON t.topic_id = a.topic_id
       WHERE a.user_id = ? AND a.completed_at IS NOT NULL
       GROUP BY t.topic_id, t.name
       ORDER BY accuracy DESC, t.name`,
      [req.user.user_id]
    );
    const [practiceSummaryRows] = await db.promise().query(
      `SELECT COUNT(*) AS quizzes_completed, COALESCE(AVG(score), 0) AS average_score,
              COALESCE(SUM(total_questions), 0) AS questions_solved
       FROM aptitude_practice_attempts WHERE user_id=? AND completed_at IS NOT NULL`,
      [req.user.user_id]
    );
    const [practiceTopics] = await db.promise().query(
      `SELECT t.topic_id, t.name AS topic, SUM(a.correct_answers) AS correct_answers,
              SUM(a.total_questions) AS questions_solved, COUNT(a.attempt_id) AS quizzes_completed,
              ROUND(SUM(a.correct_answers)*100/NULLIF(SUM(a.total_questions),0),2) AS accuracy
       FROM aptitude_practice_attempts a JOIN aptitude_topics t ON t.topic_id=a.topic_id
       WHERE a.user_id=? AND a.completed_at IS NOT NULL
       GROUP BY t.topic_id,t.name`,
      [req.user.user_id]
    );
    const summary = summaryRows[0];
    const practiceSummary = practiceSummaryRows[0];
    const combinedTopics = new Map();
    for (const topic of [...topics, ...practiceTopics]) {
      const existing = combinedTopics.get(Number(topic.topic_id)) || {
        topic_id: Number(topic.topic_id), topic: topic.topic, correct_answers: 0,
        questions_solved: 0, quizzes_completed: 0, source: 'combined'
      };
      existing.correct_answers += Number(topic.correct_answers);
      existing.questions_solved += Number(topic.questions_solved);
      existing.quizzes_completed += Number(topic.quizzes_completed);
      existing.accuracy = Number((existing.correct_answers * 100 / existing.questions_solved).toFixed(2));
      combinedTopics.set(Number(topic.topic_id), existing);
    }
    const allTopics = [...combinedTopics.values()].sort((left, right) => right.accuracy - left.accuracy);
    res.json({
      summary: {
        quizzes_completed: Number(summary.quizzes_completed) + Number(practiceSummary.quizzes_completed),
        average_score: Number(((Number(summary.average_score) * Number(summary.quizzes_completed) +
          Number(practiceSummary.average_score) * Number(practiceSummary.quizzes_completed)) /
          Math.max(1, Number(summary.quizzes_completed) + Number(practiceSummary.quizzes_completed))).toFixed(2)),
        questions_solved: Number(summary.questions_solved) + Number(practiceSummary.questions_solved),
        strong_topics: allTopics.filter((topic) => topic.accuracy >= 80).length,
        weak_topics: allTopics.filter((topic) => topic.accuracy < 60).length
      },
      topics: allTopics.map((topic) => ({
        ...topic,
        correct_answers: Number(topic.correct_answers),
        questions_solved: Number(topic.questions_solved),
        quizzes_completed: Number(topic.quizzes_completed),
        accuracy: Number(topic.accuracy)
      }))
    });
  } catch (error) {
    sendFailure(res, error, 'Unable to load aptitude performance.');
  }
});

router.get('/quiz/:attemptId/result', async (req, res) => {
  const attemptId = parsePositiveId(req.params.attemptId);
  if (!attemptId) return res.status(400).json({ message: 'A valid quiz attempt ID is required.' });

  try {
    const [attempts] = await db.promise().query(
      `SELECT a.attempt_id, a.topic_id, t.name AS topic, a.difficulty,
              a.total_questions, a.correct_answers, a.score, a.completed_at
       FROM aptitude_quiz_attempts a
       JOIN aptitude_topics t ON t.topic_id = a.topic_id
       WHERE a.attempt_id = ? AND a.user_id = ? AND a.completed_at IS NOT NULL`,
      [attemptId, req.user.user_id]
    );
    if (attempts.length === 0) return res.status(404).json({ message: 'Quiz result was not found.' });

    const [questions] = await db.promise().query(
      `SELECT question_id, question_text AS question,
              option_a, option_b, option_c, option_d, correct_option,
              selected_option, explanation
       FROM aptitude_quiz_questions WHERE attempt_id = ? ORDER BY question_id`,
      [attemptId]
    );
    res.json({
      ...attempts[0],
      questions: questions.map((question) => ({
        question_id: question.question_id,
        question: question.question,
        options: { A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d },
        selected_option: question.selected_option,
        correct_option: question.correct_option,
        is_correct: question.selected_option === question.correct_option,
        explanation: question.explanation
      }))
    });
  } catch (error) {
    sendFailure(res, error, 'Unable to load the quiz result.');
  }
});

module.exports = router;