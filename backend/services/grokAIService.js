const safeLogValue = (value, apiKey) => {
  let safeValue = String(value ?? 'Unknown error');
  if (apiKey) safeValue = safeValue.split(apiKey).join('[REDACTED]');
  return safeValue
    .replace(/Bearer\s+[^\s"',}]+/gi, 'Bearer [REDACTED]')
    .replace(/(api[_-]?key\s*[:=]\s*)[^\s,"'}]+/gi, '$1[REDACTED]')
    .replace(/[\r\n\t]+/g, ' ')
    .slice(0, 1000);
};

async function getAIAnalysis(performanceData) {
  const apiKey = process.env.XAI_API_KEY || process.env.AI_API_KEY;
  const apiUrl = process.env.XAI_API_URL || process.env.AI_API_URL;
  const model = process.env.XAI_MODEL || process.env.AI_MODEL || 'qwen/qwen3.8-27b';

  if (!apiKey || !apiUrl) {
    return {
      available: false,
      message: 'AI Learning Guidance is currently unconfigured.'
    };
  }

  let endpoint;
  try {
    endpoint = new URL(apiUrl);
  } catch {
    return {
      available: false,
      message: 'AI Learning Guidance URL is invalid.'
    };
  }

  const prompt = [
    'You are an AI EdTech Learning Mentor analyzing a student performance and improvement history report.',
    'Do NOT calculate or modify official scores, metrics, or weak/strong topic statuses.',
    'Use ONLY the provided deterministic performance and improvement history context.',
    'Provide concise, structured learning guidance containing these exact JSON keys:',
    '- summary (1-2 sentences summarizing overall performance and recent progress)',
    '- progress_observed (explanation acknowledging any topic improvements made by the student, e.g. "React Dataflow improved from 30% to 70%")',
    '- remaining_weak_areas (explanation of remaining weak topics that still require focus)',
    '- priority (which topic or concept the student should prioritize first based on priority category)',
    '- study_plan (short step-by-step actionable learning plan with 3 steps)',
    '- recommended_action (one immediate next action for the student)',
    '- encouragement (one short motivating sentence)',
    'Respond ONLY with a valid JSON object matching this structure:',
    '{"summary": "...", "progress_observed": "...", "remaining_weak_areas": "...", "priority": "...", "study_plan": ["step 1", "step 2", "step 3"], "recommended_action": "...", "encouragement": "..."}',
    '',
    `Performance & Improvement Context:`,
    `Exam Title: ${performanceData.exam_title || 'Assessment'}`,
    `Score: ${performanceData.score} / ${performanceData.total_questions}`,
    `Overall Percentage: ${performanceData.overall_percentage}%`,
    `Has Previous Attempt/Practice History: ${performanceData.has_history ? 'Yes' : 'No'}`,
    `Improved Topics: ${JSON.stringify(performanceData.improved_topics || [])}`,
    `Remaining Weak Topics: ${JSON.stringify(performanceData.weak_topics || [])}`,
    `Full Topic Performance & History:`,
    JSON.stringify(performanceData.full_topic_history || performanceData.current_exam_topics || performanceData.topics || [])
  ].join('\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 750,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Grok AI] Request failed:', safeLogValue(errText, apiKey));
      return {
        available: false,
        message: 'AI Learning Guidance is temporarily unavailable.'
      };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return {
        available: false,
        message: 'AI provider returned an empty response.'
      };
    }

    const trimmedContent = content.trim();
    const fencedMatch = trimmedContent.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    const jsonText = fencedMatch ? fencedMatch[1].trim() : trimmedContent;

    const parsed = JSON.parse(jsonText);
    const progressObserved = String(
      parsed.progress_observed ||
      (performanceData.improved_topics?.length > 0
        ? `Observed improvement in ${performanceData.improved_topics.map((t) => t.topic).join(', ')}.`
        : 'No previous practice comparison available yet.')
    );
    const remainingWeak = String(parsed.remaining_weak_areas || parsed.reason_for_weak_areas || 'Focus on your priority weak topics.');

    return {
      available: true,
      guidance: {
        summary: String(parsed.summary || 'Summary unavailable.'),
        progress_observed: progressObserved,
        remaining_weak_areas: remainingWeak,
        reason_for_weak_areas: remainingWeak,
        priority: String(parsed.priority || 'Focus on your lowest scoring topics.'),
        study_plan: Array.isArray(parsed.study_plan) ? parsed.study_plan.map(String) : [String(parsed.study_plan || 'Practice daily.')],
        recommended_action: String(parsed.recommended_action || 'Complete targeted practice quizzes.'),
        encouragement: String(parsed.encouragement || 'Keep pushing forward!')
      }
    };
  } catch (error) {
    clearTimeout(timeout);
    console.error('[Grok AI] Error generating analysis:', safeLogValue(error.message, apiKey));
    return {
      available: false,
      message: 'AI Learning Guidance is currently unavailable.'
    };
  }
}

async function getAIChatResponse({ message, history = [], studentContext = {} }) {
  const apiKey = process.env.XAI_API_KEY || process.env.AI_API_KEY;
  const apiUrl = process.env.XAI_API_URL || process.env.AI_API_URL;
  const model = process.env.XAI_MODEL || process.env.AI_MODEL || 'qwen/qwen3.8-27b';

  const sanitizedMessage = String(message || '').trim().slice(0, 1000);
  if (!sanitizedMessage) {
    return {
      available: false,
      reply: 'Please provide a non-empty question or prompt.'
    };
  }

  const systemPrompt = [
    'You are ExamForge AI Study Assistant, an expert, friendly, and encouraging educational mentor for students.',
    'Help the student with their syllabus questions, concepts, practice problems, study strategies, and weak topic guidance.',
    'RULES:',
    '- Do NOT calculate or override official exam scores or database records.',
    '- Do NOT modify topic statuses or recommendations.',
    '- Keep responses helpful, structured, clear, and easy to understand.',
    '- Format code snippets or lists cleanly using markdown when relevant.',
    '- Be polite, motivating, and focused on student success.',
    '',
    'STUDENT PERFORMANCE CONTEXT (Read-only reference for personalizing guidance):',
    `Overall Average Exam Score: ${studentContext.average_exam_score || 0}%`,
    `Total Exams Attempted: ${studentContext.exams_attempted || 0}`,
    `Total Practice Sessions Completed: ${studentContext.practice_attempts || 0}`,
    `Current Focus / Weak Topics: ${JSON.stringify(studentContext.weak_topics || [])}`,
    `Recent Improved Topics: ${JSON.stringify(studentContext.recent_improvements || [])}`,
    `All Topic History: ${JSON.stringify(studentContext.all_topics || [])}`
  ].join('\n');

  if (!apiKey || !apiUrl) {
    let fallbackText = `Hello! I am your ExamForge AI Study Assistant. While live AI cloud credentials are currently unconfigured, I can guide you based on your performance summary:`;
    if (studentContext.weak_topics && studentContext.weak_topics.length > 0) {
      const topWeak = studentContext.weak_topics[0].topic || studentContext.weak_topics[0];
      fallbackText += `\n\n📌 **Priority Focus Area**: Your primary focus area is **${topWeak}**. We recommend attempting a targeted 10-question practice quiz in the Practice Center!`;
    } else {
      fallbackText += `\n\nGreat job! You have strong mastery across your completed assessments. Try taking a new exam or explore the Practice Center to maintain your skills!`;
    }
    return {
      available: true,
      reply: fallbackText
    };
  }

  let endpoint;
  try {
    endpoint = new URL(apiUrl);
  } catch {
    return {
      available: true,
      reply: `I'm having trouble connecting to AI services right now. Meanwhile, check your Performance tab or Practice section to work on your weak topics!`
    };
  }

  const apiMessages = [
    { role: 'system', content: systemPrompt }
  ];

  if (Array.isArray(history)) {
    for (const msg of history.slice(-6)) {
      if (msg && typeof msg.content === 'string' && (msg.role === 'user' || msg.role === 'assistant')) {
        apiMessages.push({ role: msg.role, content: msg.content.slice(0, 1000) });
      }
    }
  }

  apiMessages.push({ role: 'user', content: sanitizedMessage });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        max_tokens: 800,
        messages: apiMessages
      })
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Grok Chat AI] Request failed:', safeLogValue(errText, apiKey));
      return {
        available: true,
        reply: `I'm temporarily unavailable to generate live responses. Focus on your top weak topics in the Practice tab or review your Performance analytics!`
      };
    }

    const data = await response.json();
    const replyText = data?.choices?.[0]?.message?.content?.trim();

    if (!replyText) {
      return {
        available: true,
        reply: `I received an empty response. Please try rephrasing your question!`
      };
    }

    return {
      available: true,
      reply: replyText
    };
  } catch (error) {
    clearTimeout(timeout);
    console.error('[Grok Chat AI] Error during chat:', safeLogValue(error.message, apiKey));
    return {
      available: true,
      reply: `I'm currently unable to reach the AI cloud endpoint. Meanwhile, check your Performance tab to review your weak topics and practice!`
    };
  }
}

module.exports = {
  getAIAnalysis,
  getAIChatResponse
};

