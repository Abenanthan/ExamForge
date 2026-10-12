const express = require('express');

const db = require('../db');

const router = express.Router();

function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function text(value, maxLength) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized && normalized.length <= maxLength ? normalized : null;
}

function description(value) {
  if (value === undefined || value === null) return '';
  return typeof value === 'string' && value.trim().length <= 1000 ? value.trim() : null;
}

router.get('/categories', async (_req, res) => {
  try {
    const [categories] = await db.promise().query(
      `SELECT c.category_id, c.name, c.description, COUNT(t.topic_id) AS topic_count
       FROM aptitude_categories c LEFT JOIN aptitude_topics t ON t.category_id = c.category_id
       GROUP BY c.category_id, c.name, c.description ORDER BY c.name`
    );
    res.json({ categories });
  } catch {
    res.status(500).json({ message: 'Unable to load aptitude categories.' });
  }
});

router.post('/categories', async (req, res) => {
  const name = text(req.body?.name, 100);
  const categoryDescription = description(req.body?.description);
  if (!name || categoryDescription === null) {
    return res.status(400).json({ message: 'Enter a category name and a description under 1,000 characters.' });
  }

  try {
    const [result] = await db.promise().query(
      'INSERT INTO aptitude_categories (name, description) VALUES (?, ?)',
      [name, categoryDescription]
    );
    res.status(201).json({ category_id: result.insertId, name, description: categoryDescription });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'That category already exists.' });
    res.status(500).json({ message: 'Unable to create the aptitude category.' });
  }
});

router.get('/topics', async (_req, res) => {
  try {
    const [topics] = await db.promise().query(
      `SELECT t.topic_id, t.category_id, t.name, t.description, c.name AS category_name,
              (SELECT COUNT(*) FROM aptitude_notes n WHERE n.topic_id = t.topic_id) AS note_count,
              (SELECT COUNT(*) FROM aptitude_quiz_attempts a
               WHERE a.topic_id = t.topic_id AND a.completed_at IS NOT NULL) AS attempt_count,
              (SELECT COALESCE(AVG(a.score), 0) FROM aptitude_quiz_attempts a
               WHERE a.topic_id = t.topic_id AND a.completed_at IS NOT NULL) AS average_score
       FROM aptitude_topics t JOIN aptitude_categories c ON c.category_id = t.category_id
       ORDER BY c.name, t.name`
    );
    res.json({ topics });
  } catch {
    res.status(500).json({ message: 'Unable to load aptitude topics.' });
  }
});

router.post('/topics', async (req, res) => {
  const categoryId = parseId(req.body?.category_id);
  const name = text(req.body?.name, 100);
  const topicDescription = description(req.body?.description);
  if (!categoryId || !name || topicDescription === null) {
    return res.status(400).json({ message: 'Choose a category and enter a topic name and valid description.' });
  }

  try {
    const [result] = await db.promise().query(
      'INSERT INTO aptitude_topics (category_id, name, description) VALUES (?, ?, ?)',
      [categoryId, name, topicDescription]
    );
    res.status(201).json({ topic_id: result.insertId, category_id: categoryId, name, description: topicDescription });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(404).json({ message: 'Aptitude category was not found.' });
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'That topic already exists in this category.' });
    res.status(500).json({ message: 'Unable to create the aptitude topic.' });
  }
});

router.get('/topics/:topicId/notes', async (req, res) => {
  const topicId = parseId(req.params.topicId);
  if (!topicId) return res.status(400).json({ message: 'A valid topic ID is required.' });

  try {
    const [topics] = await db.promise().query(
      'SELECT topic_id FROM aptitude_topics WHERE topic_id = ?',
      [topicId]
    );
    if (topics.length === 0) return res.status(404).json({ message: 'Aptitude topic was not found.' });
    const [notes] = await db.promise().query(
      `SELECT note_id, topic_id, title, content, created_at, updated_at
       FROM aptitude_notes WHERE topic_id = ? ORDER BY created_at, note_id`,
      [topicId]
    );
    res.json({ notes });
  } catch {
    res.status(500).json({ message: 'Unable to load aptitude notes.' });
  }
});

router.post('/topics/:topicId/notes', async (req, res) => {
  const topicId = parseId(req.params.topicId);
  const title = text(req.body?.title, 200);
  const content = text(req.body?.content, 50000);
  if (!topicId || !title || !content) {
    return res.status(400).json({ message: 'A valid topic, note title, and note content are required.' });
  }

  try {
    const [result] = await db.promise().query(
      'INSERT INTO aptitude_notes (topic_id, title, content) VALUES (?, ?, ?)',
      [topicId, title, content]
    );
    res.status(201).json({ note_id: result.insertId, topic_id: topicId, title, content });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(404).json({ message: 'Aptitude topic was not found.' });
    res.status(500).json({ message: 'Unable to create the aptitude note.' });
  }
});

router.put('/notes/:noteId', async (req, res) => {
  const noteId = parseId(req.params.noteId);
  const title = text(req.body?.title, 200);
  const content = text(req.body?.content, 50000);
  if (!noteId || !title || !content) {
    return res.status(400).json({ message: 'A valid note title and content are required.' });
  }

  try {
    const [result] = await db.promise().query(
      'UPDATE aptitude_notes SET title = ?, content = ?, updated_at = NOW() WHERE note_id = ?',
      [title, content, noteId]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Aptitude note was not found.' });
    res.json({ message: 'Aptitude note updated.' });
  } catch {
    res.status(500).json({ message: 'Unable to update the aptitude note.' });
  }
});

router.delete('/notes/:noteId', async (req, res) => {
  const noteId = parseId(req.params.noteId);
  if (!noteId) return res.status(400).json({ message: 'A valid note ID is required.' });

  try {
    const [result] = await db.promise().query('DELETE FROM aptitude_notes WHERE note_id = ?', [noteId]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Aptitude note was not found.' });
    res.json({ message: 'Aptitude note deleted.' });
  } catch {
    res.status(500).json({ message: 'Unable to delete the aptitude note.' });
  }
});

module.exports = router;