import { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { isLoggedIn, getUser } from '../utils/auth';
import '../App.css';

const QUICK_PROMPTS = [
  'How can I improve my weak topics?',
  'What should I study next?',
  'Explain React Hooks simply.',
  'Give me 5 practice tips for aptitude.'
];

function StudentAIChatbot() {
  const user = isLoggedIn() ? getUser() : null;
  const isStudent = user?.role === 'student';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I am your ExamForge AI Study Assistant. Ask me anything about your syllabus, weak topics, or personalized study plans!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  if (!isStudent) {
    return null;
  }

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setError('');
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    // Prepare history payload for API (last 6 messages)
    const historyPayload = updatedMessages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content
    }));

    try {
      const data = await apiFetch('/api/student/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          history: historyPayload
        })
      });

      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'I am ready to help you study!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err.message || 'Unable to connect to AI Study Assistant.');
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: 'I am having trouble reaching the AI service right now. Please check your Performance tab or Practice section to continue studying!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-chatbot-wrapper">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          className="ai-chatbot-toggle-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open ExamForge AI Study Assistant"
        >
          <span className="chatbot-btn-icon">🤖</span>
          <span className="chatbot-btn-text">AI Assistant</span>
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <section className="ai-chatbot-card" aria-label="ExamForge AI Study Assistant Window">
          {/* Header */}
          <div className="ai-chatbot-header">
            <div className="ai-chatbot-brand">
              <span className="ai-brand-badge">🤖</span>
              <div>
                <h2>ExamForge AI Assistant</h2>
                <p>Personalized Study Mentor</p>
              </div>
            </div>
            <button
              type="button"
              className="ai-chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close AI Assistant"
            >
              ✕
            </button>
          </div>

          {/* Messages Body */}
          <div className="ai-chatbot-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-message-bubble ${msg.role === 'user' ? 'user-bubble' : 'ai-bubble'}`}
              >
                <div className="bubble-content">
                  <p>{msg.content}</p>
                  <span className="bubble-time">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="ai-message-bubble ai-bubble ai-typing-bubble">
                <div className="bubble-content">
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 2 && !isLoading && (
            <div className="ai-quick-prompts">
              <span className="quick-prompts-label">Suggested prompts:</span>
              <div className="quick-prompts-list">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="quick-prompt-chip"
                    onClick={() => handleSendMessage(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <form
            className="ai-chatbot-footer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              type="text"
              className="ai-chatbot-input"
              placeholder="Ask anything about your syllabus or weak topics..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              maxLength={1000}
            />
            <button
              type="submit"
              className="button button-primary ai-chatbot-send-btn"
              disabled={!inputMessage.trim() || isLoading}
            >
              Send
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

export default StudentAIChatbot;
