const express = require('express');

const db = require('../db');
const {
  CodeExecutionError,
  executeTestCase,
  getExecutionConfiguration,
  normalizeLanguage
} = require('../services/codeExecution');

const router = express.Router();
const maximumSourceLength = 50_000;
const maximumTestCases = 20;

function parsePositiveId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validateCodeRequest(body) {
  const challengeId = parsePositiveId(body?.challenge_id);
  const language = normalizeLanguage(body?.language);
  if (!challengeId) return { error: 'A valid challenge ID is required.', status: 400 };
  if (!language) return { error: 'Language must be Java, Python, or C.', status: 400 };
  if (typeof body.source_code !== 'string' || body.source_code.trim().length === 0) {
    return { error: 'Source code is required.', status: 400 };
  }
  if (Buffer.byteLength(body.source_code, 'utf8') > maximumSourceLength) {
    return { error: `Source code must be no larger than ${maximumSourceLength} bytes.`, status: 413 };
  }
  return { challengeId, language };
}

function summarizeExecution(results, totalTests) {
  const passedTests = results.filter((result) => result.status === 'Accepted').length;
  const statusPriority = [
    'Compilation Error',
    'Time Limit Exceeded',
    'Runtime Error',
    'Execution Error'
  ];
  const status = statusPriority.find((candidate) => results.some((result) => result.status === candidate)) ||
    (passedTests === totalTests ? 'Accepted' : 'Wrong Answer');
  const executionTime = results.reduce(
    (total, result) => total + (Number.isFinite(result.execution_time) ? result.execution_time : 0),
    0
  );

  return {
    status,
    score: totalTests === 0 ? 0 : Number(((passedTests / totalTests) * 100).toFixed(2)),
    passed_tests: passedTests,
    total_tests: totalTests,
    execution_time: Number(executionTime.toFixed(3))
  };
}

async function getChallenge(challengeId) {
  const [challenges] = await db.promise().query(
    `SELECT challenge_id, title FROM coding_challenges WHERE challenge_id = ?`,
    [challengeId]
  );
  return challenges[0] || null;
}

async function executeCases(language, sourceCode, testCases) {
  if (testCases.length === 0) {
    throw new CodeExecutionError('This challenge has no test cases available.', 409);
  }
  if (testCases.length > maximumTestCases) {
    throw new CodeExecutionError('This challenge exceeds the maximum number of executable test cases.', 409);
  }

  const results = [];
  for (const [index, testCase] of testCases.entries()) {
    const result = await executeTestCase({ language, sourceCode, testCase });
    results.push({
      test_case: index + 1,
      status: result.status,
      output: result.output,
      error_output: result.error_output,
      expected_output: testCase.expected_output,
      execution_time: result.execution_time
    });
    if (['Compilation Error', 'Time Limit Exceeded', 'Runtime Error', 'Execution Error'].includes(result.status)) {
      break;
    }
  }
  return results;
}

router.get('/challenges', async (req, res) => {
  try {
    const userId = req.user?.user_id || 0;
    const [challenges] = await db.promise().query(
      `SELECT c.challenge_id, c.title, c.description, c.specification, c.difficulty,
              c.created_at, COUNT(DISTINCT tc.test_case_id) AS sample_test_cases,
              (
                SELECT s.status
                FROM coding_submissions s
                WHERE s.challenge_id = c.challenge_id AND s.user_id = ?
                ORDER BY (s.status = 'Accepted') DESC, s.submitted_at DESC, s.submission_id DESC
                LIMIT 1
              ) AS user_status
       FROM coding_challenges c
       LEFT JOIN coding_test_cases tc
         ON tc.challenge_id = c.challenge_id AND tc.is_sample = 1
       GROUP BY c.challenge_id, c.title, c.description, c.specification, c.difficulty, c.created_at
       ORDER BY c.challenge_id ASC`,
      [userId]
    );
    res.json({ challenges });
  } catch (error) {
    res.status(500).json({ message: 'Could not load coding challenges.' });
  }
});

router.get('/challenges/:challengeId', async (req, res) => {
  const challengeId = parsePositiveId(req.params.challengeId);
  if (!challengeId) return res.status(400).json({ message: 'A valid challenge ID is required.' });

  try {
    const [challenges] = await db.promise().query(
      `SELECT c.challenge_id, c.title, c.description, c.specification, c.input_format, c.output_format,
              c.\`constraints\`, c.difficulty, c.created_at
       FROM coding_challenges c WHERE c.challenge_id = ?`,
      [challengeId]
    );
    if (challenges.length === 0) return res.status(404).json({ message: 'Challenge not found.' });

    const [sampleCases] = await db.promise().query(
      `SELECT test_case_id, input_data, expected_output
       FROM coding_test_cases
       WHERE challenge_id = ? AND is_sample = 1
       ORDER BY test_case_id`,
      [challengeId]
    );
    res.json({ challenge: challenges[0], sample_test_cases: sampleCases });
  } catch (error) {
    res.status(500).json({ message: 'Could not load coding challenge.' });
  }
});

router.post('/run', async (req, res) => {
  const validation = validateCodeRequest(req.body);
  if (validation.error) return res.status(validation.status).json({ message: validation.error });

  try {
    getExecutionConfiguration();
    const challenge = await getChallenge(validation.challengeId);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found.' });

    const [sampleCases] = await db.promise().query(
      `SELECT input_data, expected_output
       FROM coding_test_cases
       WHERE challenge_id = ? AND is_sample = 1
       ORDER BY test_case_id`,
      [validation.challengeId]
    );
    if (sampleCases.length === 0) {
      return res.status(409).json({ message: 'This challenge has no sample test cases to run.' });
    }

    const results = await executeCases(validation.language, req.body.source_code, sampleCases);
    res.json({
      execution_status: results.find((result) => result.status !== 'Accepted')?.status || 'Accepted',
      results: results.map(({ test_case, status, output, error_output, expected_output, execution_time }) => ({
        test_case,
        status,
        output,
        error_output,
        expected_output,
        execution_time
      }))
    });
  } catch (error) {
    res.status(error.status || 502).json({ message: error.message || 'Code execution failed.' });
  }
});

router.post('/submit', async (req, res) => {
  const validation = validateCodeRequest(req.body);
  if (validation.error) return res.status(validation.status).json({ message: validation.error });

  try {
    getExecutionConfiguration();
    const challenge = await getChallenge(validation.challengeId);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found.' });

    const [testCases] = await db.promise().query(
      `SELECT input_data, expected_output
       FROM coding_test_cases
       WHERE challenge_id = ?
       ORDER BY test_case_id`,
      [validation.challengeId]
    );
    if (testCases.length === 0) return res.status(409).json({ message: 'This challenge has no test cases.' });
    if (testCases.length > maximumTestCases) {
      return res.status(409).json({ message: 'This challenge exceeds the maximum number of test cases.' });
    }

    let caseResults = [];
    try {
      caseResults = await executeCases(validation.language, req.body.source_code, testCases);
    } catch (error) {
      if (error.status === 503) throw error;
      caseResults = [{ status: 'Execution Error', execution_time: null }];
    }

    const summary = summarizeExecution(caseResults, testCases.length);
    const [insert] = await db.promise().query(
      `INSERT INTO coding_submissions
       (challenge_id, user_id, language, source_code, status, score, passed_tests, total_tests, execution_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        validation.challengeId,
        req.user.user_id,
        validation.language,
        req.body.source_code,
        summary.status,
        summary.score,
        summary.passed_tests,
        summary.total_tests,
        summary.execution_time
      ]
    );

    res.status(201).json({
      submission_id: insert.insertId,
      challenge_title: challenge.title,
      language: validation.language,
      ...summary
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Could not submit code.' });
  }
});

router.get('/submissions', async (req, res) => {
  try {
    const [submissions] = await db.promise().query(
      `SELECT s.submission_id, s.challenge_id, c.title AS challenge_title,
              c.difficulty, c.specification,
              s.language, s.status, s.score, s.passed_tests, s.total_tests,
              s.execution_time, s.submitted_at
       FROM coding_submissions s
       JOIN coding_challenges c ON c.challenge_id = s.challenge_id
       WHERE s.user_id = ?
       ORDER BY s.submitted_at DESC, s.submission_id DESC`,
      [req.user.user_id]
    );
    res.json({ submissions });
  } catch (error) {
    res.status(500).json({ message: 'Could not load submission history.' });
  }
});

router.get('/submissions/:submissionId', async (req, res) => {
  const submissionId = parsePositiveId(req.params.submissionId);
  if (!submissionId) return res.status(400).json({ message: 'A valid submission ID is required.' });

  try {
    const [submissions] = await db.promise().query(
      `SELECT s.submission_id, s.challenge_id, c.title AS challenge_title,
              c.difficulty, c.specification,
              s.language, s.source_code, s.status, s.score, s.passed_tests,
              s.total_tests, s.execution_time, s.submitted_at
       FROM coding_submissions s
       JOIN coding_challenges c ON c.challenge_id = s.challenge_id
       WHERE s.submission_id = ? AND s.user_id = ?`,
      [submissionId, req.user.user_id]
    );
    if (submissions.length === 0) return res.status(404).json({ message: 'Submission not found.' });
    res.json({ submission: submissions[0] });
  } catch (error) {
    res.status(500).json({ message: 'Could not load submission.' });
  }
});

module.exports = router;