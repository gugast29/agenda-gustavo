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
          {[["hoje", "📋 Hoje"], ["agenda", "📅 Agenda"], ["metas", "🎯 Metas"], ["rick", "🧪 Rick"]].map(([key, label]) => (
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
