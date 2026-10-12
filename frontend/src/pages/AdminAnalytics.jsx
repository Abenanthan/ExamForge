import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import '../App.css';

function AnalyticsTable({ title, columns, rows }) {
  return (
    <section className="dashboard-card analytics-section">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="exam-empty-state">No data available.</p>
      ) : (
        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.question_id || row.exam_id || row.topic || row.difficulty || index}>
                  {columns.map((column) => <td key={column.key}>{row[column.key]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [overview, exams, topics, questions, difficulty] = await Promise.all([
          apiFetch('/api/admin/analytics/overview'),
          apiFetch('/api/admin/analytics/exams'),
          apiFetch('/api/admin/analytics/topics'),
          apiFetch('/api/admin/analytics/questions'),
          apiFetch('/api/admin/analytics/difficulty')
        ]);
        setAnalytics({ overview, exams: exams.exams, topics: topics.topics, questions: questions.questions, difficulty: difficulty.difficulty });
      } catch (loadError) {
        setError(loadError.message || 'Could not load analytics.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Admin Analytics</h1>
          <p>Exam, topic, question, and difficulty performance.</p>
        </div>
        <Link to="/admin-dashboard" className="dashboard-action">Admin Dashboard</Link>
      </div>

      {isLoading && <p role="status">Loading analytics...</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {analytics && (
        <>
          <div className="dashboard-cards analytics-overview">
            {[
              ['Students', analytics.overview.total_students],
              ['Exams', analytics.overview.total_exams],
              ['Published exams', analytics.overview.published_exams],
              ['Questions', analytics.overview.total_questions],
              ['Submitted attempts', analytics.overview.total_attempts],
              ['Average score', analytics.overview.average_score],
              ['Average percentage', `${analytics.overview.average_percentage}%`]
            ].map(([label, value]) => (
              <article className="dashboard-card analytics-metric" key={label}>
                <p>{label}</p>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
          <div className="analytics-tables">
            <AnalyticsTable title="Exam Performance" columns={[
              { key: 'title', label: 'Exam' }, { key: 'total_questions', label: 'Questions' },
              { key: 'attempts', label: 'Attempts' }, { key: 'average_score', label: 'Avg score' },
              { key: 'average_percentage', label: 'Avg %' }, { key: 'highest_score', label: 'High' },
              { key: 'lowest_score', label: 'Low' }
            ]} rows={analytics.exams} />
            <AnalyticsTable title="Topic Performance" columns={[
              { key: 'topic', label: 'Topic' }, { key: 'total_answers', label: 'Answers' },
              { key: 'correct_answers', label: 'Correct' }, { key: 'wrong_answers', label: 'Wrong' },
              { key: 'accuracy', label: 'Accuracy %' }
            ]} rows={analytics.topics} />
            <AnalyticsTable title="Question Performance" columns={[
              { key: 'question_text', label: 'Question' }, { key: 'topic', label: 'Topic' },
              { key: 'difficulty', label: 'Difficulty' }, { key: 'times_answered', label: 'Answered' },
              { key: 'correct_answers', label: 'Correct' }, { key: 'wrong_answers', label: 'Wrong' },
              { key: 'accuracy', label: 'Accuracy %' }
            ]} rows={analytics.questions} />
            <AnalyticsTable title="Difficulty Performance" columns={[
              { key: 'difficulty', label: 'Difficulty' }, { key: 'total_answers', label: 'Answers' },
              { key: 'correct_answers', label: 'Correct' }, { key: 'accuracy', label: 'Accuracy %' }
            ]} rows={analytics.difficulty} />
          </div>
        </>
      )}
    </div>
  );
}

export default AdminAnalytics;