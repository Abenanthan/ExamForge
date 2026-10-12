import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import '../App.css';

const SPECIFICATIONS = [
  'All',
  'Array',
  'String',
  'Mathematics',
  'Hashing',
  'Searching',
  'Sorting',
  'Stack',
  'Queue',
  'Linked List',
  'Matrix',
  'Two Pointers',
  'Sliding Window',
  'Recursion',
  'Dynamic Programming',
  'Basic Algorithms'
];

function StudentCodingChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [specificationFilter, setSpecificationFilter] = useState('All');

  useEffect(() => {
    const loadChallenges = async () => {
      try {
        const data = await apiFetch('/api/student/coding/challenges');
        setChallenges(data.challenges || []);
      } catch (loadError) {
        setError(loadError.message || 'Could not load coding challenges.');
      } finally {
        setIsLoading(false);
      }
    };

    loadChallenges();
  }, []);

  // Compute stats based on real data
  const stats = useMemo(() => {
    const counts = {
      Easy: { total: 0, completed: 0 },
      Medium: { total: 0, completed: 0 },
      Hard: { total: 0, completed: 0 }
    };

    challenges.forEach((item) => {
      if (counts[item.difficulty]) {
        counts[item.difficulty].total += 1;
        if (item.user_status === 'Accepted') {
          counts[item.difficulty].completed += 1;
        }
      }
    });

    return counts;
  }, [challenges]);

  // Filtered challenges
  const filteredChallenges = useMemo(() => {
    return challenges.filter((item) => {
      // Difficulty filter
      if (difficultyFilter !== 'All' && item.difficulty !== difficultyFilter) {
        return false;
      }

      // Specification filter (supports multi-spec like "Array / Hashing")
      if (specificationFilter !== 'All') {
        const itemSpecs = (item.specification || '')
          .split(/[\/,]/)
          .map((s) => s.trim().toLowerCase());
        const targetSpec = specificationFilter.toLowerCase();
        if (!itemSpecs.includes(targetSpec)) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(query);
        const descMatch = item.description.toLowerCase().includes(query);
        const specMatch = (item.specification || '').toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !specMatch) {
          return false;
        }
      }

      return true;
    });
  }, [challenges, difficultyFilter, specificationFilter, searchQuery]);

  return (
    <main className="dashboard-page coding-practice-page page-container">
      {/* Top Banner */}
      <div className="dashboard-header coding-practice-header">
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" />PRACTICE PLATFORM</p>
          <h1>CODING PRACTICE</h1>
          <p>Build problem-solving skills through hands-on coding.</p>
        </div>
        <div className="coding-header-actions">
          <Link to="/student/coding/submissions" className="button button-quiet">
            Submission History
          </Link>
          <Link to="/student-dashboard" className="button button-secondary">
            Student Dashboard
          </Link>
        </div>
      </div>

      {/* Real Progress Overview */}
      {!isLoading && !error && challenges.length > 0 && (
        <section className="coding-progress-bar-card dashboard-card" aria-label="Coding Progress">
          <div className="coding-progress-grid">
            <div className="coding-progress-item">
              <div className="coding-progress-label">
                <span className="coding-difficulty coding-difficulty-easy">Easy</span>
                <strong>{stats.Easy.completed} / {stats.Easy.total} completed</strong>
              </div>
              <div className="coding-progress-track">
                <div
                  className="coding-progress-fill fill-easy"
                  style={{ width: `${stats.Easy.total > 0 ? (stats.Easy.completed / stats.Easy.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="coding-progress-item">
              <div className="coding-progress-label">
                <span className="coding-difficulty coding-difficulty-medium">Medium</span>
                <strong>{stats.Medium.completed} / {stats.Medium.total} completed</strong>
              </div>
              <div className="coding-progress-track">
                <div
                  className="coding-progress-fill fill-medium"
                  style={{ width: `${stats.Medium.total > 0 ? (stats.Medium.completed / stats.Medium.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="coding-progress-item">
              <div className="coding-progress-label">
                <span className="coding-difficulty coding-difficulty-hard">Hard</span>
                <strong>{stats.Hard.completed} / {stats.Hard.total} completed</strong>
              </div>
              <div className="coding-progress-track">
                <div
                  className="coding-progress-fill fill-hard"
                  style={{ width: `${stats.Hard.total > 0 ? (stats.Hard.completed / stats.Hard.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filter and Search Bar */}
      <section className="coding-filter-section dashboard-card">
        <div className="coding-search-bar">
          <input
            type="search"
            placeholder="Search challenges by title, concept, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="coding-search-input"
            aria-label="Search coding challenges"
          />
        </div>

        {/* Difficulty Filter */}
        <div className="coding-filter-group">
          <label className="coding-filter-label">Difficulty:</label>
          <div className="coding-filter-pills" role="radiogroup" aria-label="Difficulty Filter">
            {['All', 'Easy', 'Medium', 'Hard'].map((diff) => {
              const count = diff === 'All'
                ? challenges.length
                : challenges.filter((c) => c.difficulty === diff).length;
              return (
                <button
                  key={diff}
                  type="button"
                  className={`coding-pill-btn ${difficultyFilter === diff ? 'active' : ''}`}
                  onClick={() => setDifficultyFilter(diff)}
                >
                  {diff} {count > 0 ? `(${count})` : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Specification / Topic Filter */}
        <div className="coding-filter-group">
          <label className="coding-filter-label">Specification:</label>
          <div className="coding-spec-pills" role="radiogroup" aria-label="Specification Filter">
            {SPECIFICATIONS.map((spec) => (
              <button
                key={spec}
                type="button"
                className={`coding-spec-pill ${specificationFilter === spec ? 'active' : ''}`}
                onClick={() => setSpecificationFilter(spec)}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Loading & Error States */}
      {isLoading && <p role="status" className="loading-state">Loading coding challenges...</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {!isLoading && !error && filteredChallenges.length === 0 && (
        <div className="exam-empty-state dashboard-card">
          <h3>No matching challenges found</h3>
          <p>Try adjusting your search query, difficulty, or specification filter.</p>
          <button
            type="button"
            className="button button-quiet"
            onClick={() => {
              setSearchQuery('');
              setDifficultyFilter('All');
              setSpecificationFilter('All');
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Challenge Cards Grid */}
      {!isLoading && !error && filteredChallenges.length > 0 && (
        <div className="coding-challenge-grid">
          {filteredChallenges.map((challenge) => {
            const specTags = (challenge.specification || 'Basic Algorithms')
              .split('/')
              .map((tag) => tag.trim());

            return (
              <article className="coding-card-item dashboard-card" key={challenge.challenge_id}>
                <div className="coding-card-top">
                  <h2 className="coding-card-title">{challenge.title}</h2>
                  <span className={`coding-difficulty coding-difficulty-${challenge.difficulty.toLowerCase()}`}>
                    {challenge.difficulty}
                  </span>
                </div>

                <div className="coding-card-specs">
                  {specTags.map((tag) => (
                    <span key={tag} className="coding-spec-tag">
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="coding-card-desc">{challenge.description}</p>

                <div className="coding-card-footer">
                  <div className="coding-card-status">
                    {challenge.user_status === 'Accepted' ? (
                      <span className="status-badge status-accepted">✓ Accepted</span>
                    ) : challenge.user_status ? (
                      <span className="status-badge status-attempted">{challenge.user_status}</span>
                    ) : (
                      <span className="status-badge status-unattempted">Not Attempted</span>
                    )}
                  </div>
                  <Link to={`/student/coding/${challenge.challenge_id}`} className="button button-primary button-small">
                    Solve Challenge →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default StudentCodingChallenges;