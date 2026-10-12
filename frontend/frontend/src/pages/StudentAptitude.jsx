import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { apiFetch } from '../utils/api';
import { getToken } from '../utils/auth';
import '../App.css';
import './Aptitude.css';

const categoryMarks = {
  'Quantitative Aptitude': '01',
  'Logical Reasoning': '02',
  'Verbal Ability': '03'
};
const EMPTY_CATEGORIES = { categories: [] };
const EMPTY_ATTEMPTS = { attempts: [] };
const EMPTY_PERFORMANCE = { summary: {}, topics: [] };
const EMPTY_TOPICS = { topics: [] };
const EMPTY_NOTES = { notes: [] };
const EMPTY_QUESTIONS = { questions: [] };
const AI_QUIZ_QUESTION_COUNT = 5;
const QUIZ_TIMER_STORAGE_PREFIX = 'examforge_aptitude_quiz_timer_';

function formatQuizTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function useRemoteData(path, initialValue) {
  const [request, setRequest] = useState({ path: null, data: initialValue, error: '' });

  useEffect(() => {
    let active = true;
    apiFetch(path)
      .then((response) => {
        if (active) setRequest({ path, data: response, error: '' });
      })
      .catch((loadError) => {
        if (active) setRequest({ path, data: initialValue, error: loadError.message || 'Unable to load aptitude data.' });
      });
    return () => { active = false; };
  }, [path, initialValue]);

  return {
    data: request.path === path ? request.data : initialValue,
    error: request.path === path ? request.error : '',
    loading: request.path !== path
  };
}

function PageHeading({ eyebrow = 'APTITUDE PREPARATION', title, description, backTo = '/student/aptitude' }) {
  return (
    <div className="aptitude-heading">
      <div>
        <p className="eyebrow"><span className="eyebrow-rule" />{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {backTo && <Link to={backTo} className="aptitude-back-link">Aptitude home</Link>}
    </div>
  );
}

function LoadingMessage({ children = 'Loading aptitude preparation...' }) {
  return <p className="aptitude-message" role="status">{children}</p>;
}

function ErrorMessage({ children }) {
  return <p className="form-error aptitude-error" role="alert">{children}</p>;
}

function DifficultyBadge({ difficulty }) {
  const className = { Easy: 'easy', Medium: 'medium', Hard: 'hard' }[difficulty];
  return className ? <span className={`aptitude-difficulty aptitude-difficulty-${className}`}>{difficulty}</span> : null;
}

function relativeAttemptDate(value) {
  const days = Math.floor(Math.max(0, Date.now() - new Date(value).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function AptitudeHome() {
  const categoriesState = useRemoteData('/api/student/aptitude/categories', EMPTY_CATEGORIES);
  const topicsState = useRemoteData('/api/student/aptitude/topics', EMPTY_TOPICS);
  const historyState = useRemoteData('/api/student/aptitude/history', EMPTY_ATTEMPTS);
  const performanceState = useRemoteData('/api/student/aptitude/performance', EMPTY_PERFORMANCE);
  const categories = categoriesState.data.categories || [];
  const attempts = historyState.data.attempts || [];
  const summary = performanceState.data.summary || {};
  const allTopics = topicsState.data.topics || [];
  const weakTopics = (performanceState.data.topics || []).filter((item) => Number(item.quizzes_completed) > 0 && Number(item.accuracy) < 80).slice(0, 3);
  const beginnerTopics = allTopics.filter((item) => item.difficulty === 'Easy').slice(0, 3);
  const hasCompletedAttempts = attempts.length > 0;
  const recentAttempts = [...attempts].sort((left, right) => new Date(right.completed_at) - new Date(left.completed_at)).slice(0, 3);

  return (
    <main className="aptitude-page page-container">
      <PageHeading
        title="Aptitude Preparation"
        description="Prepare for placement aptitude through structured learning, practice and analysis."
        backTo={null}
      />
      {categoriesState.error && <ErrorMessage>{categoriesState.error}</ErrorMessage>}
      {categoriesState.loading ? <LoadingMessage /> : (
        <section className="aptitude-category-grid" aria-label="Aptitude categories">
          {categories.map((category) => (
            <article className="aptitude-category-card" key={category.category_id}>
              <span className="aptitude-category-mark" aria-hidden="true">
                {categoryMarks[category.name] || 'EF'}
              </span>
              <div>
                <h2>{category.name}</h2>
                <p>{category.description}</p>
              </div>
              <div className="aptitude-card-footer">
                <span>{category.topic_count} topics</span>
                <Link to={`/student/aptitude/${category.category_id}`} className="dashboard-action">Explore</Link>
              </div>
            </article>
          ))}
          {!categories.length && !categoriesState.error && (
            <p className="aptitude-empty">Categories will appear here once the aptitude catalog is available.</p>
          )}
        </section>
      )}

      <section className="aptitude-section">
        <div className="aptitude-section-title"><div><p className="eyebrow"><span className="eyebrow-rule" />TOPIC PREPARATION LEVEL</p><h2>Explore Topics</h2></div></div>
        {topicsState.loading ? <LoadingMessage>Loading aptitude topics...</LoadingMessage> : (
          <div className="aptitude-topic-directory">
            {categories.map((category) => <section className="aptitude-topic-directory-group" key={category.category_id}>
              <h3>{category.name}</h3>
              <div>{allTopics.filter((topic) => Number(topic.category_id) === Number(category.category_id)).map((topic) => (
                <Link className="aptitude-topic-directory-row" to={`/student/aptitude/topic/${topic.topic_id}/notes`} key={topic.topic_id}>
                  <span>{topic.name}</span><DifficultyBadge difficulty={topic.difficulty} />
                </Link>
              ))}</div>
            </section>)}
          </div>
        )}
      </section>

      <section className="aptitude-section">
        <div className="aptitude-section-title">
          <div><p className="eyebrow"><span className="eyebrow-rule" />YOUR RECENT PRACTICE</p><h2>Recent Activity</h2></div>
          <Link to="/student/aptitude/history" className="aptitude-text-link">View history</Link>
        </div>
        {historyState.loading ? <LoadingMessage>Loading recent activity...</LoadingMessage> : recentAttempts.length ? (
          <div className="aptitude-recent-list">
            {recentAttempts.map((attempt) => (
              <Link className="aptitude-recent-row" to={attempt.source === 'practice' ? `/student/aptitude/practice/result/${attempt.attempt_id}` : `/student/aptitude/result/${attempt.attempt_id}`} key={`${attempt.source || 'ai'}-${attempt.attempt_id}`}>
                <span className="aptitude-recent-mark">{(attempt.topic || 'A').slice(0, 1)}</span>
                <span className="aptitude-recent-copy"><strong>{attempt.topic}</strong><small>{attempt.source === 'practice' ? 'Default Practice' : 'AI Quiz'} · {attempt.difficulty || attempt.difficulty_mode} · {attempt.total_questions} questions · {relativeAttemptDate(attempt.completed_at)}</small></span>
                <strong className="aptitude-recent-score">{Math.round(Number(attempt.score))}%</strong>
              </Link>
            ))}
          </div>
        ) : (
          <div className="aptitude-empty-panel"><strong>Your quiz activity will appear here after you complete your first quiz.</strong></div>
        )}
      </section>

      <section className="aptitude-section">
        <div className="aptitude-section-title"><div><p className="eyebrow"><span className="eyebrow-rule" />PERSONALIZED PRACTICE</p><h2>{hasCompletedAttempts ? 'Recommended Topics' : 'Start Your Aptitude Preparation'}</h2></div></div>
        {performanceState.loading || topicsState.loading ? <LoadingMessage>Loading recommendations...</LoadingMessage> : (
          <div className="aptitude-recommendation-grid">
            {(hasCompletedAttempts ? weakTopics : beginnerTopics).map((item) => {
              const topic = allTopics.find((entry) => Number(entry.topic_id) === Number(item.topic_id)) || item;
              return <article className="aptitude-recommendation-card" key={item.topic_id}>
                <div className="aptitude-recommendation-card-heading"><h3>{item.topic}</h3><DifficultyBadge difficulty={topic.difficulty} /></div>
                <p>{hasCompletedAttempts ? `Accuracy: ${Math.round(Number(item.accuracy))}% · ${Number(item.accuracy) < 60 ? 'Weak' : 'Needs Improvement'}` : 'Beginner-friendly topic to start with.'}</p>
                <div className="aptitude-card-actions"><Link className="exam-secondary-action" to={`/student/aptitude/topic/${item.topic_id}/notes`}>{hasCompletedAttempts ? 'Revise Notes' : 'Start Learning'}</Link><Link className="dashboard-action" to={`/student/aptitude/topic/${item.topic_id}/practice`}>Practice</Link></div>
              </article>;
            })}
            {hasCompletedAttempts && !weakTopics.length && <div className="aptitude-empty-panel"><strong>No weak topics identified yet.</strong><span>Your completed aptitude results are at or above 80%.</span></div>}
            {!hasCompletedAttempts && !beginnerTopics.length && <p className="aptitude-empty">Beginner topics are not available.</p>}
          </div>
        )}
      </section>

      <section className="aptitude-section">
        <div className="aptitude-section-title">
          <div><p className="eyebrow"><span className="eyebrow-rule" />A LITTLE PROGRESS ADDS UP</p><h2>Your Aptitude Progress</h2></div>
          <Link to="/student/aptitude/performance" className="aptitude-text-link">Full performance</Link>
        </div>
        {performanceState.loading ? <LoadingMessage>Loading progress...</LoadingMessage> : (
          <div className="aptitude-stat-grid">
            <ProgressStat label="Quizzes completed" value={summary.quizzes_completed || 0} />
            <ProgressStat label="Average score" value={`${Math.round(Number(summary.average_score) || 0)}%`} />
            <ProgressStat label="Questions solved" value={summary.questions_solved || 0} />
            <ProgressStat label="Strong topics" value={summary.strong_topics || 0} />
            <ProgressStat label="Weak topics" value={summary.weak_topics || 0} />
          </div>
        )}
        {performanceState.error && <ErrorMessage>{performanceState.error}</ErrorMessage>}
      </section>
    </main>
  );
}

function ProgressStat({ label, value }) {
  return <article className="aptitude-stat"><span>{label}</span><strong>{value}</strong></article>;
}

function CategoryTopics() {
  const { categoryId } = useParams();
  const { data, error, loading } = useRemoteData(`/api/student/aptitude/topics/${categoryId}`, EMPTY_TOPICS);
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const category = data.category || {};
  const filteredTopics = (data.topics || []).filter((topic) => difficultyFilter === 'All' || topic.difficulty === difficultyFilter);

  return (
    <main className="aptitude-page page-container">
      <PageHeading title={category.name || 'Aptitude Topics'} description={category.description} />
      {loading && <LoadingMessage>Loading topics...</LoadingMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!loading && !error && (
        <>
        <div className="aptitude-filter-group" role="group" aria-label="Filter topics by difficulty">
          {['All', 'Easy', 'Medium', 'Hard'].map((difficulty) => <button className={difficultyFilter === difficulty ? 'is-selected' : ''} type="button" key={difficulty} onClick={() => setDifficultyFilter(difficulty)}>{difficulty}</button>)}
        </div>
        <div className="aptitude-topic-grid">
          {filteredTopics.map((topic, index) => (
            <article className="aptitude-topic-card" key={topic.topic_id}>
              <span className="aptitude-topic-number">{String(index + 1).padStart(2, '0')}</span>
              <div className="aptitude-topic-heading"><h2>{topic.name}</h2><DifficultyBadge difficulty={topic.difficulty} /></div>
              <p>{topic.description}</p>
              <div className="aptitude-topic-actions"><Link className="exam-secondary-action" to={`/student/aptitude/topic/${topic.topic_id}/notes`}>Read Notes</Link><Link className="exam-secondary-action" to={`/student/aptitude/topic/${topic.topic_id}/practice`}>Practice</Link><Link className="dashboard-action" to={`/student/aptitude/topic/${topic.topic_id}/quiz`}>AI Quiz</Link></div>
            </article>
          ))}
          {!filteredTopics.length && <p className="aptitude-empty">No topics match this difficulty.</p>}
        </div>
        </>
      )}
    </main>
  );
}

function TopicNotes() {
  const { topicId } = useParams();
  const { data, error, loading } = useRemoteData(`/api/student/aptitude/topics/${topicId}/notes`, EMPTY_NOTES);
  const topic = data.topic || {};
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const downloadNotes = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/aptitude/topics/${topicId}/notes/pdf`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!response.ok) throw new Error('Unable to download these notes.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `${topic.name} - Aptitude Notes.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (failure) {
      setDownloadError(failure.message);
    } finally {
      setDownloading(false);
    }
  };
  const noteActions = (
    <div className="aptitude-notes-quiz-cta">
      <button className="exam-secondary-action" type="button" disabled={downloading} onClick={downloadNotes}>{downloading ? 'Preparing PDF...' : 'Download Notes'}</button>
      <Link className="dashboard-action aptitude-start-quiz" to={`/student/aptitude/topic/${topicId}/quiz`}>Start AI Quiz</Link>
    </div>
  );

  return (
    <main className="aptitude-page page-container">
      <PageHeading title={topic.name || 'Topic Notes'} description={topic.description} />
      {loading && <LoadingMessage>Loading learning notes...</LoadingMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!loading && !error && (
        <>
          <p className="aptitude-breadcrumb">{topic.category_name} <span>/</span> {topic.name}</p>
          <div className="aptitude-topic-detail-difficulty"><DifficultyBadge difficulty={topic.difficulty} /><span>Preparation level</span></div>
          {noteActions}
          {downloadError && <ErrorMessage>{downloadError}</ErrorMessage>}
          <div className="aptitude-notes-list">
            {data.notes.map((note) => (
              <article className="aptitude-note" key={note.note_id}>
                <h2>{note.title}</h2>
                <div className="aptitude-note-content">
                    <ReactMarkdown>{note.content}</ReactMarkdown>
                </div>
              </article>
            ))}
            {!data.notes.length && (
              <div className="aptitude-empty-panel"><strong>Notes are being prepared.</strong><span>You can still test your understanding with a generated quiz.</span></div>
            )}
          </div>
          {noteActions}
        </>
      )}
    </main>
  );
}

function QuizPage() {
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attemptId');
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [difficulty, setDifficulty] = useState('Medium');
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadedAttemptId, setLoadedAttemptId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timerMode, setTimerMode] = useState('none');
  const [customMinutes, setCustomMinutes] = useState('5');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);
  const [autoSubmitFailed, setAutoSubmitFailed] = useState(false);
  const submissionStartedRef = useRef(false);
  const autoSubmitTriggeredRef = useRef(false);
  const timerEndAtRef = useRef(null);
  const submitQuizRef = useRef(null);

  useEffect(() => {
    let active = true;
    apiFetch(`/api/student/aptitude/topics/${topicId}/notes`)
      .then((response) => { if (active) setTopic(response.topic); })
      .catch((loadError) => { if (active) setError(loadError.message); });
    return () => { active = false; };
  }, [topicId]);

  useEffect(() => {
    if (!attemptId) return undefined;
    let active = true;
    apiFetch(`/api/student/aptitude/quiz/${attemptId}`)
      .then((response) => {
        if (!active) return;
        setQuiz({ attempt_id: response.attempt.attempt_id, difficulty: response.attempt.difficulty, questions: response.questions });
        setDifficulty(response.attempt.difficulty);
        setAnswers(Object.fromEntries(response.questions.filter((question) => question.selected_option)
          .map((question) => [question.question_id, question.selected_option])));
        if (response.attempt.completed_at) {
          sessionStorage.removeItem(`${QUIZ_TIMER_STORAGE_PREFIX}${attemptId}`);
          setQuizStarted(false);
        } else {
          const savedTimer = (() => {
            try {
              return JSON.parse(sessionStorage.getItem(`${QUIZ_TIMER_STORAGE_PREFIX}${attemptId}`) || 'null');
            } catch {
              return null;
            }
          })();
          if (savedTimer?.mode && savedTimer.mode !== 'none' && Number.isFinite(savedTimer.endAt)) {
            const remaining = Math.max(0, Math.ceil((savedTimer.endAt - Date.now()) / 1000));
            setTimerMode(savedTimer.mode);
            setTimeRemaining(remaining);
            timerEndAtRef.current = savedTimer.endAt;
            setQuizStarted(true);
            setTimerExpired(remaining === 0);
          } else {
            setTimerMode('none');
            setTimeRemaining(null);
            timerEndAtRef.current = null;
            setQuizStarted(true);
          }
        }
      })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoadedAttemptId(attemptId); });
    return () => { active = false; };
  }, [attemptId]);

  const generateQuiz = async (event) => {
    event.preventDefault();
    const durationSeconds = timerMode === 'none'
      ? 0
      : timerMode === 'custom'
        ? Number(customMinutes) * 60
        : Number(timerMode) * 60;
    if (timerMode === 'custom' && (!/^\d+$/.test(customMinutes) || durationSeconds < 60 || durationSeconds > 3600)) {
      setError('Please enter a duration between 1 and 60 minutes.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch('/api/student/aptitude/quiz/generate', {
        method: 'POST',
        body: JSON.stringify({ topic_id: Number(topicId), difficulty, total_questions: AI_QUIZ_QUESTION_COUNT })
      });
      const startedAt = Date.now();
      const endAt = durationSeconds ? startedAt + durationSeconds * 1000 : null;
      const savedTimer = {
        attemptId: response.attempt_id,
        mode: timerMode,
        durationSeconds,
        startedAt,
        endAt
      };
      try {
        sessionStorage.setItem(`${QUIZ_TIMER_STORAGE_PREFIX}${response.attempt_id}`, JSON.stringify(savedTimer));
      } catch {
        // The timer still works for this page session if storage is unavailable.
      }
      setQuiz(response);
      setAnswers({});
      setQuestionIndex(0);
      setTimeRemaining(durationSeconds || null);
      timerEndAtRef.current = endAt;
      setTimerExpired(false);
      setAutoSubmitFailed(false);
      autoSubmitTriggeredRef.current = false;
      submissionStartedRef.current = false;
      setQuizStarted(true);
      navigate(`/student/aptitude/topic/${topicId}/quiz?attemptId=${response.attempt_id}`, { replace: true });
    } catch (generateError) {
      setError(generateError.status >= 500
        ? 'Unable to generate the quiz right now. Please try again.'
        : generateError.message || 'Unable to generate the quiz right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = useCallback(async ({ automatic = false } = {}) => {
    if (!quiz || submissionStartedRef.current || submitting) return;
    if (!automatic && Object.keys(answers).length !== quiz.questions.length) return;
    submissionStartedRef.current = true;
    setSubmitting(true);
    setQuizStarted(false);
    setError('');
    try {
      await apiFetch(`/api/student/aptitude/quiz/${quiz.attempt_id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          ...(automatic ? { timed_out: true } : {}),
          answers: quiz.questions.map((question) => ({
            question_id: question.question_id,
            selected_option: answers[question.question_id] || null
          }))
        })
      });
      sessionStorage.removeItem(`${QUIZ_TIMER_STORAGE_PREFIX}${quiz.attempt_id}`);
      timerEndAtRef.current = null;
      navigate(`/student/aptitude/result/${quiz.attempt_id}`);
    } catch (submitError) {
      submissionStartedRef.current = false;
      setError(submitError.message || 'Unable to submit the quiz. Please try again.');
      if (automatic) {
        setAutoSubmitFailed(true);
        setTimerExpired(true);
      } else if (timerEndAtRef.current && timerEndAtRef.current > Date.now()) {
        setQuizStarted(true);
      }
    } finally {
      setSubmitting(false);
    }
  }, [answers, navigate, quiz, submitting]);
  useEffect(() => {
    submitQuizRef.current = submitQuiz;
  }, [submitQuiz]);

  useEffect(() => {
    if (!quizStarted || timerMode === 'none' || submitting || !quiz || !attemptId ||
      loadedAttemptId !== attemptId || !timerEndAtRef.current) return undefined;

    const updateRemainingTime = () => {
      const remaining = Math.max(0, Math.ceil((timerEndAtRef.current - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining === 0 && !autoSubmitTriggeredRef.current) {
        autoSubmitTriggeredRef.current = true;
        setTimerExpired(true);
        void submitQuizRef.current?.({ automatic: true });
      }
    };

    updateRemainingTime();
    const intervalId = setInterval(updateRemainingTime, 1000);
    return () => clearInterval(intervalId);
  }, [attemptId, loadedAttemptId, quiz, quizStarted, submitting, timerMode]);

  useEffect(() => () => {
    timerEndAtRef.current = null;
  }, []);

  const activeQuestion = quiz?.questions[questionIndex];
  const isLoading = loading || Boolean(attemptId && loadedAttemptId !== attemptId);
  return (
    <main className="aptitude-page page-container">
      <PageHeading title={topic?.name || 'Aptitude Quiz'} description="AI-generated placement quiz" />
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {isLoading && <LoadingMessage>{quiz ? 'Loading your quiz...' : 'Generating your personalized aptitude quiz...'}</LoadingMessage>}
      {!isLoading && !quiz && (
        <form className="aptitude-quiz-setup" noValidate onSubmit={generateQuiz}>
          <h2 className="aptitude-quiz-setup-title">Quiz Setup</h2>
          <p className="aptitude-setup-topic"><span>TOPIC</span><strong>{topic?.name || 'Loading topic...'}</strong></p>
          <fieldset>
            <legend>Difficulty</legend>
            <div className="aptitude-choice-group">
              {['Easy', 'Medium', 'Hard'].map((level) => (
                <button className={difficulty === level ? 'is-selected' : ''} type="button" key={level} onClick={() => setDifficulty(level)}>{level}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Number of Questions</legend>
            <div className="aptitude-question-count-wrap">
              <output className="aptitude-question-count" aria-label="Number of questions">{AI_QUIZ_QUESTION_COUNT}</output>
              <small>Currently generating 5-question focused quizzes.</small>
            </div>
          </fieldset>
          <fieldset>
            <legend>Choose Timer</legend>
            <div className="aptitude-timer-options">
              {[['none', 'No Timer'], ['3', '3 Minutes'], ['5', '5 Minutes'], ['10', '10 Minutes'], ['custom', 'Custom']].map(([value, label]) => (
                <label className={timerMode === value ? 'is-selected' : ''} key={value}>
                  <input type="radio" name="quiz-timer" value={value} checked={timerMode === value} onChange={() => setTimerMode(value)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {timerMode === 'custom' && (
              <label className="aptitude-custom-timer">
                <span>Custom Duration</span>
                <span className="aptitude-custom-timer-input">
                  <input type="number" min="1" max="60" step="1" value={customMinutes} onChange={(event) => setCustomMinutes(event.target.value)} />
                  <span>minutes</span>
                </span>
              </label>
            )}
          </fieldset>
          <button className="dashboard-action" type="submit" disabled={!topic || isLoading}>Start Quiz</button>
        </form>
      )}
      {!isLoading && quiz && activeQuestion && (
        <section className="aptitude-live-quiz">
          <div className="aptitude-quiz-meta"><strong>{topic?.name || quiz.topic}</strong><span>{quiz.difficulty}</span></div>
          {timerMode !== 'none' && timeRemaining !== null && (
            <div className={`aptitude-quiz-timer${timeRemaining < 60 ? ' is-warning' : ''}${timeRemaining < 30 ? ' is-critical' : ''}`} role="timer" aria-live="off">
              <span>Time Remaining</span><strong>{formatQuizTime(timeRemaining)}</strong>
            </div>
          )}
          {timerExpired && autoSubmitFailed && (
            <div className="aptitude-timer-expired" role="alert">
              <span>Time expired. Automatic submission could not be completed.</span>
              <button className="dashboard-action" type="button" disabled={submitting} onClick={() => submitQuiz({ automatic: true })}>
                {submitting ? 'Submitting...' : 'Retry Submission'}
              </button>
            </div>
          )}
          <div className="aptitude-question-status">
            <span>Question {questionIndex + 1} of {quiz.questions.length}</span>
            <span>{Object.keys(answers).length} answered</span>
          </div>
          <div className="aptitude-progress-track" aria-label="Quiz progress">
            <span style={{ width: `${((questionIndex + 1) / quiz.questions.length) * 100}%` }} />
          </div>
          <h2 className="aptitude-question-text">{activeQuestion.question}</h2>
          <div className="aptitude-answer-list">
            {Object.entries(activeQuestion.options).map(([option, value]) => (
              <button
                className={`aptitude-answer${answers[activeQuestion.question_id] === option ? ' is-selected' : ''}`}
                type="button"
                key={option}
                disabled={submitting || timerExpired}
                onClick={() => setAnswers((previous) => ({ ...previous, [activeQuestion.question_id]: option }))}
              >
                <span>{option}</span><strong>{value}</strong>
              </button>
            ))}
          </div>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <div className="aptitude-quiz-controls">
            <button className="exam-secondary-action" type="button" disabled={questionIndex === 0 || submitting || timerExpired} onClick={() => setQuestionIndex((index) => index - 1)}>Previous</button>
            {questionIndex < quiz.questions.length - 1 ? (
              <button className="dashboard-action" type="button" disabled={submitting || timerExpired} onClick={() => setQuestionIndex((index) => index + 1)}>Next</button>
            ) : (
              <button className="dashboard-action" type="button" disabled={submitting || timerExpired || Object.keys(answers).length !== quiz.questions.length} onClick={() => submitQuiz()}>
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            )}
          </div>
          {!timerExpired && Object.keys(answers).length !== quiz.questions.length && <small className="aptitude-answer-hint">Answer every question to submit.</small>}
        </section>
      )}
    </main>
  );
}

function QuizResult() {
  const { attemptId } = useParams();
  const { data, error, loading } = useRemoteData(`/api/student/aptitude/quiz/${attemptId}/result`, EMPTY_QUESTIONS);
  if (loading) return <main className="aptitude-page page-container"><LoadingMessage>Loading your result...</LoadingMessage></main>;
  if (error) return <main className="aptitude-page page-container"><ErrorMessage>{error}</ErrorMessage></main>;

  const score = Number(data.score) || 0;
  const classification = score >= 80 ? 'Strong' : score >= 60 ? 'Needs Improvement' : 'Weak';
  return (
    <main className="aptitude-page page-container">
      <PageHeading title="Aptitude Quiz Complete" description={`${data.topic} · ${data.difficulty}`} />
      <section className="aptitude-result-summary">
        <div className="aptitude-result-score"><strong>{Number(data.correct_answers)}/{Number(data.total_questions)}</strong><span>Correct answers</span></div>
        <div className="aptitude-result-meter"><strong>{Math.round(score)}%</strong><span>Accuracy</span></div>
        <div className="aptitude-result-counts"><span><b>{data.correct_answers}</b> correct</span><span><b>{data.total_questions - data.correct_answers}</b> wrong</span></div>
        <span className={`aptitude-classification aptitude-classification-${classification.toLowerCase().replaceAll(' ', '-')}`}>{classification}</span>
      </section>
      <section className="aptitude-section">
        <div className="aptitude-section-title"><div><p className="eyebrow"><span className="eyebrow-rule" />REVIEW AND IMPROVE</p><h2>Question explanations</h2></div></div>
        <div className="aptitude-review-list">
          {data.questions.map((question, index) => (
            <article className={`aptitude-review${question.is_correct ? ' is-correct' : ' is-wrong'}`} key={question.question_id}>
              <div className="aptitude-review-heading"><span>Question {index + 1}</span><strong>{question.is_correct ? 'Correct' : 'Review this one'}</strong></div>
              <h3>{question.question}</h3>
              <p>Your answer: <b>{question.selected_option ? `${question.selected_option}. ${question.options[question.selected_option]}` : 'Not answered'}</b></p>
              <p>Correct answer: <b>{question.correct_option}. {question.options[question.correct_option]}</b></p>
              <p className="aptitude-explanation">{question.explanation}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="aptitude-result-actions">
        <Link className="dashboard-action" to={`/student/aptitude/topic/${data.topic_id}/quiz`}>Practice Again</Link>
        <Link className="exam-secondary-action" to={`/student/aptitude/topic/${data.topic_id}/notes`}>Read Notes</Link>
        <Link className="exam-secondary-action" to="/student/aptitude">Back to Aptitude</Link>
      </div>
    </main>
  );
}

function AptitudeHistory() {
  const { data, error, loading } = useRemoteData('/api/student/aptitude/history', EMPTY_ATTEMPTS);
  return (
    <main className="aptitude-page page-container">
      <PageHeading title="Quiz History" description="Review your completed aptitude practice." />
      {loading && <LoadingMessage>Loading quiz history...</LoadingMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!loading && !error && (data.attempts.length ? (
        <div className="aptitude-history-table-wrap">
          <table className="aptitude-history-table">
            <thead><tr><th>Topic</th><th>Source</th><th>Difficulty</th><th>Questions</th><th>Score</th><th>Accuracy</th><th>Date</th><th /></tr></thead>
            <tbody>{data.attempts.map((attempt) => (
              <tr key={attempt.attempt_id}>
                <td><strong>{attempt.topic}</strong><small>{attempt.category}</small></td>
                <td>{attempt.source === 'practice' ? 'Default Practice' : 'AI Quiz'}</td>
                <td>{attempt.difficulty}</td>
                <td>{attempt.total_questions}</td>
                <td>{attempt.correct_answers}/{attempt.total_questions}</td>
                <td><span className="aptitude-table-score">{Math.round(Number(attempt.score))}%</span></td>
                <td>{new Date(attempt.completed_at).toLocaleDateString()}</td>
                <td><Link to={attempt.source === 'practice' ? `/student/aptitude/practice/result/${attempt.attempt_id}` : `/student/aptitude/result/${attempt.attempt_id}`}>Review</Link></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <div className="aptitude-empty-panel"><strong>No completed quizzes yet.</strong><span>Your aptitude attempts will appear here.</span></div>)}
    </main>
  );
}

function AptitudePerformance() {
  const { data, error, loading } = useRemoteData('/api/student/aptitude/performance', EMPTY_PERFORMANCE);
  const summary = data.summary || {};
  return (
    <main className="aptitude-page page-container">
      <PageHeading title="Aptitude Performance" description="A clear view of your placement preparation progress." />
      {loading && <LoadingMessage>Loading aptitude performance...</LoadingMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!loading && !error && (
        <>
          <div className="aptitude-stat-grid aptitude-performance-stats">
            <ProgressStat label="Average score" value={`${Math.round(Number(summary.average_score) || 0)}%`} />
            <ProgressStat label="Quizzes completed" value={summary.quizzes_completed || 0} />
            <ProgressStat label="Questions solved" value={summary.questions_solved || 0} />
          </div>
          {data.topics.length ? (
            <section className="aptitude-section">
              <div className="aptitude-section-title"><div><p className="eyebrow"><span className="eyebrow-rule" />BY TOPIC</p><h2>Topic performance</h2></div></div>
              <div className="aptitude-performance-list">
                {data.topics.map((topic) => {
                  const classification = topic.accuracy >= 80 ? 'Strong' : topic.accuracy >= 60 ? 'Needs Improvement' : 'Weak';
                  return (
                    <article className="aptitude-performance-row" key={topic.topic_id}>
                      <div className="aptitude-performance-label"><strong>{topic.topic}</strong><span>{topic.quizzes_completed} quizzes · {topic.questions_solved} questions</span></div>
                      <div className="aptitude-performance-bar"><span style={{ width: `${topic.accuracy}%` }} /></div>
                      <strong className="aptitude-performance-percent">{Math.round(topic.accuracy)}%</strong>
                      <span className={`aptitude-classification aptitude-classification-${classification.toLowerCase().replaceAll(' ', '-')}`}>{classification}</span>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : <div className="aptitude-empty-panel"><strong>Your performance report is taking shape.</strong><span>Complete a quiz to see topic-by-topic progress.</span></div>}
          {data.topics.filter((topic) => topic.accuracy < 60 && topic.quizzes_completed >= 2).map((topic) => (
            <article className="aptitude-recommendation" key={topic.topic_id}>
              <div><p className="eyebrow"><span className="eyebrow-rule" />RECOMMENDED FOR YOU</p><h2>Improve {topic.topic}</h2><p>Your accuracy across {topic.quizzes_completed} quizzes is below 60%.</p></div>
              <Link className="dashboard-action" to={`/student/aptitude/topic/${topic.topic_id}/quiz`}>Practice {topic.topic}</Link>
            </article>
          ))}
        </>
      )}
    </main>
  );
}

function StudentAptitude() {
  const location = useLocation();
  const { categoryId, topicId } = useParams();
  if (location.pathname.endsWith('/history')) return <AptitudeHistory />;
  if (location.pathname.endsWith('/performance')) return <AptitudePerformance />;
  if (location.pathname.includes('/result/')) return <QuizResult />;
  if (location.pathname.endsWith('/quiz')) return <QuizPage />;
  if (location.pathname.endsWith('/notes')) return <TopicNotes />;
  if (location.pathname.includes('/topic/')) return topicId ? <TopicNotes /> : <AptitudeHome />;
  if (categoryId) return <CategoryTopics />;
  return <AptitudeHome />;
}

export default StudentAptitude;