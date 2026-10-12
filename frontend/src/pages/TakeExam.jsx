import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import '../App.css';

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function TakeExam() {
  const { examId } = useParams();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attemptId');
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionStarted = useRef(false);

  useEffect(() => {
    const loadAttempt = async () => {
      if (!attemptId) {
        setError('A valid exam attempt is required.');
        setIsLoading(false);
        return;
      }

      try {
        const data = await apiFetch(`/api/student/attempts/${attemptId}/questions`);
        if (String(data.exam_id) !== examId) throw new Error('This attempt does not belong to the selected exam.');

        setExam(data);
        setQuestions(data.questions);
        setRemainingSeconds(data.remaining_seconds);
      } catch (loadError) {
        setError(loadError.message || 'Cannot connect to the server.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAttempt();
  }, [attemptId, examId]);

  const submitExam = useCallback(async () => {
    if (submissionStarted.current || !questions.length) return;
    submissionStarted.current = true;
    setIsSubmitting(true);
    setError('');

    try {
      await apiFetch(`/api/student/attempts/${attemptId}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          answers: questions.map((question) => ({
            question_id: question.question_id,
            selected_option: answers[question.question_id] || null
          }))
        })
      });
      localStorage.setItem('examforge_last_attempt', attemptId);
      navigate(`/student/result/${attemptId}`);
    } catch (submitError) {
      submissionStarted.current = false;
      setIsSubmitting(false);
      setError(submitError.message || 'Cannot connect to the server.');
    }
  }, [answers, attemptId, navigate, questions]);

  useEffect(() => {
    if (remainingSeconds === null || isLoading || isSubmitting) return undefined;

    const timer = window.setTimeout(() => {
      if (remainingSeconds <= 1) {
        setRemainingSeconds(0);
        submitExam();
      } else {
        setRemainingSeconds(remainingSeconds - 1);
      }
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [isLoading, isSubmitting, remainingSeconds, submitExam]);

  const currentQuestion = questions[questionIndex];
  const progressPercent = questions.length > 0
    ? Math.round(((questionIndex + 1) / questions.length) * 100)
    : 0;

  const timerStateClass = remainingSeconds !== null
    ? remainingSeconds <= 30
      ? 'timer-critical'
      : remainingSeconds <= 60
        ? 'timer-warning'
        : 'timer-normal'
    : '';

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  return (
    <div className="dashboard-page exam-taking-page page-container">
      <div className="dashboard-header exam-header">
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" />ASSESSMENT SESSION</p>
          <h1>{exam?.exam_title || 'Loading exam...'}</h1>
        </div>
        <div className={`exam-timer-card ${timerStateClass}`} aria-live="polite">
          <span className="timer-label">TIME REMAINING</span>
          <strong className="timer-display">⏱ {remainingSeconds === null ? '--:--' : formatTime(remainingSeconds)}</strong>
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {isLoading && <p role="status">Loading questions...</p>}

      {!isLoading && questions.length > 0 && (
        <div
          className="exam-progress-track"
          role="progressbar"
          aria-label="Exam progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <span style={{ width: `${progressPercent}%` }} />
        </div>
      )}

      {!isLoading && currentQuestion && (
        <section className="exam-question-panel dashboard-card">
          <div className="question-progress">
            <span className="question-badge">Question {questionIndex + 1} of {questions.length}</span>
            <span className="answered-count">{Object.keys(answers).length} of {questions.length} answered</span>
          </div>
          <h2 className="question-text">{currentQuestion.question_text}</h2>
          <div className="exam-answer-list">
            {currentQuestion.options.map((option) => (
              <label className={`exam-answer ${answers[currentQuestion.question_id] === option.label ? 'exam-answer-selected' : ''}`} key={option.label}>
                <input
                  type="radio"
                  name={`question-${currentQuestion.question_id}`}
                  value={option.label}
                  checked={answers[currentQuestion.question_id] === option.label}
                  onChange={() => setAnswers((currentAnswers) => ({
                    ...currentAnswers,
                    [currentQuestion.question_id]: option.label
                  }))}
                />
                <span className="answer-label">{option.label}</span>
                <span className="answer-text">{option.text}</span>
              </label>
            ))}
          </div>
          <div className="exam-controls-bar">
            <button
              className="button button-secondary exam-btn-prev"
              type="button"
              disabled={questionIndex === 0 || isSubmitting}
              onClick={() => setQuestionIndex((index) => index - 1)}
            >
              ← Previous
            </button>

            <div className="exam-controls-right">
              {questionIndex < questions.length - 1 && (
                <button
                  className="button button-primary exam-btn-next"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setQuestionIndex((index) => index + 1)}
                >
                  Next →
                </button>
              )}
              <button
                className="button button-accent exam-btn-submit"
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowSubmitConfirm(true)}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Exam ✓'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* CONFIRM SUBMIT EXAM MODAL */}
      {showSubmitConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="submit-modal-title">
          <div className="modal-card">
            <h2 id="submit-modal-title">Submit Exam?</h2>
            <p>
              You have answered {Object.keys(answers).length} of {questions.length} questions. Are you sure you want to submit the exam? Once submitted, you cannot change your answers.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                disabled={isSubmitting}
                onClick={() => setShowSubmitConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-accent"
                disabled={isSubmitting}
                onClick={() => {
                  setShowSubmitConfirm(false);
                  submitExam();
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !currentQuestion && !error && (
        <div className="question-empty-state">
          <p>This exam does not have any questions.</p>
          <Link to="/student/exams" className="dashboard-action">Back to Exams</Link>
        </div>
      )}
    </div>
  );
}

export default TakeExam;