import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import '../App.css';
import './Aptitude.css';

function AdminAptitude() {
  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [topicForm, setTopicForm] = useState({ category_id: '', name: '', description: '' });
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadCatalog = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [categoryData, topicData] = await Promise.all([
        apiFetch('/api/admin/aptitude/categories'),
        apiFetch('/api/admin/aptitude/topics')
      ]);
      setCategories(categoryData.categories);
      setTopics(topicData.topics);
      setTopicForm((form) => ({ ...form, category_id: form.category_id || String(categoryData.categories[0]?.category_id || '') }));
      setSelectedTopicId((current) => current || String(topicData.topics[0]?.topic_id || ''));
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load aptitude management data.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch('/api/admin/aptitude/categories'),
      apiFetch('/api/admin/aptitude/topics')
    ])
      .then(([categoryData, topicData]) => {
        if (!active) return;
        setCategories(categoryData.categories);
        setTopics(topicData.topics);
        setTopicForm((form) => ({ ...form, category_id: form.category_id || String(categoryData.categories[0]?.category_id || '') }));
        setSelectedTopicId((current) => current || String(topicData.topics[0]?.topic_id || ''));
        setError('');
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Unable to load aptitude management data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedTopicId) {
      return undefined;
    }
    let active = true;
    apiFetch(`/api/admin/aptitude/topics/${selectedTopicId}/notes`)
      .then((response) => { if (active) setNotes(response.notes); })
      .catch((loadError) => { if (active) setError(loadError.message); });
    return () => { active = false; };
  }, [selectedTopicId]);

  const submit = async (event, path, payload, reset) => {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      await apiFetch(path, { method: 'POST', body: JSON.stringify(payload) });
      reset();
      setNotice('Aptitude content saved.');
      await loadCatalog();
    } catch (saveError) {
      setError(saveError.message || 'Unable to save aptitude content.');
    }
  };

  const saveNote = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    const path = editingNoteId
      ? `/api/admin/aptitude/notes/${editingNoteId}`
      : `/api/admin/aptitude/topics/${selectedTopicId}/notes`;
    try {
      await apiFetch(path, { method: editingNoteId ? 'PUT' : 'POST', body: JSON.stringify(noteForm) });
      setNoteForm({ title: '', content: '' });
      setEditingNoteId(null);
      setNotice(editingNoteId ? 'Note updated.' : 'Note added.');
      const response = await apiFetch(`/api/admin/aptitude/topics/${selectedTopicId}/notes`);
      setNotes(response.notes);
      await loadCatalog();
    } catch (saveError) {
      setError(saveError.message || 'Unable to save the aptitude note.');
    }
  };

  const deleteNote = async (noteId) => {
    setError('');
    setNotice('');
    try {
      await apiFetch(`/api/admin/aptitude/notes/${noteId}`, { method: 'DELETE' });
      setNotes((current) => current.filter((note) => note.note_id !== noteId));
      setNotice('Note deleted.');
      await loadCatalog();
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete the aptitude note.');
    }
  };

  return (
    <main className="aptitude-page page-container">
      <div className="aptitude-heading">
        <div><p className="eyebrow"><span className="eyebrow-rule" />CONTENT MANAGEMENT</p><h1>Aptitude Management</h1><p>Organize placement topics and learning notes.</p></div>
      </div>
      {error && <p className="form-error aptitude-error" role="alert">{error}</p>}
      {notice && <p className="aptitude-notice" role="status">{notice}</p>}
      {loading && <p className="aptitude-message" role="status">Loading aptitude catalog...</p>}

      <div className="aptitude-admin-forms">
        <form className="aptitude-admin-form" onSubmit={(event) => submit(event, '/api/admin/aptitude/categories', categoryForm, () => setCategoryForm({ name: '', description: '' }))}>
          <h2>Create category</h2>
          <label>Category name<input required maxLength="100" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} /></label>
          <label>Description<textarea maxLength="1000" rows="3" value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} /></label>
          <button className="dashboard-action" type="submit">Add category</button>
        </form>
        <form className="aptitude-admin-form" onSubmit={(event) => submit(event, '/api/admin/aptitude/topics', topicForm, () => setTopicForm((form) => ({ ...form, name: '', description: '' })))}>
          <h2>Create topic</h2>
          <label>Category<select required value={topicForm.category_id} onChange={(event) => setTopicForm({ ...topicForm, category_id: event.target.value })}>
            <option value="" disabled>Select a category</option>
            {categories.map((category) => <option key={category.category_id} value={category.category_id}>{category.name}</option>)}
          </select></label>
          <label>Topic name<input required maxLength="100" value={topicForm.name} onChange={(event) => setTopicForm({ ...topicForm, name: event.target.value })} /></label>
          <label>Description<textarea maxLength="1000" rows="3" value={topicForm.description} onChange={(event) => setTopicForm({ ...topicForm, description: event.target.value })} /></label>
          <button className="dashboard-action" type="submit" disabled={!categories.length}>Add topic</button>
        </form>
      </div>

      <section className="aptitude-admin-topics">
        <div className="aptitude-section-title"><div><p className="eyebrow"><span className="eyebrow-rule" />CATALOG AND ACTIVITY</p><h2>Topics</h2></div></div>
        <div className="aptitude-history-table-wrap">
          <table className="aptitude-history-table">
            <thead><tr><th>Topic</th><th>Category</th><th>Notes</th><th>Attempts</th><th>Average</th><th>Manage notes</th></tr></thead>
            <tbody>{topics.map((topic) => (
              <tr key={topic.topic_id}>
                <td><strong>{topic.name}</strong><small>{topic.description}</small></td>
                <td>{topic.category_name}</td>
                <td>{topic.note_count}</td>
                <td>{topic.attempt_count}</td>
                <td>{Math.round(Number(topic.average_score))}%</td>
                <td><button type="button" className="aptitude-inline-button" onClick={() => setSelectedTopicId(String(topic.topic_id))}>{String(topic.topic_id) === selectedTopicId ? 'Selected' : 'Edit notes'}</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="aptitude-admin-notes">
        <div className="aptitude-section-title"><div><p className="eyebrow"><span className="eyebrow-rule" />LEARNING MATERIAL</p><h2>{topics.find((topic) => String(topic.topic_id) === selectedTopicId)?.name || 'Topic notes'}</h2></div></div>
        {selectedTopicId ? (
          <>
            <form className="aptitude-note-editor" onSubmit={saveNote}>
              <label>Note title<input required maxLength="200" value={noteForm.title} onChange={(event) => setNoteForm({ ...noteForm, title: event.target.value })} /></label>
              <label>Content<textarea required rows="7" value={noteForm.content} onChange={(event) => setNoteForm({ ...noteForm, content: event.target.value })} /></label>
              <div className="aptitude-note-editor-actions">
                <button className="dashboard-action" type="submit">{editingNoteId ? 'Save changes' : 'Add note'}</button>
                {editingNoteId && <button className="exam-secondary-action" type="button" onClick={() => { setEditingNoteId(null); setNoteForm({ title: '', content: '' }); }}>Cancel edit</button>}
              </div>
            </form>
            <div className="aptitude-admin-note-list">
              {notes.map((note) => (
                <article className="aptitude-admin-note" key={note.note_id}>
                  <div><strong>{note.title}</strong><p>{note.content.slice(0, 180)}{note.content.length > 180 ? '...' : ''}</p></div>
                  <div className="aptitude-note-editor-actions">
                    <button type="button" className="aptitude-inline-button" onClick={() => { setEditingNoteId(note.note_id); setNoteForm({ title: note.title, content: note.content }); }}>Edit</button>
                    <button type="button" className="aptitude-inline-button is-danger" onClick={() => deleteNote(note.note_id)}>Delete</button>
                  </div>
                </article>
              ))}
              {!notes.length && <p className="aptitude-empty">No notes for this topic yet.</p>}
            </div>
          </>
        ) : <p className="aptitude-empty">Create a topic to begin adding notes.</p>}
      </section>
    </main>
  );
}

export default AdminAptitude;