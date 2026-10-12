import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import '../App.css';

const starterCode = {
  Java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner input = new Scanner(System.in);\n    }\n}`,
  Python: 'import sys\n\ndata = sys.stdin.read().strip()\n',
  C: `#include <stdio.h>\n\nint main(void) {\n    return 0;\n}`
};

function StudentCodingChallenge() {
  const { challengeId } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [sampleCases, setSampleCases] = useState([]);
  const [language, setLanguage] = useState('Python');
  const [sourceCode, setSourceCode] = useState(starterCode.Python);
  const [runResult, setRunResult] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    const loadChallenge = async () => {
      try {
        const data = await apiFetch(`/api/student/coding/challenges/${challengeId}`);
        setChallenge(data.challenge);
        setSampleCases(data.sample_test_cases);
      } catch (loadError) {
        setError(loadError.message || 'Could not load challenge.');
      } finally {
        setIsLoading(false);
      }
    };

    loadChallenge();
  }, [challengeId]);

  const updateLanguage = (event) => {
    const nextLanguage = event.target.value;
    setLanguage(nextLanguage);
    setSourceCode(starterCode[nextLanguage]);
  };

  const handleEditorKeyDown = (event) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const { selectionStart, selectionEnd } = event.currentTarget;
    const indentation = '    ';
    setSourceCode((current) => (
      `${current.slice(0, selectionStart)}${indentation}${current.slice(selectionEnd)}`
    ));
    requestAnimationFrame(() => {
      if (!editorRef.current) return;
      editorRef.current.selectionStart = selectionStart + indentation.length;
      editorRef.current.selectionEnd = selectionStart + indentation.length;
    });
  };

  const runCode = async () => {
    setError('');
    setRunResult(null);
    setIsRunning(true);
    try {
      const data = await apiFetch('/api/student/coding/run', {
        method: 'POST',
        body: JSON.stringify({ challenge_id: Number(challengeId), language, source_code: sourceCode })
      });
      setRunResult(data);
    } catch (runError) {
      setError(runError.message || 'Code execution failed.');
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    setError('');
    setSubmission(null);
    setIsSubmitting(true);
    try {
      const data = await apiFetch('/api/student/coding/submit', {
        method: 'POST',
        body: JSON.stringify({ challenge_id: Number(challengeId), language, source_code: sourceCode })
      });
      setSubmission(data);
    } catch (submitError) {
      setError(submitError.message || 'Could not submit code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="dashboard-page"><p role="status">Loading challenge...</p></div>;
  }

  return (
    <div className="dashboard-page coding-workspace">
      <div className="dashboard-header">
        <div>
          <p className="exam-kicker">{challenge?.difficulty || 'Challenge'}</p>
          <h1>{challenge?.title || 'Coding Challenge'}</h1>
        </div>
        <Link to="/student/coding" className="dashboard-action">All Challenges</Link>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      {challenge && (
        <div className="coding-workspace-grid">
          <section className="coding-problem dashboard-card">
            <h2>Problem</h2>
            <p>{challenge.description}</p>
            <h3>Input Format</h3>
            <p>{challenge.input_format}</p>
            <h3>Output Format</h3>
            <p>{challenge.output_format}</p>
            <h3>Constraints</h3>
            <p className="coding-constraints">{challenge.constraints}</p>
            <h3>Sample Cases</h3>
            {sampleCases.map((testCase, index) => (
              <div className="coding-sample-case" key={testCase.test_case_id}>
                <strong>Sample {index + 1}</strong>
                <span>Input</span>
                <pre>{testCase.input_data}</pre>
                <span>Output</span>
                <pre>{testCase.expected_output}</pre>
              </div>
            ))}
          </section>

          <section className="coding-editor-panel dashboard-card">
            <div className="coding-editor-toolbar">
              <label htmlFor="coding-language">Language</label>
              <select id="coding-language" value={language} onChange={updateLanguage}>
                <option>Java</option>
                <option>Python</option>
                <option>C</option>
              </select>
            </div>
            <label className="sr-only" htmlFor="coding-source">Source code</label>
            <textarea
              id="coding-source"
              className="coding-editor"
              ref={editorRef}
              spellCheck="false"
              autoCapitalize="off"
              autoCorrect="off"
              value={sourceCode}
              onKeyDown={handleEditorKeyDown}
              onChange={(event) => setSourceCode(event.target.value)}
            />
            <div className="coding-editor-actions">
              <button type="button" className="exam-secondary-action" onClick={runCode} disabled={isRunning || isSubmitting}>
                {isRunning ? 'Running...' : 'Run Code'}
              </button>
              <button type="button" className="dashboard-action" onClick={submitCode} disabled={isSubmitting || isRunning}>
                {isSubmitting ? 'Submitting...' : 'Submit Code'}
              </button>
            </div>

            {runResult && (
              <section className="coding-result" aria-live="polite">
                <h2>Execution Result: {runResult.execution_status}</h2>
                {runResult.results.map((result) => (
                  <article className="coding-test-result" key={result.test_case}>
                    <div className="coding-test-result-header">
                      <strong>Sample Test {result.test_case}</strong>
                      <span>{result.status}</span>
                    </div>
                    <div className="coding-result-columns">
                      <div><span>Output</span><pre>{result.error_output || result.output || '(no output)'}</pre></div>
                      <div><span>Expected</span><pre>{result.expected_output}</pre></div>
                    </div>
                    <p>Execution time: {result.execution_time ?? 'N/A'} s</p>
                  </article>
                ))}
              </section>
            )}

            {submission && (
              <section className="coding-result coding-submission-result" aria-live="polite">
                <h2>Submission Result</h2>
                <p><strong>Status:</strong> {submission.status}</p>
                <p><strong>Score:</strong> {submission.score} / 100</p>
                <p><strong>Test cases:</strong> {submission.passed_tests} / {submission.total_tests} passed</p>
                <p><strong>Execution time:</strong> {submission.execution_time ?? 'N/A'} s</p>
              </section>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default StudentCodingChallenge;