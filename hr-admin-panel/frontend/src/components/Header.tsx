import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { askAssistant } from '../api/assistant';
import { useState } from 'react';
import axios from 'axios';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const username = user?.username || 'User';
  const initials = username.slice(0, 2).toUpperCase();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState('');

  const submitQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!question.trim()) return;
    setAssistantLoading(true);
    setAssistantError('');
    try {
      setAnswer(await askAssistant(question.trim()));
    } catch (error) {
      console.error('Assistant request failed:', error);
      if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
        setAssistantError(t('Please sign in again to use the assistant.'));
        return;
      }
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        setAssistantError(typeof message === 'string' ? message : t('The assistant is temporarily unavailable.'));
      } else {
        setAssistantError(t('The assistant is temporarily unavailable.'));
      }
    } finally {
      setAssistantLoading(false);
    }
  };

  return (
    <header className="app-header">
      <div className="header-spacer" />
      <div className="header-actions">
        <button type="button" className="assistant-trigger" onClick={() => setAssistantOpen(true)}>
          ✨ {t('Assistant')}
        </button>
        <div className="locale-switch" role="group" aria-label={t('Language')}>
          <button type="button" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>EN</button>
          <button type="button" aria-pressed={locale === 'fr'} onClick={() => setLocale('fr')}>FR</button>
        </div>
        {assistantOpen && (
          <div className="assistant-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setAssistantOpen(false)}>
            <section className="assistant-dialog" role="dialog" aria-modal="true" aria-labelledby="assistant-title">
              <div className="assistant-dialog-header">
                <div><h2 id="assistant-title">{t('HR Assistant')}</h2><p>{t('Ask about your HR data in natural language.')}</p></div>
                <button type="button" onClick={() => setAssistantOpen(false)} aria-label={t('Close')}>×</button>
              </div>
              <div className="assistant-suggestions">
                {['Combien j’ai payé en septembre ?', 'Qui a le plus d’absences ce mois ?'].map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => setQuestion(suggestion)}>{suggestion}</button>
                ))}
              </div>
              {answer && <div className="assistant-answer">{answer}</div>}
              {assistantError && <div className="assistant-error" role="alert">{assistantError}</div>}
              <form onSubmit={submitQuestion} className="assistant-form">
                <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={t('Ask a question...')} />
                <button type="submit" disabled={assistantLoading || !question.trim()}>{assistantLoading ? t('Loading...') : t('Ask')}</button>
              </form>
            </section>
          </div>
        )}
        <details className="profile-menu">
          <summary aria-label={t('Account menu')}>
            <span className="user-avatar" aria-hidden="true">{initials}</span>
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor">
              <path d="m5 7 5 5 5-5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <div className="profile-menu-panel">
            <div className="profile-menu-name">{username}</div>
            <div className="profile-menu-role">{user?.role ? t(user.role) : ''}</div>
            <button type="button" onClick={logout} className="logout-button">{t('Sign out')}</button>
          </div>
        </details>
      </div>
    </header>
  );
};

export default Header;
