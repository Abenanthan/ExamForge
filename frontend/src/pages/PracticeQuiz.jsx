import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import '../App.css';

const UNITS = [
  { number: 1, name: 'Unit I — Web Basics, HTML & CSS', desc: 'Web evolution, HTML tags, Semantic elements, CSS selectors, Box model, Git basics.' },
  { number: 2, name: 'Unit II — Client-Side JavaScript', desc: 'JS variables, DOM manipulation, Events, Form validation, Loops, Canvas API.' },
  { number: 3, name: 'Unit III — Server-Side PHP & Bootstrap', desc: 'PHP fundamentals, Arrays, File handling, PDO database access, Bootstrap 12-col grid.' },
  { number: 4, name: 'Unit IV — ReactJS Basics & Architecture', desc: 'JSX, React components, Virtual DOM diffing, Class lifecycle, React Native comparison.' },
  { number: 5, name: 'Unit V — React Dataflow, Hooks & Routing', desc: 'State, Props, useEffect/useState, Context API, React Router navigation & params.' }
];

function PracticeQuiz() {
  const [searchParams] = useSearchParams();
  const initialTopicParam = searchParams.get('topic');

  // Navigation & Mode
  const [activeTab, setActiveTab] = useState(initialTopicParam ? 'weak_topics' : 'web_programming'); // 'web_programming' | 'weak_topics' | 'history'

  // Unit Practice Config
  const [selectedUnit, setSelectedUnit] = useState('All');
  const [selectedCount, setSelectedCount] = useState(10);
  const [timerMode, setTimerMode] = useState(0); // 0 = No Timer, 180 = 3m, 300 = 5m, 600 = 10m, custom
  const [customTimerMinutes, setCustomTimerMinutes] = useState(5);

  // Active Practice State
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // History State
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Weak Topics Practice State
  const [weakQuestions, setWeakQuestions] = useState([]);
  const [weakAnswers, setWeakAnswers] = useState({});
  const [weakMessage, setWeakMessage] = useState('');
  const [isLoadingWeak, setIsLoadingWeak] = useState(false);
  const [weakResult, setWeakResult] = useState(null);

  // Load History
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await apiFetch('/api/student/practice/web-programming/history');
      setHistory(data.attempts || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load Weak Topics Practice
  const loadWeakTopics = async (topicOverride = null) => {
    setIsLoadingWeak(true);
    const targetTopic = topicOverride !== null ? topicOverride : initialTopicParam;
    const url = targetTopic ? `/api/student/practice?topic=${encodeURIComponent(targetTopic)}` : '/api/student/practice';
    try {
      const data = await apiFetch(url);
      setWeakQuestions(data.questions || []);
      setWeakMessage(data.message || '');
    } catch (err) {
      setWeakMessage(err.message || 'Complete an exam assessment to generate personalized weak topic practice.');
    } finally {
      setIsLoadingWeak(false);
    }
  };

  useEffect(() => {
    loadHistory();
    loadWeakTopics();
  }, [initialTopicParam]);

  // Timer Countdown Effect
  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0 || result) return undefined;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitWebPracticeAuto();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, result]);

  // Start Web Programming Practice
  const startWebPractice = async (overrideUnit = null) => {
    setError('');
    setResult(null);
    setAnswers({});
    setIsStarting(true);

    const unitToUse = overrideUnit !== null ? overrideUnit : selectedUnit;
    const finalTimerSeconds = timerMode === 'custom'
      ? Math.max(60, customTimerMinutes * 60)
      : Number(timerMode) > 0 ? Number(timerMode) : null;

    try {
      const data = await apiFetch('/api/student/practice/web-programming/attempts', {
        method: 'POST',
        body: JSON.stringify({
          unit_number: unitToUse,
          difficulty: 'Mixed',
          count: selectedCount,
          timer_seconds: finalTimerSeconds
        })
      });

      setActiveAttempt(data);
      setQuestions(data.questions || []);
      setRemainingSeconds(data.timer_seconds || null);
    } catch (startError) {
      setError(startError.message || 'Could not start practice attempt.');
    } finally {
      setIsStarting(false);
    }
  };

  // Auto-submit on timer expiry
  const submitWebPracticeAuto = () => {
    submitWebPractice(null, true);
  };

  // Submit Web Programming Practice
  const submitWebPractice = async (e = null, isAuto = false) => {
    if (e) e.preventDefault();
    if (!activeAttempt || isSubmitting) return;

    setError('');
    setIsSubmitting(true);

    const timeTaken = activeAttempt.timer_seconds && remainingSeconds !== null
      ? Math.max(0, activeAttempt.timer_seconds - remainingSeconds)
      : 0;

    const formattedAnswers = questions.map((q) => ({
      question_id: q.question_id,
      selected_option: answers[q.question_id] || null
    }));

    try {
      const data = await apiFetch(`/api/student/practice/web-programming/attempts/${activeAttempt.attempt_id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          answers: formattedAnswers,
          time_taken_seconds: timeTaken
        })
      });

      setResult(data);
      loadHistory();
    } catch (submitError) {
      setError(submitError.message || 'Failed to submit practice answers.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Weak Topics Practice
  const submitWeakPractice = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const data = await apiFetch('/api/student/practice/submit', {
        method: 'POST',
        body: JSON.stringify({
          answers: weakQuestions.map((q) => ({
            question_id: q.question_id,
            selected_option: weakAnswers[q.question_id] || null
          }))
        })
      });
      setWeakResult(data);
    } catch (err) {
      setError(err.message || 'Failed to submit weak topic answers.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format seconds into MM:SS
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <main className="dashboard-page practice-center-page page-container">
      {/* Header */}
      <div className="dashboard-header practice-header">
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" />ASSESSMENT & PRACTICE</p>
          <h1>PRACTICE CENTER</h1>
          <p>Practice Web Programming and improve your skills across 75 syllabus MCQs.</p>
        </div>
        <div className="practice-header-actions">
          <button
            type="button"
            className={`button ${activeTab === 'web_programming' ? 'button-primary' : 'button-quiet'}`}
            onClick={() => { setActiveTab('web_programming'); setResult(null); setActiveAttempt(null); }}
          >
            Web Programming
          </button>
          <button
            type="button"
            className={`button ${activeTab === 'weak_topics' ? 'button-primary' : 'button-quiet'}`}
            onClick={() => setActiveTab('weak_topics')}
          >
            Personalized Practice
          </button>
          <button
            type="button"
            className={`button ${activeTab === 'history' ? 'button-primary' : 'button-quiet'}`}
            onClick={() => { setActiveTab('history'); loadHistory(); }}
          >
            Practice History
          </button>
        </div>
      </div>

      {error && (
        <div className="form-error" role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <span>{error}</span>
          <button type="button" className="button button-quiet" onClick={() => startWebPractice()}>Retry</button>
        </div>
      )}

      {/* ========================================================
          ACTIVE PRACTICE ATTEMPT VIEW (Web Programming)
         ======================================================== */}
      {activeAttempt && !result && (
        <div className="practice-active-session">
          <div className="practice-session-bar dashboard-card">
            <div>
              <span className="eyebrow">ACTIVE PRACTICE</span>
              <h2>{activeAttempt.unit_name}</h2>
              <p>Subject: <strong>Web Programming</strong> · {questions.length} Questions</p>
            </div>
            {remainingSeconds !== null && (
              <div className={`practice-timer-box ${remainingSeconds < 60 ? 'timer-warning' : ''}`}>
                <span>TIME REMAINING</span>
                <strong>⏱ {formatTime(remainingSeconds)}</strong>
              </div>
            )}
          </div>

          <form className="practice-question-list" onSubmit={submitWebPractice}>
            {questions.map((q, index) => (
              <section className="exam-question-panel dashboard-card" key={q.question_id}>
                <div className="question-progress">
                  <span>Question {index + 1} of {questions.length}</span>
                  <span className="coding-difficulty coding-difficulty-medium">
                    {q.topic}
                  </span>
                </div>
                <h2>{q.question_text}</h2>
                <div className="exam-answer-list">
                  {Object.entries(q.options).map(([label, text]) => (
                    <label
                      key={label}
                      className={`exam-answer ${answers[q.question_id] === label ? 'exam-answer-selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.question_id}`}
                        value={label}
                        checked={answers[q.question_id] === label}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.question_id]: label }))}
                      />
                      <span className="answer-label">{label}</span>
                      <span>{text}</span>
                    </label>
                  ))}
                </div>
              </section>
            ))}

            <div className="practice-submit-bar">
              <button className="button button-primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Evaluating...' : 'Submit Practice →'}
              </button>
              <button
                type="button"
                className="button button-quiet"
                onClick={() => { setActiveAttempt(null); setQuestions([]); }}
              >
                Cancel Practice
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          PRACTICE RESULT VIEW
         ======================================================== */}
      {result && (
        <section className="result-panel dashboard-card practice-result-view">
          <div className="result-header">
            <span className="eyebrow">PRACTICE COMPLETED</span>
            <h2>{result.unit_name}</h2>
            <p>Subject: <strong>Web Programming</strong> · {result.total_questions} Questions</p>
          </div>

          <div className="result-score-overview">
            <div className="score-big-circle">
              <strong>{result.score}%</strong>
              <span>Overall Score</span>
            </div>
            <div className="score-stat-breakdown">
              <div className="stat-pill stat-correct">
                <span>Correct</span>
                <strong>{result.correct_answers}</strong>
              </div>
              <div className="stat-pill stat-wrong">
                <span>Incorrect</span>
                <strong>{result.wrong_answers}</strong>
              </div>
              <div className="stat-pill stat-unanswered">
                <span>Unanswered</span>
                <strong>{result.unanswered}</strong>
              </div>
              {result.time_taken_seconds > 0 && (
                <div className="stat-pill stat-time">
                  <span>Time Used</span>
                  <strong>{formatTime(result.time_taken_seconds)}</strong>
                </div>
              )}
            </div>
          </div>

          <h3>Question Breakdown & Explanations</h3>
          <div className="practice-review-list">
            {result.questions.map((q, idx) => (
              <article className={`review-question-card ${q.is_correct ? 'review-pass' : 'review-fail'}`} key={q.question_id}>
                <div className="review-card-header">
                  <strong>Question {idx + 1}: {q.topic}</strong>
                  <span className={`status-badge ${q.is_correct ? 'status-accepted' : 'status-attempted'}`}>
                    {q.is_correct ? '✓ Correct' : q.selected_option ? '✕ Incorrect' : 'Unanswered'}
                  </span>
                </div>
                <p className="review-question-text">{q.question_text}</p>
                <div className="review-options">
                  {Object.entries(q.options).map(([lbl, txt]) => {
                    const isSelected = q.selected_option === lbl;
                    const isCorrect = q.correct_option === lbl;
                    let optClass = 'review-opt';
                    if (isCorrect) optClass += ' review-opt-correct';
                    if (isSelected && !isCorrect) optClass += ' review-opt-wrong';

                    return (
                      <div key={lbl} className={optClass}>
                        <strong>{lbl}.</strong> {txt} {isCorrect && '✓ (Correct)'} {isSelected && !isCorrect && '✕ (Your Answer)'}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <div className="review-explanation">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="result-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={() => { setResult(null); setActiveAttempt(null); startWebPractice(); }}
            >
              Practice Again ↻
            </button>
            <button
              type="button"
              className="button button-quiet"
              onClick={() => { setResult(null); setActiveAttempt(null); }}
            >
              Back to Practice Center
            </button>
          </div>
        </section>
      )}

      {/* ========================================================
          WEB PROGRAMMING PRACTICE SELECTION & SYLLABUS UNITS
         ======================================================== */}
      {activeTab === 'web_programming' && !activeAttempt && !result && (
        <>
          {/* Custom Practice Configurator Panel */}
          <section className="practice-configurator dashboard-card">
            <div className="configurator-heading">
              <h2>Customize Your Practice Session</h2>
              <p>Configure Unit, Question Count, and Session Timer to start targeted preparation.</p>
            </div>

            <div className="configurator-controls-grid">
              {/* Unit Selector */}
              <div className="config-group">
                <label>CHOOSE UNIT:</label>
                <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
                  <option value="All">All Units (Unit I to V)</option>
                  <option value="1">Unit I — Web Basics, HTML & CSS</option>
                  <option value="2">Unit II — Client-Side JavaScript</option>
                  <option value="3">Unit III — Server-Side PHP & Bootstrap</option>
                  <option value="4">Unit IV — ReactJS Basics & Architecture</option>
                  <option value="5">Unit V — React Dataflow, Hooks & Routing</option>
                </select>
              </div>

              {/* Question Count Selector */}
              <div className="config-group">
                <label>QUESTIONS COUNT:</label>
                <div className="pill-selector">
                  {[5, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      className={`pill-btn ${selectedCount === cnt ? 'active' : ''}`}
                      onClick={() => setSelectedCount(cnt)}
                    >
                      {cnt} Questions
                    </button>
                  ))}
                </div>
              </div>

              {/* Timer Selector */}
              <div className="config-group">
                <label>SESSION TIMER:</label>
                <div className="pill-selector">
                  {[
                    [0, 'No Timer'],
                    [180, '3 Mins'],
                    [300, '5 Mins'],
                    [600, '10 Mins'],
                    ['custom', 'Custom']
                  ].map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      className={`pill-btn ${timerMode === val ? 'active' : ''}`}
                      onClick={() => setTimerMode(val)}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
                {timerMode === 'custom' && (
                  <div className="custom-timer-input">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={customTimerMinutes}
                      onChange={(e) => setCustomTimerMinutes(Math.max(1, Number(e.target.value)))}
                    />
                    <span>Minutes</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              className="button button-primary start-session-btn"
              onClick={() => startWebPractice()}
              disabled={isStarting}
            >
              {isStarting ? 'Starting Session...' : 'Start Practice Session →'}
            </button>
          </section>

          {/* Web Programming Syllabus Cards Grid */}
          <div className="dashboard-section-heading" style={{ marginTop: '2.5rem' }}>
            <div>
              <p className="eyebrow"><span className="eyebrow-rule" />SYLLABUS UNITS</p>
              <h2>Web Programming Units</h2>
            </div>
          </div>

          <div className="web-prog-units-grid">
            {UNITS.map((u) => (
              <article className="dashboard-card unit-card-item" key={u.number}>
                <div className="unit-card-header">
                  <span className="unit-badge">UNIT {u.number}</span>
                  <span className="unit-count-tag">15 MCQs</span>
                </div>
                <h3 className="unit-card-title">{u.name}</h3>
                <p className="unit-card-desc">{u.desc}</p>
                <button
                  type="button"
                  className="button button-secondary button-small unit-start-btn"
                  onClick={() => { setSelectedUnit(u.number); startWebPractice(u.number); }}
                >
                  Practice Unit {u.number} →
                </button>
              </article>
            ))}
          </div>
        </>
      )}

      {/* ========================================================
          PERSONALIZED PRACTICE TAB (Weak Topics Fallback)
         ======================================================== */}
      {activeTab === 'weak_topics' && (
        <div className="personalized-practice-section">
          {isLoadingWeak && <p role="status">Loading personalized practice...</p>}

          {!isLoadingWeak && weakQuestions.length === 0 && (
            <section className="dashboard-card practice-empty-state-card">
              <div className="empty-state-content">
                <span className="empty-state-badge">ASSESSMENT STATUS</span>
                <h2>Personalized practice will appear after you complete assessments</h2>
                <p>{weakMessage || 'Complete your first exam to automatically generate targeted practice questions.'}</p>
              </div>

              <div className="empty-fallback-units">
                <h3>Or Start Practice by Web Programming Syllabus:</h3>
                <div className="units-quick-list">
                  {UNITS.map((u) => (
                    <button
                      key={u.number}
                      type="button"
                      className="button button-quiet"
                      onClick={() => { setActiveTab('web_programming'); setSelectedUnit(u.number); startWebPractice(u.number); }}
                    >
                      {u.name} →
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {!isLoadingWeak && weakQuestions.length > 0 && !weakResult && (
            <form className="practice-question-list" onSubmit={submitWeakPractice}>
              <div className="dashboard-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                <h2>Personalized Weak Topics Practice</h2>
                <p>Questions selected based on your recent exam performance.</p>
              </div>

              {weakQuestions.map((question, index) => (
                <section className="exam-question-panel dashboard-card" key={question.question_id}>
                  <div className="question-progress">
                    <span>Question {index + 1} of {weakQuestions.length}</span>
                    <span>{question.topic} · {question.difficulty}</span>
                  </div>
                  <h2>{question.question_text}</h2>
                  <div className="exam-answer-list">
                    {question.options.map((option) => (
                      <label
                        className={`exam-answer ${weakAnswers[question.question_id] === option.option_label ? 'exam-answer-selected' : ''}`}
                        key={option.option_label}
                      >
                        <input
                          type="radio"
                          name={`weak-${question.question_id}`}
                          value={option.option_label}
                          checked={weakAnswers[question.question_id] === option.option_label}
                          onChange={() => setWeakAnswers((prev) => ({ ...prev, [question.question_id]: option.option_label }))}
                        />
                        <span className="answer-label">{option.option_label}</span>
                        <span>{option.option_text}</span>
                      </label>
                    ))}
                  </div>
                </section>
              ))}

              <button className="button button-primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Evaluating...' : 'Submit Weak Topics Practice'}
              </button>
            </form>
          )}

          {weakResult && (
            <section className="result-panel dashboard-card practice-result-view">
              <div className="result-header">
                <span className="eyebrow">PRACTICE COMPLETED</span>
                <h2>{weakResult.topic ? `${weakResult.topic} Practice Result` : 'Personalized Practice Result'}</h2>
              </div>

              <div className="result-score-overview">
                <div className="score-big-circle">
                  <strong>{Number(weakResult.percentage).toFixed(2)}%</strong>
                  <span>Accuracy</span>
                </div>
                <div className="score-stat-breakdown">
                  <div className="stat-pill stat-correct">
                    <span>Correct</span>
                    <strong>{weakResult.correct_answers}</strong>
                  </div>
                  <div className="stat-pill stat-wrong">
                    <span>Incorrect</span>
                    <strong>{weakResult.wrong_answers}</strong>
                  </div>
                  <div className="stat-pill">
                    <span>Total Questions</span>
                    <strong>{weakResult.total_questions}</strong>
                  </div>
                </div>
              </div>

              <div className="dashboard-card" style={{ marginTop: '1.5rem', padding: '1.25rem', borderLeft: '4px solid #6366f1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Topic Improvement Status</h3>
                  <span
                    className="coding-difficulty"
                    style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      backgroundColor: weakResult.improvement_status === 'Improved' ? '#dcfce7' : weakResult.improvement_status === 'Needs more practice' ? '#fee2e2' : '#fef3c7',
                      color: weakResult.improvement_status === 'Improved' ? '#15803d' : weakResult.improvement_status === 'Needs more practice' ? '#b91c1c' : '#b45309'
                    }}
                  >
                    {weakResult.improvement_status}
                  </span>
                </div>

                {weakResult.previous_percentage !== null && (
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Comparison: Previous accuracy <strong>{weakResult.previous_percentage}%</strong> → Practice accuracy <strong>{weakResult.latest_percentage}%</strong>
                  </p>
                )}

                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                  <strong>Updated Recommendation:</strong> "{weakResult.recommendation}"
                </p>
              </div>

              <div className="result-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => { setWeakResult(null); setWeakAnswers({}); loadWeakTopics(); }}
                >
                  Practice Again ↻
                </button>
                <Link to="/student/recommendations" className="button button-secondary">
                  View All Recommendations →
                </Link>
                <button type="button" className="button button-quiet" onClick={() => setWeakResult(null)}>
                  Back to Practice
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      {/* ========================================================
          PRACTICE HISTORY TAB
         ======================================================== */}
      {activeTab === 'history' && (
        <section className="dashboard-card practice-history-section">
          <h2>Web Programming Practice History</h2>
          <p>Review your completed practice sessions and scores.</p>

          {isLoadingHistory && <p role="status">Loading history...</p>}

          {!isLoadingHistory && history.length === 0 && (
            <p className="exam-empty-state">No Web Programming practice history recorded yet. Complete a session above!</p>
          )}

          {!isLoadingHistory && history.length > 0 && (
            <div className="coding-table-wrap">
              <table className="analytics-table coding-history-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Unit / Module</th>
                    <th>Score</th>
                    <th>Questions</th>
                    <th>Time Used</th>
                    <th>Date Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.attempt_id}>
                      <td><strong>Web Programming</strong></td>
                      <td>{h.unit_name}</td>
                      <td><strong>{h.score}%</strong></td>
                      <td>{h.correct_answers} / {h.total_questions}</td>
                      <td>{h.time_taken_seconds > 0 ? formatTime(h.time_taken_seconds) : 'Untimed'}</td>
                      <td>{h.completed_at ? new Date(h.completed_at).toLocaleString() : 'Recently'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default PracticeQuiz;