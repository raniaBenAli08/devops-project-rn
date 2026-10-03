import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmployeeEmail } from '../api/registrations';
import { useLocale } from '../contexts/LocaleContext';

const VerifyEmailPage: React.FC = () => {
  const { t } = useLocale();
  const [params] = useSearchParams();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const verificationStarted = useRef(false);

  useEffect(() => {
    const token = params.get('token');
    if (verificationStarted.current) {
      return;
    }
    verificationStarted.current = true;
    if (!token) {
      setState('error');
      setMessage(t('This verification link is invalid.'));
      return;
    }
    verifyEmployeeEmail(token)
      .then((response) => {
        setState('success');
        setMessage(response.message);
      })
      .catch((error: any) => {
        setState('error');
        setMessage(error.response?.data?.message || t('This verification link is invalid or expired.'));
      });
  }, [params, t]);

  return (
    <div className="login-page">
      <section className="login-form-panel mx-auto w-full">
        <div className="login-form-card text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-3xl">
            {state === 'loading' ? '…' : state === 'success' ? '✓' : '!'}
          </div>
          <h2>{state === 'loading' ? t('Verifying your email...') : state === 'success' ? t('Email verified') : t('Verification failed')}</h2>
          <p className="mt-3">{message}</p>
          {state !== 'loading' && <Link className="mt-6 inline-block font-semibold text-blue-600 hover:underline" to="/login">{t('Back to sign in')}</Link>}
        </div>
      </section>
    </div>
  );
};

export default VerifyEmailPage;
