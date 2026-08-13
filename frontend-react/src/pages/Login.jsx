import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/context';
import { complete2FALogin } from '../api/api';
import logo from '/logo-nuevo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  const [twoFactorTempToken, setTwoFactorTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [showSuspendPopup, setShowSuspendPopup] = useState(false);
  const { login } = useAuth();
  const { t, lang, toggleLang } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    window.onTurnstileSuccess = (token) => { setCaptchaToken(token); setCaptchaError(''); };
    window.onTurnstileError = () => { setCaptchaError(t('login.captchaError')); setCaptchaToken(''); };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError(t('login.completeFields')); return; }
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password, captchaToken);
      if (result.error) {
        if (result.suspensionReason) {
          setSuspendReason(result.suspensionReason);
          setShowSuspendPopup(true);
        } else {
          setError(result.error);
        }
        if (window.turnstile) { window.turnstile.reset('#cf-turnstile-login'); setCaptchaToken(''); }
      } else if (result.requireTwoFactor) {
        setTwoFactorTempToken(result.tempToken);
      } else if (result.success) {
        navigate('/dashboard');
      }
    } catch (e) { setError(t('login.error') + e.message); }
    setLoading(false);
  };

  const handleComplete2FA = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) { setTwoFactorError('Ingresa el código de 6 dígitos'); return; }
    setTwoFactorError('');
    setTwoFactorLoading(true);
    try {
      const result = await complete2FALogin(twoFactorTempToken, twoFactorCode);
      if (result.error) { setTwoFactorError(result.error); setTwoFactorLoading(false); return; }
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      window.dispatchEvent(new Event('auth-change'));
      navigate('/dashboard');
    } catch (e) { setTwoFactorError('Error de conexión'); }
    setTwoFactorLoading(false);
  };

  const handlePasskeyLogin = async () => {
    if (!window.navigator.credentials || !window.PublicKeyCredential) { setError(t('login.passkeyNotSupported')); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/passkey/beginLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      if (!data.options) { setError(t('login.invalidServerResponse')); setLoading(false); return; }

      const credential = await window.navigator.credentials.get({
        publicKey: {
          challenge: base64urlToArrayBuffer(data.options.challenge),
          allowCredentials: (data.options.allowCredentials || []).map(c => ({
            id: base64urlToArrayBuffer(c.id), type: c.type, transports: c.transports,
          })),
          timeout: data.options.timeout || 60000,
        },
      });

      if (!credential) { setError(t('login.passkeyAuthFailed')); setLoading(false); return; }

      const finishRes = await fetch('/api/passkey/finishLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          credential: {
            id: credential.id,
            rawId: arrayBufferToBase64url(credential.rawId),
            response: {
              authenticatorData: arrayBufferToBase64url(credential.response.authenticatorData),
              clientDataJSON: arrayBufferToBase64url(credential.response.clientDataJSON),
              signature: arrayBufferToBase64url(credential.response.signature),
              userHandle: credential.response.userHandle ? arrayBufferToBase64url(credential.response.userHandle) : null,
            },
            type: credential.type,
          },
          sessionData: data.sessionData,
        }),
      });
      const finishData = await finishRes.json();
      if (finishData.error) { setError(finishData.error); setLoading(false); return; }

      localStorage.setItem('token', finishData.token);
      localStorage.setItem('user', JSON.stringify(finishData.user));
      window.dispatchEvent(new Event('auth-change'));
      navigate(finishData.user.isActive ? '/dashboard' : '/plans');
    } catch (e) { setError(t('login.passkeyLoginFailed') + e.message); }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) { setResetError(t('login.pleaseEnterEmail')); return; }
    setResetting(true);
    setResetError('');
    setResetSuccess(false);
    await new Promise(r => setTimeout(r, 1000));
    setResetSuccess(true);
    setResetEmail('');
    setResetting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0b0f]">
      {/* Language Switcher */}
      <button onClick={toggleLang} className="fixed top-4 right-4 z-50 text-[11px] px-2 py-1 rounded bg-[#1a1a1f] border border-[#1f2937] text-text-muted hover:text-text-heading transition-colors">
        {lang === 'es' ? t('admin.switchToEnglish') : t('admin.switchToSpanish')}
      </button>
      <div className="w-full max-w-sm px-6">
        <div className="flex flex-col items-center mb-8">
          <div className="w-18 h-18 mb-4 flex items-center justify-center">
            <img src={logo} alt="SecureLab" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{t('nav.login')}</h1>
          <p className="text-sm text-text-muted">{t('login.subtitle')}</p>
        </div>

        {twoFactorTempToken ? (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </div>
              <h2 className="text-[16px] font-bold text-white mb-1">Verificación en Dos Pasos</h2>
              <p className="text-[12px] text-text-muted">Ingresa el código de 6 dígitos de tu aplicación de autenticación</p>
            </div>
            <div>
              <input value={twoFactorCode} onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6}
                className="w-full bg-[#0f1419] border border-[#1f2937] text-[20px] font-mono text-white rounded-md px-4 py-3 text-center tracking-[10px] focus:outline-none focus:border-emerald-500/50 placeholder-text-subtle"
                placeholder="000000" />
            </div>
            {twoFactorError && <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-xs text-center">{twoFactorError}</div>}
            <button onClick={handleComplete2FA} disabled={twoFactorLoading || twoFactorCode.length !== 6}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
              {twoFactorLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Verificando...
                </span>
              ) : 'Verificar Código'}
            </button>
            <button type="button" onClick={() => { setTwoFactorTempToken(''); setTwoFactorCode(''); setTwoFactorError(''); }}
              className="w-full text-xs text-text-muted hover:text-text-body transition-colors">
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-text-body mb-1.5">{t('login.email')}</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                    </svg>
                  </div>
                  <input value={email} onChange={e => setEmail(e.target.value)}
                    type="email" required
                    className="w-full bg-[#0f1419] border border-[#1f2937] rounded-md pl-9 pr-3 py-2 text-sm text-white placeholder-text-subtle focus:outline-none focus:border-[#3b82f6] transition-colors"
                    placeholder={t('login.emailPlaceholder')} />
                </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-text-body">{t('login.password')}</label>
                <button type="button" onClick={() => setShowForgotPasswordModal(true)} className="text-xs text-[#3b82f6] hover:text-blue-400">
                  {t('login.forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <input value={password} onChange={e => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'} required
                  className="w-full bg-[#0f1419] border border-[#1f2937] rounded-md pl-9 pr-10 py-2 text-sm text-white placeholder-text-subtle focus:outline-none focus:border-[#3b82f6] transition-colors"
                  placeholder={t('login.passwordPlaceholder')} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-body">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/></>
                    ) : (
                      <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <div id="cf-turnstile-login" className="cf-turnstile" data-sitekey="0x4AAAAAAD4bBqtEEyeh9-4J" data-theme="dark"
                data-callback="onTurnstileSuccess" data-error-callback="onTurnstileError"></div>
            </div>
            {captchaError && <p className="text-red-400 text-xs text-center">{captchaError}</p>}

            {error && <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-xs">{error}</div>}

            <button type="submit" disabled={loading || !captchaToken}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('login.signingIn')}
                </span>
              ) : (
                <><span>{t('login.signIn')}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>

            <button type="button" onClick={handlePasskeyLogin} disabled={loading}
              className="w-full bg-[#1a1a1f] hover:bg-[#252530] border border-[#1f2937] text-white text-sm font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
              </svg>
              <span>{t('login.passkey')}</span>
            </button>

            <p className="text-center text-xs text-text-muted pt-2">
              {t('login.agreeTerms')}{' '}
              <button type="button" onClick={() => setShowTermsModal(true)} className="text-[#3b82f6] hover:text-blue-400">{t('login.termsOfService')}</button>
            </p>
            <p className="text-center text-xs text-text-muted">
              {t('login.noAccount')}{' '}
              <Link to="/register" className="text-[#3b82f6] hover:text-blue-400 font-medium">{t('login.registerHere')}</Link>
            </p>
          </form>
        )}
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b0b0f] border border-[#1a1a1f] rounded-lg w-full max-w-md">
            <div className="px-5 py-4 border-b border-[#1a1a1f] flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-semibold text-text-heading">{t('login.forgotTitle')}</h3>
                <p className="text-[10px] text-text-muted">{t('login.forgotDesc')}</p>
              </div>
              <button onClick={() => setShowForgotPasswordModal(false)} className="text-text-muted hover:text-text-heading">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">{t('login.email')}</label>
                <input value={resetEmail} onChange={e => setResetEmail(e.target.value)} type="email" placeholder={t('login.emailPlaceholder')}
                  className="w-full bg-[#0f0f14] border border-[#1a1a1f] rounded px-3 py-2.5 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-[#3b82f6]" />
              </div>
              {resetSuccess && <div className="p-3 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-[11px]">{t('login.resetSuccess')}</div>}
              {resetError && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-[11px]">{resetError}</div>}
            </div>
            <div className="px-5 py-4 border-t border-[#1a1a1f] flex justify-end space-x-2">
              <button onClick={() => setShowForgotPasswordModal(false)}
                className="px-4 py-2 bg-[#1a1a1f] hover:bg-[#252530] text-white text-[12px] rounded transition-colors">{t('login.cancel')}</button>
              <button onClick={handleForgotPassword} disabled={!resetEmail || resetting}
                className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[12px] rounded transition-colors disabled:opacity-50">
                {resetting ? t('login.sending') : t('login.sendReset')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b0b0f] border border-[#1a1a1f] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[#1a1a1f] flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-[15px] font-semibold text-text-heading">{t('terms.title')}</h3>
                <p className="text-[11px] text-text-muted">{t('terms.lastUpdated')}</p>
              </div>
              <button onClick={() => setShowTermsModal(false)} className="text-text-muted hover:text-text-heading">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-6 text-[12px] text-text-body">
              <section><h4 className="text-[13px] font-semibold text-white mb-3">{t('terms.section1Title')}</h4>
                <p className="mb-2">{t('terms.section1Desc')}</p>
                <p>{t('terms.section1Desc2')}</p>
              </section>
              <section><h4 className="text-[13px] font-semibold text-white mb-3">{t('terms.section2Title')}</h4>
                <p className="mb-2">{t('terms.section2Desc')}</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t('terms.section2Item1')}</li><li>{t('terms.section2Item2')}</li>
                  <li>{t('terms.section2Item3')}</li><li>{t('terms.section2Item4')}</li>
                  <li>{t('terms.section2Item5')}</li><li>{t('terms.section2Item6')}</li>
                </ul>
              </section>
              <section><h4 className="text-[13px] font-semibold text-white mb-3">{t('terms.section3Title')}</h4>
                <p className="mb-2">{t('terms.section3Desc')}</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t('terms.section3Item1')}</li><li>{t('terms.section3Item2')}</li>
                  <li>{t('terms.section3Item3')}</li>
                  <li>{t('terms.section3Item4')}</li>
                  <li>{t('terms.section3Item5')}</li><li>{t('terms.section3Item6')}</li>
                </ul>
              </section>
              <section><h4 className="text-[13px] font-semibold text-white mb-3">{t('terms.section4Title')}</h4>
                <p>{t('terms.section4Desc')}</p>
              </section>
              <section><h4 className="text-[13px] font-semibold text-white mb-3">{t('terms.section5Title')}</h4>
                <p className="mb-2">{t('terms.section5Desc')}</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t('terms.section5Item1')}</li><li>{t('terms.section5Item2')}</li>
                  <li>{t('terms.section5Item3')}</li>
                  <li>{t('terms.section5Item4')}</li><li>{t('terms.section5Item5')}</li>
                </ul>
              </section>
              <section><h4 className="text-[13px] font-semibold text-white mb-3">{t('terms.section6Title')}</h4><p>{t('terms.section6Desc')}</p></section>
              <section><h4 className="text-[13px] font-semibold text-white mb-3">{t('terms.section7Title')}</h4><p>{t('terms.section7Desc')}</p></section>
              <section><h4 className="text-[13px] font-semibold text-white mb-3">{t('terms.section8Title')}</h4><p>{t('terms.section8Desc')}</p></section>
              <section><h4 className="text-[13px] font-semibold text-white mb-3">{t('terms.section9Title')}</h4><p>{t('terms.section9Desc')}</p></section>
              <section><h4 className="text-[13px] font-semibold text-white mb-3">{t('terms.section10Title')}</h4><p>{t('terms.section10Desc')}</p></section>
              <section><h4 className="text-[13px] font-semibold text-white mb-3">{t('terms.section11Title')}</h4><p>{t('terms.section11Desc')}</p></section>
              <section><h4 className="text-[13px] font-semibold text-white mb-3">{t('terms.section12Title')}</h4>
                <p className="mb-2">{t('terms.section12Desc')}</p>
                <ul className="list-none space-y-1 ml-4">
                  <li>{t('terms.section12Email')}</li><li>{t('terms.section12Phone')}</li>
                  <li>{t('terms.section12Address')}</li>
                </ul>
              </section>
              <section><h4 className="text-[13px] font-semibold text-white mb-3">{t('terms.section13Title')}</h4><p>{t('terms.section13Desc')}</p></section>
              <section><h4 className="text-[13px] font-semibold text-white mb-3">{t('terms.section14Title')}</h4><p>{t('terms.section14Desc')}</p></section>
              <section><h4 className="text-[13px] font-semibold text-white mb-3">{t('terms.section15Title')}</h4><p>{t('terms.section15Desc')}</p></section>
              <section><h4 className="text-[13px] font-semibold text-white mb-3">{t('terms.section16Title')}</h4><p>{t('terms.section16Desc')}</p></section>
              <section><h4 className="text-[13px] font-semibold text-white mb-3">{t('terms.section17Title')}</h4><p>{t('terms.section17Desc')}</p></section>
              <section><h4 className="text-[13px] font-semibold text-white mb-3">{t('terms.section18Title')}</h4><p>{t('terms.section18Desc')}</p></section>
            </div>
            <div className="px-6 py-4 border-t border-[#1a1a1f] flex justify-end flex-shrink-0">
              <button onClick={() => setShowTermsModal(false)}
                className="px-6 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[12px] rounded transition-colors">{t('terms.accept')}</button>
            </div>
          </div>
        </div>
      )}

      {showSuspendPopup && (
        <div className="fixed inset-0 bg-bg-overlay flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f13] border border-[#1a1a1f] rounded-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-[#1a1a1f] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-text-heading">Cuenta desactivada</h3>
                <p className="text-[11px] text-text-muted">No puedes iniciar sesi\u00F3n en este momento</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-[12px] text-text-body mb-4">
                Tu cuenta ha sido deshabilitada por el siguiente motivo:
              </p>
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">
                <p className="text-[12px] text-red-400 font-medium">{suspendReason}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#1a1a1f] flex justify-end">
              <button onClick={() => setShowSuspendPopup(false)}
                className="px-6 py-2 bg-[#1a1a1f] hover:bg-[#252530] text-white text-[12px] rounded transition-colors">
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function base64urlToArrayBuffer(base64url) {
  const padding = '='.repeat((4 - base64url.length % 4) % 4);
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
  const rawData = window.atob(base64);
  return new Uint8Array(rawData.split('').map(c => c.charCodeAt(0)));
}

function arrayBufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
