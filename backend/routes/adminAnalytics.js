const express = require('express');

const db = require('../db');

const router = express.Router();

router.get('/overview', async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE role = 'student') AS total_students,
         (SELECT COUNT(*) FROM exams) AS total_exams,
         (SELECT COUNT(*) FROM exams WHERE status = 'published') AS published_exams,
         (SELECT COUNT(*) FROM questions) AS total_questions,
         (SELECT COUNT(*) FROM attempts WHERE submitted_at IS NOT NULL) AS total_attempts,
         COALESCE((SELECT AVG(score) FROM attempts WHERE submitted_at IS NOT NULL), 0) AS average_score,
         COALESCE((SELECT AVG(percentage) FROM attempts WHERE submitted_at IS NOT NULL), 0) AS average_percentage`
    );
    const overview = rows[0];

    res.json({
      total_students: Number(overview.total_students),
      total_exams: Number(overview.total_exams),
      published_exams: Number(overview.published_exams),
      total_questions: Number(overview.total_questions),
      total_attempts: Number(overview.total_attempts),
      average_score: Number(Number(overview.average_score).toFixed(2)),
      average_percentage: Number(Number(overview.average_percentage).toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve overview analytics.', error: error.message });
  }
});

router.get('/exams', async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT e.exam_id, e.title, COUNT(q.question_id) AS total_questions,
              COALESCE(stats.attempts, 0) AS attempts,
              COALESCE(stats.average_score, 0) AS average_score,
              COALESCE(stats.average_percentage, 0) AS average_percentage,
              COALESCE(stats.highest_score, 0) AS highest_score,
              COALESCE(stats.lowest_score, 0) AS lowest_score
       FROM exams e
       LEFT JOIN questions q ON q.exam_id = e.exam_id
       LEFT JOIN (
         SELECT exam_id, COUNT(*) AS attempts,
                AVG(score) AS average_score,
                AVG(percentage) AS average_percentage,
                MAX(score) AS highest_score,
                MIN(score) AS lowest_score
         FROM attempts
         WHERE submitted_at IS NOT NULL
         GROUP BY exam_id
       ) stats ON stats.exam_id = e.exam_id
       GROUP BY e.exam_id, e.title, stats.attempts, stats.average_score,
                stats.average_percentage, stats.highest_score, stats.lowest_score
       ORDER BY e.exam_id`
    );

    res.json({
      exams: rows.map((row) => ({
        exam_id: Number(row.exam_id),
        title: row.title,
        total_questions: Number(row.total_questions),
        attempts: Number(row.attempts),
        average_score: Number(Number(row.average_score).toFixed(2)),
        average_percentage: Number(Number(row.average_percentage).toFixed(2)),
        highest_score: Number(row.highest_score),
        lowest_score: Number(row.lowest_score)
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve exam analytics.', error: error.message });
  }
});

router.get('/topics', async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT COALESCE(NULLIF(TRIM(q.topic), ''), 'Uncategorized') AS topic,
              COUNT(*) AS total_answers,
              SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS correct_answers,
              COUNT(*) - SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS wrong_answers,
              COALESCE(ROUND(
                100.0 * SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END)
                / NULLIF(COUNT(*), 0), 2
              ), 0) AS accuracy
       FROM answers a
       JOIN attempts t ON t.attempt_id = a.attempt_id AND t.submitted_at IS NOT NULL
       JOIN questions q ON q.question_id = a.question_id AND q.exam_id = t.exam_id
       GROUP BY COALESCE(NULLIF(TRIM(q.topic), ''), 'Uncategorized')
       ORDER BY topic`
    );

    res.json({
      topics: rows.map((row) => ({
        topic: row.topic,
        total_answers: Number(row.total_answers),
        correct_answers: Number(row.correct_answers),
        wrong_answers: Number(row.wrong_answers),
        accuracy: Number(row.accuracy)
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve topic analytics.', error: error.message });
  }
});

router.get('/questions', async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT q.question_id, q.question_text,
              COALESCE(NULLIF(TRIM(q.topic), ''), 'Uncategorized') AS topic,
              COALESCE(NULLIF(TRIM(q.difficulty), ''), 'Unknown') AS difficulty,
              COUNT(t.attempt_id) AS times_answered,
              COALESCE(SUM(CASE
                WHEN t.attempt_id IS NOT NULL AND a.is_correct = 1 THEN 1
                ELSE 0
              END), 0) AS correct_answers,
              COUNT(t.attempt_id) - COALESCE(SUM(CASE
                WHEN t.attempt_id IS NOT NULL AND a.is_correct = 1 THEN 1
                ELSE 0
              END), 0) AS wrong_answers,
              COALESCE(ROUND(
                100.0 * SUM(CASE
                  WHEN t.attempt_id IS NOT NULL AND a.is_correct = 1 THEN 1
                  ELSE 0
                END) / NULLIF(COUNT(t.attempt_id), 0), 2
              ), 0) AS accuracy
       FROM questions q
       LEFT JOIN answers a ON a.question_id = q.question_id
       LEFT JOIN attempts t
         ON t.attempt_id = a.attempt_id
        AND t.submitted_at IS NOT NULL
        AND t.exam_id = q.exam_id
       GROUP BY q.question_id, q.question_text, q.topic, q.difficulty
       ORDER BY q.question_id`
    );

    res.json({
      questions: rows.map((row) => ({
        question_id: Number(row.question_id),
        question_text: row.question_text,
        topic: row.topic,
        difficulty: row.difficulty,
        times_answered: Number(row.times_answered),
        correct_answers: Number(row.correct_answers),
        wrong_answers: Number(row.wrong_answers),
        accuracy: Number(row.accuracy)
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve question analytics.', error: error.message });
  }
});

router.get('/difficulty', async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT COALESCE(NULLIF(TRIM(q.difficulty), ''), 'Unknown') AS difficulty,
              COUNT(t.attempt_id) AS total_answers,
              COALESCE(SUM(CASE
                WHEN t.attempt_id IS NOT NULL AND a.is_correct = 1 THEN 1
                ELSE 0
              END), 0) AS correct_answers,
              COALESCE(ROUND(
                100.0 * SUM(CASE
                  WHEN t.attempt_id IS NOT NULL AND a.is_correct = 1 THEN 1
                  ELSE 0
                END) / NULLIF(COUNT(t.attempt_id), 0), 2
              ), 0) AS accuracy
       FROM questions q
       LEFT JOIN answers a ON a.question_id = q.question_id
       LEFT JOIN attempts t
         ON t.attempt_id = a.attempt_id
        AND t.submitted_at IS NOT NULL
        AND t.exam_id = q.exam_id
       GROUP BY COALESCE(NULLIF(TRIM(q.difficulty), ''), 'Unknown')
       ORDER BY difficulty`
    );

    res.json({
      difficulty: rows.map((row) => ({
        difficulty: row.difficulty,
        total_answers: Number(row.total_answers),
        correct_answers: Number(row.correct_answers),
        accuracy: Number(row.accuracy)
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve difficulty analytics.', error: error.message });
  }
});

module.exports = router;