const languageIds = new Map([
  ['Java', 62],
  ['Python', 71],
  ['C', 50]
]);

const MAX_OUTPUT_BYTES = 64 * 1024;
const EXECUTION_TIMEOUT_MS = 15_000;

class CodeExecutionError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'CodeExecutionError';
    this.status = status;
  }
}

function normalizeLanguage(language) {
  if (typeof language !== 'string') return null;
  const normalized = Array.from(languageIds.keys()).find(
    (supported) => supported.toLowerCase() === language.trim().toLowerCase()
  );
  return normalized || null;
}

function normalizeOutput(output) {
  return String(output || '').replace(/\r\n?/g, '\n').trim();
}

function decodeOutput(value) {
  if (typeof value !== 'string' || !value) return '';
  const output = Buffer.from(value, 'base64').toString('utf8');
  if (Buffer.byteLength(output, 'utf8') > MAX_OUTPUT_BYTES) {
    throw new CodeExecutionError('The execution service returned too much output.', 502);
  }
  return output;
}

function getExecutionConfiguration() {
  const apiUrl = process.env.CODE_EXECUTION_API_URL?.trim().replace(/\/+$/, '');
  const apiKey = process.env.CODE_EXECUTION_API_KEY?.trim();
  if (!apiUrl || !apiKey) {
    throw new CodeExecutionError(
      'Code execution is not configured. Set CODE_EXECUTION_API_URL and CODE_EXECUTION_API_KEY.',
      503
    );
  }

  let baseUrl;
  try {
    baseUrl = new URL(apiUrl);
  } catch {
    throw new CodeExecutionError('The code execution service URL is invalid.', 503);
  }
  if (!['http:', 'https:'].includes(baseUrl.protocol)) {
    throw new CodeExecutionError('The code execution service URL must use HTTP or HTTPS.', 503);
  }

  return { apiUrl, apiKey, host: baseUrl.host };
}

function encode(value) {
  return Buffer.from(String(value || ''), 'utf8').toString('base64');
}

async function sendSubmission(configuration, payload) {
  const submissionUrl = configuration.apiUrl.endsWith('/submissions')
    ? configuration.apiUrl
    : `${configuration.apiUrl}/submissions`;
  const url = `${submissionUrl}?base64_encoded=true&wait=true`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': configuration.apiKey,
        'X-RapidAPI-Key': configuration.apiKey,
        'X-RapidAPI-Host': configuration.host
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(EXECUTION_TIMEOUT_MS)
    });
  } catch {
    throw new CodeExecutionError('The code execution service is unavailable or timed out.', 502);
  }

  if (!response.ok) {
    throw new CodeExecutionError('The code execution service rejected the request.', 502);
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new CodeExecutionError('The code execution service returned an invalid response.', 502);
  }

  if (result.token && (!result.status || result.status.id === 1 || result.status.id === 2)) {
    result = await pollSubmission(configuration, submissionUrl, result.token);
  }
  return result;
}

async function pollSubmission(configuration, submissionUrl, token) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    let response;
    try {
      response = await fetch(
        `${submissionUrl}/${encodeURIComponent(token)}?base64_encoded=true&fields=stdout,stderr,compile_output,time,status`,
        {
          headers: {
            'X-Auth-Token': configuration.apiKey,
            'X-RapidAPI-Key': configuration.apiKey,
            'X-RapidAPI-Host': configuration.host
          },
          signal: AbortSignal.timeout(EXECUTION_TIMEOUT_MS)
        }
      );
    } catch {
      throw new CodeExecutionError('The code execution service is unavailable or timed out.', 502);
    }

    if (!response.ok) {
      throw new CodeExecutionError('The code execution service could not retrieve the result.', 502);
    }
    const result = await response.json();
    if (result.status && result.status.id !== 1 && result.status.id !== 2) return result;
  }

  throw new CodeExecutionError('The code execution service did not finish in time.', 504);
}

function getResultStatus(result, expectedOutput) {
  const statusId = result.status?.id;
  if (statusId === 3 || statusId === 4) {
    return normalizeOutput(decodeOutput(result.stdout)) === normalizeOutput(expectedOutput)
      ? 'Accepted'
      : 'Wrong Answer';
  }
  if (statusId === 5) return 'Time Limit Exceeded';
  if (statusId === 6) return 'Compilation Error';
  if (statusId >= 7 && statusId <= 12) return 'Runtime Error';
  return 'Execution Error';
}

async function executeTestCase({ language, sourceCode, testCase }) {
  const configuration = getExecutionConfiguration();
  const languageId = languageIds.get(language);
  const result = await sendSubmission(configuration, {
    source_code: encode(sourceCode),
    language_id: languageId,
    stdin: encode(testCase.input_data),
    expected_output: encode(testCase.expected_output),
    cpu_time_limit: 2,
    wall_time_limit: 5,
    memory_limit: 128000,
    enable_network: false
  });

  let status;
  let output = '';
  let errorOutput = '';
  try {
    status = getResultStatus(result, testCase.expected_output);
    output = decodeOutput(result.stdout);
    errorOutput = decodeOutput(result.compile_output || result.stderr);
  } catch (error) {
    if (error instanceof CodeExecutionError) throw error;
    throw new CodeExecutionError('The code execution service returned invalid output.', 502);
  }

  return {
    status,
    output,
    error_output: errorOutput,
    execution_time: Number.isFinite(Number(result.time)) ? Number(result.time) : null
  };
}

module.exports = {
  CodeExecutionError,
  executeTestCase,
  getExecutionConfiguration,
  normalizeLanguage
};