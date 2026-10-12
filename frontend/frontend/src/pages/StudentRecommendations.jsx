import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import '../App.css';

function StudentRecommendations() {
  const [data, setData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const resData = await apiFetch('/api/student/recommendations');
        setData(resData);
        if (resData.has_data) {
          setIsAiLoading(true);
          apiFetch('/api/student/ai-guidance')
            .then((aiData) => setAiAnalysis(aiData))
            .catch(() => setAiAnalysis({ available: false, message: 'AI Guidance is temporarily unavailable.' }))
            .finally(() => setIsAiLoading(false));
        }
      } catch (loadError) {
        setError(loadError.message || 'Could not load recommendations.');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  const getStatusBadgeStyle = (status) => {
    if (status === 'Improved') {
      return { backgroundColor: '#dcfce7', color: '#15803d', borderColor: '#86efac' };
    }
    if (status === 'Needs more practice') {
      return { backgroundColor: '#fee2e2', color: '#b91c1c', borderColor: '#fca5a5' };
    }
    return { backgroundColor: '#fef3c7', color: '#b45309', borderColor: '#fde68a' };
  };

  const renderTopicCard = (item, categoryType) => (
    <article className="dashboard-card" key={item.topic} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{item.topic}</h3>
        <span
          className="coding-difficulty"
          style={{
            fontSize: '0.75rem',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            fontWeight: 'bold',
            border: '1px solid',
            ...getStatusBadgeStyle(item.improvement_status)
          }}
        >
          {item.improvement_status}
        </span>
      </div>

      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        <p style={{ margin: '0 0 0.25rem 0' }}>
          Overall Accuracy: <strong>{Number(item.percentage).toFixed(2)}%</strong> ({item.correct_answers} / {item.total_questions} correct)
        </p>
        {item.previous_percentage !== null && (
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            Previous: <span>{item.previous_percentage}%</span> → Latest: <strong>{item.latest_percentage}%</strong>
          </p>
        )}
      </div>

      <div style={{ background: 'var(--bg-subtle, #f8fafc)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.875rem', borderLeft: '3px solid #6366f1' }}>
        <strong>Recommendation:</strong> {item.recommendation}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
        <Link
          to={`/student/practice?topic=${encodeURIComponent(item.topic)}`}
          className="button button-primary button-small"
          style={{ width: '100%', textAlign: 'center' }}
        >
          Practice {item.topic} →
        </Link>
      </div>
    </article>
  );

  return (
    <div className="dashboard-page page-container">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" />PERFORMANCE TRACKING</p>
          <h1>TARGETED RECOMMENDATIONS</h1>
          <p>Deterministic practice priorities and topic improvement tracking based on actual assessment data.</p>
        </div>
        <Link to="/student-dashboard" className="dashboard-action">Student Dashboard</Link>
      </div>

      {isLoading && <p role="status">Loading recommendations...</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {!isLoading && !error && data && !data.has_data && (
        <section className="dashboard-card practice-empty-state-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <div className="empty-state-content">
            <span className="empty-state-badge">ASSESSMENT STATUS</span>
            <h2>No Previous Exam Data Available</h2>
            <p>{data.message || 'Complete an exam assessment to view personalized recommendations and topic improvement tracking.'}</p>
            <div style={{ marginTop: '1.5rem' }}>
              <Link to="/student/exams" className="button button-primary">
                Take Your First Exam →
              </Link>
            </div>
          </div>
        </section>
      )}

      {!isLoading && !error && data && data.has_data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* AI Learning Guidance & Progress Analysis Section */}
          <section className="dashboard-card grok-insight-card">
            <div className="grok-insight-header">
              <h2 className="grok-insight-title">
                <span className="grok-icon" aria-hidden="true">🤖</span> AI Learning Guidance & Progress Analysis
              </h2>
              {isAiLoading ? (
                <small className="text-secondary">Analyzing progress...</small>
              ) : (
                <span className="badge badge-blue">Grok AI Powered</span>
              )}
            </div>

            {isAiLoading && (
              <p role="status" className="grok-loading-text">
                Grok AI is analyzing your performance metrics and improvement history...
              </p>
            )}

            {!isAiLoading && aiAnalysis?.available && aiAnalysis.guidance && (
              <div className="grok-insight-body">
                <p className="grok-summary"><strong>Summary:</strong> {aiAnalysis.guidance.summary}</p>
                {aiAnalysis.guidance.progress_observed && (
                  <p className="grok-progress">
                    <strong>Progress Observed:</strong> {aiAnalysis.guidance.progress_observed}
                  </p>
                )}
                <p className="grok-priority"><strong>Remaining Weak Areas:</strong> {aiAnalysis.guidance.remaining_weak_areas || aiAnalysis.guidance.reason_for_weak_areas}</p>
                <p className="grok-priority"><strong>Top Priority:</strong> {aiAnalysis.guidance.priority}</p>

                {aiAnalysis.guidance.study_plan?.length > 0 && (
                  <div className="grok-study-plan">
                    <strong>Suggested Study Plan:</strong>
                    <ol>
                      {aiAnalysis.guidance.study_plan.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                <p className="grok-next-step"><strong>Recommended Next Step:</strong> {aiAnalysis.guidance.recommended_action}</p>
                <p className="grok-encouragement">"{aiAnalysis.guidance.encouragement}"</p>
              </div>
            )}

            {!isAiLoading && !aiAnalysis?.available && (
              <p className="grok-unavailable-text">
                {aiAnalysis?.message || 'AI Learning Guidance is currently unavailable.'}
              </p>
            )}
          </section>

          {/* FOCUS NOW (High Priority) */}
          <section>
            <div className="dashboard-section-heading" style={{ marginBottom: '1rem' }}>
              <div>
                <p className="eyebrow" style={{ color: '#ef4444' }}><span className="eyebrow-rule" style={{ backgroundColor: '#ef4444' }} />HIGH PRIORITY (&lt;60% Accuracy)</p>
                <h2>Focus Now ({data.focus_now?.length || 0})</h2>
              </div>
            </div>

            {data.focus_now && data.focus_now.length > 0 ? (
              <div className="web-prog-units-grid">
                {data.focus_now.map((item) => renderTopicCard(item, 'Focus Now'))}
              </div>
            ) : (
              <div className="dashboard-card" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                <p style={{ margin: 0 }}>🎉 No critical weak topics requiring immediate focus right now!</p>
              </div>
            )}
          </section>

          {/* IMPROVE NEXT (Moderate Priority) */}
          <section>
            <div className="dashboard-section-heading" style={{ marginBottom: '1rem' }}>
              <div>
                <p className="eyebrow" style={{ color: '#f59e0b' }}><span className="eyebrow-rule" style={{ backgroundColor: '#f59e0b' }} />MODERATE PRIORITY (60% - 79% Accuracy)</p>
                <h2>Improve Next ({data.improve_next?.length || 0})</h2>
              </div>
            </div>

            {data.improve_next && data.improve_next.length > 0 ? (
              <div className="web-prog-units-grid">
                {data.improve_next.map((item) => renderTopicCard(item, 'Improve Next'))}
              </div>
            ) : (
              <div className="dashboard-card" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                <p style={{ margin: 0 }}>No topics currently in the moderate priority range.</p>
              </div>
            )}
          </section>

          {/* DOING WELL (Mastery) */}
          <section>
            <div className="dashboard-section-heading" style={{ marginBottom: '1rem' }}>
              <div>
                <p className="eyebrow" style={{ color: '#10b981' }}><span className="eyebrow-rule" style={{ backgroundColor: '#10b981' }} />MASTERY (≥80% Accuracy)</p>
                <h2>Doing Well ({data.doing_well?.length || 0})</h2>
              </div>
            </div>

            {data.doing_well && data.doing_well.length > 0 ? (
              <div className="web-prog-units-grid">
                {data.doing_well.map((item) => renderTopicCard(item, 'Doing Well'))}
              </div>
            ) : (
              <div className="dashboard-card" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                <p style={{ margin: 0 }}>Keep practicing to elevate your topic scores to mastery (80%+)!</p>
              </div>
            )}
          </section>

          <div className="result-follow-up" style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/student/practice" className="button button-secondary">
              Go to Personalized Practice Center →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentRecommendations;