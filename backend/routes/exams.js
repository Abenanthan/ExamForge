const express = require('express');

const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  db.query(
    "SELECT exam_id, title, status FROM exams WHERE status IN ('draft', 'published') ORDER BY created_at DESC, exam_id DESC",
    (err, exams) => {
      if (err) {
        return res.status(500).json({
          message: 'Failed to retrieve exams',
          error: err.message
        });
      }

      res.json({ exams });
    }
  );
});

router.post('/', (req, res) => {
  const { title, description, duration, total_questions, status } = req.body;
  const parsedDuration = Number(duration);
  const parsedTotalQuestions = Number(total_questions);

  if (
    typeof title !== 'string' ||
    !title.trim() ||
    !Number.isInteger(parsedDuration) ||
    parsedDuration <= 0 ||
    !Number.isInteger(parsedTotalQuestions) ||
    parsedTotalQuestions < 0 ||
    !['draft', 'published'].includes(status)
  ) {
    return res.status(400).json({
      message: 'Provide a title, positive duration, valid question count, and status.'
    });
  }

  db.query(
    `INSERT INTO exams (title, description, duration, total_questions, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [title.trim(), description?.trim() || null, parsedDuration, parsedTotalQuestions, status, req.user.user_id],
    (insertError, result) => {
      if (insertError) {
        return res.status(500).json({
          message: 'Failed to create exam.',
          error: insertError.message
        });
      }

      res.status(201).json({
        message: 'Exam created successfully',
        exam_id: result.insertId
      });
    }
  );
});

module.exports = router;