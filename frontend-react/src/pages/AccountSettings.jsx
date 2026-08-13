import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/api';

const I = {
  check: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>,
  xmark: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>,
  alert: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>,
  eye: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
  eyeOff: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>,
  key: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>,
  mail: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
  shield: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>,
  info: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  user: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
};

function SectionCard({ icon, iconBg, title, desc, accent, children }) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.015] overflow-hidden relative">
      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full" style={{ backgroundColor: accent || '#6b7280', boxShadow: `0 0 10px ${accent || '#6b7280'}80` }} />
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border-theme bg-bg-base/20">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg || 'bg-bg-elevated/80 border border-border-theme/50'}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-[13px] font-semibold text-white tracking-wide">{title}</h3>
          {desc && <p className="text-[11px] text-text-muted mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      {label && <label className="label-premium">{label}</label>}
      <input {...props} className="input-premium" />
    </div>
  );
}

function Btn({ children, className = '', disabled, variant = 'default', ...props }) {
  const variants = {
    default: 'bg-bg-elevated text-text-body border border-border-theme hover:bg-bg-elevated hover:text-text-heading',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.05)] hover:',
    primary: 'btn-glow border-0',
  };
  return (
    <button disabled={disabled} {...props}
      className={`px-5 py-2.5 text-[12px] font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant] || variants.default} ${className}`}>
      {children}
    </button>
  );
}

function Msg({ msg }) {
  if (!msg) return null;
  const ok = msg.includes('correctamente') || msg.includes('activado');
  return (
    <div className={`flex items-center gap-2 px-4 py-3 text-[12px] rounded-xl border ${ok ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ' : 'bg-red-500/10 text-red-400 border-red-500/20 '}`}>
      <span className="flex-shrink-0 text-current">{ok ? I.check : I.alert}</span>
      <span>{msg}</span>
    </div>
  );
}

export default function AccountSettings() {
  const { user, token } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [tfMsg, setTfMsg] = useState('');
  const [tfLoading, setTfLoading] = useState(false);
  const [showDisableInput, setShowDisableInput] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({});

  useEffect(() => {
    if (user?.twoFactorEnabled !== undefined) setTwoFactorEnabled(user.twoFactorEnabled);
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getUserInfo(token);
        if (!res.error && res.twoFactorEnabled !== undefined) setTwoFactorEnabled(res.twoFactorEnabled);
      } catch {}
    })();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) { setPwMsg('Las contraseñas no coinciden'); return; }
    if (newPassword.length < 6) { setPwMsg('La contraseña debe tener al menos 6 caracteres'); return; }
    setPwMsg(''); setPwLoading(true);
    const res = await api.changeAccountPassword(token, currentPassword, newPassword);
    if (res.error) setPwMsg(res.error);
    else { setPwMsg('Contraseña actualizada correctamente'); setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword(''); }
    setPwLoading(false);
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    if (!newEmail) { setEmailMsg('Ingresa un email'); return; }
    setEmailMsg(''); setEmailLoading(true);
    const res = await api.changeAccountEmail(token, newEmail, emailPassword);
    if (res.error) setEmailMsg(res.error);
    else {
      setEmailMsg('Email actualizado correctamente');
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      savedUser.email = res.email;
      localStorage.setItem('user', JSON.stringify(savedUser));
      window.dispatchEvent(new Event('auth-change'));
      setNewEmail(''); setEmailPassword('');
    }
    setEmailLoading(false);
  };

  const handleSetup2FA = async () => {
    setTfMsg(''); setTfLoading(true);
    const res = await api.setup2FA(token);
    if (res.error) setTfMsg(res.error);
    else { setQrDataUrl(res.qrDataUrl); setTwoFactorSecret(res.secret); setVerifyCode(''); setTwoFactorEnabled(false); }
    setTfLoading(false);
  };

  const handleVerify2FA = async () => {
    if (!verifyCode) { setTfMsg('Ingresa el código de 6 dígitos'); return; }
    setTfMsg(''); setTfLoading(true);
    const res = await api.verify2FA(token, verifyCode);
    if (res.error) setTfMsg(res.error);
    else {
      setTfMsg(res.message); setTwoFactorEnabled(true); setQrDataUrl(''); setTwoFactorSecret(''); setVerifyCode('');
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      savedUser.twoFactorEnabled = true;
      localStorage.setItem('user', JSON.stringify(savedUser));
      window.dispatchEvent(new Event('auth-change'));
    }
    setTfLoading(false);
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) { setTfMsg('Ingresa tu contraseña'); return; }
    setTfMsg(''); setTfLoading(true);
    const res = await api.disable2FA(token, disablePassword);
    if (res.error) setTfMsg(res.error);
    else {
      setTfMsg(res.message); setTwoFactorEnabled(false); setShowDisableInput(false); setDisablePassword('');
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      savedUser.twoFactorEnabled = false;
      localStorage.setItem('user', JSON.stringify(savedUser));
      window.dispatchEvent(new Event('auth-change'));
    }
    setTfLoading(false);
  };

  return (
    <div className="h-full overflow-y-auto theme-scrollbar bg-bg-base">
      <header className="flex-shrink-0 border-b border-white/[0.04] bg-bg-base sticky top-0 z-40">
        <div className="w-full px-4 md:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-text-subtle uppercase tracking-wider font-medium">Cuenta y seguridad</p>
              <h1 className="text-[18px] md:text-[20px] font-bold text-text-heading tracking-tight">Configuración</h1>
            </div>
            <p className="text-[11px] text-text-muted hidden sm:block">{user?.email || 'Administra tu cuenta'}</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 hover:-translate-y-0.5 transition-all">
            <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-full " />
            <p className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider">Email</p>
            <p className="text-[13px] font-semibold text-white mt-1.5 truncate">{user?.email || '-'}</p>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 hover:-translate-y-0.5 transition-all">
            <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-full " />
            <p className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider">2FA</p>
            <p className={`text-[13px] font-semibold mt-1.5 ${twoFactorEnabled ? 'text-emerald-400' : 'text-text-muted'}`}>
              {twoFactorEnabled ? 'Activado' : 'Desactivado'}
            </p>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.015] p-5 hover:-translate-y-0.5 transition-all">
            <div className="absolute left-0 top-3 bottom-3 w-1 bg-cyan-500 rounded-full " />
            <p className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider">Rol</p>
            <p className="text-[13px] font-semibold text-white mt-1.5 capitalize">{user?.role || '-'}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 pb-12 space-y-6">
        <SectionCard icon={<span className="text-cyan-400">{I.key}</span>} iconBg="bg-cyan-500/10 border border-cyan-500/20" title="Cambiar Contraseña" desc="Actualiza tu contraseña de acceso al sistema" accent="#22d3ee">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label-premium">Contraseña actual</label>
              <div className="relative">
                <input type={showPasswords.current ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                  className="input-premium pr-11" placeholder="Tu contraseña actual" />
                <button type="button" onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-body transition-colors">{showPasswords.current ? I.eyeOff : I.eye}</button>
              </div>
            </div>
            <div>
              <label className="label-premium">Nueva contraseña</label>
              <div className="relative">
                <input type={showPasswords.new ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="input-premium pr-11" placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-body transition-colors">{showPasswords.new ? I.eyeOff : I.eye}</button>
              </div>
            </div>
            <div>
              <label className="label-premium">Confirmar nueva contraseña</label>
              <div className="relative">
                <input type={showPasswords.confirm ? 'text' : 'password'} value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)}
                  className="input-premium pr-11" placeholder="Repite la nueva contraseña" />
                <button type="button" onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-body transition-colors">{showPasswords.confirm ? I.eyeOff : I.eye}</button>
              </div>
            </div>
            <Msg msg={pwMsg} />
            <div className="pt-2">
              <Btn type="submit" disabled={pwLoading || !currentPassword || !newPassword || !confirmNewPassword} variant="primary" className="w-full sm:w-auto">
                {pwLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </Btn>
            </div>
          </form>
        </SectionCard>

        <SectionCard icon={<span className="text-indigo-400">{I.mail}</span>} iconBg="bg-indigo-500/10 border border-indigo-500/20" title="Cambiar Email" desc={user?.email ? `Email actual: ${user.email}` : ''} accent="#818cf8">
          <form onSubmit={handleChangeEmail} className="space-y-4">
            <Input label="Nuevo Email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="nuevo@email.com" />
            <Input label="Confirmar con tu Contraseña" type="password" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} placeholder="Ingresa tu contraseña actual" />
            <Msg msg={emailMsg} />
            <div className="pt-2">
              <Btn type="submit" disabled={emailLoading || !newEmail || !emailPassword} variant="primary" className="w-full sm:w-auto">
                {emailLoading ? 'Actualizando...' : 'Actualizar Email'}
              </Btn>
            </div>
          </form>
        </SectionCard>

        <SectionCard icon={<span className="text-emerald-400">{I.shield}</span>} iconBg="bg-emerald-500/10 border border-emerald-500/20" title="Autenticación en Dos Pasos (2FA)" desc="Protege tu cuenta con Google Authenticator" accent="#22c55e">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-bg-base/40 border border-border-theme">
              <span className="text-[12px] text-text-muted">Estado</span>
              <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${twoFactorEnabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/10 text-text-muted border-gray-500/20'}`}>
                {twoFactorEnabled ? 'Activado' : 'Desactivado'}
              </span>
            </div>

            {!twoFactorEnabled && !qrDataUrl && (
              <Btn onClick={handleSetup2FA} disabled={tfLoading} variant="primary" className="w-full">
                {tfLoading ? 'Generando...' : 'Activar 2FA'}
              </Btn>
            )}

            {qrDataUrl && (
              <div className="space-y-4 animate-chat-open">
                <div className="bg-bg-base/60 border border-white/[0.04]/80 rounded-xl p-6 flex flex-col items-center shadow-inner">
                  <img src={qrDataUrl} alt="QR Code" className="w-44 h-44 mb-4 rounded-lg border border-border-theme/30 p-1 bg-white" />
                  <p className="text-[11px] text-text-muted text-center max-w-[280px]">Escanea este código con tu aplicación de autenticación preferida (Google Authenticator, Authy, etc.).</p>
                </div>
                <div className="bg-bg-base/60 border border-white/[0.04]/80 rounded-xl p-4">
                  <p className="text-[9px] text-text-subtle uppercase tracking-wider font-semibold mb-1.5">O ingresa la clave manualmente</p>
                  <p className="text-[12px] font-mono text-cyan-400 break-all select-all">{twoFactorSecret}</p>
                </div>
                <Input label="Código de verificación" type="text" value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} placeholder="000000" className="font-mono text-center tracking-widest text-[16px]" />
                <Btn onClick={handleVerify2FA} disabled={tfLoading || verifyCode.length !== 6} variant="primary" className="w-full">
                  {tfLoading ? 'Verificando...' : 'Verificar y Activar'}
                </Btn>
              </div>
            )}

            {twoFactorEnabled && !showDisableInput && (
              <Btn onClick={() => setShowDisableInput(true)} variant="danger" className="w-full">Desactivar 2FA</Btn>
            )}

            {showDisableInput && (
              <div className="space-y-3 p-4 rounded-xl border border-red-500/25 bg-red-500/5 animate-chat-open">
                <p className="text-[12px] text-red-400 flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0 text-red-400">{I.alert}</span>
                  <span>Ingresa tu contraseña para desactivar la autenticación de dos pasos. Si pierdes el acceso, tendrás que contactar a soporte.</span>
                </p>
                <Input label="" type="password" value={disablePassword} onChange={e => setDisablePassword(e.target.value)} placeholder="Tu contraseña actual" />
                <div className="flex gap-3 pt-1.5">
                  <Btn onClick={() => { setShowDisableInput(false); setDisablePassword(''); setTfMsg(''); }}
                    variant="default" className="flex-1">Cancelar</Btn>
                  <Btn onClick={handleDisable2FA} disabled={tfLoading || !disablePassword} variant="danger" className="flex-1">
                    {tfLoading ? 'Desactivando...' : 'Desactivar 2FA'}
                  </Btn>
                </div>
              </div>
            )}

            <Msg msg={tfMsg} />

            <div className="bg-bg-base/30 border border-border-theme/80 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">{I.info}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-white mb-0.5">¿Perdiste el acceso a 2FA?</p>
                  <p className="text-[11px] text-text-muted leading-relaxed">Si pierdes el dispositivo de autenticación, por favor contacta al administrador de la cuenta para reiniciar tus ajustes de seguridad.</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
