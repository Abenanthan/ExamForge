import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../App.css';

function Home() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  return (
    <main className="home-page">
      {/* HERO SECTION */}
      <section className="hero home-hero">
        <div className="hero-layout page-container">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-rule" />LEARN WITH INTENTION</p>
            <h1>Test Your Knowledge.<br /><span>Improve Your Skills.</span></h1>
            <p className="hero-description">
              ExamForge is an intelligent online examination and learning platform that helps students identify weak areas, practice smarter, and achieve subject mastery.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="button button-primary button-large">Get Started <span aria-hidden="true">→</span></Link>
              <a href="#features" className="button button-quiet button-large">Explore Features</a>
            </div>
            <div className="hero-proof"><span className="proof-mark">✓</span> Exams, analytics, practice, and AI guidance in one place</div>
          </div>

          <div className="hero-visual" aria-label="Sample ExamForge learning dashboard preview">
            <div className="preview-orbit preview-orbit-one" />
            <div className="preview-orbit preview-orbit-two" />
            <div className="preview-window">
              <div className="preview-window-top">
                <div className="preview-brand-mini"><span className="brand-mark brand-mark-small">EF</span><span>Learning Overview</span></div>
                <span className="preview-period">SAMPLE SESSION</span>
              </div>
              <div className="preview-score-block">
                <div><span className="preview-label">Overall score</span><strong>84<span>%</span></strong><small><b>+8%</b> compared with last attempt</small></div>
                <div className="score-ring"><span>84%</span></div>
              </div>
              <div className="preview-bar-row">
                {[['Quantitative Aptitude', '78%'], ['Logical Reasoning', '90%'], ['Web Programming', '84%']].map(([label, width]) => (
                  <div key={label} className="preview-bar-item">
                    <div className="preview-bar-heading"><span>{label}</span><b>{width}</b></div>
                    <div className="preview-bar-track"><span style={{ width }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="home-features-section">
        <div className="page-container">
          <div className="section-heading">
            <p className="eyebrow"><span className="eyebrow-rule" />FEATURES</p>
            <h2>Everything you need to<br /><span>assess and improve.</span></h2>
            <p className="section-subtitle">Comprehensive tools designed to guide your learning from initial assessment to full topic mastery.</p>
          </div>
          <div className="features-grid">
            {[
              ['📋', 'Online Exams', 'Timed syllabus assessments with authoritative server-side scoring and detailed topic breakdowns.'],
              ['📊', 'Performance Analysis', 'Automatic topic-wise accuracy metrics with Strong, Needs Improvement, and Weak classification.'],
              ['🤖', 'Grok AI Guidance', 'Intelligent AI-driven insights that analyze your strengths and formulate actionable study recommendations.'],
              ['🎯', 'Personalized Practice', 'Targeted practice quizzes automatically generated for your specific weak topics.'],
              ['📈', 'Improvement Tracking', 'Track score growth across multiple sessions with instant comparison against prior performance.'],
              ['💻', 'Aptitude & Coding', 'Comprehensive placement aptitude practice and automated multi-language coding challenges.']
            ].map(([icon, title, description]) => (
              <article className="feature-item" key={title}>
                <span className="feature-icon">{icon}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="home-how-it-works-section">
        <div className="page-container">
          <div className="section-heading">
            <p className="eyebrow"><span className="eyebrow-rule" />HOW IT WORKS</p>
            <h2>Your 6-Step Learning &<br /><span>Improvement Loop</span></h2>
            <p className="section-subtitle">A proven methodology to continuously diagnose weaknesses and elevate your knowledge.</p>
          </div>
          <div className="how-it-works-grid">
            {[
              ['1', 'Take an Exam', 'Complete a timed syllabus assessment to test your initial baseline knowledge across all units.'],
              ['2', 'Analyze Performance', 'Review your detailed score breakdown to instantly see which topics need more focus.'],
              ['3', 'Get Grok AI Guidance', 'Receive custom AI insights highlighting priority study areas and strategic advice.'],
              ['4', 'Practice Weak Topics', 'Solve targeted practice questions created specifically to strengthen your weak topics.'],
              ['5', 'Track Improvement', 'Compare your new practice scores against prior baseline performance to verify progress.'],
              ['6', 'Updated Recommendations', 'Watch your topic priorities automatically shift to new areas as you achieve mastery.']
            ].map(([step, title, description]) => (
              <article className="step-item" key={step}>
                <div className="step-number">{step}</div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="home-cta-section">
        <div className="page-container home-cta">
          <div>
            <p className="eyebrow eyebrow-light">YOUR NEXT STEP STARTS HERE</p>
            <h2>Ready to improve your skills?</h2>
            <p>Start learning with ExamForge today.</p>
          </div>
          <Link to="/register" className="button button-light button-large">Create your account <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <footer className="home-footer">
        <div className="page-container">
          <Link to="/" className="app-brand"><span className="brand-mark">EF</span><span>ExamForge</span></Link>
          <span>© 2026 ExamForge</span>
        </div>
      </footer>
    </main>
  );
}

export default Home;