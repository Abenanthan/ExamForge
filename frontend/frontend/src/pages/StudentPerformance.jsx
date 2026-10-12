import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import '../App.css';

function StudentPerformance() {
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attemptId') || localStorage.getItem('examforge_last_attempt');
  const [performance, setPerformance] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState(attemptId ? '' : 'Complete an exam to view topic performance.');
  const [isLoading, setIsLoading] = useState(Boolean(attemptId));

  useEffect(() => {
    if (!attemptId) return;

    const loadPerformance = async () => {
      try {
        const data = await apiFetch(`/api/student/attempts/${attemptId}/performance`);
        setPerformance(data);

        // Fetch AI Analysis separately & non-blockingly
        setIsAiLoading(true);
        apiFetch(`/api/student/attempts/${attemptId}/ai-analysis`)
          .then((aiData) => setAiAnalysis(aiData))
          .catch(() => setAiAnalysis({ available: false, message: 'AI Learning Guidance is temporarily unavailable.' }))
          .finally(() => setIsAiLoading(false));

      } catch (loadError) {
        setError(loadError.message || 'Could not load topic performance.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPerformance();
  }, [attemptId]);

  const weakTopics = performance?.topics?.filter((t) => t.status === 'Weak') || [];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Topic Performance</h1>
          <p>{performance ? `Overall score: ${performance.score ?? '--'} / ${performance.total_questions ?? '--'} (${Number(performance.overall_percentage).toFixed(2)}%)` : 'Review your latest completed exam by topic.'}</p>
        </div>
        <Link to="/student-dashboard" className="dashboard-action">Student Dashboard</Link>
      </div>

      {isLoading && <p role="status">Loading performance...</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {performance && (
        <>
          {/* Prominent Overall Score Summary Banner */}
          <section className="dashboard-card performance-score-banner">
            <div className="performance-score-main">
              <span className="score-percentage-circle">
                <strong>{Number(performance.overall_percentage).toFixed(1)}%</strong>
              </span>
              <div>
                <span className="eyebrow">OVERALL ASSESSMENT SCORE</span>
                <h2>{performance.score} / {performance.total_questions} Questions Correct</h2>
                <p>Complete topic breakdown and AI learning analysis for your exam attempt.</p>
              </div>
            </div>
            <div className="performance-score-actions">
              {weakTopics.length > 0 && (
                <Link to={`/student/practice?topic=${encodeURIComponent(weakTopics[0]?.topic || '')}`} className="button button-primary">
                  Practice Weak Topic ({weakTopics[0]?.topic}) →
                </Link>
              )}
              <Link to="/student/recommendations" className="button button-secondary">
                View Recommendations →
              </Link>
            </div>
          </section>

          {weakTopics.length > 0 && (
            <section className="dashboard-card weak-topics-alert-card">
              <h2 className="alert-card-title">
                ⚠️ Weak Topics Identified ({weakTopics.length})
              </h2>
              <p>
                Accuracy is below 60% in: <strong>{weakTopics.map((t) => t.topic).join(', ')}</strong>.
              </p>
            </section>
          )}

          {/* AI Learning Guidance Section */}
          <section className="dashboard-card grok-insight-card">
            <div className="grok-insight-header">
              <h2 className="grok-insight-title">
                <span className="grok-icon" aria-hidden="true">🤖</span> AI Learning Guidance & Progress Analysis
              </h2>
              {isAiLoading ? (
                <small className="text-secondary">Generating analysis...</small>
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

                <div className="grok-action-row">
                  <p className="grok-next-step"><strong>Recommended Next Step:</strong> {aiAnalysis.guidance.recommended_action}</p>
                  {weakTopics.length > 0 && (
                    <Link to={`/student/practice?topic=${encodeURIComponent(weakTopics[0].topic)}`} className="button button-primary button-small">
                      Start Practice Now →
                    </Link>
                  )}
                </div>
                <p className="grok-encouragement">"{aiAnalysis.guidance.encouragement}"</p>
              </div>
            )}

            {!isAiLoading && !aiAnalysis?.available && (
              <p className="grok-unavailable-text">
                {aiAnalysis?.message || 'AI Learning Guidance is currently unavailable.'}
              </p>
            )}
          </section>

          <div className="exam-list">
            {performance.topics.map((topic) => (
              <article className="dashboard-card" key={topic.topic}>
                <div className="topic-performance-header">
                  <h2>{topic.topic}</h2>
                  <strong className={`topic-status topic-status-${topic.status.toLowerCase().replaceAll(' ', '-')}`}>
                    {topic.status}
                  </strong>
                </div>
                <p>
                  <strong>{topic.correct_answers}</strong> correct, <strong>{topic.wrong_answers}</strong> wrong, <strong>{topic.unanswered_questions ?? 0}</strong> unanswered of {topic.total_questions} questions
                </p>
                <p><strong>{Number(topic.percentage).toFixed(2)}%</strong> accuracy</p>
              </article>
            ))}
          </div>

          <p className="result-follow-up" style={{ marginTop: '1.5rem' }}>
            <Link to="/student/recommendations">View personalized recommended practice questions →</Link>
          </p>
        </>
      )}
    </div>
  );
}

export default StudentPerformance;