import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import '../App.css';

function StudentResult() {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResult = async () => {
      try {
        const data = await apiFetch(`/api/student/attempts/${attemptId}/result`);
        setResult(data);
      } catch (loadError) {
        setError(loadError.message || 'Cannot connect to the server.');
      } finally {
        setIsLoading(false);
      }
    };

    loadResult();
  }, [attemptId]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Your Result</h1>
          <p>{result?.exam_title || 'Your submitted exam summary'}</p>
        </div>
        <Link to="/student-dashboard" className="dashboard-action">Student Dashboard</Link>
      </div>

      {isLoading && <p role="status">Loading result...</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {result && (
        <section className="result-panel dashboard-card practice-result-view">
          <div className="result-header">
            <span className="eyebrow">EXAM SUBMITTED</span>
            <h2>{result.exam_title || 'Exam Completed'}</h2>
            <p>Your performance report has been generated.</p>
          </div>

          <div className="result-score-overview">
            <div className="score-big-circle">
              <strong>{Number(result.percentage).toFixed(1)}%</strong>
              <span>Overall Score</span>
            </div>

            <div className="score-stat-breakdown">
              <div className="stat-pill stat-correct">
                <span>Correct Answers</span>
                <strong>{result.correct_answers}</strong>
              </div>
              <div className="stat-pill stat-wrong">
                <span>Wrong Answers</span>
                <strong>{result.wrong_answers}</strong>
              </div>
              <div className="stat-pill stat-unanswered">
                <span>Unanswered</span>
                <strong>{result.unanswered_questions ?? 0}</strong>
              </div>
              <div className="stat-pill">
                <span>Total Questions</span>
                <strong>{result.total_questions}</strong>
              </div>
            </div>
          </div>

          <div className="result-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to={`/student/performance?attemptId=${result.attempt_id}`} className="button button-primary">
              View Topic Performance &amp; Weak Areas →
            </Link>
            <Link to="/student/recommendations" className="button button-secondary">
              View Personalized Recommendations
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

export default StudentResult;