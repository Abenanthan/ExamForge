import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import '../App.css';
import './Aptitude.css';

const TIMER_PREFIX = 'examforge_aptitude_practice_timer_';
const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Mixed'];

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function ErrorMessage({ children }) {
  return <p className="form-error aptitude-error" role="alert">{children}</p>;
}

function PracticeResult({ attemptId }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    apiFetch(`/api/student/aptitude/practice/attempts/${attemptId}`)
      .then((response) => { if (active) setResult(response); })
      .catch((loadError) => { if (active) setError(loadError.message); });
    return () => { active = false; };
  }, [attemptId]);
  if (error) return <main className="aptitude-page page-container"><ErrorMessage>{error}</ErrorMessage></main>;
  if (!result) return <main className="aptitude-page page-container"><p className="aptitude-message">Loading practice result...</p></main>;
  const { attempt, questions } = result;
  const unanswered = questions.filter((question) => !question.selected_option).length;
  return (
    <main className="aptitude-page page-container">
      <div className="aptitude-heading"><div><p className="eyebrow">DEFAULT PRACTICE</p><h1>Practice Complete</h1><p>{attempt.topic} · {attempt.difficulty_mode}</p></div></div>
      <section className="aptitude-result-summary">
        <div className="aptitude-result-score"><strong>{attempt.correct_answers}/{attempt.total_questions}</strong><span>Correct answers</span></div>
        <div className="aptitude-result-meter"><strong>{Math.round(Number(attempt.score))}%</strong><span>Accuracy</span></div>
        <div className="aptitude-result-counts"><span><b>{attempt.total_questions - attempt.correct_answers - unanswered}</b> incorrect</span><span><b>{unanswered}</b> unanswered</span></div>
      </section>
      {attempt.timer_seconds !== null && attempt.time_taken_seconds !== null && <p className="aptitude-practice-time">Time used: {formatTime(Number(attempt.time_taken_seconds))}</p>}
      <section className="aptitude-section"><div className="aptitude-section-title"><h2>Answer review</h2></div><div className="aptitude-review-list">
        {questions.map((question, index) => (
          <article className={`aptitude-review${question.is_correct ? ' is-correct' : ' is-wrong'}`} key={question.question_id}>
            <div className="aptitude-review-heading"><span>Question {index + 1} · {question.difficulty}</span><strong>{question.is_correct ? 'Correct' : question.selected_option ? 'Incorrect' : 'Unanswered'}</strong></div>
            <h3>{question.question}</h3>
            <p>Your answer: <b>{question.selected_option ? `${question.selected_option}. ${question.options[question.selected_option]}` : 'Not answered'}</b></p>
            <p>Correct answer: <b>{question.correct_option}. {question.options[question.correct_option]}</b></p>
            <p className="aptitude-explanation">{question.explanation}</p>
          </article>
        ))}
      </div></section>
      <div className="aptitude-result-actions"><Link className="dashboard-action" to={`/student/aptitude/topic/${attempt.topic_id}/practice`}>Practice Again</Link><Link className="exam-secondary-action" to={`/student/aptitude/topic/${attempt.topic_id}/notes`}>Read Notes</Link><Link className="exam-secondary-action" to="/student/aptitude/history">View History</Link></div>
    </main>
  );
}

export default function StudentAptitudePractice() {
  const { topicId, resultAttemptId } = useParams();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attemptId');
  const navigate = useNavigate();
  const [topicData, setTopicData] = useState(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [difficultyMode, setDifficultyMode] = useState('Mixed');
  const [timerMode, setTimerMode] = useState('none');
  const [customMinutes, setCustomMinutes] = useState('5');
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expired, setExpired] = useState(false);
  const [autoSubmitFailed, setAutoSubmitFailed] = useState(false);
  const endAtRef = useRef(null);
  const submittingRef = useRef(false);
  const autoSubmitRef = useRef(false);
  const submitRef = useRef(null);

  useEffect(() => {
    if (resultAttemptId) return undefined;
    let active = true;
    apiFetch(`/api/student/aptitude/practice/topics/${topicId}/questions`)
      .then((data) => { if (active) setTopicData(data); })
      .catch((loadError) => { if (active) setError(loadError.message); });
    return () => { active = false; };
  }, [resultAttemptId, topicId]);

  useEffect(() => {
    if (!attemptId) return undefined;
    let active = true;
    apiFetch(`/api/student/aptitude/practice/attempts/${attemptId}`)
      .then((data) => {
        if (!active) return;
        setAttempt(data);
        setAnswers(Object.fromEntries(data.questions.filter((question) => question.selected_option)
          .map((question) => [question.question_id, question.selected_option])));
        if (data.attempt.completed_at) {
          sessionStorage.removeItem(`${TIMER_PREFIX}${attemptId}`);
          return;
        }
        const timer = (() => {
          try { return JSON.parse(sessionStorage.getItem(`${TIMER_PREFIX}${attemptId}`) || 'null'); } catch { return null; }
        })();
        if (timer?.endAt) {
          const remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
          endAtRef.current = timer.endAt;
          setTimeRemaining(remaining);
          setTimerMode(timer.mode);
          setExpired(remaining === 0);
        }
      })
      .catch((loadError) => { if (active) setError(loadError.message); });
    return () => { active = false; };
  }, [attemptId]);

  const startPractice = async (event) => {
    event.preventDefault();
    const timerSeconds = timerMode === 'none' ? null : timerMode === 'custom'
      ? Number(customMinutes) * 60
      : Number(timerMode) * 60;
    if (timerMode === 'custom' && (!/^\d+$/.test(customMinutes) || timerSeconds < 60 || timerSeconds > 3600)) {
      setError('Please enter a duration between 1 and 60 minutes.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/student/aptitude/practice/attempts', {
        method: 'POST',
        body: JSON.stringify({ topic_id: Number(topicId), count: questionCount, difficulty_mode: difficultyMode, timer_seconds: timerSeconds })
      });
      const startedAt = Date.now();
      const endAt = timerSeconds ? startedAt + timerSeconds * 1000 : null;
      if (timerSeconds) sessionStorage.setItem(`${TIMER_PREFIX}${data.attempt_id}`, JSON.stringify({ mode: timerMode, timerSeconds, startedAt, endAt }));
      setAttempt({ attempt: { ...data, started_at: new Date(startedAt).toISOString() }, questions: data.questions });
      setAnswers({});
      setQuestionIndex(0);
      setTimeRemaining(timerSeconds);
      endAtRef.current = endAt;
      submittingRef.current = false;
      autoSubmitRef.current = false;
      setExpired(false);
      navigate(`/student/aptitude/topic/${topicId}/practice?attemptId=${data.attempt_id}`, { replace: true });
    } catch (startError) {
      setError(startError.message || 'Unable to start practice.');
    } finally {
      setLoading(false);
    }
  };

  const submitPractice = useCallback(async ({ automatic = false } = {}) => {
    if (!attempt || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await apiFetch(`/api/student/aptitude/practice/attempts/${attempt.attempt.attempt_id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          timed_out: automatic,
          time_taken_seconds: Math.max(0, Math.floor((Date.now() - new Date(attempt.attempt.started_at).getTime()) / 1000)),
          answers: attempt.questions.map((question) => ({ question_id: question.question_id, selected_option: answers[question.question_id] || null }))
        })
      });
      sessionStorage.removeItem(`${TIMER_PREFIX}${attempt.attempt.attempt_id}`);
      endAtRef.current = null;
      navigate(`/student/aptitude/practice/result/${attempt.attempt.attempt_id}`);
    } catch (submitError) {
      submittingRef.current = false;
      setError(submitError.message || 'Unable to submit practice.');
      if (automatic) setAutoSubmitFailed(true);
    } finally {
      setSubmitting(false);
    }
  }, [answers, attempt, navigate]);
  useEffect(() => { submitRef.current = submitPractice; }, [submitPractice]);

  useEffect(() => {
    if (!attemptId || !attempt || !endAtRef.current || submitting) return undefined;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining === 0 && !autoSubmitRef.current) {
        autoSubmitRef.current = true;
        setExpired(true);
        void submitRef.current?.({ automatic: true });
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [attempt, attemptId, submitting]);

  useEffect(() => () => { endAtRef.current = null; }, []);

  if (resultAttemptId) return <PracticeResult attemptId={resultAttemptId} />;
  const activeQuestion = attempt?.questions[questionIndex];
  const topic = topicData?.topic;
  const availableForMode = difficultyMode === 'Mixed'
    ? Number(topicData?.available_questions || 0)
    : Number(topicData?.by_difficulty?.[difficultyMode] || 0);
  return (
    <main className="aptitude-page page-container">
      <div className="aptitude-heading"><div><p className="eyebrow">STORED QUESTION BANK</p><h1>{topic?.name || 'Practice Questions'}</h1><p>Practice from the permanent aptitude question bank.</p></div><Link className="aptitude-back-link" to={`/student/aptitude/topic/${topicId}/notes`}>Read Notes</Link></div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!attempt && (
        <form className="aptitude-quiz-setup" noValidate onSubmit={startPractice}>
          <h2 className="aptitude-quiz-setup-title">Practice Setup</h2>
          <p className="aptitude-setup-topic"><span>TOPIC</span><strong>{topic?.name || 'Loading topic...'}</strong></p>
          <p className="aptitude-practice-available">Available Questions: <strong>{topicData ? availableForMode : '...'}</strong>{topicData && difficultyMode !== 'Mixed' ? ` for ${difficultyMode}` : ' across all levels'}</p>
          <fieldset><legend>Number of Questions</legend><div className="aptitude-choice-group">{[5, 10, 15].map((count) => <button type="button" key={count} disabled={count > availableForMode} className={questionCount === count ? 'is-selected' : ''} onClick={() => setQuestionCount(count)}>{count}</button>)}</div></fieldset>
          <fieldset><legend>Difficulty</legend><div className="aptitude-choice-group">{DIFFICULTIES.map((difficulty) => <button type="button" key={difficulty} className={difficultyMode === difficulty ? 'is-selected' : ''} onClick={() => { setDifficultyMode(difficulty); const available = difficulty === 'Mixed' ? topicData?.available_questions : topicData?.by_difficulty?.[difficulty]; if (questionCount > Number(available || 0)) setQuestionCount(5); }}>{difficulty}</button>)}</div></fieldset>
          <fieldset><legend>Timer</legend><div className="aptitude-timer-options">{[['none','No Timer'],['3','3 Minutes'],['5','5 Minutes'],['10','10 Minutes'],['custom','Custom']].map(([value,label])=><label className={timerMode===value?'is-selected':''} key={value}><input type="radio" name="practice-timer" checked={timerMode===value} onChange={()=>setTimerMode(value)} /><span>{label}</span></label>)}</div>{timerMode==='custom'&&<label className="aptitude-custom-timer"><span>Custom Duration</span><span className="aptitude-custom-timer-input"><input type="number" min="1" max="60" step="1" value={customMinutes} onChange={(event)=>setCustomMinutes(event.target.value)}/><span>minutes</span></span></label>}</fieldset>
          <button className="dashboard-action" type="submit" disabled={!topic || loading}>{loading?'Starting...':'Start Practice'}</button>
        </form>
      )}
      {attempt && activeQuestion && (
        <section className="aptitude-live-quiz">
          <div className="aptitude-quiz-meta"><strong>{attempt.attempt.topic}</strong><span>{attempt.attempt.difficulty_mode}</span></div>
          {timeRemaining !== null && <div className={`aptitude-quiz-timer${timeRemaining<60?' is-warning':''}${timeRemaining<30?' is-critical':''}`} role="timer"><span>Time Remaining</span><strong>{formatTime(timeRemaining)}</strong></div>}
          {autoSubmitFailed && <div className="aptitude-timer-expired" role="alert"><span>Automatic submission failed.</span><button className="dashboard-action" type="button" onClick={()=>submitPractice({automatic:true})}>Retry Submission</button></div>}
          <div className="aptitude-question-status"><span>Question {questionIndex+1} of {attempt.questions.length}</span><span>{Object.keys(answers).length} answered</span></div>
          <div className="aptitude-progress-track"><span style={{width:`${((questionIndex+1)/attempt.questions.length)*100}%`}}/></div>
          <h2 className="aptitude-question-text">{activeQuestion.question}</h2>
          <p className="aptitude-practice-level">{activeQuestion.difficulty}</p>
          <div className="aptitude-answer-list">{Object.entries(activeQuestion.options).map(([letter,text])=><button className={`aptitude-answer${answers[activeQuestion.question_id]===letter?' is-selected':''}`} type="button" disabled={submitting||expired} key={letter} onClick={()=>setAnswers(previous=>({...previous,[activeQuestion.question_id]:letter}))}><span>{letter}</span><strong>{text}</strong></button>)}</div>
          {error&&<ErrorMessage>{error}</ErrorMessage>}
          <div className="aptitude-quiz-controls"><button className="exam-secondary-action" type="button" disabled={questionIndex===0||submitting||expired} onClick={()=>setQuestionIndex(index=>index-1)}>Previous</button>{questionIndex<attempt.questions.length-1?<button className="dashboard-action" type="button" disabled={submitting||expired} onClick={()=>setQuestionIndex(index=>index+1)}>Next</button>:<button className="dashboard-action" type="button" disabled={submitting} onClick={()=>submitPractice()}>{submitting?'Submitting...':'Submit Practice'}</button>}</div>
        </section>
      )}
    </main>
  );
}
