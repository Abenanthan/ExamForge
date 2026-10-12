import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateExam from './pages/CreateExam';
import CreateQuestion from './pages/CreateQuestion';
import StudentExams from './pages/StudentExams';
import TakeExam from './pages/TakeExam';
import StudentResult from './pages/StudentResult';
import StudentPerformance from './pages/StudentPerformance';
import StudentRecommendations from './pages/StudentRecommendations';
import PracticeQuiz from './pages/PracticeQuiz';
import AdminAnalytics from './pages/AdminAnalytics';
import StudentCodingChallenges from './pages/StudentCodingChallenges';
import StudentCodingChallenge from './pages/StudentCodingChallenge';
import StudentCodingSubmissions from './pages/StudentCodingSubmissions';
import AdminCoding from './pages/AdminCoding';
import StudentAptitude from './pages/StudentAptitude';
import StudentAptitudePractice from './pages/StudentAptitudePractice';
import AdminAptitude from './pages/AdminAptitude';
import ProtectedRoute from './components/ProtectedRoute';
import AppNavbar from './components/AppNavbar';

import StudentAIChatbot from './components/StudentAIChatbot';

const THEME_STORAGE_KEY = 'examforge-theme';

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <BrowserRouter>
      <div className="app">
        <AppNavbar theme={theme} onToggleTheme={toggleTheme} />
        <Routes>

        {/* Home Page */}
        <Route path="/" element={<Home />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute role="student" />}>
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/student/exams" element={<StudentExams />} />
          <Route path="/student/exam/:examId" element={<TakeExam />} />
          <Route path="/student/result/:attemptId" element={<StudentResult />} />
          <Route path="/student/performance" element={<StudentPerformance />} />
          <Route path="/student/recommendations" element={<StudentRecommendations />} />
          <Route path="/student/practice" element={<PracticeQuiz />} />
          <Route path="/student/coding" element={<StudentCodingChallenges />} />
          <Route path="/student/coding/:challengeId" element={<StudentCodingChallenge />} />
          <Route path="/student/coding/submissions" element={<StudentCodingSubmissions />} />
          <Route path="/student/coding/submissions/:submissionId" element={<StudentCodingSubmissions />} />
          <Route path="/student/aptitude" element={<StudentAptitude />} />
          <Route path="/student/aptitude/history" element={<StudentAptitude />} />
          <Route path="/student/aptitude/performance" element={<StudentAptitude />} />
          <Route path="/student/aptitude/:categoryId" element={<StudentAptitude />} />
          <Route path="/student/aptitude/topic/:topicId" element={<StudentAptitude />} />
          <Route path="/student/aptitude/topic/:topicId/notes" element={<StudentAptitude />} />
          <Route path="/student/aptitude/topic/:topicId/practice" element={<StudentAptitudePractice />} />
          <Route path="/student/aptitude/practice/result/:resultAttemptId" element={<StudentAptitudePractice />} />
          <Route path="/student/aptitude/topic/:topicId/quiz" element={<StudentAptitude />} />
          <Route path="/student/aptitude/result/:attemptId" element={<StudentAptitude />} />
        </Route>

        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/exams/create" element={<CreateExam />} />
          <Route path="/admin/questions/create" element={<CreateQuestion />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/coding" element={<AdminCoding />} />
          <Route path="/admin/aptitude" element={<AdminAptitude />} />
        </Route>

        </Routes>
        <StudentAIChatbot />
      </div>
    </BrowserRouter>
  );
}

export default App;