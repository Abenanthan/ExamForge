import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import '../App.css';

function AdminDashboard() {
  const location = useLocation();
  const [overview, setOverview] = useState(null);
  const [analyticsError, setAnalyticsError] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/analytics/overview')
      .then(setOverview)
      .catch((error) => setAnalyticsError(error.message || 'Could not load dashboard summary.'));
  }, []);

  return (
    <main className="dashboard-page page-container">
      <div className="dashboard-header dashboard-welcome">
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" />EXAMFORGE CONTROL ROOM</p>
          <h1>Admin Dashboard</h1>
          <p>Manage examinations, questions, and learning analytics.</p>
        </div>
      </div>

      {location.state?.message && (
        <p className="form-success" role="status">
          {location.state.message}
        </p>
      )}

      <section className="admin-stat-grid" aria-label="Platform overview">
        {[
          ['Total Exams', overview?.total_exams],
          ['Total Questions', overview?.total_questions],
          ['Total Students', overview?.total_students],
          ['Total Attempts', overview?.total_attempts]
        ].map(([label, value], index) => (
          <article className="admin-stat-card" key={label}>
            <span className="stat-mark">0{index + 1}</span>
            <span className="stat-label">{label}</span>
            <strong>{overview ? value : '—'}</strong>
          </article>
        ))}
      </section>
      {analyticsError && <p className="form-error" role="alert">{analyticsError}</p>}

      <div className="dashboard-section-heading">
        <div><p className="eyebrow"><span className="eyebrow-rule" />WORKSPACE</p><h2>Manage ExamForge</h2></div>
      </div>

      <div className="dashboard-cards admin-feature-grid">

        <article className="dashboard-card feature-dashboard-card">
          <span className="dashboard-card-mark">01</span>
          <h2>Exam Management</h2>
          <p>Create, edit and manage examinations.</p>
          <Link to="/admin/exams/create" className="dashboard-action">
            Create Exam
          </Link>
        </article>

        <article className="dashboard-card feature-dashboard-card">
          <span className="dashboard-card-mark">02</span>
          <h2>Question Bank</h2>
          <p>Add and manage questions with topics and difficulty levels.</p>
          <Link to="/admin/questions/create" className="dashboard-action">
            Manage Questions
          </Link>
        </article>

        <article className="dashboard-card feature-dashboard-card">
          <span className="dashboard-card-mark">03</span>
          <h2>Students</h2>
          <p>View registered students and their exam activity.</p>
          <button>View Students</button>
        </article>

        <article className="dashboard-card feature-dashboard-card">
          <span className="dashboard-card-mark">04</span>
          <h2>Analytics</h2>
          <p>Analyze exam results and identify difficult questions.</p>
          <Link to="/admin/analytics" className="dashboard-action">
            View Analytics
          </Link>
        </article>

        <article className="dashboard-card feature-dashboard-card">
          <span className="dashboard-card-mark">05</span>
          <h2>Coding Challenges</h2>
          <p>Create programming problems and manage test cases.</p>
          <Link to="/admin/coding" className="dashboard-action">
            Manage Coding Challenges
          </Link>
        </article>

      </div>
    </main>
  );
}

export default AdminDashboard;