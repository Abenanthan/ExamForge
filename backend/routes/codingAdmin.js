const express = require('express');

const db = require('../db');

const router = express.Router();
const difficulties = ['Easy', 'Medium', 'Hard'];
const maximumTestCases = 20;
const maximumTestValueLength = 10_000;

function parsePositiveId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validChallenge(body) {
  return typeof body.title === 'string' && body.title.trim().length > 0 && body.title.trim().length <= 200 &&
    typeof body.description === 'string' && body.description.trim().length > 0 &&
    typeof body.input_format === 'string' && body.input_format.trim().length > 0 &&
    typeof body.output_format === 'string' && body.output_format.trim().length > 0 &&
    typeof body.constraints === 'string' && body.constraints.trim().length > 0 &&
    difficulties.includes(body.difficulty);
}

function validTestCase(body) {
  return typeof body.input_data === 'string' && body.input_data.length <= maximumTestValueLength &&
    typeof body.expected_output === 'string' && body.expected_output.length > 0 &&
    body.expected_output.length <= maximumTestValueLength &&
    typeof body.is_sample === 'boolean';
}

router.get('/challenges', async (req, res) => {
  try {
    const [challenges] = await db.promise().query(
      `SELECT c.challenge_id, c.title, c.description, c.specification, c.difficulty, c.created_at,
              COUNT(CASE WHEN tc.is_sample = 1 THEN 1 END) AS sample_test_cases,
              COUNT(tc.test_case_id) AS total_test_cases
       FROM coding_challenges c
       LEFT JOIN coding_test_cases tc ON tc.challenge_id = c.challenge_id
       GROUP BY c.challenge_id, c.title, c.description, c.specification, c.difficulty, c.created_at
       ORDER BY c.challenge_id ASC`
    );
    res.json({ challenges });
  } catch (error) {
    res.status(500).json({ message: 'Could not load coding challenges.' });
  }
});

router.post('/challenges', async (req, res) => {
  if (!validChallenge(req.body || {})) {
    return res.status(400).json({ message: 'Complete all challenge fields with a valid difficulty.' });
  }

  try {
    const [duplicate] = await db.promise().query(
      'SELECT challenge_id FROM coding_challenges WHERE title = ? LIMIT 1',
      [req.body.title.trim()]
    );
    if (duplicate.length > 0) {
      return res.status(409).json({ message: 'A coding challenge with this title already exists.' });
    }

    const specification = typeof req.body.specification === 'string' && req.body.specification.trim()
      ? req.body.specification.trim()
      : 'Basic Algorithms';

    const [result] = await db.promise().query(
      `INSERT INTO coding_challenges
       (title, description, specification, input_format, output_format, \`constraints\`, difficulty, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.body.title.trim(),
        req.body.description.trim(),
        specification,
        req.body.input_format.trim(),
        req.body.output_format.trim(),
        req.body.constraints.trim(),
        req.body.difficulty,
        req.user.user_id
      ]
    );
    res.status(201).json({ message: 'Coding challenge created.', challenge_id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Could not create coding challenge.' });
  }
});

router.get('/challenges/:challengeId', async (req, res) => {
  const challengeId = parsePositiveId(req.params.challengeId);
  if (!challengeId) return res.status(400).json({ message: 'A valid challenge ID is required.' });

  try {
    const [challenges] = await db.promise().query(
      `SELECT c.challenge_id, c.title, c.description, c.specification, c.input_format, c.output_format,
              c.\`constraints\`, c.difficulty, c.created_at,
              COUNT(CASE WHEN tc.is_sample = 1 THEN 1 END) AS sample_test_cases,
              COUNT(tc.test_case_id) AS total_test_cases
       FROM coding_challenges c
       LEFT JOIN coding_test_cases tc ON tc.challenge_id = c.challenge_id
       WHERE c.challenge_id = ?
       GROUP BY c.challenge_id, c.title, c.description, c.specification, c.input_format, c.output_format,
                c.\`constraints\`, c.difficulty, c.created_at`,
      [challengeId]
    );
    if (challenges.length === 0) return res.status(404).json({ message: 'Challenge not found.' });
    res.json({ challenge: challenges[0] });
  } catch (error) {
    res.status(500).json({ message: 'Could not load coding challenge.' });
  }
});

router.put('/challenges/:challengeId', async (req, res) => {
  const challengeId = parsePositiveId(req.params.challengeId);
  if (!challengeId) return res.status(400).json({ message: 'A valid challenge ID is required.' });
  if (!validChallenge(req.body || {})) {
    return res.status(400).json({ message: 'Complete all challenge fields with a valid difficulty.' });
  }

  try {
    const [duplicate] = await db.promise().query(
      'SELECT challenge_id FROM coding_challenges WHERE title = ? AND challenge_id <> ? LIMIT 1',
      [req.body.title.trim(), challengeId]
    );
    if (duplicate.length > 0) {
      return res.status(409).json({ message: 'A coding challenge with this title already exists.' });
    }

    const specification = typeof req.body.specification === 'string' && req.body.specification.trim()
      ? req.body.specification.trim()
      : 'Basic Algorithms';

    const [result] = await db.promise().query(
      `UPDATE coding_challenges
       SET title = ?, description = ?, specification = ?, input_format = ?, output_format = ?,
           \`constraints\` = ?, difficulty = ?
       WHERE challenge_id = ?`,
      [
        req.body.title.trim(),
        req.body.description.trim(),
        specification,
        req.body.input_format.trim(),
        req.body.output_format.trim(),
        req.body.constraints.trim(),
        req.body.difficulty,
        challengeId
      ]
    );
    if (result.affectedRows === 0) {
      const [exists] = await db.promise().query(
        'SELECT challenge_id FROM coding_challenges WHERE challenge_id = ?',
        [challengeId]
      );
      if (exists.length === 0) return res.status(404).json({ message: 'Challenge not found.' });
    }
    res.json({ message: 'Coding challenge updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not update coding challenge.' });
  }
});

router.delete('/challenges/:challengeId', async (req, res) => {
  const challengeId = parsePositiveId(req.params.challengeId);
  if (!challengeId) return res.status(400).json({ message: 'A valid challenge ID is required.' });

  try {
    const [result] = await db.promise().query(
      'DELETE FROM coding_challenges WHERE challenge_id = ?',
      [challengeId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Challenge not found.' });
    res.json({ message: 'Coding challenge deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete coding challenge.' });
  }
});

router.post('/challenges/:challengeId/test-cases', async (req, res) => {
  const challengeId = parsePositiveId(req.params.challengeId);
  if (!challengeId) return res.status(400).json({ message: 'A valid challenge ID is required.' });
  if (!validTestCase(req.body || {})) {
    return res.status(400).json({ message: 'Provide valid input, expected output, and sample/hidden visibility.' });
  }

  try {
    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();
      const [challenges] = await connection.query(
        'SELECT challenge_id FROM coding_challenges WHERE challenge_id = ? FOR UPDATE',
        [challengeId]
      );
      if (challenges.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Challenge not found.' });
      }
      const [countRows] = await connection.query(
        'SELECT COUNT(*) AS test_case_count FROM coding_test_cases WHERE challenge_id = ?',
        [challengeId]
      );
      if (Number(countRows[0].test_case_count) >= maximumTestCases) {
        await connection.rollback();
        return res.status(400).json({ message: `A challenge can have at most ${maximumTestCases} test cases.` });
      }
      const [result] = await connection.query(
        'INSERT INTO coding_test_cases (challenge_id, input_data, expected_output, is_sample) VALUES (?, ?, ?, ?)',
        [challengeId, req.body.input_data, req.body.expected_output, req.body.is_sample ? 1 : 0]
      );
      await connection.commit();
      res.status(201).json({ message: 'Test case created.', test_case_id: result.insertId });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ message: 'Could not create test case.' });
  }
});

router.get('/challenges/:challengeId/test-cases', async (req, res) => {
  const challengeId = parsePositiveId(req.params.challengeId);
  if (!challengeId) return res.status(400).json({ message: 'A valid challenge ID is required.' });

  try {
    const [challenges] = await db.promise().query(
      'SELECT challenge_id FROM coding_challenges WHERE challenge_id = ?',
      [challengeId]
    );
    if (challenges.length === 0) return res.status(404).json({ message: 'Challenge not found.' });
    const [testCases] = await db.promise().query(
      `SELECT test_case_id, challenge_id, input_data, expected_output, is_sample, created_at
       FROM coding_test_cases WHERE challenge_id = ? ORDER BY test_case_id`,
      [challengeId]
    );
    res.json({ test_cases: testCases });
  } catch (error) {
    res.status(500).json({ message: 'Could not load test cases.' });
  }
});

router.put('/test-cases/:testCaseId', async (req, res) => {
  const testCaseId = parsePositiveId(req.params.testCaseId);
  if (!testCaseId) return res.status(400).json({ message: 'A valid test case ID is required.' });
  if (!validTestCase(req.body || {})) {
    return res.status(400).json({ message: 'Provide valid input, expected output, and sample/hidden visibility.' });
  }

  try {
    const [result] = await db.promise().query(
      `UPDATE coding_test_cases
       SET input_data = ?, expected_output = ?, is_sample = ?
       WHERE test_case_id = ?`,
      [req.body.input_data, req.body.expected_output, req.body.is_sample ? 1 : 0, testCaseId]
    );
    if (result.affectedRows === 0) {
      const [exists] = await db.promise().query(
        'SELECT test_case_id FROM coding_test_cases WHERE test_case_id = ?',
        [testCaseId]
      );
      if (exists.length === 0) return res.status(404).json({ message: 'Test case not found.' });
    }
    res.json({ message: 'Test case updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not update test case.' });
  }
});

router.delete('/test-cases/:testCaseId', async (req, res) => {
  const testCaseId = parsePositiveId(req.params.testCaseId);
  if (!testCaseId) return res.status(400).json({ message: 'A valid test case ID is required.' });

  try {
    const [result] = await db.promise().query(
      'DELETE FROM coding_test_cases WHERE test_case_id = ?',
      [testCaseId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Test case not found.' });
    res.json({ message: 'Test case deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete test case.' });
  }
});

module.exports = router;