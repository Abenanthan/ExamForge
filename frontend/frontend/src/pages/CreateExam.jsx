import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import '../App.css';

function CreateExam() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [status, setStatus] = useState('draft');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    setIsSubmitting(true);

    try {
      await apiFetch('/api/exams', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          duration: Number(duration),
          total_questions: Number(totalQuestions),
          status
        })
      });

      navigate('/admin-dashboard', {
        state: { message: `Exam "${title.trim()}" created successfully.` }
      });
    } catch (submitError) {
      setError(submitError.message || 'Could not create exam.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page create-exam-page">
      <section className="login-card create-exam-card">
        <div className="login-header">
          <h1>Create Exam</h1>
          <p>Set up the exam details and publication status.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="exam-title">Title</label>
            <input
              id="exam-title"
              type="text"
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="exam-description">Description</label>
            <textarea
              id="exam-description"
              rows="4"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="exam-duration">Duration (minutes)</label>
            <input
              id="exam-duration"
              type="number"
              min="1"
              step="1"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="exam-total-questions">Total questions</label>
            <input
              id="exam-total-questions"
              type="number"
              min="0"
              step="1"
              value={totalQuestions}
              onChange={(event) => setTotalQuestions(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="exam-status">Status</label>
            <select
              id="exam-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Exam'}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/admin-dashboard">Back to Admin Dashboard</Link>
        </div>
      </section>
    </div>
  );
}

export default CreateExam;