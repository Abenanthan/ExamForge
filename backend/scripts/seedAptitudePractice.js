const db = require('../db');

const allowedDifficulties = ['Easy', 'Medium', 'Hard'];
const letters = ['A', 'B', 'C', 'D'];

function parseExamples(content) {
  const sections = content.split(/^### Example \d+\s*$/m).slice(1);
  return sections.map((section) => {
    const question = section.match(/\*\*Question:\*\*\s*([^\n]+)/)?.[1]?.trim();
    const difficulty = section.match(/\*\*Difficulty:\*\*\s*(Easy|Medium|Hard)/)?.[1];
    const solution = section.match(/\*\*Solution:\*\*\s*([\s\S]*?)\n\s*\*\*Answer:\*\*/)?.[1]?.trim();
    const answer = section.match(/\*\*Answer:\*\*\s*([^\n]+)/)?.[1]?.trim();
    return { question, difficulty, solution, answer };
  }).filter((item) => item.question && item.solution && item.answer && allowedDifficulties.includes(item.difficulty));
}

function parseDefinitions(content) {
  const section = content.match(/## 3\. Important Definitions\s*([\s\S]*?)(?=\n## )/)?.[1] || '';
  return [...section.matchAll(/^- (?:\*\*)?([^:*]+?)(?:\*\*)?:\s*(.+)$/gm)]
    .map((match) => ({ term: match[1].replace(/\*\*/g, '').trim(), meaning: match[2].replace(/\*\*/g, '').trim() }));
}

function parseSupplementConcepts(content) {
  const concepts = parseDefinitions(content);
  for (const heading of ['4. Types / Patterns', '5. Rules / Properties', '6. Formulas', '6. Rules / Methods / Approaches']) {
    const section = content.match(new RegExp(`## ${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*([\\s\\S]*?)(?=\\n## )`))?.[1] || '';
    for (const line of section.match(/^[-*] (.+)$/gm) || []) {
      const text = line.replace(/^[-*] /, '').replace(/`/g, '').trim();
      if (text && !concepts.some((concept) => concept.term.toLowerCase() === text.toLowerCase())) {
        concepts.push({ term: text.slice(0, 90), meaning: text });
      }
    }
  }
  return concepts;
}

function numericAnswer(answer) {
  const match = answer.replace(/,/g, '').match(/^\s*(-?\d+(?:\.\d+)?)(%|\s+[\p{L}°⅓⅔²³/]+.*)?\s*\.?$/u);
  if (match) return { value: Number(match[1]), format: (candidate) => `${candidate}${match[2] || ''}` };
  if (answer.length > 42) return null;
  const numericTokens = [...answer.matchAll(/-?\d+(?:\.\d+)?/g)];
  if (numericTokens.length !== 1) return null;
  const value = Number(numericTokens[0][0]);
  return Number.isFinite(value)
    ? { value, format: (candidate) => `${answer.slice(0, numericTokens[0].index)}${candidate}${answer.slice(numericTokens[0].index + numericTokens[0][0].length)}` }
    : null;
}

function generateDistractors(answer, siblings, topicId, questionText) {
  const remainderQuestion = topicId === 1 && questionText.match(/(?:remainder|divided by|division by)[^?]*?(?:divided by|division by)\s+(\d+)/i);
  const remainderAnswer = answer.match(/^Remainder\s+(\d+)/i);
  if (remainderQuestion && remainderAnswer) {
    const divisor = Number(remainderQuestion[1]);
    const correct = Number(remainderAnswer[1]);
    const candidates = [correct - 1, correct + 1, divisor - 1, 0]
      .filter((value, index, values) => value >= 0 && value < divisor && value !== correct && values.indexOf(value) === index);
    if (candidates.length >= 3) return candidates.slice(0, 3).map((value) => `Remainder ${value}.`);
  }
  if (topicId === 1 && /divisible by (\d+) and (\d+)/i.test(questionText)) {
    const [, first, second] = questionText.match(/divisible by (\d+) and (\d+)/i);
    return [`Divisible by ${first}, but not ${second}.`, `Divisible by ${second}, but not ${first}.`, `Divisible by neither ${first} nor ${second}.`]
      .filter((choice) => choice !== answer).slice(0, 3);
  }
  if (topicId === 1 && /co-prime/i.test(questionText)) {
    return ['No; the numbers share a common factor.', 'No; their HCF is greater than 1.', 'They are both prime, so they are co-prime.']
      .filter((choice) => choice !== answer).slice(0, 3);
  }
  if (topicId === 1 && /^HCF \d+; LCM \d+/i.test(answer)) {
    const [, hcf, lcm] = answer.match(/^HCF (\d+); LCM (\d+)/i);
    return [`HCF ${hcf}; LCM ${hcf}.`, `HCF ${lcm}; LCM ${hcf}.`, `HCF ${Math.max(1, Math.floor(Number(hcf) / 2))}; LCM ${Number(lcm) * 2}.`]
      .filter((choice) => choice !== answer).slice(0, 3);
  }
  if (topicId === 3 && /Check the statement/i.test(questionText)) {
    return ['The statement is inconsistent; the savings should be 60%.', 'The statement is consistent; savings are 30%.', 'The statement is inconsistent; spending is 40%.']
      .filter((choice) => choice !== answer).slice(0, 3);
  }
  if ([24, 25, 26].includes(topicId) && answer.length > 18) {
    const source = questionText.match(/[“"]([^”"]+)[”"]/u)?.[1];
    const variants = [source];
    if (/along with/i.test(answer)) {
      variants.push(answer.replace(/,\s*along with\s+([^,]+),/i, ' and $1'));
      variants.push(answer.replace(/reviews\b/i, 'are reviewing'));
    }
    if (/By working carefully/i.test(answer)) {
      variants.push(answer.replace(/avoided the error/i, 'avoiding the error'));
      variants.push(answer.replace(/Maya avoided/i, 'Maya were avoiding'));
    }
    if (/reviews the report/i.test(answer)) variants.push(answer.replace(/reviews the report/i, 'review the report'));
    if (/is ready/i.test(answer)) variants.push(answer.replace(/is ready/i, 'are ready'));
    if (/has written/i.test(answer)) variants.push(answer.replace(/has written/i, 'has wrote'));
    if (/interested in/i.test(answer)) variants.push(answer.replace(/interested in/i, 'interested on'));
    const substitutions = [
      [/\bis\b/i, 'are'], [/\bis\b/i, 'were'], [/\bis\b/i, 'have'],
      [/\bare\b/i, 'is'], [/\bare\b/i, 'was'], [/\bwas\b/i, 'were'],
      [/\bwere\b/i, 'was'], [/\bhas\b/i, 'have'], [/\bhave\b/i, 'has'],
      [/\bin\b/i, 'on'], [/\bon\b/i, 'in'], [/\btheir\b/i, 'his']
    ];
    for (const [pattern, replacement] of substitutions) {
      const candidate = answer.replace(pattern, replacement);
      if (candidate !== answer && !variants.includes(candidate)) variants.push(candidate);
      if (variants.filter(Boolean).length >= 3) break;
    }
    const uniqueVariants = [...new Set(variants.filter((candidate) => candidate && candidate !== answer))];
    const otherSentences = siblings.map((item) => item.answer).filter((candidate) => candidate.length > 45 && candidate !== answer);
    for (const candidate of otherSentences) {
      if (uniqueVariants.length >= 3) break;
      if (!uniqueVariants.includes(candidate)) uniqueVariants.push(candidate);
    }
    if (uniqueVariants.length >= 3) return uniqueVariants.slice(0, 3);
  }
  const numeric = numericAnswer(answer);
  if (numeric) {
    const { value, format } = numeric;
    const candidates = topicId === 3
      ? [value + 10, value - 10, value * 1.1, value / 2]
      : topicId === 4
        ? [value + 10, value - 10, value * 0.9, value * 1.2]
        : topicId === 5
          ? [value + 1, value - 1, value * 2, value / 2]
          : topicId === 6
            ? [value + 1, value - 1, value * 2, value / 2]
            : topicId === 7
              ? [value + 1, value * 2, value / 2, value + 2]
              : topicId === 8
                ? [value + 5, value - 5, value * 2, value / 2]
                : topicId === 9 || topicId === 10
                  ? [value + 100, value - 100, value * 1.1, value / 2]
                  : topicId === 11 || topicId === 12
                    ? [value + 1, value - 1, value * 2, value / 2]
                    : [value + 1, value - 1, value * 2, Math.floor(value / 2)];
    const formatted = candidates.map((candidate) => format(Number(candidate.toFixed(3))))
      .filter((candidate) => candidate !== answer);
    const unique = [...new Set(formatted)];
    if (unique.length >= 3) return unique.slice(0, 3);
  }
  const passage = questionText.match(/Passage [1-4]/)?.[0];
  const candidates = siblings.filter((item) => !passage || questionText.match(/Passage [1-4]/)?.[0] === item.passage)
    .map((item) => item.answer);
  const uniqueSiblings = [...new Set(candidates.filter((item) => item && item !== answer))];
  for (const fallback of ['The passage does not support this conclusion.', 'This statement reverses the stated relationship.', 'The evidence is insufficient to conclude this.']) {
    if (uniqueSiblings.length >= 3) break;
    if (!uniqueSiblings.includes(fallback) && fallback !== answer) uniqueSiblings.push(fallback);
  }
  return uniqueSiblings.slice(0, 3);
}

function buildQuestionOptions(answer, siblings, topicId, questionText) {
  const distractors = generateDistractors(answer, siblings, topicId, questionText);
  const values = [answer, ...distractors];
  const correctIndex = (topicId + answer.length) % 4;
  const shuffled = [...values];
  [shuffled[0], shuffled[correctIndex]] = [shuffled[correctIndex], shuffled[0]];
  return {
    options: Object.fromEntries(letters.map((letter, index) => [letter, shuffled[index]])),
    correct_option: letters[correctIndex]
  };
}

function makeDefinitionQuestion(topic, definition, index, difficulty, definitions) {
  if (difficulty === 'Hard') {
    const partner = definitions.find((item) => item.term !== definition.term) || definition;
    const alternatives = definitions.filter((item) => item.term !== definition.term && item.term !== partner.term);
    const firstAlternative = alternatives[index % alternatives.length] || partner;
    const secondAlternative = alternatives[(index + 1) % alternatives.length] || definition;
    const answer = `${definition.term}: ${definition.meaning}; ${partner.term}: ${partner.meaning}`;
    const distractors = [
      `${definition.term}: ${definition.meaning}; ${firstAlternative.term}: ${firstAlternative.meaning}`,
      `${secondAlternative.term}: ${secondAlternative.meaning}; ${partner.term}: ${partner.meaning}`,
      `${firstAlternative.term}: ${firstAlternative.meaning}; ${secondAlternative.term}: ${secondAlternative.meaning}`
    ];
    const values = [answer, ...distractors];
    const correctIndex = (topic.topic_id + index) % 4;
    [values[0], values[correctIndex]] = [values[correctIndex], values[0]];
    return {
      topic_id: topic.topic_id,
      difficulty,
      question_text: `Which pair correctly matches “${definition.term}” and “${partner.term}” in ${topic.name}?`,
      option_a: values[0], option_b: values[1], option_c: values[2], option_d: values[3],
      correct_option: letters[correctIndex],
      correct_answer: answer,
      explanation: `${definition.term}: ${definition.meaning} ${partner.term}: ${partner.meaning}`
    };
  }
  const distractors = definitions.filter((item) => item.term !== definition.term)
    .map((item) => item.meaning).slice(index % 2, index % 2 + 3);
  while (distractors.length < 3) distractors.push(`A different ${topic.name} concept.`);
  const values = [definition.meaning, ...distractors];
  const correctIndex = (topic.topic_id + index) % 4;
  [values[0], values[correctIndex]] = [values[correctIndex], values[0]];
  return {
    topic_id: topic.topic_id,
    difficulty,
    question_text: `In ${topic.name}, what does “${definition.term}” mean?`,
    option_a: values[0], option_b: values[1], option_c: values[2], option_d: values[3],
    correct_option: letters[correctIndex],
    correct_answer: definition.meaning,
    explanation: `${definition.term}: ${definition.meaning}`
  };
}

async function seed() {
  const [topics] = await db.promise().query('SELECT topic_id, name FROM aptitude_topics ORDER BY topic_id');
  if (topics.length !== 28) throw new Error(`Expected 28 topics; found ${topics.length}`);
  const bank = [];

  for (const topic of topics) {
    const [notes] = await db.promise().query('SELECT content FROM aptitude_notes WHERE topic_id = ? ORDER BY note_id LIMIT 1', [topic.topic_id]);
    if (!notes.length) throw new Error(`Missing note for topic ${topic.topic_id}`);
    const examples = parseExamples(notes[0].content);
    for (const example of examples) example.passage = example.question.match(/Passage [1-4]/)?.[0] || null;
    if (examples.length < 10) throw new Error(`Topic ${topic.name} has fewer than 10 solved examples`);
    const definitions = parseSupplementConcepts(notes[0].content);
    if (definitions.length < 5) throw new Error(`Topic ${topic.name} has fewer than five definitions`);

    const counts = Object.fromEntries(allowedDifficulties.map((difficulty) => [difficulty, 0]));
    for (const example of examples.slice(0, 10)) counts[example.difficulty] += 1;
    const deficits = Object.fromEntries(allowedDifficulties.map((difficulty) => [difficulty, Math.max(0, 5 - counts[difficulty])]));
    for (const example of examples.slice(0, 10)) {
      const siblings = examples.filter((item) => item !== example);
      const choices = buildQuestionOptions(example.answer, siblings, topic.topic_id, example.question);
      if (Object.values(choices.options).filter((option) => option === example.answer).length !== 1) {
        throw new Error(`Correct answer is not unique for ${topic.name}: ${example.question}`);
      }
      bank.push({
        topic_id: topic.topic_id,
        difficulty: example.difficulty,
        question_text: example.question,
        option_a: choices.options.A,
        option_b: choices.options.B,
        option_c: choices.options.C,
        option_d: choices.options.D,
        correct_option: choices.correct_option,
        correct_answer: example.answer,
        explanation: example.solution.replace(/\n+/g, ' ')
      });
    }

    let definitionIndex = 0;
    for (const difficulty of allowedDifficulties) {
      for (let index = 0; index < deficits[difficulty]; index += 1) {
        bank.push(makeDefinitionQuestion(topic, definitions[definitionIndex], definitionIndex, difficulty, definitions));
        definitionIndex += 1;
      }
    }
  }

  const questionTexts = new Set();
  for (const question of bank) {
    const key = `${question.topic_id}:${question.difficulty}:${question.question_text.trim().toLocaleLowerCase()}`;
    if (questionTexts.has(key)) throw new Error(`Duplicate question detected for topic ${question.topic_id}`);
    questionTexts.add(key);
    if (new Set([question.option_a, question.option_b, question.option_c, question.option_d]).size !== 4) {
      throw new Error(`Duplicate options detected for: ${question.question_text}`);
    }
    if (question[`option_${question.correct_option.toLowerCase()}`] !== question.correct_answer) {
      throw new Error(`Correct option mismatch for: ${question.question_text}`);
    }
  }

  const preInsertCounts = new Map();
  for (const question of bank) {
    const key = `${question.topic_id}:${question.difficulty}`;
    preInsertCounts.set(key, (preInsertCounts.get(key) || 0) + 1);
  }
  for (const topic of topics) {
    for (const difficulty of allowedDifficulties) {
      if ((preInsertCounts.get(`${topic.topic_id}:${difficulty}`) || 0) < 5) {
        throw new Error(`Prepared bank has fewer than five ${difficulty} questions for ${topic.name}`);
      }
    }
  }
  if (process.env.DRY_RUN === '1') {
    console.log(JSON.stringify({ prepared: bank.length, topics: topics.length, difficulty_counts: Object.fromEntries(allowedDifficulties.map((difficulty) => [difficulty, bank.filter((question) => question.difficulty === difficulty).length])) }));
    return;
  }

  const values = bank.map((question) => [question.topic_id, question.difficulty, question.question_text,
    question.option_a, question.option_b, question.option_c, question.option_d, question.correct_option, question.explanation]);
  await db.promise().query(
    `UPDATE aptitude_practice_questions
     SET difficulty='Easy'
     WHERE difficulty='Hard' AND question_text LIKE 'In % what does % mean?'`
  );
  await db.promise().query(
    `INSERT INTO aptitude_practice_questions
     (topic_id, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
     VALUES ?
     ON DUPLICATE KEY UPDATE difficulty=VALUES(difficulty), question_text=VALUES(question_text),
       option_a=VALUES(option_a), option_b=VALUES(option_b), option_c=VALUES(option_c),
       option_d=VALUES(option_d), correct_option=VALUES(correct_option), explanation=VALUES(explanation)`,
    [values]
  );

  const [verification] = await db.promise().query(
    `SELECT topic_id, difficulty, COUNT(*) AS question_count
     FROM aptitude_practice_questions GROUP BY topic_id, difficulty ORDER BY topic_id, difficulty`
  );
  const countByKey = new Map(verification.map((row) => [`${row.topic_id}:${row.difficulty}`, Number(row.question_count)]));
  for (const topic of topics) {
    for (const difficulty of allowedDifficulties) {
      if ((countByKey.get(`${topic.topic_id}:${difficulty}`) || 0) < 5) {
        throw new Error(`Topic ${topic.topic_id} lacks five ${difficulty} questions`);
      }
    }
  }
  const [totals] = await db.promise().query(
    `SELECT COUNT(*) AS total,
       SUM(difficulty='Easy') AS easy,
       SUM(difficulty='Medium') AS medium,
       SUM(difficulty='Hard') AS hard
     FROM aptitude_practice_questions`
  );
  console.log(JSON.stringify({ inserted_or_updated: bank.length, totals: totals[0] }));
}

seed().catch((error) => {
  console.error('Aptitude question bank seed failed:', error.message);
  process.exitCode = 1;
}).finally(() => db.end());
