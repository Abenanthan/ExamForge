import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import '../App.css';

const optionLabels = ['A', 'B', 'C', 'D'];

function CreateQuestion() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [options, setOptions] = useState({ A: '', B: '', C: '', D: '' });
  const [correctOption, setCorrectOption] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadExams = async () => {
      try {
        const data = await apiFetch('/api/exams');

        setExams(data.exams);
      } catch (loadError) {
        setError(loadError.message || 'Cannot connect to the server.');
      } finally {
        setIsLoading(false);
      }
    };

    loadExams();
  }, []);

  const handleOptionChange = (label, value) => {
    setOptions((currentOptions) => ({
      ...currentOptions,
      [label]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (
      !examId ||
      !questionText.trim() ||
      !topic.trim() ||
      optionLabels.some((label) => !options[label].trim()) ||
      !correctOption
    ) {
      setError('Select an exam, enter the question and topic, complete all four options, and select the correct option.');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await apiFetch('/api/questions', {
        method: 'POST',
        body: JSON.stringify({
          exam_id: Number(examId),
          question_text: questionText,
          topic,
          difficulty,
          options,
          correct_option: correctOption
        })
      });

      navigate('/admin-dashboard', {
        state: { message: `Question created successfully (ID ${data.question_id}).` }
      });
    } catch (submitError) {
      setError(submitError.message || 'Could not create question.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page create-exam-page">
      <section className="login-card create-exam-card question-form-card">
        <div className="login-header">
          <h1>Add Question</h1>
          <p>Add a multiple-choice question to an exam.</p>
        </div>

        {isLoading ? (
          <p role="status">Loading exams...</p>
        ) : exams.length === 0 ? (
          <div className="question-empty-state">
            <p>No exams are available yet. Create an exam before adding questions.</p>
            <Link to="/admin/exams/create" className="dashboard-action">
              Create Exam
            </Link>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="question-exam">Exam</label>
              <select
                id="question-exam"
                value={examId}
                onChange={(event) => setExamId(event.target.value)}
                required
              >
                <option value="">Select an exam</option>
                {exams.map((exam) => (
                  <option key={exam.exam_id} value={exam.exam_id}>
                    {exam.title} ({exam.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="question-text">Question</label>
              <textarea
                id="question-text"
                rows="4"
                value={questionText}
                onChange={(event) => setQuestionText(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="question-topic">Topic</label>
              <input
                id="question-topic"
                type="text"
                maxLength={100}
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="question-difficulty">Difficulty</label>
              <select
                id="question-difficulty"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <fieldset className="question-options">
              <legend>Options</legend>
              {optionLabels.map((label) => (
                <div className="form-group" key={label}>
                  <label htmlFor={`option-${label}`}>Option {label}</label>
                  <input
                    id={`option-${label}`}
                    type="text"
                    maxLength={500}
                    value={options[label]}
                    onChange={(event) => handleOptionChange(label, event.target.value)}
                    required
                  />
                </div>
              ))}
            </fieldset>

            <div className="form-group">
              <label htmlFor="correct-option">Correct option</label>
              <select
                id="correct-option"
                value={correctOption}
                onChange={(event) => setCorrectOption(event.target.value)}
                required
              >
                <option value="">Select the correct option</option>
                {optionLabels.map((label) => (
                  <option value={label} key={label}>{label}</option>
                ))}
              </select>
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}

            <button className="login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Add Question'}
            </button>
          </form>
        )}

        {!isLoading && error && exams.length === 0 && (
          <p className="form-error" role="alert">{error}</p>
        )}

        <div className="login-footer">
          <Link to="/admin-dashboard">Back to Admin Dashboard</Link>
        </div>
      </section>
    </div>
  );
}

export default CreateQuestion;