import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/context';
import logo from '/logo-nuevo.png';

const onboardingSteps = [
  {
    title: 'Datos de la Empresa',
    desc: 'Cuéntanos sobre tu empresa para adaptar la plataforma',
    fields: [
      { key: 'companyRut', label: 'RUT Empresa', placeholder: 'XX.XXX.XXX-X', type: 'text', optional: true },
      { key: 'companyName', label: 'Nombre de la Empresa', placeholder: 'Nombre legal de tu empresa', type: 'text' },
      { key: 'industry', label: 'Industria / Giro', placeholder: 'Ej: Retail, Salud, Fintech', type: 'text', optional: true },
      { key: 'companySize', label: 'Tamaño de la Empresa', placeholder: 'Selecciona...', type: 'select', options: ['1-10 empleados', '11-50 empleados', '51-200 empleados', '201-1000 empleados', '1000+ empleados'] },
    ],
  },
  {
    title: 'Delegado de Protección de Datos (DPD)',
    desc: 'Designa la persona responsable del cumplimiento de la Ley 21.719 (Art. 28)',
    fields: [
      { key: 'dpdName', label: 'Nombre del DPD', placeholder: 'Nombre completo', type: 'text' },
      { key: 'dpdEmail', label: 'Email del DPD', placeholder: 'dpd@tuempresa.cl', type: 'email' },
      { key: 'dpdPhone', label: 'Teléfono del DPD', placeholder: '+56 9 XXXX XXXX', type: 'text', optional: true },
    ],
  },
  {
    title: 'Evaluación de Cumplimiento',
    desc: 'Estas preguntas nos ayudan a medir tu nivel de preparación',
    fields: [],
    questions: [
      { id: 'hasConsents', label: '¿Tienes consentimientos documentados de los titulares de datos?' },
      { id: 'hasInventory', label: '¿Tienes un inventario de datos personales?' },
      { id: 'hasDpd', label: '¿Has designado un DPD formalmente?' },
      { id: 'hasBreachPlan', label: '¿Tienes un protocolo de notificación de brechas?' },
      { id: 'hasEncryption', label: '¿Los datos sensibles están cifrados?' },
      { id: 'hasAccessControl', label: '¿Tienes control de acceso por roles?' },
    ],
  },
  {
    title: 'Guía de Conexión',
    desc: 'Pasos para conectar tu infraestructura a Invisia',
    fields: [],
    guide: [
      '1. Instala el agente Invisia en tus servidores (Windows, Linux o macOS)',
      '2. El agente se registrará automáticamente en tu panel',
      '3. Conecta tus bases de datos desde la sección "Bases de Datos"',
      '4. Configura los agentes para monitoreo en vivo',
      '5. Revisa los reportes de cumplimiento generados automáticamente',
    ],
  },
];

export default function Register() {
  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('register');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [registrationData, setRegistrationData] = useState(null);
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);
  const [passkeySkipped, setPasskeySkipped] = useState(false);
  const [onbStep, setOnbStep] = useState(0);
  const [onbData, setOnbData] = useState({});
  const [onbAnswers, setOnbAnswers] = useState({});
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const otpRefs = useRef([]);
  const { token } = useAuth();
  const { t, lang, toggleLang } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 'otp' && otpRefs.current[0]) otpRefs.current[0].focus();
  }, [step]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    window.onTurnstileSuccess = (token) => { setCaptchaToken(token); setCaptchaError(''); };
    window.onTurnstileError = () => { setCaptchaError('Error de verificación. Intenta de nuevo.'); setCaptchaToken(''); };
  }, []);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setOtpError('');
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'Enter') handleVerifyOtp();
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!companyName || !email || !password || !confirmPassword) {
      setError('Completa todos los campos obligatorios');
      return;
    }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setError('');
    setLoading(true);
    if (!captchaToken) { setError('Completa la verificación de seguridad'); setLoading(false); return; }
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, ...(domain ? { domain } : {}), email, password, captchaToken }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        if (window.turnstile) { window.turnstile.reset('#cf-turnstile-register'); setCaptchaToken(''); }
        setLoading(false);
        return;
      }
      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-change'));
        setShowPasskeyPrompt(true);
      } else {
        setRegistrationData(data.data || data);
        setStep('otp');
      }
    } catch (e) { setError('Error de conexión: ' + e.message); }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setOtpError('Código inválido'); return; }
    setLoading(true);
    setOtpError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (data.error) { setOtpError(data.error); setLoading(false); return; }
      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-change'));
        setShowPasskeyPrompt(true);
      }
    } catch (e) { setOtpError('Error de conexión'); }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    if (otpRefs.current[0]) otpRefs.current[0].focus();
    setLoading(false);
  };

  const setupPasskey = async () => {
    if (!window.navigator.credentials || !window.PublicKeyCredential) { setShowPasskeyPrompt(false); setStep('onboarding'); return; }
    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const beginRes = await fetch('/api/passkey/beginRegistration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: userData.email }),
      });
      const beginData = await beginRes.json();
      if (beginData.error) { setLoading(false); setShowPasskeyPrompt(false); setStep('onboarding'); return; }

      const publicKey = {
        challenge: base64urlToArrayBuffer(beginData.options.challenge),
        rp: beginData.options.rp,
        user: {
          id: base64urlToArrayBuffer(beginData.options.user.id),
          name: beginData.options.user.name,
          displayName: beginData.options.user.displayName,
        },
        pubKeyCredParams: beginData.options.pubKeyCredParams,
        timeout: beginData.options.timeout,
        attestation: beginData.options.attestation,
        authenticatorSelection: beginData.options.authenticatorSelection || { authenticatorAttachment: 'platform', residentKey: 'required', userVerification: 'preferred' },
      };

      const credential = await window.navigator.credentials.create({ publicKey });
      if (!credential) { setLoading(false); setShowPasskeyPrompt(false); setStep('onboarding'); return; }

      await fetch('/api/passkey/finishRegistration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          email: userData.email,
          credential: {
            id: credential.id,
            rawId: arrayBufferToBase64url(credential.rawId),
            response: {
              clientDataJSON: arrayBufferToBase64url(credential.response.clientDataJSON),
              attestationObject: arrayBufferToBase64url(credential.response.attestationObject),
            },
            type: credential.type,
          },
          sessionData: beginData.sessionData,
        }),
      });
    } catch (e) { /* Passkey setup failed silently */ }
    setLoading(false);
    setShowPasskeyPrompt(false);
    setStep('onboarding');
  };

  const handlePasskeyLater = () => { setPasskeySkipped(true); setShowPasskeyPrompt(false); setStep('onboarding'); };

  const handleOnbFieldChange = (key, value) => {
    setOnbData(prev => ({ ...prev, [key]: value }));
  };

  const handleOnbAnswer = (id, value) => {
    setOnbAnswers(prev => ({ ...prev, [id]: value }));
  };

  const saveOnbStep = async () => {
    const currentStep = onbStep + 1;

    if (currentStep === 1) {
      await fetch('/api/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, step: 1, data: onbData }),
      });
    }

    if (currentStep === 3) {
      const score = Object.values(onbAnswers).filter(Boolean).length;
      const total = Object.keys(onbAnswers).length;
      await fetch('/api/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, step: 3, data: { answers: onbAnswers, score, total } }),
      });
    }
  };

  const nextOnbStep = async () => {
    await saveOnbStep();
    if (onbStep < onboardingSteps.length - 1) {
      setOnbStep(onbStep + 1);
    } else {
      // Finish onboarding
      await fetch('/api/onboarding/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      window.dispatchEvent(new Event('auth-change'));
      navigate('/dashboard');
    }
  };

  const prevOnbStep = () => {
    if (onbStep > 0) setOnbStep(onbStep - 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0b0f]">
      <button onClick={toggleLang} className="fixed top-4 right-4 z-50 text-[11px] px-2 py-1 rounded bg-[#1a1a1f] border border-border-theme text-text-muted hover:text-text-heading transition-colors">
        {lang === 'es' ? 'English' : 'Español'}
      </button>

      {step === 'register' && (
        <div className="w-full max-w-sm px-6">
          <div className="flex flex-col items-center mb-8">
            <div className="w-18 h-18 mb-4 flex items-center justify-center">
              <img src={logo} alt="SecureLab" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{t('register.title')}</h1>
            <p className="text-sm text-text-muted">{t('register.subtitle')}</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-body mb-1.5">{t('register.companyName')}</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                </div>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)} required
                  className="w-full bg-[#0f1419] border border-border-theme rounded-md pl-9 pr-3 py-2 text-sm text-white placeholder-text-subtle focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder={t('register.companyPlaceholder')} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-body mb-1.5">
                {t('register.domain')}
                <span className="text-text-subtle font-normal ml-1">(opcional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                  </svg>
                </div>
                <input value={domain} onChange={e => setDomain(e.target.value)} placeholder={t('register.domainPlaceholder')}
                  className="w-full bg-[#0f1419] border border-border-theme rounded-md pl-9 pr-3 py-2 text-sm text-white placeholder-text-subtle focus:outline-none focus:border-primary-500 transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-body mb-1.5">{t('register.email')}</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                  </svg>
                </div>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
                  className="w-full bg-[#0f1419] border border-border-theme rounded-md pl-9 pr-3 py-2 text-sm text-white placeholder-text-subtle focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder={t('register.emailPlaceholder')} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-body mb-1.5">{t('register.password')}</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" required
                  className="w-full bg-[#0f1419] border border-border-theme rounded-md pl-9 pr-3 py-2 text-sm text-white placeholder-text-subtle focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder={t('register.passwordPlaceholder')} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-body mb-1.5">{t('register.confirmPassword')}</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" required
                  className="w-full bg-[#0f1419] border border-border-theme rounded-md pl-9 pr-3 py-2 text-sm text-white placeholder-text-subtle focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder={t('register.confirmPlaceholder')} />
              </div>
            </div>

            {error && <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-xs">{error}</div>}

            <div id="cf-turnstile-register" className="cf-turnstile flex justify-center" data-sitekey="0x4AAAAAAD4bBqtEEyeh9-4J" data-theme="dark" data-callback="onTurnstileSuccess" data-error-callback="onTurnstileError" />
            {captchaError && <p className="text-red-400 text-xs text-center">{captchaError}</p>}

            <button type="submit" disabled={loading || !captchaToken}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('register.creating')}
                </span>
              ) : t('register.createAccount')}
            </button>

            <p className="text-center text-sm text-text-muted pt-2">
              {t('register.hasAccount')}{' '}
              <Link to="/" className="text-[#3b82f6] hover:text-blue-400 font-medium">{t('register.signIn')}</Link>
            </p>
          </form>
        </div>
      )}

      {step === 'otp' && (
        <div className="w-full max-w-sm px-6">
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-text-muted mb-1">{t('register.verifySent')}</p>
              <p className="text-sm text-white font-medium">{email}</p>
            </div>

            <div className="flex justify-center gap-2.5">
              {otp.map((digit, index) => (
                <input key={index} ref={el => otpRefs.current[index] = el}
                  value={digit} onChange={e => handleOtpChange(index, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(index, e)}
                  type="text" inputMode="numeric" maxLength={1}
                  className="w-10 h-12 bg-[#0f1419] border border-border-theme rounded-md text-center text-white text-lg font-medium focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-[#3b82f6] transition-colors" />
              ))}
            </div>

            {otpError && <p className="text-red-400 text-xs text-center">{otpError}</p>}

            <button onClick={handleVerifyOtp} disabled={loading || otp.join('').length !== 6}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('register.verifying')}
                </span>
              ) : t('register.verify')}
            </button>

            <div className="text-center">
              <button onClick={handleResendOtp} disabled={loading}
                className="text-xs text-[#3b82f6] hover:text-blue-400">{t('register.resend')}</button>
            </div>
          </div>
        </div>
      )}

      {step === 'onboarding' && (
        <div className="w-full max-w-lg px-6">
          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {onboardingSteps.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  i < onbStep ? 'bg-emerald-500 text-text-heading' :
                  i === onbStep ? 'bg-[#3b82f6] text-white ring-2 ring-[#3b82f6]/30' :
                  'bg-[#1a1a1f] text-text-subtle border border-border-theme'
                }`}>{i < onbStep ? '✓' : i + 1}</div>
                <span className={`text-[10px] hidden sm:inline ${i === onbStep ? 'text-text-heading' : 'text-text-subtle'}`}>{s.title}</span>
                {i < onboardingSteps.length - 1 && <div className={`w-8 h-px ${i < onbStep ? 'bg-emerald-500' : 'bg-bg-elevated'}`} />}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="bg-[#0f1419] border border-border-theme rounded-xl p-6">
            <h2 className="text-[16px] font-semibold text-white mb-1">{onboardingSteps[onbStep].title}</h2>
            <p className="text-[12px] text-text-muted mb-5">{onboardingSteps[onbStep].desc}</p>

            {/* Fields */}
            {onboardingSteps[onbStep].fields?.map(f => (
              <div key={f.key} className="mb-4">
                <label className="block text-[11px] font-medium text-text-muted mb-1">
                  {f.label}
                  {f.optional && <span className="text-text-subtle font-normal ml-1">(opcional)</span>}
                </label>
                {f.type === 'select' ? (
                  <select value={onbData[f.key] || ''} onChange={e => handleOnbFieldChange(f.key, e.target.value)}
                    className="w-full bg-[#0b0b0f] border border-border-theme rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors">
                    <option value="" className="text-text-subtle">{f.placeholder}</option>
                    {f.options.map(o => <option key={o} value={o} className="text-text-heading">{o}</option>)}
                  </select>
                ) : (
                  <input value={onbData[f.key] || ''} onChange={e => handleOnbFieldChange(f.key, e.target.value)}
                    type={f.type} placeholder={f.placeholder}
                    className="w-full bg-[#0b0b0f] border border-border-theme rounded-md px-3 py-2 text-sm text-white placeholder-text-subtle focus:outline-none focus:border-primary-500 transition-colors" />
                )}
              </div>
            ))}

            {/* Questions for step 3 */}
            {onboardingSteps[onbStep].questions?.map(q => (
              <div key={q.id} className="flex items-center justify-between py-2.5 border-b border-border-theme/30 last:border-0">
                <span className="text-[12px] text-text-body">{q.label}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleOnbAnswer(q.id, true)}
                    className={`px-3 py-1 rounded text-[10px] font-medium transition-all ${
                      onbAnswers[q.id] === true ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-bg-elevated/40 text-text-muted border border-border-theme hover:text-text-body'
                    }`}>Sí</button>
                  <button onClick={() => handleOnbAnswer(q.id, false)}
                    className={`px-3 py-1 rounded text-[10px] font-medium transition-all ${
                      onbAnswers[q.id] === false ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-bg-elevated/40 text-text-muted border border-border-theme hover:text-text-body'
                    }`}>No</button>
                </div>
              </div>
            ))}

            {/* Guide for step 4 */}
            {onboardingSteps[onbStep].guide && (
              <div className="space-y-3">
                {onboardingSteps[onbStep].guide.map((g, i) => (
                  <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-[#0b0b0f] border border-border-theme/50">
                    <div className="w-5 h-5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                    <span className="text-[12px] text-text-muted">{g}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-theme/50">
              <button onClick={prevOnbStep} disabled={onbStep === 0}
                className="px-4 py-2 rounded-lg text-[11px] font-medium bg-bg-elevated/40 border border-border-theme text-text-muted hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                Anterior
              </button>
              <button onClick={nextOnbStep}
                className="px-5 py-2 rounded-lg text-[11px] font-medium bg-[#3b82f6] hover:bg-[#2563eb] text-white transition-all flex items-center gap-1.5">
                {onbStep < onboardingSteps.length - 1 ? (
                  <>Siguiente <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></>
                ) : (
                  <>Ir al Dashboard <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Passkey Prompt Modal */}
      {showPasskeyPrompt && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b0b0f] border border-border-theme rounded-lg w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-[#0f1419] rounded-full flex items-center justify-center mx-auto mb-4 border border-border-theme">
              <svg className="w-7 h-7 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
              </svg>
            </div>
            <h3 className="text-[15px] font-semibold text-white mb-1">{t('register.passkeyTitle')}</h3>
            <p className="text-[12px] text-text-muted mb-6">{t('register.passkeyDesc')}</p>
            <div className="space-y-2">
              <button onClick={setupPasskey} disabled={loading}
                className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[12px] font-medium py-2.5 rounded-md transition-colors disabled:opacity-50">
                {loading ? 'Configurando...' : t('register.passkeySetup')}
              </button>
              <button onClick={handlePasskeyLater}
                className="w-full bg-transparent text-text-muted hover:text-text-body text-[12px] py-2 rounded-md transition-colors">
                {t('register.passkeyLater')}
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
