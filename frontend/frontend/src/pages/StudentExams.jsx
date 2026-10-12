import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import '../App.css';

function StudentExams() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [startingExam, setStartingExam] = useState(null);
  const [pendingStartExam, setPendingStartExam] = useState(null);

  useEffect(() => {
    const loadExams = async () => {
      try {
        const data = await apiFetch('/api/student/exams');
        setExams(data.exams);
      } catch (loadError) {
        setError(loadError.message || 'Cannot connect to the server.');
      } finally {
        setIsLoading(false);
      }
    };

    loadExams();
  }, []);

  const confirmStartExam = async (exam) => {
    if (!exam) return;
    setError('');
    setStartingExam(exam.exam_id);

    try {
      const data = await apiFetch(`/api/student/exams/${exam.exam_id}/start`, {
        method: 'POST',
        body: JSON.stringify({})
      });

      setPendingStartExam(null);
      navigate(`/student/exam/${exam.exam_id}?attemptId=${data.attempt_id}`);
    } catch (startError) {
      setError(startError.message || 'Cannot connect to the server.');
    } finally {
      setStartingExam(null);
    }
  };

  return (
    <div className="dashboard-page page-container">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" />ASSESSMENTS</p>
          <h1>Available Exams</h1>
          <p>Choose a published exam to begin.</p>
        </div>
        <Link to="/student-dashboard" className="button button-secondary">
          Back to Dashboard
        </Link>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {isLoading && <p role="status">Loading exams...</p>}

      {!isLoading && !error && exams.length === 0 && (
        <p className="exam-empty-state">There are no published exams available right now.</p>
      )}

      {!isLoading && exams.length > 0 && (
        <div className="exam-list">
          {exams.map((exam) => (
            <article className="dashboard-card exam-card" key={exam.exam_id}>
              <div>
                <h2>{exam.title}</h2>
                <p>{exam.description || 'No description provided.'}</p>
                <dl className="exam-details">
                  <div><dt>Duration</dt><dd>{exam.duration} minutes</dd></div>
                  <div><dt>Questions</dt><dd>{exam.total_questions}</dd></div>
                </dl>
              </div>
              <button
                className="button button-primary"
                type="button"
                disabled={startingExam !== null || Number(exam.total_questions) === 0}
                onClick={() => setPendingStartExam(exam)}
              >
                {startingExam === exam.exam_id ? 'Starting...' : 'Start Exam'}
              </button>
            </article>
          ))}
        </div>
      )}

      {/* CONFIRM START EXAM MODAL */}
      {pendingStartExam && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="start-modal-title">
          <div className="modal-card">
            <h2 id="start-modal-title">Start Exam?</h2>
            <p>Are you sure you want to attend this exam? Once started, the exam timer will begin.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                disabled={startingExam !== null}
                onClick={() => setPendingStartExam(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-primary"
                disabled={startingExam !== null}
                onClick={() => confirmStartExam(pendingStartExam)}
              >
                {startingExam === pendingStartExam.exam_id ? 'Starting...' : 'Start Exam'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentExams;