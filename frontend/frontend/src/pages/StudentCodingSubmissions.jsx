import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import '../App.css';

function StudentCodingSubmissions() {
  const { submissionId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [submission, setSubmission] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        if (submissionId) {
          const data = await apiFetch(`/api/student/coding/submissions/${submissionId}`);
          setSubmission(data.submission);
        } else {
          const data = await apiFetch('/api/student/coding/submissions');
          setSubmissions(data.submissions);
        }
      } catch (loadError) {
        setError(loadError.message || 'Could not load submissions.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSubmissions();
  }, [submissionId]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>{submissionId ? 'Submission Details' : 'Coding Submission History'}</h1>
          <p>Only your submissions are shown here.</p>
        </div>
        <Link to="/student/coding" className="dashboard-action">Coding Challenges</Link>
      </div>

      {isLoading && <p role="status">Loading submissions...</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {submission && (
        <section className="dashboard-card coding-submission-detail">
          <h2>{submission.challenge_title}</h2>
          <p>
            <span className={`coding-difficulty coding-difficulty-${(submission.difficulty || 'Easy').toLowerCase()}`}>
              {submission.difficulty || 'Easy'}
            </span>
            {' · '}
            <span>{submission.specification || 'Basic Algorithms'}</span>
            {' · '}
            <strong>{submission.language}</strong>
            {' · '}
            <span>{submission.status}</span>
          </p>
          <p>Score: {submission.score} / 100</p>
          <p>Tests passed: {submission.passed_tests} / {submission.total_tests}</p>
          <p>Execution time: {submission.execution_time ?? 'N/A'} s</p>
          <h3>Submitted Code</h3>
          <pre className="coding-source-review">{submission.source_code}</pre>
        </section>
      )}

      {!submissionId && !isLoading && !error && submissions.length === 0 && (
        <p className="exam-empty-state">You have no coding submissions yet.</p>
      )}

      {!submissionId && submissions.length > 0 && (
        <div className="coding-table-wrap">
          <table className="analytics-table coding-history-table">
            <thead>
              <tr>
                <th>Challenge</th>
                <th>Difficulty</th>
                <th>Specification</th>
                <th>Language</th>
                <th>Status</th>
                <th>Score</th>
                <th>Tests</th>
                <th>Time</th>
                <th>Submitted</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {submissions.map((item) => (
                <tr key={item.submission_id}>
                  <td><strong>{item.challenge_title}</strong></td>
                  <td>
                    <span className={`coding-difficulty coding-difficulty-${(item.difficulty || 'Easy').toLowerCase()}`}>
                      {item.difficulty || 'Easy'}
                    </span>
                  </td>
                  <td>{item.specification || 'Basic Algorithms'}</td>
                  <td>{item.language}</td>
                  <td>{item.status}</td>
                  <td>{item.score}</td>
                  <td>{item.passed_tests}/{item.total_tests}</td>
                  <td>{item.execution_time ?? 'N/A'} s</td>
                  <td>{new Date(item.submitted_at).toLocaleString()}</td>
                  <td><Link to={`/student/coding/submissions/${item.submission_id}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default StudentCodingSubmissions;