import { Link } from 'react-router-dom';
import '../App.css';

function ComingSoon({ message }) {
  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Coming Soon</h1>
          <p>{message}</p>
        </div>

        <Link to="/student-dashboard" className="dashboard-action">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default ComingSoon;