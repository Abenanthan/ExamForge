import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import '../App.css';

const emptyChallenge = {
  title: '',
  description: '',
  specification: 'Basic Algorithms',
  input_format: '',
  output_format: '',
  constraints: '',
  difficulty: 'Easy'
};

const emptyTestCase = {
  input_data: '',
  expected_output: '',
  is_sample: true
};

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

function AdminCoding() {
  const [challenges, setChallenges] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [challengeForm, setChallengeForm] = useState(emptyChallenge);
  const [editingChallengeId, setEditingChallengeId] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [testCaseForm, setTestCaseForm] = useState(emptyTestCase);
  const [editingTestCase, setEditingTestCase] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingChallenge, setIsSavingChallenge] = useState(false);
  const [isSavingTestCase, setIsSavingTestCase] = useState(false);

  // Admin list filters
  const [adminDifficultyFilter, setAdminDifficultyFilter] = useState('All');
  const [adminSpecFilter, setAdminSpecFilter] = useState('All');

  const loadChallenges = async () => {
    const data = await apiFetch('/api/admin/coding/challenges');
    setChallenges(data.challenges || []);
  };

  useEffect(() => {
    let active = true;
    apiFetch('/api/admin/coding/challenges')
      .then((data) => {
        if (active) setChallenges(data.challenges || []);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Could not load challenges.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedId) return undefined;

    let active = true;
    const loadSelected = async () => {
      try {
        const [challengeData, caseData] = await Promise.all([
          apiFetch(`/api/admin/coding/challenges/${selectedId}`),
          apiFetch(`/api/admin/coding/challenges/${selectedId}/test-cases`)
        ]);
        if (active) {
          setChallengeForm({
            title: challengeData.challenge.title,
            description: challengeData.challenge.description,
            specification: challengeData.challenge.specification || 'Basic Algorithms',
            input_format: challengeData.challenge.input_format,
            output_format: challengeData.challenge.output_format,
            constraints: challengeData.challenge.constraints,
            difficulty: challengeData.challenge.difficulty
          });
          setTestCases(caseData.test_cases || []);
        }
      } catch (loadError) {
        if (active) setError(loadError.message || 'Could not load challenge details.');
      }
    };

    loadSelected();
    return () => { active = false; };
  }, [selectedId]);

  const updateChallengeField = (event) => {
    const { name, value } = event.target;
    setChallengeForm((current) => ({ ...current, [name]: value }));
  };

  const resetChallengeForm = () => {
    setEditingChallengeId(null);
    setSelectedId(null);
    setChallengeForm(emptyChallenge);
    setTestCases([]);
  };

  const saveChallenge = async (event) => {
    event.preventDefault();
    setError('');
    setIsSavingChallenge(true);
    try {
      await apiFetch(
        editingChallengeId
          ? `/api/admin/coding/challenges/${editingChallengeId}`
          : '/api/admin/coding/challenges',
        {
          method: editingChallengeId ? 'PUT' : 'POST',
          body: JSON.stringify(challengeForm)
        }
      );
      await loadChallenges();
      resetChallengeForm();
    } catch (saveError) {
      setError(saveError.message || 'Could not save challenge.');
    } finally {
      setIsSavingChallenge(false);
    }
  };

  const selectChallenge = (challengeId) => {
    setError('');
    setEditingChallengeId(challengeId);
    setSelectedId(challengeId);
    setTestCases([]);
  };

  const deleteChallenge = async (challengeId) => {
    if (!window.confirm('Delete this challenge and its test cases?')) return;
    setError('');
    try {
      await apiFetch(`/api/admin/coding/challenges/${challengeId}`, { method: 'DELETE' });
      if (selectedId === challengeId) resetChallengeForm();
      await loadChallenges();
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete challenge.');
    }
  };

  const saveTestCase = async (event) => {
    event.preventDefault();
    if (!selectedId) return;
    setError('');
    setIsSavingTestCase(true);
    try {
      if (editingTestCase) {
        await apiFetch(`/api/admin/coding/test-cases/${editingTestCase.test_case_id}`, {
          method: 'PUT',
          body: JSON.stringify(editingTestCase)
        });
      } else {
        await apiFetch(`/api/admin/coding/challenges/${selectedId}/test-cases`, {
          method: 'POST',
          body: JSON.stringify(testCaseForm)
        });
      }
      const data = await apiFetch(`/api/admin/coding/challenges/${selectedId}/test-cases`);
      setTestCases(data.test_cases || []);
      setTestCaseForm(emptyTestCase);
      setEditingTestCase(null);
      await loadChallenges();
    } catch (saveError) {
      setError(saveError.message || 'Could not save test case.');
    } finally {
      setIsSavingTestCase(false);
    }
  };

  const deleteTestCase = async (testCaseId) => {
    if (!window.confirm('Delete this test case?')) return;
    setError('');
    try {
      await apiFetch(`/api/admin/coding/test-cases/${testCaseId}`, { method: 'DELETE' });
      setTestCases((current) => current.filter((testCase) => testCase.test_case_id !== testCaseId));
      await loadChallenges();
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete test case.');
    }
  };

  const editTestCase = (testCase) => {
    setEditingTestCase({
      test_case_id: testCase.test_case_id,
      input_data: testCase.input_data,
      expected_output: testCase.expected_output,
      is_sample: Boolean(testCase.is_sample)
    });
  };

  const cancelTestCaseEdit = () => setEditingTestCase(null);

  const filteredAdminChallenges = useMemo(() => {
    return challenges.filter((c) => {
      if (adminDifficultyFilter !== 'All' && c.difficulty !== adminDifficultyFilter) return false;
      if (adminSpecFilter !== 'All') {
        const itemSpecs = (c.specification || '').split(/[\/,]/).map((s) => s.trim().toLowerCase());
        if (!itemSpecs.includes(adminSpecFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [challenges, adminDifficultyFilter, adminSpecFilter]);

  return (
    <div className="dashboard-page page-container">
      <div className="dashboard-header">
        <div>
          <h1>Coding Challenge Management</h1>
          <p>Create problems and manage sample and hidden test cases across 30 challenges.</p>
        </div>
        <Link to="/admin-dashboard" className="dashboard-action">Admin Dashboard</Link>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {isLoading && <p role="status">Loading challenges...</p>}

      <div className="admin-coding-layout">
        <section className="dashboard-card admin-coding-list">
          <div className="coding-admin-list-header">
            <h2>Challenges ({filteredAdminChallenges.length} / {challenges.length})</h2>
            <button type="button" className="exam-secondary-action" onClick={resetChallengeForm}>New</button>
          </div>

          {/* Admin filters */}
          <div className="admin-coding-filters">
            <select value={adminDifficultyFilter} onChange={(e) => setAdminDifficultyFilter(e.target.value)}>
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <select value={adminSpecFilter} onChange={(e) => setAdminSpecFilter(e.target.value)}>
              {SPECIFICATIONS.map((spec) => (
                <option key={spec} value={spec}>{spec === 'All' ? 'All Specifications' : spec}</option>
              ))}
            </select>
          </div>

          {filteredAdminChallenges.length === 0 && !isLoading && <p className="exam-empty-state">No coding challenges match filter.</p>}
          <div className="admin-coding-scroll-list">
            {filteredAdminChallenges.map((challenge) => (
              <article className={`admin-coding-item${selectedId === challenge.challenge_id ? ' admin-coding-item-selected' : ''}`} key={challenge.challenge_id}>
                <button type="button" className="admin-coding-select" onClick={() => selectChallenge(challenge.challenge_id)}>
                  <strong>{challenge.title}</strong>
                  <span>{challenge.difficulty} · {challenge.specification} · {challenge.sample_test_cases}/{challenge.total_test_cases} tests</span>
                </button>
                <button type="button" className="exam-secondary-action" onClick={() => deleteChallenge(challenge.challenge_id)}>Delete</button>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-card admin-coding-editor">
          <h2>{editingChallengeId ? 'Edit Challenge' : 'Create Challenge'}</h2>
          <form className="coding-admin-form" onSubmit={saveChallenge}>
            <div className="form-group">
              <label htmlFor="challenge-title">Title</label>
              <input id="challenge-title" name="title" maxLength={200} value={challengeForm.title} onChange={updateChallengeField} required />
            </div>
            <div className="form-group">
              <label htmlFor="challenge-specification">Specification / Topic</label>
              <input id="challenge-specification" name="specification" placeholder="e.g. Array / Hashing" value={challengeForm.specification} onChange={updateChallengeField} required />
            </div>
            <div className="form-group">
              <label htmlFor="challenge-description">Description</label>
              <textarea id="challenge-description" name="description" rows="3" value={challengeForm.description} onChange={updateChallengeField} required />
            </div>
            <div className="form-group">
              <label htmlFor="challenge-input-format">Input Format</label>
              <textarea id="challenge-input-format" name="input_format" rows="2" value={challengeForm.input_format} onChange={updateChallengeField} required />
            </div>
            <div className="form-group">
              <label htmlFor="challenge-output-format">Output Format</label>
              <textarea id="challenge-output-format" name="output_format" rows="2" value={challengeForm.output_format} onChange={updateChallengeField} required />
            </div>
            <div className="form-group">
              <label htmlFor="challenge-constraints">Constraints</label>
              <textarea id="challenge-constraints" name="constraints" rows="2" value={challengeForm.constraints} onChange={updateChallengeField} required />
            </div>
            <div className="form-group">
              <label htmlFor="challenge-difficulty">Difficulty</label>
              <select id="challenge-difficulty" name="difficulty" value={challengeForm.difficulty} onChange={updateChallengeField}>
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </div>
            <div className="coding-editor-actions">
              <button className="dashboard-action" type="submit" disabled={isSavingChallenge}>
                {isSavingChallenge ? 'Saving...' : editingChallengeId ? 'Save Changes' : 'Create Challenge'}
              </button>
              {editingChallengeId && <button className="exam-secondary-action" type="button" onClick={resetChallengeForm}>Cancel Edit</button>}
            </div>
          </form>
        </section>
      </div>

      {selectedId && (
        <section className="dashboard-card coding-test-case-manager">
          <h2>Test Cases for Challenge #{selectedId}</h2>
          <form className="coding-test-case-form" onSubmit={saveTestCase}>
            <div className="form-group">
              <label htmlFor="test-input">Input</label>
              <textarea id="test-input" rows="3" value={editingTestCase?.input_data ?? testCaseForm.input_data} onChange={(event) => editingTestCase ? setEditingTestCase((current) => ({ ...current, input_data: event.target.value })) : setTestCaseForm((current) => ({ ...current, input_data: event.target.value }))} required />
            </div>
            <div className="form-group">
              <label htmlFor="test-output">Expected Output</label>
              <textarea id="test-output" rows="3" value={editingTestCase?.expected_output ?? testCaseForm.expected_output} onChange={(event) => editingTestCase ? setEditingTestCase((current) => ({ ...current, expected_output: event.target.value })) : setTestCaseForm((current) => ({ ...current, expected_output: event.target.value }))} required />
            </div>
            <div className="form-group">
              <label htmlFor="test-visibility">Visibility</label>
              <select id="test-visibility" value={String(editingTestCase?.is_sample ?? testCaseForm.is_sample)} onChange={(event) => editingTestCase ? setEditingTestCase((current) => ({ ...current, is_sample: event.target.value === 'true' })) : setTestCaseForm((current) => ({ ...current, is_sample: event.target.value === 'true' }))}>
                <option value="true">Sample Test Case (Visible)</option>
                <option value="false">Hidden Test Case</option>
              </select>
            </div>
            <div className="coding-editor-actions">
              <button className="dashboard-action" type="submit" disabled={isSavingTestCase}>
                {isSavingTestCase ? 'Saving...' : editingTestCase ? 'Save Test Case' : 'Add Test Case'}
              </button>
              {editingTestCase && <button type="button" className="exam-secondary-action" onClick={cancelTestCaseEdit}>Cancel</button>}
            </div>
          </form>

          <div className="coding-test-case-list">
            {testCases.map((testCase, index) => (
              <article className="coding-test-case-item" key={testCase.test_case_id}>
                <div className="coding-test-case-item-header">
                  <strong>Test Case {index + 1}</strong>
                  <span className={testCase.is_sample ? 'test-case-sample' : 'test-case-hidden'}>
                    {testCase.is_sample ? 'Sample Test Case' : 'Hidden Test Case'}
                  </span>
                </div>
                <div className="coding-result-columns">
                  <div><span>Input</span><pre>{testCase.input_data || '(empty)'}</pre></div>
                  <div><span>Expected output</span><pre>{testCase.expected_output}</pre></div>
                </div>
                <div className="coding-editor-actions">
                  <button type="button" className="exam-secondary-action" onClick={() => editTestCase(testCase)}>Edit</button>
                  <button type="button" className="exam-secondary-action" onClick={() => deleteTestCase(testCase.test_case_id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default AdminCoding;