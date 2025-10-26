// src/App.jsx
import React, { useCallback, useEffect, useState } from 'react';
import LoginForm from './components/LoginForm.jsx';
import RegisterForm from './components/RegisterForm.jsx';
import Terms from './components/Terms.jsx';
import Privacy from './components/Privacy.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import Homepage from './components/Homepage.jsx';
import GlassCard from './components/ui/GlassCard.jsx';
import Icon from './components/ui/Icon.jsx';
import DashboardSummary from './components/DashboardSummary.jsx';
import BuilderFlow from './components/BuilderFlow.jsx';
import MyQRCodes from './components/MyQRCodes.jsx';
import CookieBanner from './components/CookieBanner.jsx';
import CookieManager from './components/CookieManager.jsx';
import BottomNav from './components/BottomNav.jsx';

import { api, startCheckout, fetchProfile } from './api.js';
import { FREE_PLAN_DYNAMIC_LIMIT, UPGRADES_ENABLED } from './config/planLimits.js';

const COOKIE_KEY = 'qr_cookie_consent';
const COOKIE_PREF_KEY = 'qr_cookie_preferences';
const defaultCookiePrefs = {
  analytics: false,
  personalization: false,
  marketing: false
};

const initialView = typeof window !== 'undefined'
  ? (localStorage.getItem('qr_last_view') === 'codes' ? 'codes' : 'summary')
  : 'summary';

export default function App(){
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('login');
  const [view, setViewRaw] = useState(initialView);
  const [lastStableView, setLastStableView] = useState(initialView);
  const [authOpen, setAuthOpen] = useState(false);
  const [infoModal, setInfoModal] = useState(null);
  const [authAlert, setAuthAlert] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const [dashboardAlert, setDashboardAlert] = useState(null);
  const [resendBusy, setResendBusy] = useState(false);
  const [builderConfig, setBuilderConfig] = useState(null);
  const [codesVersion, setCodesVersion] = useState(0);
  const [lastCreated, setLastCreated] = useState(null);
  const [cookieConsent, setCookieConsent] = useState(() => {
    if (typeof window === 'undefined') return 'unknown';
    return localStorage.getItem(COOKIE_KEY) || 'unknown';
  });
  const [showCookieBanner, setShowCookieBanner] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem(COOKIE_KEY);
  });
  const handleCountsChange = useCallback(({ dynamic, staticCount }) => {
    setUser(prev => {
      if (!prev) return prev;
      const nextDynamic = typeof dynamic === 'number' ? dynamic : prev.dynamic_count;
      const nextStatic = typeof staticCount === 'number' ? staticCount : prev.static_count;
      if (nextDynamic === prev.dynamic_count && nextStatic === prev.static_count) {
        return prev;
      }
      return { ...prev, dynamic_count: nextDynamic, static_count: nextStatic };
    });
  }, []);

  const [cookiePreferences, setCookiePreferences] = useState(() => {
    if (typeof window === 'undefined') return defaultCookiePrefs;
    try {
      const stored = JSON.parse(localStorage.getItem(COOKIE_PREF_KEY) || 'null');
      if (stored && typeof stored === 'object') {
        return { ...defaultCookiePrefs, ...stored };
      }
    } catch {
      /* ignore */
    }
    return defaultCookiePrefs;
  });
  const [cookieManagerOpen, setCookieManagerOpen] = useState(false);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await fetchProfile();
      if (!profile) return;
      setUser(prev => {
        const next = { ...(prev || {}), ...profile };
        try { localStorage.setItem('qr_user', JSON.stringify(next)); } catch (_){ }
        return next;
      });
    } catch (err) {
      if (err?.status === 401) return;
      console.error('Failed to refresh profile', err);
    }
  }, []);

  const scrollToTop = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);
  const setView = useCallback((nextView) => {
    setViewRaw(nextView);
    if (nextView !== 'builder') {
      setLastStableView(nextView);
      if (typeof window !== 'undefined') {
        localStorage.setItem('qr_last_view', nextView);
      }
    }
  }, []);
  const openBuilder = (config = { type: null, codeId: null }) => {
    setBuilderConfig(config);
    setDashboardAlert(null);
    setView('builder');
  };
  useEffect(() => {
    scrollToTop();
  }, [view, scrollToTop]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (!UPGRADES_ENABLED) {
      if (url.searchParams.has('billing')) {
        url.searchParams.delete('billing');
        window.history.replaceState({}, '', url.toString());
      }
      return;
    }
    const billingStatus = url.searchParams.get('billing');
    if (!billingStatus) return;
    if (billingStatus === 'success') {
      setDashboardAlert({ type: 'success', text: 'Thanks for upgrading! Pro features are now unlocked.' });
      refreshProfile();
    } else if (billingStatus === 'cancel') {
      setDashboardAlert({ type: 'info', text: 'Upgrade cancelled. You can upgrade anytime from the dashboard.' });
    }
    url.searchParams.delete('billing');
    window.history.replaceState({}, '', url.toString());
  }, [refreshProfile]);

  useEffect(()=>{
    const raw = localStorage.getItem('qr_user');
    if(raw){
      try{
        const parsed = JSON.parse(raw);
        if (typeof parsed.email_verified === 'undefined') parsed.email_verified = true;
        setUser(parsed);
      }catch{ /* ignore */ }
    }
  },[]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(COOKIE_KEY);
    if (stored) {
      setCookieConsent(stored);
      setShowCookieBanner(false);
    } else {
      setCookieConsent('unknown');
      setShowCookieBanner(true);
    }
    try {
      const prefRaw = JSON.parse(localStorage.getItem(COOKIE_PREF_KEY) || 'null');
      if (prefRaw && typeof prefRaw === 'object') {
        setCookiePreferences(prev => ({ ...prev, ...prefRaw }));
      }
    } catch {
      setCookiePreferences(defaultCookiePrefs);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlReset = params.get('reset');
    const verify = params.get('verify');
    if (urlReset) {
      setResetToken(urlReset);
      setMode('login');
      setAuthOpen(true);
      setAuthAlert({ type: 'info', text: 'Enter a new password to finish resetting your account.' });
    }
    if (verify) {
      setMode('login');
      setAuthOpen(true);
      verifyEmailToken(verify);
    }
  }, []);

  // load most recent QR for the dashboard summary (used by RecentCard)
  useEffect(() => {
    if (!user) {
      setLastCreated(null);
      return;
    }
    let ignore = false;
    (async () => {
      try {
        // debug: surface token presence to console to help diagnose missing codes
        const token = localStorage.getItem('token') || (() => { try { const u=JSON.parse(localStorage.getItem('qr_user')||'null'); return u?.token||u?.jwt||null } catch { return null } })();
        console.debug('Dashboard: fetch recent QR list (token present?):', !!token);
        const list = await api('/qr/list');
        console.debug('Dashboard: /qr/list returned', Array.isArray(list) ? list.length : typeof list, 'items');
        if (ignore) return;
        if (Array.isArray(list) && list.length) {
          const sorted = list.slice().sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
          setLastCreated(sorted[0]);
          // clear any previous dashboard notice about missing codes
          setDashboardAlert(null);
        } else {
          setLastCreated(null);
          // surface a helpful hint so the user knows why their codes might be missing
          setDashboardAlert({ type: 'info', text: 'No dynamic codes found for this account. Check that you are logged in with the same account you used to create codes or re-login.' });
        }
      } catch (e) {
        if (!ignore) {
          setLastCreated(null);
          // friendly explanation when auth fails
          if (e.status === 401) {
            setDashboardAlert({ type: 'error', text: 'Session expired or unauthorized. Please sign in again to see your dynamic codes.' });
          } else {
            setDashboardAlert({ type: 'error', text: e.message || 'Could not load your QR list. Check network or API.' });
          }
        }
      }
    })();
    return () => { ignore = true; };
  }, [user, codesVersion]);

  function clearAuthParams(keys = ['reset','verify','billing']){
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    let mutated = false;
    keys.forEach(key => {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        mutated = true;
      }
    });
    if (mutated) {
      window.history.replaceState({}, '', url.toString());
    }
  }

  function handleAuthSuccess(u){
    if (!u) return;
    const normalized = { ...u };
    if (typeof normalized.email_verified === 'undefined') normalized.email_verified = true;
    // persist minimal profile
    localStorage.setItem('qr_user', JSON.stringify(normalized));
    // NEW: persist token if the backend returns it in the user object
    if (normalized && (normalized.token || normalized.jwt)) {
      localStorage.setItem('token', normalized.token || normalized.jwt);
    }
    setUser(normalized);
    setView('summary');
    setAuthAlert(null);
    setResetToken(null);
    clearAuthParams();
    setAuthOpen(false);
    setDashboardAlert(null);
    setResendBusy(false);
    refreshProfile();
  }

  function logout(){
    localStorage.removeItem('qr_user');
    localStorage.removeItem('token'); // NEW: clear token on logout
    if (typeof window !== 'undefined') localStorage.removeItem('qr_last_view');
    setUser(null);
    setMode('login');
    setView('summary');
    setLastStableView('summary');
    setAuthAlert(null);
    setResetToken(null);
    setDashboardAlert(null);
    setResendBusy(false);
  }

  function requestAuth(){
    setMode('login');
    setAuthAlert(null);
    setResetToken(null);
    clearAuthParams();
    setAuthOpen(true);
  }

  async function handleUpgrade(){
    if (!UPGRADES_ENABLED) {
      setDashboardAlert({ type: 'info', text: 'Paid plans are coming soon. For now, enjoy unlimited access.' });
      return;
    }
    if (!user) {
      requestAuth();
      return;
    }
    try {
      const { url } = await startCheckout();
      if (url) {
        window.location.href = url;
      } else {
        setDashboardAlert({ type: 'error', text: 'Unable to start checkout. Please try again.' });
      }
    } catch (err) {
      setDashboardAlert({ type: 'error', text: err.message || 'Unable to start checkout. Please try again.' });
    }
  }

  function closeAuthModal(){
    setAuthOpen(false);
    setAuthAlert(null);
    setResetToken(null);
    clearAuthParams();
  }

  async function verifyEmailToken(token){
    if (!token) return;
    try{
      setAuthAlert({ type: 'info', text: 'Verifying your email…' });
      const result = await api('/auth/verify', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ token })
      });
      setAuthAlert({ type: 'success', text: 'Email verified! You can now log in.' });
      if (result?.email && user?.email === result.email) {
        const next = { ...user, email_verified: true };
        setUser(next);
        localStorage.setItem('qr_user', JSON.stringify(next));
      }
      clearAuthParams(['verify']);
    }catch(err){
      setAuthAlert({ type: 'error', text: err.message || 'Verification failed. Please request a new email.' });
    }
  }

  function handleResetConsumed(){
    setResetToken(null);
    clearAuthParams(['reset']);
  }

  async function resendVerificationFromDashboard(){
    if (!user?.email) return;
    setResendBusy(true);
    setDashboardAlert(null);
    try{
      await api('/auth/resend-verification', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: user.email })
      });
      setDashboardAlert({ type: 'success', text: 'Verification email sent. Check your inbox for the latest link.' });
    }catch(err){
      setDashboardAlert({ type: 'error', text: err.message || 'Unable to send verification email right now.' });
    }finally{
      setResendBusy(false);
    }
  }

  if (!user) {
    return (
      <div className="landing">
        <Homepage onRequestAuth={requestAuth} />
        <SiteFooter onShowTerms={()=>setInfoModal('terms')} onShowPrivacy={()=>setInfoModal('privacy')} />
        {authOpen && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="auth-modal">
              <button className="modal-close" onClick={closeAuthModal} aria-label="Close">&times;</button>
              <div className="auth-illustration" aria-hidden="true">
                <span className="auth-illustration-badge">✨ Dynamic QR</span>
                <h3>Design today. Update tomorrow.</h3>
                <p>Showcase branded QR codes, schedule redirects, and watch scans in real time with Qrovate Pro.</p>
                <div className="auth-illustration-demo">
                  <div className="auth-illustration-qr">
                    <div className="auth-illustration-qr-inner" />
                  </div>
                  <div className="auth-illustration-stats">
                    <strong>1,248</strong>
                    <span>Scans this week</span>
                  </div>
                </div>
                <div className="auth-avatars">
                  <span className="auth-avatar">AM</span>
                  <span className="auth-avatar">JT</span>
                  <span className="auth-avatar">RX</span>
                  <span className="auth-avatar more">+8</span>
                </div>
              </div>
              <div className="auth-panel">
                <div className="auth-header">
                  <span className="eyebrow">Welcome back</span>
                  <h2>Sign in to your Qrovate workspace</h2>
                  <p className="auth-sub">Access saved designs, dynamic redirects, analytics, and bulk tools.</p>
                </div>
                {authAlert && (
                  <div className={`auth-alert ${authAlert.type || 'info'}`}>
                    {authAlert.text}
                  </div>
                )}
                {!resetToken && (
                  <div className="auth-toggle">
                    <button
                      type="button"
                      className={mode==='login'?'pill active':'pill'}
                      onClick={()=>{
                        setMode('login');
                        setAuthAlert(null);
                      }}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      className={mode==='register'?'pill active':'pill'}
                      onClick={()=>{
                        setResetToken(null);
                        setAuthAlert(null);
                        setMode('register');
                      }}
                    >
                      Register
                    </button>
                  </div>
                )}
                {mode==='login'
                  ? (
                    <LoginForm
                      onLogin={handleAuthSuccess}
                      onNotice={setAuthAlert}
                      resetToken={resetToken}
                      onResetConsumed={handleResetConsumed}
                    />
                  )
                  : <RegisterForm onRegister={handleAuthSuccess} onNotice={setAuthAlert} />}
                <p className="auth-footnote">No credit card needed · Cancel anytime · GDPR safe</p>
              </div>
            </div>
          </div>
        )}
        {infoModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
              <button className="modal-close" onClick={()=>setInfoModal(null)} aria-label="Close">&times;</button>
              {infoModal==='terms' ? <Terms /> : <Privacy />}
            </div>
          </div>
        )}
      </div>
    );
  }

  const nav = [
    { id: 'summary', label: 'Dashboard', subtitle: 'Recent activity & quick actions', icon: 'dashboard' },
    { id: 'codes', label: 'My QR codes', subtitle: 'Download, edit, and review stats', icon: 'library' },
    { id: 'builder', label: 'Create new code', subtitle: 'Start a guided flow', icon: 'sparkles' }
  ];
  const verified = user.email_verified !== false;
  const dynamicLimit = user?.free_plan_dynamic_limit ?? FREE_PLAN_DYNAMIC_LIMIT;
  const planLabel = user.is_pro ? 'Pro plan active' : `Free plan · ${dynamicLimit} dynamic QR limit`;
  return (
    <>
      <div className="dashboard-layout">
        <header className="dashboard-topbar">
          <div className="brand">
            <span>◎</span>
            <div>Qrovate Workspace</div>
          </div>
          <div className="dashboard-topbar-actions">
            {!verified && (
              <button
                type="button"
                className="chip-action warning"
                onClick={resendVerificationFromDashboard}
                disabled={resendBusy}
              >
                {resendBusy ? 'Sending link…' : 'Verify email'}
              </button>
            )}
            <span className={`dashboard-chip ${user.is_pro ? 'success' : ''}`}>
              {planLabel}
            </span>
          <button
            className="btn-primary"
            onClick={()=>openBuilder({ type: 'dynamic-new', codeId: null })}
          >
              New QR code
            </button>
            <button className="btn-secondary ghost" onClick={logout}>Logout</button>
          </div>
        </header>

        <div className="dashboard-body">
          <main className="dashboard-main">
            {dashboardAlert && (
              <div className={`dashboard-alert ${dashboardAlert.type || 'info'}`}>
                <span>{dashboardAlert.text}</span>
              </div>
            )}

            <GlassCard className="dashboard-nav-card">
              <nav className="dashboard-nav" role="navigation" aria-label="Primary">
                {nav.map(item => (
                  <button
                    key={item.id}
                    className={view===item.id ? 'nav-card active' : 'nav-card'}
                    aria-current={view===item.id ? 'page' : undefined}
                    onClick={() => {
                      setDashboardAlert(null);
                      if (item.id === 'builder') {
                        openBuilder({ type: 'dynamic-new', codeId: null });
                        return;
                      }
                      setView(item.id);
                    }}
                  >
                    <div className="nav-icon">
                      <Icon name={item.icon} size={20} />
                    </div>
                    <div className="nav-copy">
                      <div className="nav-label">{item.label}</div>
                      <div className="nav-sub">{item.subtitle}</div>
                    </div>
                  </button>
                ))}
              </nav>
            </GlassCard>

            <div className="dashboard-content">
              {view==='summary' && (
                <DashboardSummary
                  user={user}
                  onCreateNew={openBuilder}
                  onOpenCodes={() => setView('codes')}
                  lastCreated={lastCreated}
                  onUpgrade={handleUpgrade}
                />
              )}
              {view==='codes' && (
                <MyQRCodes
                  user={user}
                  version={codesVersion}
                  onCreateNew={openBuilder}
                  onEdit={openBuilder}
                  onCountsChange={handleCountsChange}
                  onUpgrade={handleUpgrade}
                />
              )}
              {view==='builder' && (
                <BuilderFlow
                  user={user}
                  config={builderConfig}
                  onClose={() => { setBuilderConfig(null); setView(lastStableView || 'summary'); }}
                  onRefresh={() => setCodesVersion(v => v + 1)}
                  onUpgrade={handleUpgrade}
                />
              )}
            </div>

            <SiteFooter
              onShowTerms={()=>setInfoModal('terms')}
              onShowPrivacy={()=>setInfoModal('privacy')}
              onShowCookies={() => {
                setCookieManagerOpen(true);
                setShowCookieBanner(false);
              }}
            />
          </main>

        </div>
      </div>

      {infoModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <button className="modal-close" onClick={()=>setInfoModal(null)} aria-label="Close">&times;</button>
            {infoModal==='terms' ? <Terms /> : <Privacy />}
          </div>
        </div>
      )}
      {(cookieConsent === 'unknown' || showCookieBanner) && (
        <CookieBanner
          consent={cookieConsent}
          onAccept={() => {
            localStorage.setItem(COOKIE_KEY, 'accepted');
            localStorage.setItem(COOKIE_PREF_KEY, JSON.stringify({
              analytics: true,
              personalization: true,
              marketing: true
            }));
            setCookieConsent('accepted');
            setCookiePreferences({
              analytics: true,
              personalization: true,
              marketing: true
            });
            setShowCookieBanner(false);
          }}
          onReject={() => {
            localStorage.setItem(COOKIE_KEY, 'rejected');
            localStorage.setItem(COOKIE_PREF_KEY, JSON.stringify(defaultCookiePrefs));
            setCookieConsent('rejected');
            setCookiePreferences(defaultCookiePrefs);
            setShowCookieBanner(false);
          }}
          onDetails={() => {
            setCookieManagerOpen(true);
            setShowCookieBanner(false);
          }}
        />
      )}
      {cookieManagerOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card cookie-modal-card">
            <button className="modal-close" onClick={() => {
              setCookieManagerOpen(false);
              if (cookieConsent === 'unknown') setShowCookieBanner(true);
            }} aria-label="Close">&times;</button>
            <CookieManager
              preferences={cookiePreferences}
              onUpdate={(key, value) => {
                setCookiePreferences(prev => ({ ...prev, [key]: value }));
              }}
              onSave={(mode) => {
                if (mode === 'accepted') {
                  localStorage.setItem(COOKIE_KEY, 'accepted');
                  localStorage.setItem(COOKIE_PREF_KEY, JSON.stringify(cookiePreferences));
                  setCookieConsent('accepted');
                } else {
                  localStorage.setItem(COOKIE_KEY, 'rejected');
                  localStorage.setItem(COOKIE_PREF_KEY, JSON.stringify(defaultCookiePrefs));
                  setCookiePreferences(defaultCookiePrefs);
                  setCookieConsent('rejected');
                }
                setCookieManagerOpen(false);
                setShowCookieBanner(false);
              }}
              onClose={() => {
                setCookieManagerOpen(false);
                if (cookieConsent === 'unknown') setShowCookieBanner(true);
              }}
            />
          </div>
        </div>
      )}

      <BottomNav
        nav={nav}
        view={view}
        setView={setView}
        openBuilder={openBuilder}
        setDashboardAlert={setDashboardAlert}
      />
    </>
  );
}
