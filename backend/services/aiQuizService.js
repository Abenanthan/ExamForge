const allowedOptions = ['A', 'B', 'C', 'D'];

class QuizGenerationError extends Error {
  constructor(message, status = 503, kind = 'generation', details = {}) {
    super(message);
    this.name = 'QuizGenerationError';
    this.status = status;
    this.kind = kind;
    this.details = details;
  }
}

function validationError(message, details) {
  return new QuizGenerationError(message, 502, 'validation', details);
}

function validateQuestions(value, requestedCount) {
  if (!value || !Array.isArray(value.questions) || value.questions.length !== requestedCount) {
    throw validationError('The generated quiz did not contain the requested number of questions.', {
      requested_count: requestedCount,
      received_count: Array.isArray(value?.questions) ? value.questions.length : null
    });
  }
  if (Object.keys(value).length !== 1 || !Object.hasOwn(value, 'questions')) {
    throw validationError('The generated quiz contained unexpected fields.');
  }

  const seenQuestions = new Set();
  return value.questions.map((question) => {
    if (!question || typeof question !== 'object' || Array.isArray(question) ||
      Object.keys(question).sort().join(',') !== 'correct_option,explanation,options,question') {
      throw validationError('The generated quiz contained malformed question fields.');
    }
    if (!question || typeof question.question !== 'string' || !question.question.trim()) {
      throw validationError('The generated quiz contained an empty question.');
    }

    const normalizedQuestion = question.question.trim().toLocaleLowerCase();
    if (seenQuestions.has(normalizedQuestion)) {
      throw validationError('The generated quiz contained duplicate questions.');
    }
    seenQuestions.add(normalizedQuestion);

    if (!question.options || typeof question.options !== 'object' || Array.isArray(question.options)) {
      throw validationError('The generated quiz contained malformed answer options.');
    }

    const optionKeys = Object.keys(question.options).sort();
    if (optionKeys.join(',') !== allowedOptions.join(',')) {
      throw validationError('Each generated question must have exactly four answer options.');
    }
    const options = {};
    for (const option of allowedOptions) {
      if (typeof question.options[option] !== 'string' || !question.options[option].trim()) {
        throw validationError('The generated quiz contained an empty answer option.');
      }
      options[option] = question.options[option].trim();
    }

    if (!allowedOptions.includes(question.correct_option)) {
      throw validationError('The generated quiz contained an invalid correct answer.');
    }
    if (typeof question.explanation !== 'string' || !question.explanation.trim()) {
      throw validationError('The generated quiz contained a question without an explanation.');
    }

    return {
      question: question.question.trim(),
      options,
      correct_option: question.correct_option,
      explanation: question.explanation.trim()
    };
  });
}

function parseModelContent(content, requestedCount) {
  if (typeof content !== 'string' || !content.trim()) {
    throw new QuizGenerationError('The AI provider returned an empty response.', 502, 'parsing');
  }

  const trimmedContent = content.trim();
  const fencedContent = trimmedContent.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonContent = fencedContent ? fencedContent[1].trim() : trimmedContent;
  let parsed;
  try {
    parsed = JSON.parse(jsonContent);
  } catch (error) {
    throw new QuizGenerationError('The AI provider returned invalid JSON.', 502, 'parsing');
  }
  return validateQuestions(parsed, requestedCount);
}

function safeLogValue(value, apiKey) {
  let safeValue = String(value ?? 'Unknown provider error');
  if (apiKey) safeValue = safeValue.split(apiKey).join('[REDACTED]');
  return safeValue
    .replace(/Bearer\s+[^\s"',}]+/gi, 'Bearer [REDACTED]')
    .replace(/(api[_-]?key\s*[:=]\s*)[^\s,"'}]+/gi, '$1[REDACTED]')
    .replace(/[\r\n\t]+/g, ' ')
    .slice(0, 1000);
}

function logProviderFailure(status, body, apiKey) {
  let providerError;
  try {
    providerError = JSON.parse(body)?.error;
  } catch {
    providerError = null;
  }
  console.error('[AI quiz] Groq request failed', {
    status,
    type: safeLogValue(providerError?.type || 'unknown', apiKey),
    message: safeLogValue(providerError?.message || body, apiKey)
  });
}

async function generateQuestions({ category, topic, difficulty, count }) {
  const { AI_API_KEY: apiKey, AI_API_URL: apiUrl, AI_MODEL: model } = process.env;
  if (!apiKey || !apiUrl || !model) {
    throw new QuizGenerationError('AI quiz generation is not configured.', 503);
  }

  let endpoint;
  try {
    endpoint = new URL(apiUrl);
  } catch {
    throw new QuizGenerationError('AI quiz generation is not configured.', 503);
  }
  if (!['https:', 'http:'].includes(endpoint.protocol)) {
    throw new QuizGenerationError('AI quiz generation is not configured.', 503);
  }

  const prompt = [
    'You are an aptitude question generator for placement preparation.',
    'Generate exactly the requested number of distinct, placement-oriented multiple-choice aptitude questions.',
    'Every question must test the requested topic and match the requested difficulty. Do not substitute another topic or difficulty.',
    'For every numerical question, calculate the answer independently, compare it against all four options, verify exactly one option is correct, and ensure the explanation supports that selected option. Recheck every calculation before returning the result.',
    'Every question must be unambiguous and have exactly four non-empty options labeled A, B, C and D, exactly one correct option, and a non-empty explanation.',
    'Keep each question to at most 8 words. Use numeric options with at most 3 tokens each whenever possible.',
    'Keep each explanation to one short equation or at most 8 words. Do not add narrative or restate the question.',
    'For numerical questions, show the verified result in that concise explanation.',
    'Do not include duplicate or near-duplicate questions. Do not include commentary, markdown, or code fences.',
    'Return a single JSON object with this exact structure and no additional properties: {"questions":[{"question":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"correct_option":"A","explanation":"..."}]}.',
    'The questions array must contain exactly the requested number of complete objects. Do not return an example or a partial list.',
    `Category: ${category}`,
    `Topic: ${topic}`,
    `Difficulty: ${difficulty}`,
    `Question count: ${count}`
  ].join('\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);
  let response;
  let providerData;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 950,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!response.ok) {
      logProviderFailure(response.status, await response.text(), apiKey);
    } else {
      const responseText = await response.text();
      try {
        providerData = JSON.parse(responseText);
      } catch (error) {
        console.error('[AI quiz] Provider response parsing failed', {
          type: error.name,
          message: safeLogValue(error.message, apiKey)
        });
        throw new QuizGenerationError('The AI provider returned an invalid quiz response.', 502, 'parsing');
      }
    }
  } catch (error) {
    if (error instanceof QuizGenerationError) throw error;
    console.error('[AI quiz] Groq request failed', {
      status: null,
      type: safeLogValue(error.name, apiKey),
      message: safeLogValue(error.message, apiKey)
    });
    throw new QuizGenerationError('The AI quiz service is unavailable. Please try again.', 503);
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401 || response.status === 403) {
    throw new QuizGenerationError('The AI quiz service is not configured correctly.', 503);
  }
  if (response.status === 429) {
    throw new QuizGenerationError('The AI quiz service is busy. Please try again shortly.', 503);
  }
  if (!response.ok) {
    throw new QuizGenerationError('Unable to generate the quiz right now. Please try again.', 503);
  }

  try {
    return parseModelContent(providerData?.choices?.[0]?.message?.content, count);
  } catch (error) {
    console.error(`[AI quiz] ${error.kind === 'validation' ? 'Quiz validation' : 'Generated content parsing'} failed`, {
      message: safeLogValue(error.message, apiKey),
      ...error.details,
      finish_reason: safeLogValue(providerData?.choices?.[0]?.finish_reason || 'unknown', apiKey),
      completion_tokens: Number.isSafeInteger(providerData?.usage?.completion_tokens)
        ? providerData.usage.completion_tokens
        : null
    });
    throw error;
  }
}

module.exports = {
  QuizGenerationError,
  generateQuestions,
  parseModelContent,
  validateQuestions
};