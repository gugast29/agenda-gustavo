import { useState, useEffect, useCallback, useRef } from "react";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

const CATEGORIES = {
  faculdade: { label: "Faculdade", color: "#3b82f6", icon: "🎓" },
  terra: { label: "Terra AUV", color: "#10b981", icon: "🤖" },
  saude: { label: "Saúde", color: "#ef4444", icon: "💪" },
  pessoal: { label: "Pessoal", color: "#f59e0b", icon: "⭐" },
  alemao: { label: "Alemão", color: "#8b5cf6", icon: "🇩🇪" },
  outro: { label: "Outro", color: "#6b7280", icon: "📌" },
};

const FIN_CATEGORIES = {
  salario:     { label: "Salário",      color: "#10b981", icon: "💼", type: "receita" },
  freelance:   { label: "Freelance",    color: "#22c55e", icon: "💻", type: "receita" },
  investimento:{ label: "Investimento", color: "#14b8a6", icon: "📈", type: "receita" },
  outros_rec:  { label: "Outras receitas", color: "#84cc16", icon: "💵", type: "receita" },
  alimentacao: { label: "Alimentação",  color: "#f59e0b", icon: "🍔", type: "despesa" },
  transporte:  { label: "Transporte",   color: "#3b82f6", icon: "🚗", type: "despesa" },
  moradia:     { label: "Moradia",      color: "#8b5cf6", icon: "🏠", type: "despesa" },
  lazer:       { label: "Lazer",        color: "#ec4899", icon: "🎮", type: "despesa" },
  saude_fin:   { label: "Saúde",        color: "#ef4444", icon: "💊", type: "despesa" },
  educacao:    { label: "Educação",     color: "#06b6d4", icon: "📚", type: "despesa" },
  compras:     { label: "Compras",      color: "#f97316", icon: "🛍️", type: "despesa" },
  contas:      { label: "Contas",       color: "#6366f1", icon: "🧾", type: "despesa" },
  outros_desp: { label: "Outras despesas", color: "#6b7280", icon: "📌", type: "despesa" },
};

const formatBRL = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function loadData(key, fallback) {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch { return fallback; }
}

function saveData(key, data) {
  try { window.localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Epilogue:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #f5f2ee; --bg2: #edeae4; --card: #ffffff; --border: #e0dbd3;
    --text: #1a1814; --text2: #6b6560; --accent: #c84b31; --accent2: #e8a87c;
  }
  body { background: var(--bg); color: var(--text); font-family: 'Epilogue', sans-serif; -webkit-text-size-adjust: 100%; }
  .app { min-height: 100vh; min-height: -webkit-fill-available; display: flex; flex-direction: column; }
  .header { background: var(--text); color: var(--bg); padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
  .header-left { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  .header-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; letter-spacing: -0.5px; }
  .header-date { font-size: 11px; color: #888; font-weight: 300; }
  .notif-btn { background: transparent; border: 1px solid #444; color: #aaa; padding: 6px 12px; border-radius: 20px; font-size: 11px; cursor: pointer; font-family: 'Epilogue', sans-serif; transition: all 0.2s; white-space: nowrap; -webkit-tap-highlight-color: transparent; }
  .notif-btn.active { border-color: #e8a87c; color: #e8a87c; }
  .tabs { display: flex; background: var(--bg2); border-bottom: 1px solid var(--border); padding: 0 16px; gap: 2px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .tab { padding: 12px 16px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; cursor: pointer; background: transparent; border: none; color: var(--text2); border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap; -webkit-tap-highlight-color: transparent; }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
  .main { flex: 1; padding: 16px; max-width: 900px; width: 100%; margin: 0 auto; }
  .section-title { font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--text2); margin-bottom: 12px; margin-top: 24px; }
  .section-title:first-child { margin-top: 0; }
  .task-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; background: var(--card); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 8px; }
  .task-item.done { opacity: 0.5; }
  .task-check { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--border); cursor: pointer; flex-shrink: 0; margin-top: 1px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; -webkit-tap-highlight-color: transparent; }
  .task-check.checked { background: var(--accent); border-color: var(--accent); }
  .task-check.checked::after { content: '✓'; color: white; font-size: 12px; }
  .task-content { flex: 1; min-width: 0; }
  .task-name { font-size: 14px; font-weight: 500; color: var(--text); line-height: 1.4; word-break: break-word; }
  .task-item.done .task-name { text-decoration: line-through; color: var(--text2); }
  .task-meta { display: flex; gap: 6px; margin-top: 4px; align-items: center; flex-wrap: wrap; }
  .task-cat { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
  .task-time { font-size: 11px; color: var(--text2); }
  .task-delete { background: none; border: none; color: #ccc; cursor: pointer; font-size: 18px; padding: 0 4px; flex-shrink: 0; -webkit-tap-highlight-color: transparent; }
  .add-form { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  .form-row { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
  .form-row:last-child { margin-bottom: 0; }
  .input { flex: 1; min-width: 120px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-family: 'Epilogue', sans-serif; font-size: 16px; background: var(--bg); color: var(--text); outline: none; -webkit-appearance: none; }
  .input:focus { border-color: var(--accent); }
  .select { padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-family: 'Epilogue', sans-serif; font-size: 14px; background: var(--bg); color: var(--text); outline: none; cursor: pointer; -webkit-appearance: none; }
  .btn { padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; transition: all 0.2s; -webkit-tap-highlight-color: transparent; }
  .btn-primary { background: var(--accent); color: white; }
  .btn-secondary { background: var(--bg2); color: var(--text); border: 1px solid var(--border); }
  .calendar { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 16px; }
  .calendar-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border); }
  .calendar-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; }
  .cal-nav { background: none; border: 1px solid var(--border); border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 16px; color: var(--text2); -webkit-tap-highlight-color: transparent; }
  .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
  .cal-day-name { text-align: center; padding: 8px 2px; font-size: 10px; font-weight: 600; color: var(--text2); letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--border); }
  .cal-day { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; font-size: 13px; border-right: 1px solid var(--bg2); border-bottom: 1px solid var(--bg2); gap: 2px; -webkit-tap-highlight-color: transparent; }
  .cal-day.today { background: var(--accent); color: white; font-weight: 700; }
  .cal-day.selected { background: var(--bg2); outline: 2px solid var(--accent); }
  .cal-day.other-month { color: #ccc; }
  .cal-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--accent2); }
  .cal-day.today .cal-dot { background: white; }
  .event-item { display: flex; gap: 12px; padding: 12px 14px; background: var(--card); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 8px; align-items: flex-start; }
  .event-time-block { text-align: center; min-width: 40px; }
  .event-time { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: var(--accent); }
  .event-ampm { font-size: 10px; color: var(--text2); }
  .event-bar { width: 3px; border-radius: 2px; align-self: stretch; min-height: 24px; flex-shrink: 0; }
  .event-content { flex: 1; min-width: 0; }
  .event-name { font-size: 14px; font-weight: 500; word-break: break-word; }
  .event-desc { font-size: 12px; color: var(--text2); margin-top: 2px; }
  .goal-item { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; }
  .goal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .goal-name { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; }
  .goal-pct { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: var(--accent); }
  .goal-bar-bg { height: 6px; background: var(--bg2); border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
  .goal-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
  .goal-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--text2); }
  .goal-actions { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
  .progress-btn { padding: 8px 14px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); font-size: 13px; cursor: pointer; font-family: 'Epilogue', sans-serif; -webkit-tap-highlight-color: transparent; }
  .empty { text-align: center; padding: 40px 20px; color: var(--text2); font-size: 14px; }
  .empty-icon { font-size: 32px; margin-bottom: 10px; }
  .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 20px; }
  .stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 12px 8px; text-align: center; }
  .stat-num { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: var(--accent); line-height: 1; }
  .stat-lbl { font-size: 10px; color: var(--text2); margin-top: 4px; letter-spacing: 0.5px; }
  .notif-banner { background: #fff8f0; border: 1px solid #e8a87c; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; font-size: 13px; color: #7a4a20; display: flex; align-items: center; gap: 8px; }
  .row-space { display: flex; justify-content: space-between; align-items: center; }
  .rick-textarea { width: 100%; min-height: 110px; resize: vertical; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-family: 'Epilogue', sans-serif; font-size: 15px; background: var(--bg); color: var(--text); outline: none; }
  .rick-textarea:focus { border-color: #97ce4c; }
  .rick-header { background: linear-gradient(135deg, #1a2e0a 0%, #0d1a0d 100%); border: 1px solid #2d4a1a; border-radius: 12px; padding: 16px; margin-bottom: 14px; }
  .rick-chip { font-size: 11px; padding: 5px 10px; border-radius: 20px; border: 1px solid #2d4a1a; background: #0d1a0d; color: #97ce4c; cursor: pointer; white-space: nowrap; font-family: 'Epilogue', sans-serif; transition: background 0.15s; }
  .rick-chip:hover { background: #1a2e0a; }
  .rick-speak-btn { width: 100%; padding: 14px; border-radius: 10px; border: none; background: #97ce4c; color: #0d1a0d; font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 800; cursor: pointer; transition: opacity 0.2s; letter-spacing: 0.5px; }
  .rick-speak-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .rick-audio-box { background: var(--card); border: 1px solid #2d4a1a; border-radius: 12px; padding: 16px; margin-top: 14px; text-align: center; }
  .rick-toggle { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; cursor: pointer; }
  .rick-error { color: #ef4444; font-size: 13px; margin-top: 10px; padding: 10px 12px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; }
  .deutsch-chat { display: flex; flex-direction: column; gap: 10px; max-height: 420px; overflow-y: auto; padding: 4px 2px; margin-bottom: 12px; scroll-behavior: smooth; }
  .msg-user { align-self: flex-end; background: var(--accent); color: white; padding: 10px 14px; border-radius: 16px 16px 4px 16px; max-width: 82%; font-size: 14px; line-height: 1.5; word-break: break-word; }
  .msg-assistant { align-self: flex-start; background: var(--card); border: 1px solid var(--border); padding: 12px 14px; border-radius: 4px 16px 16px 16px; max-width: 88%; font-size: 14px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
  .msg-assistant strong { font-weight: 700; color: var(--text); }
  .deutsch-input-row { display: flex; gap: 8px; align-items: flex-end; }
  .deutsch-input { flex: 1; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-family: 'Epilogue', sans-serif; font-size: 15px; background: var(--bg); color: var(--text); outline: none; resize: none; min-height: 44px; max-height: 120px; }
  .deutsch-input:focus { border-color: #3b82f6; }
  .deutsch-send { padding: 10px 18px; border-radius: 8px; border: none; background: #1d4ed8; color: white; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: opacity 0.2s; flex-shrink: 0; }
  .deutsch-send:disabled { opacity: 0.45; cursor: not-allowed; }
  .mode-btn { padding: 6px 13px; border-radius: 20px; border: 1px solid var(--border); font-size: 12px; cursor: pointer; font-family: 'Epilogue', sans-serif; background: var(--bg); color: var(--text2); transition: all 0.15s; white-space: nowrap; -webkit-tap-highlight-color: transparent; }
  .mode-btn.active { background: #1e3a8a; color: #93c5fd; border-color: #1e3a8a; font-weight: 600; }
  .level-btn { padding: 5px 11px; border-radius: 20px; border: 1px solid var(--border); font-size: 11px; cursor: pointer; font-family: 'Epilogue', sans-serif; background: var(--bg); color: var(--text2); transition: all 0.15s; white-space: nowrap; -webkit-tap-highlight-color: transparent; }
  .level-btn.active { background: #14532d; color: #86efac; border-color: #14532d; font-weight: 600; }
  .quick-prompt { font-size: 11px; padding: 5px 10px; border-radius: 16px; border: 1px solid var(--border); background: var(--bg2); color: var(--text2); cursor: pointer; white-space: nowrap; font-family: 'Epilogue', sans-serif; transition: all 0.15s; -webkit-tap-highlight-color: transparent; }
  .quick-prompt:hover { border-color: #3b82f6; color: #3b82f6; }
  .deutsch-header { background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); border: 1px solid #1e40af; border-radius: 12px; padding: 16px; margin-bottom: 14px; }
  .deutsch-error { color: #ef4444; font-size: 13px; margin-top: 8px; padding: 8px 12px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; }
  .typing-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--text2); margin: 0 2px; animation: bounce 1.2s infinite; }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
  .fin-balance { background: linear-gradient(135deg, #1a1814 0%, #2d2820 100%); border-radius: 16px; padding: 20px; margin-bottom: 14px; color: #fff; position: relative; overflow: hidden; }
  .fin-balance::after { content: ''; position: absolute; top: -40px; right: -40px; width: 140px; height: 140px; border-radius: 50%; background: radial-gradient(circle, rgba(200,75,49,0.25), transparent 70%); }
  .fin-balance-label { font-size: 12px; color: #aaa; letter-spacing: 1px; text-transform: uppercase; font-weight: 600; }
  .fin-balance-value { font-family: 'Syne', sans-serif; font-size: 34px; font-weight: 800; margin-top: 4px; letter-spacing: -1px; line-height: 1; }
  .fin-balance-sub { font-size: 12px; color: #888; margin-top: 8px; }
  .fin-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .fin-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 14px; }
  .fin-card-label { font-size: 11px; color: var(--text2); letter-spacing: 0.5px; display: flex; align-items: center; gap: 5px; }
  .fin-card-value { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; margin-top: 4px; letter-spacing: -0.5px; }
  .fin-month-nav { display: flex; align-items: center; justify-content: space-between; background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 8px 12px; margin-bottom: 14px; }
  .fin-month-label { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; }
  .fin-breakdown-item { margin-bottom: 12px; }
  .fin-breakdown-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-size: 13px; }
  .fin-breakdown-bar-bg { height: 8px; background: var(--bg2); border-radius: 4px; overflow: hidden; }
  .fin-breakdown-bar { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
  .fin-budget-warn { font-size: 11px; font-weight: 600; }
  .fin-tx { display: flex; align-items: center; gap: 12px; padding: 11px 14px; background: var(--card); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 8px; }
  .fin-tx-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .fin-tx-body { flex: 1; min-width: 0; }
  .fin-tx-name { font-size: 14px; font-weight: 500; word-break: break-word; }
  .fin-tx-meta { font-size: 11px; color: var(--text2); margin-top: 2px; }
  .fin-tx-amount { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; white-space: nowrap; }
  .fin-type-toggle { display: flex; gap: 8px; margin-bottom: 10px; }
  .fin-type-btn { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; -webkit-tap-highlight-color: transparent; }
  .fin-type-btn.active-receita { background: #10b981; color: #fff; border-color: #10b981; }
  .fin-type-btn.active-despesa { background: #ef4444; color: #fff; border-color: #ef4444; }
`;

export default function Agenda() {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const [tab, setTab] = useState("hoje");
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [events, setEvents] = useState([]);
  const [calDate, setCalDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [newTask, setNewTask] = useState({ name: "", category: "faculdade", time: "", date: todayStr });
  const [newEvent, setNewEvent] = useState({ name: "", date: todayStr, time: "", desc: "", category: "faculdade" });
  const [newGoal, setNewGoal] = useState({ name: "", category: "pessoal", target: "", unit: "", deadline: "" });
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);

  // Finanças
  const [transactions, setTransactions] = useState(() => loadData("fin_transactions", []));
  const [budgets, setBudgets] = useState(() => loadData("fin_budgets", {}));
  const [finMonth, setFinMonth] = useState(new Date());
  const [showAddTx, setShowAddTx] = useState(false);
  const [showBudgets, setShowBudgets] = useState(false);
  const [newTx, setNewTx] = useState({ type: "despesa", amount: "", category: "alimentacao", desc: "", date: todayStr });

  // Deutsch AI Agent
  const [deutschMessages, setDeutschMessages] = useState(() => loadData("deutsch_messages", []));
  const [deutschInput, setDeutschInput] = useState("");
  const [deutschApiKey, setDeutschApiKey] = useState(() => loadData("deutsch_api_key", ""));
  const [deutschMode, setDeutschMode] = useState("conversacao");
  const [deutschLevel, setDeutschLevel] = useState("iniciante");
  const [deutschLoading, setDeutschLoading] = useState(false);
  const [showDeutschSetup, setShowDeutschSetup] = useState(false);
  const [deutschError, setDeutschError] = useState("");
  const deutschEndRef = useRef(null);

  // Rick Voice AI
  const [rickText, setRickText] = useState("");
  const [rickApiKey, setRickApiKey] = useState(() => loadData("rick_api_key", ""));
  const [rickVoiceId, setRickVoiceId] = useState(() => loadData("rick_voice_id", "VR6AewLTigWG4xSOukaG"));
  const [rickLoading, setRickLoading] = useState(false);
  const [rickError, setRickError] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [rickModeOn, setRickModeOn] = useState(true);
  const [showRickSetup, setShowRickSetup] = useState(false);
  const rickAudioRef = useRef(null);

  // Load from localStorage after mount (safe for Safari)
  useEffect(() => {
    setTasks(loadData("agenda_tasks", []));
    setGoals(loadData("agenda_goals", [
      { id: 1, name: "Estudar Alemão", category: "alemao", target: 30, current: 8, unit: "aulas", deadline: "2025-12-31" },
      { id: 2, name: "Horas Terra AUV", category: "terra", target: 100, current: 23, unit: "horas", deadline: "2025-07-01" },
      { id: 3, name: "Recuperação Acidente", category: "saude", target: 30, current: 18, unit: "dias", deadline: "2025-06-30" },
    ]));
    setEvents(loadData("agenda_events", []));
    if (typeof Notification !== "undefined" && Notification.permission === "granted") setNotifEnabled(true);
  }, []);

  useEffect(() => { saveData("agenda_tasks", tasks); }, [tasks]);
  useEffect(() => { saveData("agenda_goals", goals); }, [goals]);
  useEffect(() => { saveData("agenda_events", events); }, [events]);
  useEffect(() => { saveData("fin_transactions", transactions); }, [transactions]);
  useEffect(() => { saveData("fin_budgets", budgets); }, [budgets]);
  useEffect(() => { saveData("deutsch_messages", deutschMessages.slice(-60)); }, [deutschMessages]);
  useEffect(() => { saveData("deutsch_api_key", deutschApiKey); }, [deutschApiKey]);
  useEffect(() => { deutschEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [deutschMessages, deutschLoading]);
  useEffect(() => { saveData("rick_api_key", rickApiKey); }, [rickApiKey]);
  useEffect(() => { saveData("rick_voice_id", rickVoiceId); }, [rickVoiceId]);

  const requestNotifications = async () => {
    if (!("Notification" in window)) return alert("Seu navegador não suporta notificações.");
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setNotifEnabled(true);
        new Notification("✅ Agenda Gustavo", { body: "Notificações ativadas! Aviso 30 min antes de cada tarefa." });
      }
    } catch (e) { console.warn(e); }
  };

  const scheduleNotification = useCallback((task) => {
    if (!task.time || !task.date || !notifEnabled) return;
    try {
      const taskTime = new Date(task.date + "T" + task.time + ":00");
      const notifTime = new Date(taskTime.getTime() - 30 * 60 * 1000);
      const diff = notifTime - new Date();
      if (diff <= 0) return;
      const cat = CATEGORIES[task.category] || CATEGORIES.outro;
      setTimeout(() => {
        new Notification(`⏰ ${task.name}`, { body: `${cat.icon} ${cat.label} — em 30 minutos (${task.time})` });
      }, diff);
    } catch (e) { console.warn(e); }
  }, [notifEnabled]);

  // ===== Finanças =====
  const addTransaction = () => {
    const amount = parseFloat(String(newTx.amount).replace(",", "."));
    if (!amount || amount <= 0) return;
    setTransactions(t => [...t, { ...newTx, id: Date.now(), amount }]);
    setNewTx({ type: newTx.type, amount: "", category: newTx.category, desc: "", date: todayStr });
    setShowAddTx(false);
  };
  const deleteTransaction = (id) => setTransactions(t => t.filter(tx => tx.id !== id));
  const setBudget = (cat, value) => setBudgets(b => ({ ...b, [cat]: parseFloat(String(value).replace(",", ".")) || 0 }));

  const finMonthStr = `${finMonth.getFullYear()}-${String(finMonth.getMonth() + 1).padStart(2, "0")}`;
  const monthTx = transactions.filter(tx => tx.date?.startsWith(finMonthStr));
  const monthIncome = monthTx.filter(tx => tx.type === "receita").reduce((s, tx) => s + tx.amount, 0);
  const monthExpense = monthTx.filter(tx => tx.type === "despesa").reduce((s, tx) => s + tx.amount, 0);
  const monthBalance = monthIncome - monthExpense;

  // Gastos por categoria (despesas do mês), ordenado do maior pro menor
  const expenseByCat = {};
  monthTx.filter(tx => tx.type === "despesa").forEach(tx => {
    expenseByCat[tx.category] = (expenseByCat[tx.category] || 0) + tx.amount;
  });
  const expenseBreakdown = Object.entries(expenseByCat).sort((a, b) => b[1] - a[1]);
  const sortedMonthTx = [...monthTx].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  const DEUTSCH_MODES = {
    conversacao: { label: "💬 Conversação", desc: "conduza diálogos em alemão, corrija erros e traduza quando necessário" },
    gramatica:   { label: "📚 Gramática",   desc: "explique regras gramaticais com exemplos claros e exercícios práticos" },
    vocabulario: { label: "📝 Vocabulário", desc: "ensine novas palavras com gênero (der/die/das), plural e exemplos em frases" },
    exercicios:  { label: "✏️ Exercícios",  desc: "crie exercícios adequados ao nível e corrija as respostas do aluno" },
    correcao:    { label: "🔍 Correção",    desc: "corrija frases em alemão do aluno, explique os erros e mostre a forma correta" },
  };

  const DEUTSCH_LEVELS = {
    iniciante:     "🌱 Iniciante (A1-A2) — vocabulário simples, frases curtas e muitas explicações",
    intermediario: "📈 Intermediário (B1-B2) — estruturas mais complexas e textos variados",
    avancado:      "🎓 Avançado (C1-C2) — linguagem sofisticada, nuances e expressões idiomáticas",
  };

  const DEUTSCH_QUICK = {
    conversacao: ["Como me apresentar em alemão?", "Simule uma conversa em restaurante", "Como pedir informações na rua?"],
    gramatica:   ["Explique os artigos der, die, das", "Como funciona o Akkusativ?", "Diferença entre sein e haben"],
    vocabulario: ["Ensine as cores em alemão", "Números de 1 a 20", "Vocabulário essencial de viagem"],
    exercicios:  ["Exercício com der/die/das", "Complete as frases com o verbo correto", "Tradução de frases simples"],
    correcao:    ["Ich bin gehen zur Schule heute", "Er haben ein großes Haus", "Sie ist sehr schön Frau"],
  };

  const getDeutschSystemPrompt = () => `Você é o Professor Hans, tutor especializado em ensinar alemão para falantes de português brasileiro.

REGRAS:
- Responda SEMPRE em português, exceto exemplos em alemão
- Em exemplos alemães, sempre forneça a tradução em português
- Aponte similaridades e diferenças entre português e alemão quando relevante
- Corrija erros gentilmente, mostrando a forma correta e explicando o porquê
- Para pronúncia, compare com sons do português (ex: "ü = tente falar 'i' com lábios arredondados como 'u'")
- Use formatação clara: palavras em alemão em destaque, exemplos em lista quando apropriado
- Seja encorajador, paciente e didático
- Nas respostas, use ** ** para destacar palavras-chave em alemão

NÍVEL DO ALUNO: ${DEUTSCH_LEVELS[deutschLevel]}

MODO ATUAL: ${DEUTSCH_MODES[deutschMode].label.toUpperCase()} — ${DEUTSCH_MODES[deutschMode].desc}`;

  const sendDeutschMessage = async (text) => {
    const messageText = text || deutschInput;
    if (!deutschApiKey.trim()) { setShowDeutschSetup(true); setDeutschError("Configure sua API Key do Google Gemini primeiro!"); return; }
    if (!messageText.trim() || deutschLoading) return;

    const userMsg = { role: "user", content: messageText };
    const history = [...deutschMessages, userMsg];
    setDeutschMessages(history);
    setDeutschInput("");
    setDeutschLoading(true);
    setDeutschError("");

    try {
      // Gemini usa os papéis "user" e "model" (em vez de "assistant")
      const contents = history.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${deutschApiKey.trim()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: getDeutschSystemPrompt() }] },
            contents,
            generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Erro ${res.status}: verifique sua API Key`);
      }

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!reply) throw new Error("A IA não retornou resposta. Tente novamente.");
      setDeutschMessages([...history, { role: "assistant", content: reply }]);
    } catch (e) {
      setDeutschError(e.message || "Erro ao conectar com a IA");
      setDeutschMessages(deutschMessages);
    } finally {
      setDeutschLoading(false);
    }
  };

  const rickifyText = (text) => {
    const rickEndings = [
      " Wubba lubba dub dub!",
      " Get schwifty!",
      " Sou o Pickle Rick!",
      " Morty, você consegue acreditar nisso?",
      " E é assim que as notícias vão!",
      " Rikki-tikki-tavi!",
      " Morty, eu sou um gênio!",
    ];
    const midPhrases = [
      ", Morty,", ", escuta só,", ", obviamente,", ", cara,",
    ];
    let result = text.trim();
    // Insert a Rick-ish filler in the middle of longer texts
    if (result.length > 40) {
      const words = result.split(" ");
      const midIdx = Math.floor(words.length / 2);
      const filler = midPhrases[Math.floor(Math.random() * midPhrases.length)];
      words.splice(midIdx, 0, filler);
      result = words.join(" ").replace(/,\s+,/g, ",");
    }
    result += rickEndings[Math.floor(Math.random() * rickEndings.length)];
    return result;
  };

  const speakAsRick = async () => {
    if (!rickApiKey.trim()) {
      setShowRickSetup(true);
      setRickError("Configure sua API Key do ElevenLabs primeiro!");
      return;
    }
    if (!rickText.trim()) {
      setRickError("Digite algum texto para o Rick falar!");
      return;
    }
    setRickLoading(true);
    setRickError("");
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    const textToSpeak = rickModeOn ? rickifyText(rickText) : rickText;
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${rickVoiceId.trim()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": rickApiKey.trim() },
        body: JSON.stringify({
          text: textToSpeak,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.3, similarity_boost: 0.85, style: 0.45, use_speaker_boost: true },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail?.message || `Erro ${res.status}: verifique sua API Key e Voice ID`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setTimeout(() => rickAudioRef.current?.play(), 100);
    } catch (e) {
      setRickError(e.message || "Erro ao gerar áudio");
    } finally {
      setRickLoading(false);
    }
  };

  const addTask = (overrideDate) => {
    if (!newTask.name.trim()) return;
    const task = { ...newTask, id: Date.now(), done: false, date: overrideDate || newTask.date || todayStr };
    setTasks(t => [...t, task]);
    scheduleNotification(task);
    setNewTask({ name: "", category: "faculdade", time: "", date: todayStr });
    setShowAddTask(false);
  };

  const addEvent = (overrideDate) => {
    if (!newEvent.name.trim()) return;
    const ev = { ...newEvent, id: Date.now(), date: overrideDate || newEvent.date };
    if (!ev.date) return;
    setEvents(e => [...e, ev]);
    setNewEvent({ name: "", date: todayStr, time: "", desc: "", category: "faculdade" });
    setShowAddEvent(false);
  };

  const addGoal = () => {
    if (!newGoal.name.trim() || !newGoal.target) return;
    setGoals(g => [...g, { ...newGoal, id: Date.now(), current: 0, target: Number(newGoal.target) }]);
    setNewGoal({ name: "", category: "pessoal", target: "", unit: "", deadline: "" });
    setShowAddGoal(false);
  };

  const toggleTask = (id) => setTasks(t => t.map(tk => tk.id === id ? { ...tk, done: !tk.done } : tk));
  const deleteTask = (id) => setTasks(t => t.filter(tk => tk.id !== id));
  const deleteEvent = (id) => setEvents(e => e.filter(ev => ev.id !== id));
  const deleteGoal = (id) => setGoals(g => g.filter(gl => gl.id !== id));
  const updateGoalProgress = (id, delta) => setGoals(g => g.map(gl => gl.id === id ? { ...gl, current: Math.max(0, Math.min(gl.target, gl.current + delta)) } : gl));

  const todayTasks = tasks.filter(t => t.date === todayStr);
  const doneTasks = todayTasks.filter(t => t.done).length;

  const calYear = calDate.getFullYear();
  const calMonth = calDate.getMonth();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev = new Date(calYear, calMonth, 0).getDate();

  const selectedDateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
  const selectedTasks = tasks.filter(t => t.date === selectedDateStr);
  const selectedEvents = events.filter(e => e.date === selectedDateStr).sort((a, b) => a.time.localeCompare(b.time));
  const allUpcoming = events.filter(e => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const calDays = [];
  for (let i = firstDay - 1; i >= 0; i--) calDays.push({ day: daysInPrev - i, current: false });
  for (let i = 1; i <= daysInMonth; i++) calDays.push({ day: i, current: true });
  while (calDays.length % 7 !== 0) calDays.push({ day: calDays.length - daysInMonth - firstDay + 2, current: false });

  const hasEvent = (day, current) => {
    if (!current) return false;
    const ds = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return tasks.some(t => t.date === ds) || events.some(e => e.date === ds);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="header">
          <div className="header-left">
            <div className="header-title">AGENDA</div>
            <div className="header-date">{DAYS[today.getDay()]}, {today.getDate()} de {MONTHS[today.getMonth()]}</div>
          </div>
          <button className={`notif-btn ${notifEnabled ? "active" : ""}`} onClick={requestNotifications}>
            {notifEnabled ? "🔔 Ativo" : "🔕 Notif."}
          </button>
        </div>

        <div className="tabs">
          {[["hoje", "📋 Hoje"], ["agenda", "📅 Agenda"], ["metas", "🎯 Metas"], ["financas", "💰 Finanças"], ["deutsch", "🇩🇪 Alemão"], ["rick", "🧪 Rick"]].map(([key, label]) => (
            <button key={key} className={`tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        <div className="main">
          {tab === "hoje" && (
            <>
              {!notifEnabled && (
                <div className="notif-banner">🔔 <span>Ative as notificações para ser avisado <strong>30 min antes</strong> de cada tarefa!</span></div>
              )}
              <div className="stats-row">
                <div className="stat-card"><div className="stat-num">{todayTasks.length}</div><div className="stat-lbl">Tarefas</div></div>
                <div className="stat-card"><div className="stat-num">{doneTasks}</div><div className="stat-lbl">Feitas</div></div>
                <div className="stat-card"><div className="stat-num">{todayTasks.length > 0 ? Math.round(doneTasks / todayTasks.length * 100) : 0}%</div><div className="stat-lbl">Progresso</div></div>
              </div>

              <div className="row-space">
                <div className="section-title">Tarefas de Hoje</div>
                <button className="btn btn-secondary" style={{ fontSize: 12, padding: "6px 12px", marginBottom: 12 }} onClick={() => setShowAddTask(!showAddTask)}>
                  {showAddTask ? "✕" : "+ Nova"}
                </button>
              </div>

              {showAddTask && (
                <div className="add-form">
                  <div className="form-row">
                    <input className="input" placeholder="Nome da tarefa..." value={newTask.name} onChange={e => setNewTask({ ...newTask, name: e.target.value })} />
                  </div>
                  <div className="form-row">
                    <select className="select" value={newTask.category} onChange={e => setNewTask({ ...newTask, category: e.target.value })}>
                      {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                    <input className="input" type="time" value={newTask.time} onChange={e => setNewTask({ ...newTask, time: e.target.value })} style={{ maxWidth: 120 }} />
                  </div>
                  <div className="form-row">
                    <input className="input" type="date" value={newTask.date} onChange={e => setNewTask({ ...newTask, date: e.target.value })} />
                    <button className="btn btn-primary" onClick={() => addTask()}>Adicionar</button>
                  </div>
                </div>
              )}

              {todayTasks.length === 0 ? (
                <div className="empty"><div className="empty-icon">✅</div>Nenhuma tarefa para hoje!</div>
              ) : todayTasks.map(task => {
                const cat = CATEGORIES[task.category] || CATEGORIES.outro;
                return (
                  <div key={task.id} className={`task-item ${task.done ? "done" : ""}`}>
                    <div className={`task-check ${task.done ? "checked" : ""}`} onClick={() => toggleTask(task.id)} />
                    <div className="task-content">
                      <div className="task-name">{task.name}</div>
                      <div className="task-meta">
                        <span className="task-cat" style={{ background: cat.color + "22", color: cat.color }}>{cat.icon} {cat.label}</span>
                        {task.time && <span className="task-time">⏰ {task.time}</span>}
                      </div>
                    </div>
                    <button className="task-delete" onClick={() => deleteTask(task.id)}>✕</button>
                  </div>
                );
              })}

              {allUpcoming.slice(0, 3).length > 0 && (
                <>
                  <div className="section-title">Próximos Eventos</div>
                  {allUpcoming.slice(0, 3).map(ev => {
                    const cat = CATEGORIES[ev.category] || CATEGORIES.outro;
                    return (
                      <div key={ev.id} className="event-item">
                        <div className="event-time-block">
                          <div className="event-time">{ev.time || "--"}</div>
                          <div className="event-ampm">{ev.date}</div>
                        </div>
                        <div className="event-bar" style={{ background: cat.color }} />
                        <div className="event-content">
                          <div className="event-name">{cat.icon} {ev.name}</div>
                          {ev.desc && <div className="event-desc">{ev.desc}</div>}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}

          {tab === "agenda" && (
            <>
              <div className="calendar">
                <div className="calendar-header">
                  <button className="cal-nav" onClick={() => setCalDate(new Date(calYear, calMonth - 1, 1))}>‹</button>
                  <div className="calendar-title">{MONTHS[calMonth]} {calYear}</div>
                  <button className="cal-nav" onClick={() => setCalDate(new Date(calYear, calMonth + 1, 1))}>›</button>
                </div>
                <div className="calendar-grid">
                  {DAYS.map(d => <div key={d} className="cal-day-name">{d[0]}</div>)}
                  {calDays.map((d, i) => {
                    const isToday = d.current && d.day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                    const isSelected = d.current && d.day === selectedDay && calMonth === calDate.getMonth();
                    return (
                      <div key={i} className={`cal-day ${isToday ? "today" : ""} ${isSelected && !isToday ? "selected" : ""} ${!d.current ? "other-month" : ""}`}
                        onClick={() => d.current && setSelectedDay(d.day)}>
                        {d.day}
                        {hasEvent(d.day, d.current) && <div className="cal-dot" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="row-space">
                <div className="section-title">{selectedDay}/{calMonth + 1}/{calYear}</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  <button className="btn btn-secondary" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setShowAddTask(!showAddTask)}>+ Tarefa</button>
                  <button className="btn btn-secondary" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setShowAddEvent(!showAddEvent)}>+ Evento</button>
                </div>
              </div>

              {showAddTask && (
                <div className="add-form">
                  <div className="form-row">
                    <input className="input" placeholder="Tarefa..." value={newTask.name} onChange={e => setNewTask({ ...newTask, name: e.target.value })} />
                  </div>
                  <div className="form-row">
                    <select className="select" value={newTask.category} onChange={e => setNewTask({ ...newTask, category: e.target.value })}>
                      {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                    <input className="input" type="time" value={newTask.time} onChange={e => setNewTask({ ...newTask, time: e.target.value })} style={{ maxWidth: 120 }} />
                    <button className="btn btn-primary" onClick={() => addTask(selectedDateStr)}>Add</button>
                  </div>
                </div>
              )}

              {showAddEvent && (
                <div className="add-form">
                  <div className="form-row">
                    <input className="input" placeholder="Evento..." value={newEvent.name} onChange={e => setNewEvent({ ...newEvent, name: e.target.value })} />
                    <input className="input" type="time" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} style={{ maxWidth: 120 }} />
                  </div>
                  <div className="form-row">
                    <select className="select" value={newEvent.category} onChange={e => setNewEvent({ ...newEvent, category: e.target.value })}>
                      {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                    <input className="input" placeholder="Descrição (opcional)" value={newEvent.desc} onChange={e => setNewEvent({ ...newEvent, desc: e.target.value })} />
                    <button className="btn btn-primary" onClick={() => addEvent(selectedDateStr)}>Add</button>
                  </div>
                </div>
              )}

              {selectedTasks.length === 0 && selectedEvents.length === 0 ? (
                <div className="empty"><div className="empty-icon">📅</div>Nenhuma tarefa ou evento.</div>
              ) : (
                <>
                  {selectedEvents.map(ev => {
                    const cat = CATEGORIES[ev.category] || CATEGORIES.outro;
                    return (
                      <div key={ev.id} className="event-item">
                        <div className="event-time-block"><div className="event-time">{ev.time || "--"}</div></div>
                        <div className="event-bar" style={{ background: cat.color }} />
                        <div className="event-content">
                          <div className="event-name">{cat.icon} {ev.name}</div>
                          {ev.desc && <div className="event-desc">{ev.desc}</div>}
                        </div>
                        <button className="task-delete" onClick={() => deleteEvent(ev.id)}>✕</button>
                      </div>
                    );
                  })}
                  {selectedTasks.map(task => {
                    const cat = CATEGORIES[task.category] || CATEGORIES.outro;
                    return (
                      <div key={task.id} className={`task-item ${task.done ? "done" : ""}`}>
                        <div className={`task-check ${task.done ? "checked" : ""}`} onClick={() => toggleTask(task.id)} />
                        <div className="task-content">
                          <div className="task-name">{task.name}</div>
                          <div className="task-meta">
                            <span className="task-cat" style={{ background: cat.color + "22", color: cat.color }}>{cat.icon} {cat.label}</span>
                            {task.time && <span className="task-time">⏰ {task.time}</span>}
                          </div>
                        </div>
                        <button className="task-delete" onClick={() => deleteTask(task.id)}>✕</button>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}

          {tab === "metas" && (
            <>
              <div className="row-space">
                <div className="section-title">Metas de Longo Prazo</div>
                <button className="btn btn-secondary" style={{ fontSize: 12, padding: "6px 12px", marginBottom: 12 }} onClick={() => setShowAddGoal(!showAddGoal)}>
                  {showAddGoal ? "✕" : "+ Nova"}
                </button>
              </div>

              {showAddGoal && (
                <div className="add-form">
                  <div className="form-row">
                    <input className="input" placeholder="Nome da meta..." value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} />
                    <select className="select" value={newGoal.category} onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}>
                      {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                  </div>
                  <div className="form-row">
                    <input className="input" type="number" placeholder="Meta total (ex: 30)" value={newGoal.target} onChange={e => setNewGoal({ ...newGoal, target: e.target.value })} />
                    <input className="input" placeholder="Unidade (ex: aulas)" value={newGoal.unit} onChange={e => setNewGoal({ ...newGoal, unit: e.target.value })} />
                  </div>
                  <div className="form-row">
                    <input className="input" type="date" value={newGoal.deadline} onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })} />
                    <button className="btn btn-primary" onClick={addGoal}>Adicionar</button>
                  </div>
                </div>
              )}

              {goals.length === 0 ? (
                <div className="empty"><div className="empty-icon">🎯</div>Nenhuma meta ainda.</div>
              ) : goals.map(goal => {
                const cat = CATEGORIES[goal.category] || CATEGORIES.outro;
                const pct = Math.round((goal.current / goal.target) * 100);
                return (
                  <div key={goal.id} className="goal-item">
                    <div className="goal-header">
                      <div>
                        <div className="goal-name">{cat.icon} {goal.name}</div>
                        {goal.deadline && <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>Prazo: {goal.deadline}</div>}
                      </div>
                      <div className="goal-pct">{pct}%</div>
                    </div>
                    <div className="goal-bar-bg">
                      <div className="goal-bar-fill" style={{ width: `${pct}%`, background: cat.color }} />
                    </div>
                    <div className="goal-meta">
                      <span>{goal.current} / {goal.target} {goal.unit}</span>
                      <span style={{ color: cat.color }}>{cat.label}</span>
                    </div>
                    <div className="goal-actions">
                      <button className="progress-btn" onClick={() => updateGoalProgress(goal.id, -1)}>− 1</button>
                      <button className="progress-btn" onClick={() => updateGoalProgress(goal.id, 1)}>+ 1</button>
                      <button className="progress-btn" onClick={() => updateGoalProgress(goal.id, 5)}>+ 5</button>
                      <button className="progress-btn" style={{ marginLeft: "auto", color: "var(--accent)" }} onClick={() => deleteGoal(goal.id)}>Remover</button>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {tab === "financas" && (
            <>
              {/* Navegação de mês */}
              <div className="fin-month-nav">
                <button className="cal-nav" onClick={() => setFinMonth(new Date(finMonth.getFullYear(), finMonth.getMonth() - 1, 1))}>‹</button>
                <div className="fin-month-label">{MONTHS[finMonth.getMonth()]} {finMonth.getFullYear()}</div>
                <button className="cal-nav" onClick={() => setFinMonth(new Date(finMonth.getFullYear(), finMonth.getMonth() + 1, 1))}>›</button>
              </div>

              {/* Saldo do mês */}
              <div className="fin-balance">
                <div className="fin-balance-label">Saldo do mês</div>
                <div className="fin-balance-value" style={{ color: monthBalance >= 0 ? "#86efac" : "#fca5a5" }}>
                  {formatBRL(monthBalance)}
                </div>
                <div className="fin-balance-sub">
                  {monthBalance >= 0 ? "🟢 Você está no positivo!" : "🔴 Atenção: gastos acima da receita"}
                </div>
              </div>

              {/* Receitas e Despesas */}
              <div className="fin-cards">
                <div className="fin-card">
                  <div className="fin-card-label">⬆️ Receitas</div>
                  <div className="fin-card-value" style={{ color: "#10b981" }}>{formatBRL(monthIncome)}</div>
                </div>
                <div className="fin-card">
                  <div className="fin-card-label">⬇️ Despesas</div>
                  <div className="fin-card-value" style={{ color: "#ef4444" }}>{formatBRL(monthExpense)}</div>
                </div>
              </div>

              {/* Botões de ação */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setShowAddTx(!showAddTx); setShowBudgets(false); }}>
                  {showAddTx ? "✕ Fechar" : "+ Lançamento"}
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowBudgets(!showBudgets); setShowAddTx(false); }}>
                  {showBudgets ? "✕ Fechar" : "🎯 Orçamento"}
                </button>
              </div>

              {/* Form de lançamento */}
              {showAddTx && (
                <div className="add-form">
                  <div className="fin-type-toggle">
                    <button
                      className={`fin-type-btn ${newTx.type === "receita" ? "active-receita" : ""}`}
                      onClick={() => setNewTx({ ...newTx, type: "receita", category: "salario" })}
                    >⬆️ Receita</button>
                    <button
                      className={`fin-type-btn ${newTx.type === "despesa" ? "active-despesa" : ""}`}
                      onClick={() => setNewTx({ ...newTx, type: "despesa", category: "alimentacao" })}
                    >⬇️ Despesa</button>
                  </div>
                  <div className="form-row">
                    <input className="input" type="number" inputMode="decimal" placeholder="Valor (R$)" value={newTx.amount} onChange={e => setNewTx({ ...newTx, amount: e.target.value })} />
                    <select className="select" value={newTx.category} onChange={e => setNewTx({ ...newTx, category: e.target.value })}>
                      {Object.entries(FIN_CATEGORIES).filter(([, v]) => v.type === newTx.type).map(([k, v]) => (
                        <option key={k} value={k}>{v.icon} {v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <input className="input" placeholder="Descrição (opcional)" value={newTx.desc} onChange={e => setNewTx({ ...newTx, desc: e.target.value })} />
                  </div>
                  <div className="form-row">
                    <input className="input" type="date" value={newTx.date} onChange={e => setNewTx({ ...newTx, date: e.target.value })} />
                    <button className="btn btn-primary" onClick={addTransaction}>Salvar</button>
                  </div>
                </div>
              )}

              {/* Definição de orçamento por categoria */}
              {showBudgets && (
                <div className="add-form">
                  <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12, lineHeight: 1.6 }}>
                    Defina um limite mensal por categoria. O app te avisa quando você se aproximar ou estourar. 🎯
                  </div>
                  {Object.entries(FIN_CATEGORIES).filter(([, v]) => v.type === "despesa").map(([k, v]) => (
                    <div key={k} className="form-row" style={{ alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, minWidth: 130, display: "flex", alignItems: "center", gap: 6 }}>{v.icon} {v.label}</span>
                      <input className="input" type="number" inputMode="decimal" placeholder="Sem limite" value={budgets[k] || ""} onChange={e => setBudget(k, e.target.value)} style={{ maxWidth: 130 }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Gastos por categoria */}
              {expenseBreakdown.length > 0 && (
                <>
                  <div className="section-title">Para onde foi o dinheiro</div>
                  {expenseBreakdown.map(([cat, value]) => {
                    const c = FIN_CATEGORIES[cat] || FIN_CATEGORIES.outros_desp;
                    const pct = monthExpense > 0 ? Math.round((value / monthExpense) * 100) : 0;
                    const budget = budgets[cat];
                    const budgetPct = budget > 0 ? Math.round((value / budget) * 100) : null;
                    return (
                      <div key={cat} className="fin-breakdown-item">
                        <div className="fin-breakdown-top">
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>{c.icon} {c.label}</span>
                          <span style={{ fontWeight: 600 }}>{formatBRL(value)} <span style={{ color: "var(--text2)", fontWeight: 400 }}>({pct}%)</span></span>
                        </div>
                        <div className="fin-breakdown-bar-bg">
                          <div className="fin-breakdown-bar" style={{ width: `${pct}%`, background: c.color }} />
                        </div>
                        {budgetPct !== null && (
                          <div className="fin-budget-warn" style={{ marginTop: 4, color: budgetPct >= 100 ? "#ef4444" : budgetPct >= 80 ? "#f59e0b" : "var(--text2)" }}>
                            {budgetPct >= 100 ? "🚨 Estourou o orçamento" : budgetPct >= 80 ? "⚠️ Perto do limite" : "✅ Dentro do orçamento"}
                            {" "}— {formatBRL(value)} de {formatBRL(budget)} ({budgetPct}%)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {/* Histórico de lançamentos */}
              <div className="section-title">Lançamentos de {MONTHS[finMonth.getMonth()]}</div>
              {sortedMonthTx.length === 0 ? (
                <div className="empty"><div className="empty-icon">💰</div>Nenhum lançamento neste mês.<br/>Toque em "+ Lançamento" para começar!</div>
              ) : sortedMonthTx.map(tx => {
                const c = FIN_CATEGORIES[tx.category] || FIN_CATEGORIES.outros_desp;
                const isIncome = tx.type === "receita";
                return (
                  <div key={tx.id} className="fin-tx">
                    <div className="fin-tx-icon" style={{ background: c.color + "22" }}>{c.icon}</div>
                    <div className="fin-tx-body">
                      <div className="fin-tx-name">{tx.desc || c.label}</div>
                      <div className="fin-tx-meta">{c.label} · {tx.date.split("-").reverse().join("/")}</div>
                    </div>
                    <div className="fin-tx-amount" style={{ color: isIncome ? "#10b981" : "#ef4444" }}>
                      {isIncome ? "+" : "−"} {formatBRL(tx.amount)}
                    </div>
                    <button className="task-delete" onClick={() => deleteTransaction(tx.id)}>✕</button>
                  </div>
                );
              })}
            </>
          )}

          {tab === "deutsch" && (
            <>
              {/* Header */}
              <div className="deutsch-header">
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#93c5fd", letterSpacing: -0.5 }}>
                  🇩🇪 Professor Hans
                </div>
                <div style={{ fontSize: 12, color: "#60a5fa", marginTop: 4, lineHeight: 1.5 }}>
                  Seu tutor de alemão pessoal — explica tudo em português
                </div>
              </div>

              {/* API Setup */}
              <div className="add-form" style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: deutschApiKey ? "#10b981" : "#f59e0b" }}>
                    {deutschApiKey ? "✅ API Key configurada" : "⚠️ API Key não configurada"}
                  </div>
                  <button className="btn btn-secondary" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setShowDeutschSetup(!showDeutschSetup)}>
                    {showDeutschSetup ? "Fechar" : "⚙️ Configurar"}
                  </button>
                </div>
                {showDeutschSetup && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10, lineHeight: 1.7, background: "var(--bg2)", padding: "10px 12px", borderRadius: 8 }}>
                      <strong>Como obter a API Key (100% grátis):</strong><br/>
                      1. Acesse <strong>aistudio.google.com/apikey</strong><br/>
                      2. Faça login com sua conta <strong>Google</strong><br/>
                      3. Clique em <strong>"Create API key"</strong> e copie<br/>
                      ✅ Sem cartão de crédito, sem cobrança!
                    </div>
                    <div className="form-row">
                      <input className="input" type="password" placeholder="Cole sua API Key do Google Gemini" value={deutschApiKey} onChange={e => setDeutschApiKey(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              {/* Mode selector */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "var(--text2)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Modo</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {Object.entries(DEUTSCH_MODES).map(([key, { label }]) => (
                    <button key={key} className={`mode-btn ${deutschMode === key ? "active" : ""}`} onClick={() => setDeutschMode(key)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level selector */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "var(--text2)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Nível</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[["iniciante", "🌱 Iniciante"], ["intermediario", "📈 Intermediário"], ["avancado", "🎓 Avançado"]].map(([key, label]) => (
                    <button key={key} className={`level-btn ${deutschLevel === key ? "active" : ""}`} onClick={() => setDeutschLevel(key)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat */}
              <div className="add-form" style={{ padding: "14px 12px" }}>
                {/* Quick prompts */}
                {deutschMessages.length === 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 8 }}>Sugestões para começar:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {DEUTSCH_QUICK[deutschMode].map(p => (
                        <button key={p} className="quick-prompt" onClick={() => sendDeutschMessage(p)}>{p}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                {deutschMessages.length > 0 && (
                  <div className="deutsch-chat">
                    {deutschMessages.map((msg, i) => (
                      <div key={i} className={msg.role === "user" ? "msg-user" : "msg-assistant"}>
                        {msg.role === "assistant" && (
                          <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600, marginBottom: 4 }}>🎓 Professor Hans</div>
                        )}
                        {msg.content}
                      </div>
                    ))}
                    {deutschLoading && (
                      <div className="msg-assistant">
                        <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600, marginBottom: 6 }}>🎓 Professor Hans</div>
                        <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                      </div>
                    )}
                    <div ref={deutschEndRef} />
                  </div>
                )}

                {deutschError && <div className="deutsch-error">❌ {deutschError}</div>}

                {/* Input */}
                <div className="deutsch-input-row">
                  <textarea
                    className="deutsch-input"
                    placeholder={`Mensagem para o Professor Hans... (${DEUTSCH_MODES[deutschMode].label})`}
                    value={deutschInput}
                    onChange={e => setDeutschInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendDeutschMessage(); } }}
                    rows={1}
                  />
                  <button className="deutsch-send" onClick={() => sendDeutschMessage()} disabled={deutschLoading || !deutschInput.trim()}>
                    Enviar
                  </button>
                </div>

                {deutschMessages.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {DEUTSCH_QUICK[deutschMode].map(p => (
                        <button key={p} className="quick-prompt" onClick={() => sendDeutschMessage(p)}>{p}</button>
                      ))}
                    </div>
                    <button className="btn btn-secondary" style={{ fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => setDeutschMessages([])}>
                      Limpar
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "rick" && (
            <>
              <div className="rick-header">
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#97ce4c", letterSpacing: -0.5 }}>
                  🧪 Rick Voice AI
                </div>
                <div style={{ fontSize: 12, color: "#7aad3a", marginTop: 4, lineHeight: 1.5 }}>
                  Digite um texto e o Rick vai ler com a voz dele via ElevenLabs
                </div>
              </div>

              {/* API Setup */}
              <div className="add-form" style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: rickApiKey ? "#10b981" : "#f59e0b" }}>
                    {rickApiKey ? "✅ API Key configurada" : "⚠️ API Key não configurada"}
                  </div>
                  <button className="btn btn-secondary" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setShowRickSetup(!showRickSetup)}>
                    {showRickSetup ? "Fechar" : "⚙️ Configurar"}
                  </button>
                </div>

                {showRickSetup && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12, lineHeight: 1.7, background: "var(--bg2)", padding: "10px 12px", borderRadius: 8 }}>
                      <strong>Como configurar:</strong><br/>
                      1. Crie conta grátis em <strong>elevenlabs.io</strong> (10k chars/mês grátis)<br/>
                      2. Vá em <strong>Profile Settings → API Keys</strong> e copie sua key<br/>
                      3. Na <strong>Voice Library</strong>, busque por <strong>"Rick Sanchez"</strong> e adicione à sua conta<br/>
                      4. Copie o <strong>Voice ID</strong> da voz adicionada e cole abaixo
                    </div>
                    <div className="form-row">
                      <input className="input" type="password" placeholder="xi-api-key do ElevenLabs" value={rickApiKey} onChange={e => setRickApiKey(e.target.value)} />
                    </div>
                    <div className="form-row">
                      <input className="input" placeholder="Voice ID (padrão: Arnold — grave/rouco)" value={rickVoiceId} onChange={e => setRickVoiceId(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              {/* Text Input */}
              <div className="add-form">
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>Frases rápidas do Rick:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {[
                    "Wubba lubba dub dub!",
                    "Sou o Pickle Rick!",
                    "Get schwifty!",
                    "Morty, precisamos ir agora!",
                    "Eu sou um gênio, Morty.",
                  ].map(phrase => (
                    <button key={phrase} className="rick-chip" onClick={() => setRickText(phrase)}>{phrase}</button>
                  ))}
                </div>

                <textarea
                  className="rick-textarea"
                  placeholder="Digite o que o Rick vai falar..."
                  value={rickText}
                  onChange={e => setRickText(e.target.value)}
                  style={{ marginBottom: 12 }}
                />

                <label className="rick-toggle">
                  <input type="checkbox" checked={rickModeOn} onChange={e => setRickModeOn(e.target.checked)} />
                  <span style={{ fontSize: 13 }}>🧬 <strong>Modo Rick</strong> — adiciona frases e vícios de linguagem automaticamente</span>
                </label>

                <button className="rick-speak-btn" onClick={speakAsRick} disabled={rickLoading}>
                  {rickLoading ? "⏳ Gerando com o ElevenLabs..." : "🎙️ Falar como o Rick!"}
                </button>

                {rickError && <div className="rick-error">❌ {rickError}</div>}
              </div>

              {audioUrl && (
                <div className="rick-audio-box">
                  <div style={{ fontSize: 13, color: "#7aad3a", marginBottom: 10, fontWeight: 600 }}>🔊 Wubba lubba dub dub! Ouça:</div>
                  <audio ref={rickAudioRef} controls src={audioUrl} style={{ width: "100%" }} />
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 8 }}>
                    Áudio gerado pelo ElevenLabs — {new Date().toLocaleTimeString("pt-BR")}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
