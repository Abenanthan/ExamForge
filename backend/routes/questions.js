const express = require('express');

const db = require('../db');

const router = express.Router();
const optionLabels = ['A', 'B', 'C', 'D'];
const difficulties = ['Easy', 'Medium', 'Hard'];

router.post('/', async (req, res) => {
  const { exam_id, question_text, topic, difficulty, options, correct_option } = req.body;
  const parsedExamId = Number(exam_id);

  if (
    !Number.isInteger(parsedExamId) ||
    parsedExamId <= 0 ||
    typeof question_text !== 'string' ||
    !question_text.trim() ||
    typeof topic !== 'string' ||
    !topic.trim() ||
    topic.trim().length > 100 ||
    !difficulties.includes(difficulty) ||
    !options ||
    optionLabels.some((label) => typeof options[label] !== 'string' || !options[label].trim() || options[label].trim().length > 500) ||
    !optionLabels.includes(correct_option)
  ) {
    return res.status(400).json({
      message: 'Provide an exam, question, topic, valid difficulty, four options (A-D), and correct option.'
    });
  }

  let connection;
  let transactionStarted = false;

  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    const [exams] = await connection.query(
      'SELECT exam_id FROM exams WHERE exam_id = ?',
      [parsedExamId]
    );

    if (exams.length === 0) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(404).json({ message: 'Selected exam was not found.' });
    }

    const [questionResult] = await connection.query(
      `INSERT INTO questions (exam_id, question_text, topic, difficulty, correct_option)
       VALUES (?, ?, ?, ?, ?)`,
      [parsedExamId, question_text.trim(), topic.trim(), difficulty, correct_option]
    );

    const optionValues = optionLabels.map((label) => [
      questionResult.insertId,
      label,
      options[label].trim()
    ]);

    await connection.query(
      'INSERT INTO options (question_id, option_label, option_text) VALUES ?',
      [optionValues]
    );
    await connection.commit();
    transactionStarted = false;

    res.status(201).json({
      message: 'Question and four options created successfully.',
      question_id: questionResult.insertId
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Question transaction rollback failed:', rollbackError.message);
      }
    }

    res.status(500).json({
      message: 'Failed to create question. No question data was saved.',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;