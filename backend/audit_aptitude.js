const db = require('./db');

async function auditFormulaQuestions() {
  const [rows] = await db.promise().query(`
    SELECT q.question_id, q.topic_id, t.name as topic_name, c.name as cat_name,
           q.question_text, q.difficulty
    FROM aptitude_practice_questions q
    JOIN aptitude_topics t ON t.topic_id = q.topic_id
    JOIN aptitude_categories c ON c.category_id = t.category_id
    WHERE q.question_text LIKE 'Which pair correctly matches%'
       OR q.question_text LIKE 'Which of the following is defined as%'
       OR q.question_text LIKE 'What is the definition of%'
    ORDER BY q.topic_id, q.question_id
  `);

  console.log(`Total Formula/Definition Questions Found: ${rows.length}`);
  const byTopic = {};
  for (const r of rows) {
    if (!byTopic[r.topic_name]) byTopic[r.topic_name] = [];
    byTopic[r.topic_name].push(r.question_id);
  }
  console.log(JSON.stringify(byTopic, null, 2));
  process.exit(0);
}

auditFormulaQuestions();
