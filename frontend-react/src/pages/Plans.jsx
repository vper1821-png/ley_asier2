import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/context';

export default function Plans() {
  const { user, token, logout: authLogout } = useAuth();
  const { t, lang, toggleLang } = useI18n();
  const navigate = useNavigate();
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', plan: 'Basic' });
  const [contactSuccess, setContactSuccess] = useState(false);
  const isLoggedIn = !!token;

  const handleLogout = () => { authLogout(); navigate('/'); };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSuccess(true);
    setTimeout(() => {
      setShowContactModal(false);
      setContactSuccess(false);
      setContactForm({ name: '', phone: '', plan: 'K8s' });
    }, 2000);
  };

  const plans = [
    {
      name: 'K8s', price: '29', popular: false, color: 'border-[#1a1a1f] hover:border-[#3b82f6]',
      icon: 'k8s',
      features: [t('plans.featK8s1'), t('plans.featK8s2'), t('plans.featK8s3'), t('plans.featK8s4'), t('plans.featK8s5'), t('plans.featK8s6')],
    },
    {
      name: 'Invisia V2', price: '49', popular: false, color: 'border-[#1a1a1f] hover:border-[#3b82f6]',
      icon: 'invisia',
      features: [t('plans.featInvisia1'), t('plans.featInvisia2'), t('plans.featInvisia3'), t('plans.featInvisia4'), t('plans.featInvisia5'), t('plans.featInvisia6'), t('plans.featInvisia7'), t('plans.featInvisia8')],
    },
    {
      name: 'Chile Compliance', price: '79', popular: true, color: 'border-[#10b981]',
      icon: 'compliance',
      features: [
        t('plans.featChile1'), t('plans.featChile2'), t('plans.featChile3'),
        t('plans.featChile4'), t('plans.featChile5'), t('plans.featChile6'),
        t('plans.featChile7'), t('plans.featChile8'), t('plans.featChile9'),
        t('plans.featChile10'),
      ],
    },
    {
      name: 'Enterprise', price: '149', popular: false, color: 'border-[#1a1a1f] hover:border-[#3b82f6]',
      icon: 'both',
      features: [t('plans.featEnterprise1'), t('plans.featEnterprise2'), t('plans.featEnterprise3'), t('plans.featEnterprise4'), t('plans.featEnterprise5'), t('plans.featEnterprise6'), t('plans.featEnterprise7'), t('plans.featEnterprise8')],
    },
  ];


  return (
    <div className="min-h-screen bg-[#0b0b0f]">
      {/* Header */}
      <div className="border-b border-[#1a1a1f] bg-[#0f0f14]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#0f1419] rounded-lg flex items-center justify-center border border-[#1f2937]">
              <svg className="w-6 h-6 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-text-heading">Invisia</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={toggleLang} className="text-[11px] px-2 py-1 rounded bg-[#1a1a1f] border border-[#1f2937] text-text-muted hover:text-text-heading transition-colors">
              {lang === 'es' ? t('admin.switchToEnglish') : t('admin.switchToSpanish')}
            </button>
            {!isLoggedIn && (
              <>
                <Link to="/" className="text-text-muted hover:text-text-heading text-sm">{t('nav.login')}</Link>
                <Link to="/register" className="bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm px-4 py-2 rounded transition-colors">{t('nav.register')}</Link>
              </>
            )}
            {isLoggedIn && (
              <>
                <Link to="/dashboard" className="text-text-muted hover:text-text-heading text-sm">{t('nav.dashboard')}</Link>
                <button onClick={handleLogout} className="text-text-muted hover:text-text-heading text-sm">{t('nav.logout')}</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">{t('plans.title')}</h2>
        <p className="text-lg text-text-muted mb-2">{t('plans.subtitle')}</p>
        <p className="text-sm text-text-muted mb-8">{t('plans.subtitle2')}</p>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <div key={i} className={`bg-[#141419] ${plan.popular ? 'border-2' : 'border'} ${plan.color} rounded-xl p-6 relative transition-colors`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#3b82f6] text-white text-xs px-3 py-1 rounded-full font-medium">
                  {t('plans.popular')}
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-white mb-1">${plan.price}</div>
                <p className="text-sm text-text-muted">{t('plans.perWeek')}</p>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center space-x-3 text-sm text-text-body">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => setShowContactModal(true)}
                className={`w-full text-sm py-3 rounded-lg transition-colors ${
                  plan.popular
                    ? 'bg-[#3b82f6] hover:bg-[#2563eb] text-text-heading'
                    : 'bg-[#1a1a1f] hover:bg-[#252530] text-white border border-[#1f2937]'
                }`}>
                {t('plans.contactSales')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-[#0f0f14] border-t border-[#1a1a1f]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h3 className="text-2xl font-semibold text-white text-center mb-12">{t('plans.features')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: 'shield', title: t('plans.feat1Title'), desc: t('plans.feat1Desc'), color: 'bg-[#3b82f6]/20', iconColor: 'text-[#3b82f6]' },
              { icon: 'zap', title: t('plans.feat2Title'), desc: t('plans.feat2Desc'), color: 'bg-[#10b981]/20', iconColor: 'text-[#10b981]' },
              { icon: 'chart', title: t('plans.feat3Title'), desc: t('plans.feat3Desc'), color: 'bg-[#8b5cf6]/20', iconColor: 'text-[#8b5cf6]' },
            ].map((feat, i) => (
              <div key={i} className="text-center">
                <div className={`w-12 h-12 ${feat.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  {i === 0 && (
                    <svg className={`w-6 h-6 ${feat.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  )}
                  {i === 1 && (
                    <svg className={`w-6 h-6 ${feat.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  )}
                  {i === 2 && (
                    <svg className={`w-6 h-6 ${feat.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  )}
                </div>
                <h4 className="text-lg font-medium text-white mb-2">{feat.title}</h4>
                <p className="text-sm text-text-muted">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h3 className="text-2xl font-semibold text-white mb-4">{t('plans.ready')}</h3>
        <p className="text-text-muted mb-8">{t('plans.readyDesc')}</p>
        <button onClick={() => setShowContactModal(true)}
          className="bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm px-8 py-3 rounded-lg transition-colors">
          {t('plans.contactSales')}
        </button>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b0b0f] border border-[#1a1a1f] rounded-lg w-full max-w-md">
            <div className="px-5 py-4 border-b border-[#1a1a1f] flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-text-heading">{t('plans.contactSales')}</h3>
              <button onClick={() => setShowContactModal(false)} className="text-text-muted hover:text-text-heading">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            {contactSuccess ? (
              <div className="p-5 text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <p className="text-[13px] text-white font-medium">{t('plans.contactSuccess')}</p>
              </div>
            ) : (
            <form onSubmit={handleContactSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">{t('plans.contactName')}</label>
                <input required value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})}
                  className="w-full bg-[#0f0f14] border border-[#1a1a1f] rounded px-3 py-2.5 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-[#3b82f6]" />
              </div>
              <div>
                <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">{t('plans.contactPhone')}</label>
                <input required value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})}
                  className="w-full bg-[#0f0f14] border border-[#1a1a1f] rounded px-3 py-2.5 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-[#3b82f6]" />
              </div>
              <div>
                <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1.5">{t('plans.contactPlan')}</label>
                <select value={contactForm.plan} onChange={e => setContactForm({...contactForm, plan: e.target.value})}
                  className="w-full bg-[#0f0f14] border border-[#1a1a1f] text-[12px] text-white rounded px-3 py-2.5 focus:outline-none focus:border-[#3b82f6]">
                  <option>K8s</option>
                  <option>Invisia V2</option>
                  <option>Chile Compliance</option>
                  <option>Enterprise</option>
                </select>
              </div>
              <button type="submit"
                className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[12px] font-medium py-2.5 rounded transition-colors">
                {t('plans.submit')}
              </button>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
