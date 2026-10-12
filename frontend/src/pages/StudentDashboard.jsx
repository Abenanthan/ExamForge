import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getUser } from '../utils/auth';
import { apiFetch } from '../utils/api';
import '../App.css';

function StudentDashboard() {
  const user = getUser();
  const studentName = user?.name || 'Student';
  const firstName = studentName.split(' ')[0] || 'there';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Real Data States
  const [summary, setSummary] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [exams, setExams] = useState([]);
  const [codingSubmissions, setCodingSubmissions] = useState([]);
  const [aptitudePerformance, setAptitudePerformance] = useState(null);

  useEffect(() => {
    let active = true;

    const loadDashboardData = async () => {
      try {
        const results = await Promise.allSettled([
          apiFetch('/api/student/dashboard-summary'),
          apiFetch('/api/student/ai-guidance'),
          apiFetch('/api/student/exams'),
          apiFetch('/api/student/coding/submissions'),
          apiFetch('/api/student/aptitude/practice/performance')
        ]);

        if (!active) return;

        if (results[0].status === 'fulfilled') {
          setSummary(results[0].value);
        }
        if (results[1].status === 'fulfilled') {
          setAiAnalysis(results[1].value);
        }
        if (results[2].status === 'fulfilled') {
          setExams(results[2].value.exams || []);
        }
        if (results[3].status === 'fulfilled') {
          setCodingSubmissions(results[3].value.submissions || []);
        }
        if (results[4].status === 'fulfilled') {
          setAptitudePerformance(results[4].value || null);
        }
      } catch (err) {
        if (active) setError(err.message || 'Could not load student dashboard.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadDashboardData();
    return () => { active = false; };
  }, []);

  const codingTotal = codingSubmissions.length;
  const codingAccepted = codingSubmissions.filter((s) => s.status === 'Accepted').length;
  const aptitudeQuizzes = aptitudePerformance?.summary?.quizzes_completed || 0;

  return (
    <main className="dashboard-page student-dashboard-page page-container">
      {/* Welcome Header */}
      <div className="dashboard-header dashboard-welcome">
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" />STUDENT DASHBOARD</p>
          <h1>Welcome back, {firstName}</h1>
          <p>Real-time learning overview, performance analytics, and targeted practice guidance.</p>
        </div>
      </div>

      {/* Quick Navigation Action Bar */}
      <section className="student-quick-actions" aria-label="Quick Actions">
        <Link to="/student/exams" className="quick-action-btn">
          <span className="quick-action-icon">📝</span>
          <span>Exams</span>
        </Link>
        <Link to="/student/practice" className="quick-action-btn">
          <span className="quick-action-icon">🎯</span>
          <span>Practice</span>
        </Link>
        <Link to="/student/recommendations" className="quick-action-btn">
          <span className="quick-action-icon">💡</span>
          <span>Recommendations</span>
        </Link>
        <Link to="/student/aptitude" className="quick-action-btn">
          <span className="quick-action-icon">🧠</span>
          <span>Aptitude</span>
        </Link>
        <Link to="/student/coding" className="quick-action-btn">
          <span className="quick-action-icon">💻</span>
          <span>Coding</span>
        </Link>
      </section>

      {/* Real Summary Metric Cards */}
      <section className="student-stat-grid" aria-label="Real Performance Metrics">
        <article className="student-stat-card">
          <span className="stat-mark">01</span>
          <span className="stat-label">Exams Attempted</span>
          <strong>{isLoading ? '...' : summary?.exams_attempted || 0}</strong>
          <small>{summary?.exams_attempted > 0 ? `Avg Score: ${summary.average_exam_score}%` : 'Complete an exam to see your score.'}</small>
        </article>

        <article className="student-stat-card">
          <span className="stat-mark">02</span>
          <span className="stat-label">Practice Attempts</span>
          <strong>{isLoading ? '...' : summary?.practice_attempts || 0}</strong>
          <small>{summary?.practice_attempts > 0 ? `${summary.practice_attempts} session(s) completed` : 'Start practice quizzes to build speed.'}</small>
        </article>

        <article className="student-stat-card">
          <span className="stat-mark">03</span>
          <span className="stat-label">Weak Topics</span>
          <strong>{isLoading ? '...' : summary?.weak_topics?.length || 0}</strong>
          <small>{summary?.weak_topics?.length > 0 ? `${summary.weak_topics.length} topic(s) need practice` : 'No weak topics below 60%!'}</small>
        </article>

        <article className="student-stat-card">
          <span className="stat-mark">04</span>
          <span className="stat-label">Improved Topics</span>
          <strong>{isLoading ? '...' : summary?.recent_improvements?.length || 0}</strong>
          <small>{summary?.recent_improvements?.length > 0 ? `${summary.recent_improvements.length} topic(s) showing score growth` : 'Complete practice to record improvements.'}</small>
        </article>
      </section>

      {isLoading && <p role="status">Loading student learning overview...</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {/* Empty State when student has no assessment history */}
      {!isLoading && !error && summary && !summary.has_data && (
        <section className="dashboard-card new-student-empty-state" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div className="empty-state-content">
            <span className="empty-state-badge">GET STARTED</span>
            <h2>Welcome to ExamForge Personalized Learning</h2>
            <p>Start your first exam assessment to build your learning profile, identify weak topics, track score improvements, and receive Grok AI learning insights.</p>
            <div className="empty-state-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/student/exams" className="button button-primary">
                Take Your First Exam →
              </Link>
              <Link to="/student/aptitude" className="button button-secondary">
                Explore Aptitude
              </Link>
              <Link to="/student/coding" className="button button-quiet">
                Practice Coding
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Real Data Learning Overview */}
      {!isLoading && !error && summary && summary.has_data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Latest Grok AI Learning Insight */}
          {aiAnalysis?.available && aiAnalysis.guidance && (
            <section className="dashboard-card grok-insight-card">
              <div className="grok-insight-header">
                <h2 className="grok-insight-title">
                  <span className="grok-icon" aria-hidden="true">🤖</span> Grok AI Learning Insight
                </h2>
                <span className="badge badge-blue">Personalized Guidance</span>
              </div>

              <div className="grok-insight-body">
                <p className="grok-summary"><strong>Summary:</strong> {aiAnalysis.guidance.summary}</p>
                {aiAnalysis.guidance.progress_observed && (
                  <p className="grok-progress">
                    <strong>Progress Observed:</strong> {aiAnalysis.guidance.progress_observed}
                  </p>
                )}
                <p className="grok-priority"><strong>Top Priority:</strong> {aiAnalysis.guidance.priority}</p>
                <div className="grok-action-row">
                  <p className="grok-next-step"><strong>Recommended Next Step:</strong> {aiAnalysis.guidance.recommended_action}</p>
                  {summary.weak_topics?.length > 0 && (
                    <Link
                      to={`/student/practice?topic=${encodeURIComponent(summary.weak_topics[0].topic)}`}
                      className="button button-primary button-small"
                    >
                      Practice Now ({summary.weak_topics[0].topic}) →
                    </Link>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Two-Column Section: Weak Topics & Improvements */}
          <div className="dashboard-two-column-layout">
            {/* Weak / Focus Topics Section */}
            <section className="dashboard-column">
              <div className="dashboard-section-heading">
                <div>
                  <p className="eyebrow" style={{ color: '#ef4444' }}><span className="eyebrow-rule" style={{ backgroundColor: '#ef4444' }} />FOCUS AREAS (&lt;60% Accuracy)</p>
                  <h2>Current Weak Topics ({summary.weak_topics?.length || 0})</h2>
                </div>
              </div>

              {summary.weak_topics && summary.weak_topics.length > 0 ? (
                <div className="recommendations-list">
                  {summary.weak_topics.map((item) => (
                    <article className="dashboard-card recommendation-card-item" key={item.topic} style={{ padding: '1.25rem' }}>
                      <div className="rec-card-header">
                        <strong style={{ fontSize: '1.05rem' }}>{item.topic}</strong>
                        <span className="coding-difficulty coding-difficulty-hard">
                          {Number(item.percentage).toFixed(2)}% Accuracy
                        </span>
                      </div>
                      <p className="rec-card-text">{item.recommendation}</p>
                      <div className="rec-card-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                        <Link
                          to={`/student/practice?topic=${encodeURIComponent(item.topic)}`}
                          className="button button-small button-primary"
                        >
                          Practice Now →
                        </Link>
                        <Link to="/student/recommendations" className="button button-small button-quiet">
                          View Details
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="dashboard-card exam-empty-state" style={{ padding: '1.5rem' }}>
                  <p style={{ margin: 0 }}>🎉 No weak topics below 60% accuracy! Keep up the excellent work.</p>
                  <Link to="/student/practice" className="button button-quiet" style={{ marginTop: '0.75rem' }}>Start Practice Quiz</Link>
                </div>
              )}
            </section>

            {/* Recent Improvement Tracking Section */}
            <section className="dashboard-column">
              <div className="dashboard-section-heading">
                <div>
                  <p className="eyebrow" style={{ color: '#10b981' }}><span className="eyebrow-rule" style={{ backgroundColor: '#10b981' }} />PROGRESS TRACKING</p>
                  <h2>Recent Score Improvements ({summary.recent_improvements?.length || 0})</h2>
                </div>
              </div>

              {summary.recent_improvements && summary.recent_improvements.length > 0 ? (
                <div className="recent-activity-list">
                  {summary.recent_improvements.map((item) => (
                    <article className="dashboard-card activity-card-item" key={item.topic} style={{ padding: '1.25rem' }}>
                      <div className="activity-item-top">
                        <strong style={{ fontSize: '1.05rem' }}>{item.topic}</strong>
                        <span className="coding-difficulty coding-difficulty-easy" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                          Improved
                        </span>
                      </div>
                      <p style={{ fontSize: '0.9rem', margin: '0.5rem 0', color: 'var(--text-secondary)' }}>
                        Previous: <span>{item.previous_percentage}%</span> → Latest Practice: <strong>{item.latest_percentage}%</strong>
                      </p>
                      <div className="activity-item-bottom" style={{ marginTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold' }}>
                          +{(item.latest_percentage - item.previous_percentage).toFixed(2)}% Growth
                        </span>
                        <Link
                          to={`/student/practice?topic=${encodeURIComponent(item.topic)}`}
                          className="button button-small button-secondary"
                        >
                          Practice Again →
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="dashboard-card exam-empty-state" style={{ padding: '1.5rem' }}>
                  <p style={{ margin: 0 }}>Complete practice quizzes after exams to record topic score improvements here.</p>
                  <Link to="/student/recommendations" className="button button-quiet" style={{ marginTop: '0.75rem' }}>View Recommendations</Link>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Feature Navigation Cards */}
      <div className="dashboard-section-heading" style={{ marginTop: '2.5rem' }}>
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" />LEARNING MODULES</p>
          <h1>Platform Features</h1>
        </div>
      </div>

      <div className="dashboard-cards student-feature-grid">
        <article className="dashboard-card feature-dashboard-card">
          <span className="dashboard-card-mark">01</span>
          <h2>Exams</h2>
          <p>Take structured examinations and receive instant feedback.</p>
          <Link to="/student/exams" className="dashboard-action">
            View Exams →
          </Link>
        </article>

        <article className="dashboard-card feature-dashboard-card">
          <span className="dashboard-card-mark">02</span>
          <h2>Practice</h2>
          <p>Targeted practice questions focused on your areas for growth.</p>
          <Link to="/student/practice" className="dashboard-action">
            Start Practice →
          </Link>
        </article>

        <article className="dashboard-card feature-dashboard-card">
          <span className="dashboard-card-mark">03</span>
          <h2>Recommendations</h2>
          <p>Hand-picked questions and notes tailored to your performance.</p>
          <Link to="/student/recommendations" className="dashboard-action">
            View Recommendations →
          </Link>
        </article>

        <article className="dashboard-card feature-dashboard-card">
          <span className="dashboard-card-mark">04</span>
          <h2>Performance</h2>
          <p>Analyze your score breakdown by topic after completing exams.</p>
          <Link to="/student/performance" className="dashboard-action">
            View Performance →
          </Link>
        </article>

        <article className="dashboard-card feature-dashboard-card">
          <span className="dashboard-card-mark">05</span>
          <h2>Coding Practice</h2>
          <p>30 placement-grade coding challenges in Java, Python, and C.</p>
          <Link to="/student/coding" className="dashboard-action">
            Start Coding →
          </Link>
          <Link to="/student/coding/submissions" className="coding-history-link">
            Submission History
          </Link>
        </article>

        <article className="dashboard-card feature-dashboard-card">
          <span className="dashboard-card-mark">06</span>
          <h2>Aptitude Preparation</h2>
          <p>Build quantitative, reasoning, and verbal skills for campus placements.</p>
          <Link to="/student/aptitude" className="dashboard-action">
            Explore Aptitude →
          </Link>
        </article>
      </div>
    </main>
  );
}

export default StudentDashboard;