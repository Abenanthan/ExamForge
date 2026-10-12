const express = require('express');

const db = require('../db');
const { authenticateToken, requireStudent } = require('../middleware/auth');
const { getAIAnalysis, getAIChatResponse } = require('../services/grokAIService');

const router = express.Router();
const validOptions = ['A', 'B', 'C', 'D'];
const recommendationLimitPerTopic = 5;
const practiceQuestionLimit = 10;
router.use(authenticateToken, requireStudent);

function parsePositiveId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function getWeakTopicSummary(executor, userId) {
  const [completedRows] = await executor.query(
    'SELECT COUNT(*) AS completed_attempts FROM attempts WHERE user_id = ? AND submitted_at IS NOT NULL',
    [userId]
  );
  const [weakTopics] = await executor.query(
    `SELECT COALESCE(NULLIF(TRIM(q.topic), ''), 'Uncategorized') AS topic,
            COUNT(*) AS total_questions,
            SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS correct_answers
     FROM attempts t
     JOIN answers a ON a.attempt_id = t.attempt_id
     JOIN questions q ON q.question_id = a.question_id AND q.exam_id = t.exam_id
     WHERE t.user_id = ? AND t.submitted_at IS NOT NULL
     GROUP BY COALESCE(NULLIF(TRIM(q.topic), ''), 'Uncategorized')
     HAVING SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) * 100 < COUNT(*) * 60
     ORDER BY topic`,
    [userId]
  );

  return {
    completedAttempts: Number(completedRows[0].completed_attempts),
    weakTopics: weakTopics.map((row) => row.topic)
  };
}

async function getRecommendationCandidates(executor, userId, weakTopics) {
  if (weakTopics.length === 0) return [];

  const [rows] = await executor.query(
    `SELECT q.question_id,
            COALESCE(NULLIF(TRIM(q.topic), ''), 'Uncategorized') AS topic,
            q.question_text,
            q.difficulty,
            EXISTS (
              SELECT 1
              FROM answers a
              JOIN attempts t ON t.attempt_id = a.attempt_id
              JOIN questions answered_question
                ON answered_question.question_id = a.question_id
               AND answered_question.exam_id = t.exam_id
              WHERE t.user_id = ? AND t.submitted_at IS NOT NULL
                AND a.question_id = q.question_id AND a.is_correct = 0
            ) AS answered_incorrectly,
            EXISTS (
              SELECT 1
              FROM answers a
              JOIN attempts t ON t.attempt_id = a.attempt_id
              JOIN questions answered_question
                ON answered_question.question_id = a.question_id
               AND answered_question.exam_id = t.exam_id
              WHERE t.user_id = ? AND t.submitted_at IS NOT NULL
                AND a.question_id = q.question_id
            ) AS answered_before,
            EXISTS (
              SELECT 1
              FROM answers a
              JOIN attempts t ON t.attempt_id = a.attempt_id
              JOIN questions answered_question
                ON answered_question.question_id = a.question_id
               AND answered_question.exam_id = t.exam_id
              WHERE t.user_id = ? AND t.submitted_at IS NOT NULL
                AND a.question_id = q.question_id AND a.is_correct = 1
                AND t.submitted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ) AS answered_correctly_recently
     FROM questions q
     JOIN exams e ON e.exam_id = q.exam_id AND e.status = 'published'
     WHERE COALESCE(NULLIF(TRIM(q.topic), ''), 'Uncategorized') IN (?)
       AND (SELECT COUNT(DISTINCT o.option_label)
            FROM options o WHERE o.question_id = q.question_id) = 4`,
    [userId, userId, userId, weakTopics]
  );

  return rows
    .filter((row) => !row.answered_correctly_recently && (row.answered_incorrectly || !row.answered_before))
    .sort((left, right) => (
      left.topic.localeCompare(right.topic) ||
      Number(right.answered_incorrectly) - Number(left.answered_incorrectly) ||
      left.question_id - right.question_id
    ));
}

async function refreshStudentRecommendations(userId) {
  const connection = await db.promise().getConnection();
  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    const [users] = await connection.query(
      "SELECT user_id FROM users WHERE user_id = ? AND role = 'student' FOR UPDATE",
      [userId]
    );
    if (users.length === 0) {
      await connection.rollback();
      transactionStarted = false;
      return { invalidStudent: true };
    }

    const summary = await getWeakTopicSummary(connection, userId);
    if (summary.completedAttempts === 0) {
      await connection.commit();
      transactionStarted = false;
      return { ...summary, recommendations: [], candidates: [] };
    }

    if (summary.weakTopics.length === 0) {
      await connection.query('DELETE FROM recommendations WHERE user_id = ?', [userId]);
      await connection.commit();
      transactionStarted = false;
      return { ...summary, recommendations: [], candidates: [] };
    }

    const candidates = await getRecommendationCandidates(connection, userId, summary.weakTopics);
    const selected = summary.weakTopics.flatMap((topic) => (
      candidates.filter((candidate) => candidate.topic === topic).slice(0, recommendationLimitPerTopic)
    ));
    const selectedByQuestion = new Map(selected.map((candidate) => [candidate.question_id, candidate]));

    const [existing] = await connection.query(
      'SELECT recommendation_id, topic, question_id FROM recommendations WHERE user_id = ? FOR UPDATE',
      [userId]
    );
    const retainedQuestions = new Set();
    const staleIds = [];
    for (const recommendation of existing) {
      const candidate = selectedByQuestion.get(recommendation.question_id);
      if (candidate && candidate.topic === recommendation.topic && !retainedQuestions.has(recommendation.question_id)) {
        retainedQuestions.add(recommendation.question_id);
      } else {
        staleIds.push(recommendation.recommendation_id);
      }
    }

    if (staleIds.length > 0) {
      await connection.query(
        'DELETE FROM recommendations WHERE user_id = ? AND recommendation_id IN (?)',
        [userId, staleIds]
      );
    }

    const newRecommendations = selected
      .filter((candidate) => !retainedQuestions.has(candidate.question_id))
      .map((candidate) => [userId, candidate.topic, candidate.question_id]);
    if (newRecommendations.length > 0) {
      await connection.query(
        'INSERT INTO recommendations (user_id, topic, question_id) VALUES ?',
        [newRecommendations]
      );
    }

    let recommendationRows = [];
    if (selected.length > 0) {
      const [rows] = await connection.query(
        `SELECT r.recommendation_id, r.topic, r.question_id,
                q.question_text, q.difficulty, r.created_at
         FROM recommendations r
         JOIN questions q ON q.question_id = r.question_id
         JOIN exams e ON e.exam_id = q.exam_id AND e.status = 'published'
         WHERE r.user_id = ? AND r.question_id IN (?)`,
        [userId, selected.map((candidate) => candidate.question_id)]
      );
      const rowsByQuestion = new Map(rows.map((row) => [row.question_id, row]));
      recommendationRows = selected
        .map((candidate) => rowsByQuestion.get(candidate.question_id))
        .filter(Boolean);
    }

    await connection.commit();
    transactionStarted = false;
    return {
      ...summary,
      recommendations: recommendationRows,
      candidates
    };
  } catch (error) {
    if (transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Recommendation transaction rollback failed:', rollbackError.message);
      }
    }
    throw error;
  } finally {
    connection.release();
  }
}

router.get('/dashboard-summary', async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Query exam attempts summary
    const [examStats] = await db.promise().query(
      `SELECT COUNT(*) AS exams_attempted,
              COALESCE(AVG(percentage), 0) AS average_exam_score
       FROM attempts
       WHERE user_id = ? AND submitted_at IS NOT NULL`,
      [userId]
    );

    // Query practice attempts count
    const [practiceStats] = await db.promise().query(
      `SELECT COUNT(*) AS practice_attempts
       FROM web_programming_practice_attempts
       WHERE user_id = ? AND completed_at IS NOT NULL`,
      [userId]
    );

    const examsAttempted = Number(examStats[0]?.exams_attempted || 0);
    const avgExamScore = examsAttempted > 0 ? Number(Number(examStats[0]?.average_exam_score || 0).toFixed(2)) : 0;
    const practiceAttemptsCount = Number(practiceStats[0]?.practice_attempts || 0);

    // Query topic performance history
    const topicPerformance = await getTopicPerformanceHistory(db.promise(), userId);

    const focusNow = topicPerformance.filter((t) => t.category === 'Focus Now');
    const recentImprovements = topicPerformance.filter((t) => t.improvement_status === 'Improved');

    res.json({
      has_data: examsAttempted > 0 || topicPerformance.length > 0 || practiceAttemptsCount > 0,
      exams_attempted: examsAttempted,
      average_exam_score: avgExamScore,
      practice_attempts: practiceAttemptsCount,
      weak_topics: focusNow,
      recent_improvements: recentImprovements,
      all_topics: topicPerformance
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve dashboard summary.', error: error.message });
  }
});

router.get('/exams', async (req, res) => {
  try {
    const [exams] = await db.promise().query(
      `SELECT e.exam_id, e.title, e.description, e.duration,
              COUNT(q.question_id) AS total_questions
       FROM exams e
       LEFT JOIN questions q ON q.exam_id = e.exam_id
       WHERE e.status = 'published'
       GROUP BY e.exam_id, e.title, e.description, e.duration, e.created_at
       ORDER BY e.created_at DESC, e.exam_id DESC`
    );

    res.json({ exams });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve available exams.', error: error.message });
  }
});

router.post('/exams/:examId/start', async (req, res) => {
  const examId = parsePositiveId(req.params.examId);
  const userId = req.user.user_id;

  if (!examId) {
    return res.status(400).json({ message: 'A valid exam ID is required.' });
  }

  let connection;
  let transactionStarted = false;

  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    const [exams] = await connection.query(
      "SELECT exam_id, title, duration FROM exams WHERE exam_id = ? AND status = 'published' FOR UPDATE",
      [examId]
    );
    if (exams.length === 0) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(404).json({ message: 'Published exam was not found.' });
    }

    const [questionSummary] = await connection.query(
      `SELECT COUNT(*) AS total_questions,
              COALESCE(SUM(option_count = 4), 0) AS complete_questions
       FROM (
         SELECT q.question_id, COUNT(o.option_id) AS option_count
         FROM questions q
         LEFT JOIN options o ON o.question_id = q.question_id
         WHERE q.exam_id = ?
         GROUP BY q.question_id
       ) question_status`,
      [examId]
    );
    const totalQuestions = Number(questionSummary[0].total_questions);
    if (totalQuestions === 0 || Number(questionSummary[0].complete_questions) !== totalQuestions) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(409).json({ message: 'This exam is not ready. It must contain questions with four options each.' });
    }

    const [attemptResult] = await connection.query(
      'INSERT INTO attempts (user_id, exam_id, started_at) VALUES (?, ?, NOW())',
      [userId, examId]
    );
    await connection.commit();
    transactionStarted = false;

    res.status(201).json({
      message: 'Exam attempt started.',
      attempt_id: attemptResult.insertId,
      exam_id: exams[0].exam_id
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Attempt start rollback failed:', rollbackError.message);
      }
    }
    res.status(500).json({ message: 'Failed to start exam.', error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/attempts/:attemptId/questions', async (req, res) => {
  const attemptId = parsePositiveId(req.params.attemptId);

  if (!attemptId) {
    return res.status(400).json({ message: 'A valid attempt ID is required.' });
  }

  try {
    const [attempts] = await db.promise().query(
      `SELECT a.attempt_id, a.user_id, a.exam_id, a.started_at, a.submitted_at,
              e.title, e.duration
       FROM attempts a
       JOIN exams e ON e.exam_id = a.exam_id
       WHERE a.attempt_id = ?`,
      [attemptId]
    );
    if (attempts.length === 0) {
      return res.status(404).json({ message: 'Attempt was not found.' });
    }
    if (attempts[0].user_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this attempt.' });
    }
    if (attempts[0].submitted_at) {
      return res.status(409).json({ message: 'This attempt has already been submitted.' });
    }

    const attempt = attempts[0];
    const [questions] = await db.promise().query(
      `SELECT q.question_id, q.question_text,
              o.option_label, o.option_text
       FROM questions q
       JOIN options o ON o.question_id = q.question_id
       WHERE q.exam_id = ?
       ORDER BY q.question_id, o.option_label`,
      [attempt.exam_id]
    );

    const questionMap = new Map();
    for (const row of questions) {
      if (!questionMap.has(row.question_id)) {
        questionMap.set(row.question_id, {
          question_id: row.question_id,
          question_text: row.question_text,
          options: []
        });
      }
      questionMap.get(row.question_id).options.push({
        label: row.option_label,
        text: row.option_text
      });
    }

    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
    const remainingSeconds = Math.max(0, Number(attempt.duration) * 60 - elapsedSeconds);

    res.json({
      attempt_id: attempt.attempt_id,
      exam_id: attempt.exam_id,
      exam_title: attempt.title,
      duration: attempt.duration,
      remaining_seconds: remainingSeconds,
      questions: Array.from(questionMap.values())
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve attempt questions.' });
  }
});

router.post('/attempts/:attemptId/submit', async (req, res) => {
  const attemptId = parsePositiveId(req.params.attemptId);
  const userId = req.user.user_id;
  const { answers } = req.body || {};

  if (!attemptId || !Array.isArray(answers)) {
    return res.status(400).json({ message: 'A valid attempt ID and answers list are required.' });
  }

  const submittedAnswers = new Map();
  for (const answer of answers) {
    const questionId = parsePositiveId(answer?.question_id);
    const selectedOption = answer?.selected_option ?? null;
    if (!questionId || (selectedOption !== null && !validOptions.includes(selectedOption)) || submittedAnswers.has(questionId)) {
      return res.status(400).json({ message: 'Each answer must contain a valid question ID and at most one option from A-D.' });
    }
    submittedAnswers.set(questionId, selectedOption);
  }

  let connection;
  let transactionStarted = false;

  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    const [attempts] = await connection.query(
      `SELECT a.attempt_id, a.user_id, a.exam_id, a.started_at, a.submitted_at, e.duration
       FROM attempts a
       JOIN exams e ON e.exam_id = a.exam_id
       WHERE a.attempt_id = ? FOR UPDATE`,
      [attemptId]
    );
    if (attempts.length === 0) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(404).json({ message: 'Attempt was not found.' });
    }
    if (attempts[0].user_id !== userId) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(403).json({ message: 'Forbidden: You do not own this attempt.' });
    }
    if (attempts[0].submitted_at) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(409).json({ message: 'This attempt has already been submitted.' });
    }

    // Server-side timer validation (Authoritative time enforcement)
    const elapsedSeconds = Math.floor((Date.now() - new Date(attempts[0].started_at).getTime()) / 1000);
    const maxAllowedSeconds = Number(attempts[0].duration) * 60 + 60; // 60s latency buffer
    const isTimedOut = elapsedSeconds > maxAllowedSeconds;

    const [questions] = await connection.query(
      'SELECT question_id, correct_option FROM questions WHERE exam_id = ? ORDER BY question_id',
      [attempts[0].exam_id]
    );
    const questionIds = new Set(questions.map((question) => question.question_id));
    if (questions.length === 0 || Array.from(submittedAnswers.keys()).some((id) => !questionIds.has(id))) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(400).json({ message: 'Answers must refer only to questions in this attempt.' });
    }

    const answerRows = questions.map((question) => {
      const selectedOption = submittedAnswers.get(question.question_id) ?? null;
      return [attemptId, question.question_id, selectedOption, selectedOption === question.correct_option ? 1 : 0];
    });
    const score = answerRows.reduce((total, answer) => total + answer[3], 0);
    const percentage = Number(((score / questions.length) * 100).toFixed(2));

    await connection.query(
      'INSERT INTO answers (attempt_id, question_id, selected_option, is_correct) VALUES ?',
      [answerRows]
    );
    await connection.query(
      'UPDATE attempts SET submitted_at = NOW(), score = ?, percentage = ? WHERE attempt_id = ?',
      [score, percentage, attemptId]
    );
    await connection.commit();
    transactionStarted = false;

    res.json({
      message: isTimedOut ? 'Exam submitted (Timer elapsed).' : 'Exam submitted successfully.',
      attempt_id: attemptId,
      score,
      total_questions: questions.length,
      percentage,
      timed_out: isTimedOut
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Exam submission rollback failed:', rollbackError.message);
      }
    }
    res.status(500).json({ message: 'Failed to submit exam. No partial answers were saved.' });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/attempts/:attemptId/result', async (req, res) => {
  const attemptId = parsePositiveId(req.params.attemptId);

  if (!attemptId) {
    return res.status(400).json({ message: 'A valid attempt ID is required.' });
  }

  try {
    const [results] = await db.promise().query(
      `SELECT a.attempt_id, a.user_id, a.score, a.percentage, a.submitted_at,
              e.title,
              (SELECT COUNT(*) FROM questions q WHERE q.exam_id = a.exam_id) AS total_questions,
              COALESCE(SUM(CASE WHEN ans.is_correct = 1 THEN 1 ELSE 0 END), 0) AS correct_answers,
              COALESCE(SUM(CASE WHEN ans.selected_option IS NOT NULL AND ans.is_correct = 0 THEN 1 ELSE 0 END), 0) AS wrong_answers,
              COALESCE(SUM(CASE WHEN ans.selected_option IS NULL THEN 1 ELSE 0 END), 0) AS unanswered_questions
       FROM attempts a
       JOIN exams e ON e.exam_id = a.exam_id
       LEFT JOIN answers ans ON ans.attempt_id = a.attempt_id
       WHERE a.attempt_id = ?
       GROUP BY a.attempt_id, a.user_id, a.score, a.percentage, a.submitted_at, e.title, a.exam_id`,
      [attemptId]
    );
    if (results.length === 0) {
      return res.status(404).json({ message: 'Attempt result was not found.' });
    }
    if (results[0].user_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Forbidden: You do not own this attempt.' });
    }
    if (!results[0].submitted_at) {
      return res.status(409).json({ message: 'This exam has not been submitted yet.' });
    }

    const result = results[0];
    const totalQuestions = Number(result.total_questions);
    const correctAnswers = Number(result.correct_answers);
    const wrongAnswers = Number(result.wrong_answers);
    const unansweredQuestions = Number(result.unanswered_questions);

    res.json({
      attempt_id: result.attempt_id,
      exam_title: result.title,
      score: Number(result.score),
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      wrong_answers: wrongAnswers,
      unanswered_questions: unansweredQuestions,
      percentage: Number(result.percentage)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve exam result.' });
  }
});

router.get('/attempts/:attemptId/ai-analysis', async (req, res) => {
  const attemptId = parsePositiveId(req.params.attemptId);

  if (!attemptId) {
    return res.status(400).json({ message: 'A valid attempt ID is required.' });
  }

  try {
    const [attempts] = await db.promise().query(
      `SELECT a.attempt_id, a.user_id, a.exam_id, a.score, a.submitted_at, a.percentage, e.title AS exam_title
       FROM attempts a
       JOIN exams e ON e.exam_id = a.exam_id
       WHERE a.attempt_id = ?`,
      [attemptId]
    );

    if (attempts.length === 0 || attempts[0].user_id !== req.user.user_id) {
      return res.status(404).json({ message: 'Attempt was not found.' });
    }
    if (!attempts[0].submitted_at) {
      return res.status(409).json({ message: 'Submit this attempt before requesting AI learning guidance.' });
    }

    const [topicRows] = await db.promise().query(
      `SELECT COALESCE(NULLIF(TRIM(q.topic), ''), 'Uncategorized') AS topic,
              COUNT(*) AS total_questions,
              SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS correct_answers,
              SUM(CASE WHEN a.selected_option IS NOT NULL AND a.is_correct = 0 THEN 1 ELSE 0 END) AS wrong_answers,
              SUM(CASE WHEN a.selected_option IS NULL THEN 1 ELSE 0 END) AS unanswered_questions
       FROM answers a
       JOIN questions q ON q.question_id = a.question_id
       WHERE a.attempt_id = ? AND q.exam_id = ?
       GROUP BY COALESCE(NULLIF(TRIM(q.topic), ''), 'Uncategorized')
       ORDER BY topic`,
      [attemptId, attempts[0].exam_id]
    );

    let totalExamQuestions = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalUnanswered = 0;

    const topics = topicRows.map((row) => {
      const totalQuestions = Number(row.total_questions);
      const correctAnswers = Number(row.correct_answers);
      const wrongAnswers = Number(row.wrong_answers);
      const unansweredQuestions = Number(row.unanswered_questions);

      totalExamQuestions += totalQuestions;
      totalCorrect += correctAnswers;
      totalWrong += wrongAnswers;
      totalUnanswered += unansweredQuestions;

      const exactPercentage = totalQuestions === 0
        ? 0
        : (correctAnswers / totalQuestions) * 100;
      const percentage = Number(exactPercentage.toFixed(2));

      return {
        topic: row.topic,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        unanswered_questions: unansweredQuestions,
        percentage,
        status: exactPercentage >= 80
          ? 'Strong'
          : exactPercentage >= 60
            ? 'Needs Improvement'
            : 'Weak'
      };
    });

    const topicHistory = await getTopicPerformanceHistory(db.promise(), req.user.user_id);

    const improvedTopics = topicHistory.filter((t) => t.improvement_status === 'Improved').map((t) => ({
      topic: t.topic,
      previous_percentage: t.previous_percentage,
      latest_percentage: t.latest_percentage,
      overall_percentage: t.percentage,
      improvement_points: t.previous_percentage !== null ? Number((t.latest_percentage - t.previous_percentage).toFixed(2)) : 0,
      category: t.category
    }));

    const weakTopics = topicHistory.filter((t) => t.category === 'Focus Now' || t.percentage < 60).map((t) => ({
      topic: t.topic,
      overall_percentage: t.percentage,
      latest_percentage: t.latest_percentage,
      category: t.category,
      improvement_status: t.improvement_status
    }));

    const performancePayload = {
      attempt_id: attemptId,
      exam_title: attempts[0].exam_title,
      score: Number(attempts[0].score),
      total_questions: totalExamQuestions,
      correct_answers: totalCorrect,
      wrong_answers: totalWrong,
      unanswered_questions: totalUnanswered,
      overall_percentage: Number(attempts[0].percentage),
      current_exam_topics: topics,
      full_topic_history: topicHistory,
      improved_topics: improvedTopics,
      weak_topics: weakTopics,
      has_history: topicHistory.some((t) => t.previous_percentage !== null)
    };

    const aiResult = await getAIAnalysis(performancePayload);

    res.json({
      attempt_id: attemptId,
      ...aiResult
    });
  } catch (error) {
    res.status(500).json({
      available: false,
      message: 'Failed to generate AI analysis.'
    });
  }
});

router.get('/ai-guidance', async (req, res) => {
  try {
    const userId = req.user.user_id;
    const topicHistory = await getTopicPerformanceHistory(db.promise(), userId);

    if (topicHistory.length === 0) {
      return res.json({
        available: false,
        message: 'Complete an assessment before requesting AI learning guidance.'
      });
    }

    const improvedTopics = topicHistory.filter((t) => t.improvement_status === 'Improved').map((t) => ({
      topic: t.topic,
      previous_percentage: t.previous_percentage,
      latest_percentage: t.latest_percentage,
      overall_percentage: t.percentage,
      improvement_points: t.previous_percentage !== null ? Number((t.latest_percentage - t.previous_percentage).toFixed(2)) : 0,
      category: t.category
    }));

    const weakTopics = topicHistory.filter((t) => t.category === 'Focus Now' || t.percentage < 60).map((t) => ({
      topic: t.topic,
      overall_percentage: t.percentage,
      latest_percentage: t.latest_percentage,
      category: t.category,
      improvement_status: t.improvement_status
    }));

    const totalQ = topicHistory.reduce((sum, t) => sum + t.total_questions, 0);
    const correctQ = topicHistory.reduce((sum, t) => sum + t.correct_answers, 0);

    const performancePayload = {
      exam_title: 'Overall Performance & Practice History',
      score: correctQ,
      total_questions: totalQ,
      overall_percentage: totalQ > 0 ? Number(((correctQ / totalQ) * 100).toFixed(2)) : 0,
      full_topic_history: topicHistory,
      improved_topics: improvedTopics,
      weak_topics: weakTopics,
      has_history: topicHistory.some((t) => t.previous_percentage !== null)
    };

    const aiResult = await getAIAnalysis(performancePayload);
    res.json(aiResult);
  } catch (error) {
    res.status(500).json({
      available: false,
      message: 'Failed to generate AI learning guidance.'
    });
  }
});

router.get('/attempts/:attemptId/performance', async (req, res) => {
  const attemptId = parsePositiveId(req.params.attemptId);

  if (!attemptId) {
    return res.status(400).json({ message: 'A valid attempt ID is required.' });
  }

  try {
    const [attempts] = await db.promise().query(
      `SELECT attempt_id, user_id, exam_id, score, submitted_at, percentage
       FROM attempts
       WHERE attempt_id = ?`,
      [attemptId]
    );

    if (attempts.length === 0 || attempts[0].user_id !== req.user.user_id) {
      return res.status(404).json({ message: 'Attempt was not found.' });
    }
    if (!attempts[0].submitted_at) {
      return res.status(409).json({ message: 'Submit this attempt before requesting topic performance.' });
    }

    const [answerCounts] = await db.promise().query(
      `SELECT COUNT(*) AS answer_count,
              COALESCE(SUM(q.question_id IS NOT NULL), 0) AS matching_question_count
       FROM answers a
       LEFT JOIN questions q
         ON q.question_id = a.question_id AND q.exam_id = ?
       WHERE a.attempt_id = ?`,
      [attempts[0].exam_id, attemptId]
    );
    const answerCount = Number(answerCounts[0].answer_count);

    if (answerCount === 0) {
      return res.status(409).json({ message: 'This submitted attempt contains no answers to analyze.' });
    }
    if (Number(answerCounts[0].matching_question_count) !== answerCount) {
      return res.status(409).json({ message: 'Attempt answers include questions outside the attempt exam.' });
    }

    const [topicRows] = await db.promise().query(
      `SELECT COALESCE(NULLIF(TRIM(q.topic), ''), 'Uncategorized') AS topic,
              COUNT(*) AS total_questions,
              SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS correct_answers,
              SUM(CASE WHEN a.selected_option IS NOT NULL AND a.is_correct = 0 THEN 1 ELSE 0 END) AS wrong_answers,
              SUM(CASE WHEN a.selected_option IS NULL THEN 1 ELSE 0 END) AS unanswered_questions
       FROM answers a
       JOIN questions q ON q.question_id = a.question_id
       WHERE a.attempt_id = ? AND q.exam_id = ?
       GROUP BY COALESCE(NULLIF(TRIM(q.topic), ''), 'Uncategorized')
       ORDER BY topic`,
      [attemptId, attempts[0].exam_id]
    );

    let totalExamQuestions = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalUnanswered = 0;

    const topics = topicRows.map((row) => {
      const totalQuestions = Number(row.total_questions);
      const correctAnswers = Number(row.correct_answers);
      const wrongAnswers = Number(row.wrong_answers);
      const unansweredQuestions = Number(row.unanswered_questions);

      totalExamQuestions += totalQuestions;
      totalCorrect += correctAnswers;
      totalWrong += wrongAnswers;
      totalUnanswered += unansweredQuestions;

      const exactPercentage = totalQuestions === 0
        ? 0
        : (correctAnswers / totalQuestions) * 100;
      const percentage = Number(exactPercentage.toFixed(2));

      return {
        topic: row.topic,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        unanswered_questions: unansweredQuestions,
        percentage,
        status: exactPercentage >= 80
          ? 'Strong'
          : exactPercentage >= 60
            ? 'Needs Improvement'
            : 'Weak'
      };
    });

    const weakTopics = topics.filter((t) => t.status === 'Weak');

    res.json({
      attempt_id: attemptId,
      score: Number(attempts[0].score),
      total_questions: totalExamQuestions,
      correct_answers: totalCorrect,
      wrong_answers: totalWrong,
      unanswered_questions: totalUnanswered,
      overall_percentage: Number(attempts[0].percentage),
      topics,
      weak_topics: weakTopics.map((t) => t.topic)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to calculate topic performance.', error: error.message });
  }
});

async function getTopicPerformanceHistory(executor, userId) {
  const [topicRows] = await executor.query(
    `SELECT COALESCE(NULLIF(TRIM(q.topic), ''), 'Uncategorized') AS topic,
            COUNT(a.answer_id) AS total_questions,
            SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS correct_answers,
            SUM(CASE WHEN a.is_correct = 0 AND a.selected_option IS NOT NULL THEN 1 ELSE 0 END) AS wrong_answers,
            MAX(t.submitted_at) AS last_attempted_at
     FROM attempts t
     JOIN answers a ON a.attempt_id = t.attempt_id
     JOIN questions q ON q.question_id = a.question_id
     WHERE t.user_id = ? AND t.submitted_at IS NOT NULL
     GROUP BY COALESCE(NULLIF(TRIM(q.topic), ''), 'Uncategorized')
     ORDER BY topic`,
    [userId]
  );

  const [attemptTopicRows] = await executor.query(
    `SELECT t.attempt_id,
            t.submitted_at,
            COALESCE(NULLIF(TRIM(q.topic), ''), 'Uncategorized') AS topic,
            COUNT(a.answer_id) AS total_questions,
            SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS correct_answers
     FROM attempts t
     JOIN answers a ON a.attempt_id = t.attempt_id
     JOIN questions q ON q.question_id = a.question_id
     WHERE t.user_id = ? AND t.submitted_at IS NOT NULL
     GROUP BY t.attempt_id, t.submitted_at, COALESCE(NULLIF(TRIM(q.topic), ''), 'Uncategorized')
     ORDER BY t.submitted_at ASC, t.attempt_id ASC`,
    [userId]
  );

  const historyByTopic = new Map();
  for (const row of attemptTopicRows) {
    if (!historyByTopic.has(row.topic)) historyByTopic.set(row.topic, []);
    historyByTopic.get(row.topic).push({
      attempt_id: row.attempt_id,
      total: Number(row.total_questions),
      correct: Number(row.correct_answers),
      percentage: Number(row.total_questions) > 0 ? Number(((Number(row.correct_answers) / Number(row.total_questions)) * 100).toFixed(2)) : 0
    });
  }

  return topicRows.map((row) => {
    const topicName = row.topic;
    const totalQuestions = Number(row.total_questions);
    const correctAnswers = Number(row.correct_answers);
    const wrongAnswers = Number(row.wrong_answers);
    const overallPercentage = totalQuestions > 0 ? Number(((correctAnswers / totalQuestions) * 100).toFixed(2)) : 0;

    const topicAttempts = historyByTopic.get(topicName) || [];
    let previousPercentage = null;
    let latestAttemptPercentage = overallPercentage;
    let improvementStatus = 'No significant change';

    if (topicAttempts.length > 1) {
      const latestAttempt = topicAttempts[topicAttempts.length - 1];
      const priorAttempts = topicAttempts.slice(0, topicAttempts.length - 1);
      const priorTotal = priorAttempts.reduce((sum, a) => sum + a.total, 0);
      const priorCorrect = priorAttempts.reduce((sum, a) => sum + a.correct, 0);
      previousPercentage = priorTotal > 0 ? Number(((priorCorrect / priorTotal) * 100).toFixed(2)) : null;

      latestAttemptPercentage = latestAttempt.percentage;
      const compareBase = previousPercentage !== null ? previousPercentage : overallPercentage;
      const diff = latestAttemptPercentage - compareBase;

      if (diff >= 5) {
        improvementStatus = 'Improved';
      } else if (diff <= -5) {
        improvementStatus = 'Needs more practice';
      } else {
        improvementStatus = 'No significant change';
      }
    } else if (topicAttempts.length === 1) {
      previousPercentage = null;
      latestAttemptPercentage = topicAttempts[0].percentage;
      if (latestAttemptPercentage >= 80) {
        improvementStatus = 'Improved';
      } else if (latestAttemptPercentage >= 60) {
        improvementStatus = 'No significant change';
      } else {
        improvementStatus = 'Needs more practice';
      }
    }

    let recommendationText = '';
    if (previousPercentage !== null) {
      if (improvementStatus === 'Improved') {
        recommendationText = `${topicName} improved from ${previousPercentage}% to ${latestAttemptPercentage}%. Continue with intermediate practice.`;
      } else if (improvementStatus === 'Needs more practice') {
        recommendationText = `${topicName} accuracy is ${latestAttemptPercentage}% (dropped from ${previousPercentage}%). Focus on foundational practice.`;
      } else {
        recommendationText = `${topicName} accuracy is ${latestAttemptPercentage}% (no significant change from ${previousPercentage}%). Continue practicing to build accuracy.`;
      }
    } else {
      if (overallPercentage < 60) {
        recommendationText = `${topicName} accuracy is ${overallPercentage}%. Priority area for practice.`;
      } else if (overallPercentage < 80) {
        recommendationText = `${topicName} accuracy is ${overallPercentage}%. Good progress, continue practicing to achieve mastery.`;
      } else {
        recommendationText = `${topicName} accuracy is ${overallPercentage}%. Strong mastery demonstrated!`;
      }
    }

    let category = 'Focus Now';
    if (overallPercentage >= 80 || (latestAttemptPercentage >= 80 && overallPercentage >= 70)) {
      category = 'Doing Well';
    } else if (overallPercentage >= 60 || latestAttemptPercentage >= 60) {
      category = 'Improve Next';
    } else {
      category = 'Focus Now';
    }

    return {
      topic: topicName,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      wrong_answers: wrongAnswers,
      percentage: overallPercentage,
      latest_percentage: latestAttemptPercentage,
      previous_percentage: previousPercentage,
      improvement_status: improvementStatus,
      recommendation: recommendationText,
      category,
      last_attempted_at: row.last_attempted_at
    };
  });
}

router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.user.user_id;
    const state = await refreshStudentRecommendations(userId);
    if (state.invalidStudent) {
      return res.status(403).json({ message: 'A valid student account is required.' });
    }

    const topicPerformance = await getTopicPerformanceHistory(db.promise(), userId);
    if (state.completedAttempts === 0 && topicPerformance.length === 0) {
      return res.status(200).json({
        has_data: false,
        message: 'Complete an exam assessment to view recommendations and improvement tracking.',
        focus_now: [],
        improve_next: [],
        doing_well: [],
        recommendations: []
      });
    }

    const focusNow = topicPerformance.filter((t) => t.category === 'Focus Now');
    const improveNext = topicPerformance.filter((t) => t.category === 'Improve Next');
    const doingWell = topicPerformance.filter((t) => t.category === 'Doing Well');

    res.json({
      has_data: true,
      message: topicPerformance.length === 0 ? 'No topic data available yet.' : '',
      focus_now: focusNow,
      improve_next: improveNext,
      doing_well: doingWell,
      recommendations: state.recommendations || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate recommendations.', error: error.message });
  }
});

router.get('/practice', async (req, res) => {
  try {
    const userId = req.user.user_id;
    const requestedTopic = req.query.topic ? req.query.topic.trim() : null;

    const state = await refreshStudentRecommendations(userId);
    if (state.invalidStudent) {
      return res.status(403).json({ message: 'A valid student account is required.' });
    }

    if (state.completedAttempts === 0) {
      return res.status(409).json({
        questions: [],
        message: 'Complete an exam before personalized practice is available.'
      });
    }

    let targetTopics = [];
    if (requestedTopic) {
      targetTopics = [requestedTopic];
    } else if (state.weakTopics.length > 0) {
      targetTopics = state.weakTopics;
    } else {
      const perf = await getTopicPerformanceHistory(db.promise(), userId);
      targetTopics = perf.filter((t) => t.percentage < 80).map((t) => t.topic);
      if (targetTopics.length === 0 && perf.length > 0) {
        targetTopics = perf.map((t) => t.topic);
      }
    }

    if (targetTopics.length === 0) {
      return res.json({ questions: [], message: 'No topics identified for practice yet.' });
    }

    const [optionRows] = await db.promise().query(
      `SELECT q.question_id, q.question_text,
              COALESCE(NULLIF(TRIM(q.topic), ''), 'Uncategorized') AS topic,
              q.difficulty, o.option_label, o.option_text
       FROM questions q
       JOIN exams e ON e.exam_id = q.exam_id AND e.status = 'published'
       JOIN options o ON o.question_id = q.question_id
       WHERE COALESCE(NULLIF(TRIM(q.topic), ''), 'Uncategorized') IN (?)
       ORDER BY q.question_id, o.option_label`,
      [targetTopics]
    );

    const questionMap = new Map();
    for (const row of optionRows) {
      if (!questionMap.has(row.question_id)) {
        questionMap.set(row.question_id, {
          question_id: row.question_id,
          question_text: row.question_text,
          topic: row.topic,
          difficulty: row.difficulty,
          options: new Map()
        });
      }
      questionMap.get(row.question_id).options.set(row.option_label, {
        option_label: row.option_label,
        option_text: row.option_text
      });
    }

    const questions = Array.from(questionMap.values())
      .filter((q) => q.options.size === 4)
      .slice(0, practiceQuestionLimit)
      .map((q) => ({
        ...q,
        options: Array.from(q.options.values()).sort((a, b) => a.option_label.localeCompare(b.option_label))
      }));

    if (questions.length === 0) {
      return res.json({
        questions: [],
        message: `No published practice questions available for ${requestedTopic || 'your practice topics'} yet.`
      });
    }

    res.json({ questions, topic: requestedTopic });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load practice questions.', error: error.message });
  }
});

router.post('/practice/submit', async (req, res) => {
  const userId = req.user.user_id;
  const { answers } = req.body || {};

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ message: 'Submit at least one practice answer.' });
  }

  const submittedAnswers = new Map();
  for (const answer of answers) {
    const questionId = parsePositiveId(answer?.question_id);
    if (!questionId) {
      return res.status(400).json({ message: 'Each answer must include a valid question ID.' });
    }
    if (submittedAnswers.has(questionId)) {
      return res.status(400).json({ message: 'A question can only be submitted once.' });
    }
    if (typeof answer.selected_option !== 'string' || !validOptions.includes(answer.selected_option)) {
      return res.status(400).json({ message: 'Each answer must include a selected option from A to D.' });
    }
    submittedAnswers.set(questionId, answer.selected_option);
  }

  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    const questionIds = Array.from(submittedAnswers.keys());
    const [questions] = await connection.query(
      `SELECT q.question_id, q.exam_id,
              COALESCE(NULLIF(TRIM(q.topic), ''), 'Uncategorized') AS topic,
              q.correct_option
       FROM questions q
       JOIN exams e ON e.exam_id = q.exam_id AND e.status = 'published'
       WHERE q.question_id IN (?)`,
      [questionIds]
    );
    if (questions.length !== questionIds.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'One or more practice questions were not found.' });
    }

    const [availableOptions] = await connection.query(
      'SELECT question_id, option_label FROM options WHERE question_id IN (?)',
      [questionIds]
    );
    const optionsByQuestion = new Map();
    for (const option of availableOptions) {
      if (!optionsByQuestion.has(option.question_id)) optionsByQuestion.set(option.question_id, new Set());
      optionsByQuestion.get(option.question_id).add(option.option_label);
    }
    if (questions.some((q) => !optionsByQuestion.get(q.question_id)?.has(submittedAnswers.get(q.question_id)))) {
      await connection.rollback();
      return res.status(400).json({ message: 'A selected option is not available for its question.' });
    }

    const primaryTopic = questions[0].topic;

    // Retrieve prior topic performance BEFORE saving new attempt
    const [priorRows] = await connection.query(
      `SELECT COUNT(a.answer_id) AS total_questions,
              SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS correct_answers
       FROM attempts t
       JOIN answers a ON a.attempt_id = t.attempt_id
       JOIN questions q ON q.question_id = a.question_id
       WHERE t.user_id = ? AND t.submitted_at IS NOT NULL
         AND COALESCE(NULLIF(TRIM(q.topic), ''), 'Uncategorized') = ?`,
      [userId, primaryTopic]
    );
    const priorTotal = Number(priorRows[0]?.total_questions || 0);
    const priorCorrect = Number(priorRows[0]?.correct_answers || 0);
    const previousPercentage = priorTotal > 0 ? Number(((priorCorrect / priorTotal) * 100).toFixed(2)) : null;

    // Score submitted answers
    let correctCount = 0;
    const answerRows = questions.map((q) => {
      const selected = submittedAnswers.get(q.question_id);
      const isCorrect = selected === q.correct_option ? 1 : 0;
      if (isCorrect) correctCount++;
      return { question_id: q.question_id, exam_id: q.exam_id, selected, is_correct: isCorrect };
    });

    const totalQuestions = questions.length;
    const practicePercentage = Number(((correctCount / totalQuestions) * 100).toFixed(2));

    // Save attempt into attempts table
    const mainExamId = questions[0].exam_id;
    const [attemptResult] = await connection.query(
      'INSERT INTO attempts (user_id, exam_id, started_at, submitted_at, score, percentage) VALUES (?, ?, NOW(), NOW(), ?, ?)',
      [userId, mainExamId, correctCount, practicePercentage]
    );
    const attemptId = attemptResult.insertId;

    // Save answers into answers table
    const dbAnswerRows = answerRows.map((a) => [attemptId, a.question_id, a.selected, a.is_correct]);
    await connection.query(
      'INSERT INTO answers (attempt_id, question_id, selected_option, is_correct) VALUES ?',
      [dbAnswerRows]
    );

    await connection.commit();

    // Determine improvement indicator & recommendation
    let improvementStatus = 'No significant change';
    let recommendationText = '';

    if (previousPercentage !== null) {
      const diff = practicePercentage - previousPercentage;
      if (diff >= 5) {
        improvementStatus = 'Improved';
        recommendationText = `${primaryTopic} improved from ${previousPercentage}% to ${practicePercentage}%. Continue with intermediate practice.`;
      } else if (diff <= -5) {
        improvementStatus = 'Needs more practice';
        recommendationText = `${primaryTopic} accuracy is ${practicePercentage}% (dropped from ${previousPercentage}%). Focus on foundational practice.`;
      } else {
        improvementStatus = 'No significant change';
        recommendationText = `${primaryTopic} accuracy is ${practicePercentage}% (no significant change from ${previousPercentage}%). Continue practicing to build accuracy.`;
      }
    } else {
      if (practicePercentage >= 80) {
        improvementStatus = 'Improved';
        recommendationText = `${primaryTopic} practice score: ${practicePercentage}%. Strong performance demonstrated!`;
      } else if (practicePercentage >= 60) {
        improvementStatus = 'No significant change';
        recommendationText = `${primaryTopic} practice score: ${practicePercentage}%. Good progress, continue practicing.`;
      } else {
        improvementStatus = 'Needs more practice';
        recommendationText = `${primaryTopic} practice score: ${practicePercentage}%. Priority area for practice.`;
      }
    }

    let updatedCategory = 'Focus Now';
    if (practicePercentage >= 80) {
      updatedCategory = 'Doing Well';
    } else if (practicePercentage >= 60) {
      updatedCategory = 'Improve Next';
    } else {
      updatedCategory = 'Focus Now';
    }

    refreshStudentRecommendations(userId).catch((err) => {
      console.error('Failed to refresh recommendations after practice submit:', err.message);
    });

    res.json({
      message: 'Practice submitted successfully.',
      total_questions: totalQuestions,
      correct_answers: correctCount,
      wrong_answers: totalQuestions - correctCount,
      percentage: practicePercentage,
      topic: primaryTopic,
      previous_percentage: previousPercentage,
      latest_percentage: practicePercentage,
      improvement_status: improvementStatus,
      recommendation: recommendationText,
      updated_category: updatedCategory
    });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ message: 'Failed to score practice answers.', error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

router.post(['/chat', '/chat-assistant'], async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { message, history } = req.body || {};

    const trimmedMessage = String(message || '').trim();
    if (!trimmedMessage) {
      return res.status(400).json({ message: 'Message text cannot be empty.' });
    }
    if (trimmedMessage.length > 1000) {
      return res.status(400).json({ message: 'Message exceeds maximum length of 1000 characters.' });
    }

    const topicPerformance = await getTopicPerformanceHistory(db.promise(), userId);

    const [examStats] = await db.promise().query(
      `SELECT COUNT(*) AS exams_attempted,
              COALESCE(AVG(percentage), 0) AS average_exam_score
       FROM attempts
       WHERE user_id = ? AND submitted_at IS NOT NULL`,
      [userId]
    );

    const [practiceStats] = await db.promise().query(
      `SELECT COUNT(*) AS practice_attempts
       FROM web_programming_practice_attempts
       WHERE user_id = ? AND completed_at IS NOT NULL`,
      [userId]
    );

    const focusNow = topicPerformance.filter((t) => t.category === 'Focus Now');
    const recentImprovements = topicPerformance.filter((t) => t.improvement_status === 'Improved');

    const studentContext = {
      exams_attempted: Number(examStats[0]?.exams_attempted || 0),
      average_exam_score: Number(Number(examStats[0]?.average_exam_score || 0).toFixed(2)),
      practice_attempts: Number(practiceStats[0]?.practice_attempts || 0),
      weak_topics: focusNow,
      recent_improvements: recentImprovements,
      all_topics: topicPerformance
    };

    const aiResult = await getAIChatResponse({
      message: trimmedMessage,
      history: Array.isArray(history) ? history : [],
      studentContext
    });

    res.json({
      available: aiResult.available,
      reply: aiResult.reply,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      available: false,
      reply: 'An error occurred while processing your request. Please try again later.'
    });
  }
});

module.exports = router;