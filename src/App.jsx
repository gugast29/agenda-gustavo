import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY_TASKS = "agenda_tasks";
const STORAGE_KEY_GOALS = "agenda_goals";
const STORAGE_KEY_EVENTS = "agenda_events";

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
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}

function saveData(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

// Register service worker
async function registerSW() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.warn("SW registration failed:", e);
    return null;
  }
}

async function scheduleViaSW(title, body, delayMs) {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  if (reg && reg.active) {
    reg.active.postMessage({ type: "SCHEDULE_NOTIF", title, body, delay: delayMs });
  }
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Epilogue:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #f5f2ee;
    --bg2: #edeae4;
    --card: #ffffff;
    --border: #e0dbd3;
    --text: #1a1814;
    --text2: #6b6560;
    --accent: #c84b31;
    --accent2: #e8a87c;
  }

  body { background: var(--bg); color: var(--text); font-family: 'Epilogue', sans-serif; }
  .app { min-height: 100vh; display: flex; flex-direction: column; }

  .header {
    background: var(--text);
    color: var(--bg);
    padding: 20px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-left { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; }
  .header-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .header-date { font-size: 12px; color: #888; font-weight: 300; }

  .notif-btn {
    background: transparent;
    border: 1px solid #444;
    color: #aaa;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 12px;
    cursor: pointer;
    font-family: 'Epilogue', sans-serif;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .notif-btn.active { border-color: #e8a87c; color: #e8a87c; }
  .notif-btn:hover { border-color: #888; color: #ddd; }

  .tabs {
    display: flex;
    background: var(--bg2);
    border-bottom: 1px solid var(--border);
    padding: 0 28px;
    gap: 4px;
  }

  .tab {
    padding: 14px 20px;
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.5px;
    cursor: pointer;
    background: transparent;
    border: none;
    color: var(--text2);
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
  .tab:hover:not(.active) { color: var(--text); }

  .main { flex: 1; padding: 24px 28px; max-width: 900px; width: 100%; margin: 0 auto; }

  .section-title {
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text2);
    margin-bottom: 14px;
    margin-top: 28px;
  }
  .section-title:first-child { margin-top: 0; }

  .task-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    margin-bottom: 8px;
    transition: all 0.2s;
  }
  .task-item.done { opacity: 0.5; }
  .task-item:hover { border-color: #ccc; }

  .task-check {
    width: 20px; height: 20px;
    border-radius: 50%;
    border: 2px solid var(--border);
    cursor: pointer;
    flex-shrink: 0;
    margin-top: 2px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .task-check.checked { background: var(--accent); border-color: var(--accent); }
  .task-check.checked::after { content: '✓'; color: white; font-size: 11px; }

  .task-content { flex: 1; }
  .task-name { font-size: 14px; font-weight: 500; color: var(--text); line-height: 1.4; }
  .task-item.done .task-name { text-decoration: line-through; color: var(--text2); }

  .task-meta { display: flex; gap: 8px; margin-top: 4px; align-items: center; flex-wrap: wrap; }
  .task-cat { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
  .task-time { font-size: 11px; color: var(--text2); }

  .task-delete {
    background: none; border: none; color: #ccc; cursor: pointer;
    font-size: 16px; padding: 0 4px; transition: color 0.2s; flex-shrink: 0;
  }
  .task-delete:hover { color: var(--accent); }

  .add-form {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 18px 20px;
    margin-bottom: 20px;
  }

  .form-row { display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
  .form-row:last-child { margin-bottom: 0; }

  .input {
    flex: 1; min-width: 140px;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: 'Epilogue', sans-serif;
    font-size: 14px;
    background: var(--bg);
    color: var(--text);
    outline: none;
    transition: border-color 0.2s;
  }
  .input:focus { border-color: var(--accent); }

  .select {
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: 'Epilogue', sans-serif;
    font-size: 13px;
    background: var(--bg);
    color: var(--text);
    outline: none;
    cursor: pointer;
  }

  .btn {
    padding: 10px 20px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.5px;
    transition: all 0.2s;
  }
  .btn-primary { background: var(--accent); color: white; }
  .btn-primary:hover { background: #b03d28; }
  .btn-secondary { background: var(--bg2); color: var(--text); border: 1px solid var(--border); }
  .btn-secondary:hover { background: var(--border); }

  .calendar { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 20px; }

  .calendar-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; border-bottom: 1px solid var(--border);
  }
  .calendar-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; }

  .cal-nav {
    background: none; border: 1px solid var(--border); border-radius: 6px;
    padding: 4px 10px; cursor: pointer; font-size: 14px; color: var(--text2); transition: all 0.2s;
  }
  .cal-nav:hover { background: var(--bg2); }

  .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); }

  .cal-day-name {
    text-align: center; padding: 10px 4px; font-size: 11px; font-weight: 600;
    color: var(--text2); letter-spacing: 1px; text-transform: uppercase;
    border-bottom: 1px solid var(--border);
  }

  .cal-day {
    aspect-ratio: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; cursor: pointer;
    font-size: 13px; border-right: 1px solid var(--bg2); border-bottom: 1px solid var(--bg2);
    transition: all 0.15s; gap: 2px; padding: 4px;
  }
  .cal-day:hover { background: var(--bg2); }
  .cal-day.today { background: var(--accent); color: white; font-weight: 700; }
  .cal-day.today:hover { background: #b03d28; }
  .cal-day.selected { background: var(--bg2); border: 2px solid var(--accent); }
  .cal-day.other-month { color: #ccc; }
  .cal-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--accent2); }
  .cal-day.today .cal-dot { background: white; }

  .event-item {
    display: flex; gap: 14px; padding: 12px 16px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 10px; margin-bottom: 8px; align-items: flex-start;
  }
  .event-time-block { text-align: center; min-width: 44px; }
  .event-time { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--accent); }
  .event-ampm { font-size: 10px; color: var(--text2); }
  .event-bar { width: 3px; border-radius: 2px; align-self: stretch; min-height: 30px; }
  .event-content { flex: 1; }
  .event-name { font-size: 14px; font-weight: 500; }
  .event-desc { font-size: 12px; color: var(--text2); margin-top: 2px; }

  .goal-item {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 10px; padding: 16px 18px; margin-bottom: 10px;
  }
  .goal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .goal-name { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; }
  .goal-pct { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: var(--accent); }
  .goal-bar-bg { height: 6px; background: var(--bg2); border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
  .goal-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
  .goal-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--text2); }
  .goal-actions { display: flex; gap: 6px; margin-top: 10px; }
  .progress-btn {
    padding: 4px 12px; border-radius: 6px; border: 1px solid var(--border);
    background: var(--bg); font-size: 12px; cursor: pointer;
    font-family: 'Epilogue', sans-serif; transition: all 0.2s;
  }
  .progress-btn:hover { background: var(--bg2); }

  .empty { text-align: center; padding: 40px 20px; color: var(--text2); font-size: 14px; }
  .empty-icon { font-size: 32px; margin-bottom: 10px; }

  .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px; }
  .stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; text-align: center; }
  .stat-num { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: var(--accent); line-height: 1; }
  .stat-lbl { font-size: 11px; color: var(--text2); margin-top: 4px; letter-spacing: 0.5px; }

  .notif-banner {
    background: #fff8f0; border: 1px solid #e8a87c; border-radius: 10px;
    padding: 12px 16px; margin-bottom: 16px; font-size: 13px; color: #7a4a20;
    display: flex; align-items: center; gap: 10px;
  }

  @media (max-width: 600px) {
    .main { padding: 16px; }
    .tabs { padding: 0 16px; }
    .header { padding: 16px; }
    .tab { padding: 12px 14px; font-size: 12px; }
    .form-row { flex-direction: column; }
  }
`;

export default function Agenda() {
  const today = new Date();
  const [tab, setTab] = useState("hoje");
  const [tasks, setTasks] = useState(() => loadData(STORAGE_KEY_TASKS, []));
  const [goals, setGoals] = useState(() => loadData(STORAGE_KEY_GOALS, [
    { id: 1, name: "Estudar Alemão", category: "alemao", target: 30, current: 8, unit: "aulas", deadline: "2025-12-31" },
    { id: 2, name: "Horas Terra AUV", category: "terra", target: 100, current: 23, unit: "horas", deadline: "2025-07-01" },
    { id: 3, name: "Recuperação Acidente", category: "saude", target: 30, current: 18, unit: "dias", deadline: "2025-06-30" },
  ]));
  const [events, setEvents] = useState(() => loadData(STORAGE_KEY_EVENTS, []));
  const [calDate, setCalDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [swReady, setSwReady] = useState(false);

  const [newTask, setNewTask] = useState({ name: "", category: "faculdade", time: "", date: "" });
  const [newEvent, setNewEvent] = useState({ name: "", date: "", time: "", desc: "", category: "faculdade" });
  const [newGoal, setNewGoal] = useState({ name: "", category: "pessoal", target: "", unit: "", deadline: "" });
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);

  useEffect(() => { saveData(STORAGE_KEY_TASKS, tasks); }, [tasks]);
  useEffect(() => { saveData(STORAGE_KEY_GOALS, goals); }, [goals]);
  useEffect(() => { saveData(STORAGE_KEY_EVENTS, events); }, [events]);

  useEffect(() => {
    registerSW().then(reg => { if (reg) setSwReady(true); });
    if (Notification.permission === "granted") setNotifEnabled(true);
  }, []);

  const requestNotifications = async () => {
    if (!("Notification" in window)) return alert("Seu navegador não suporta notificações.");
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setNotifEnabled(true);
      await registerSW();
      setSwReady(true);
      new Notification("✅ Agenda Gustavo", {
        body: "Notificações ativadas! Você será avisado 30 minutos antes de cada tarefa.",
        icon: "/favicon.ico",
      });
    }
  };

  const scheduleNotification = useCallback(async (task) => {
    if (!task.time || !task.date) return;
    const [h, m] = task.time.split(":").map(Number);
    const taskTime = new Date(task.date + "T" + task.time);
    const notifTime = new Date(taskTime.getTime() - 30 * 60 * 1000); // 30 min antes
    const diff = notifTime - new Date();
    if (diff <= 0) return;

    const cat = CATEGORIES[task.category] || CATEGORIES.outro;
    const title = `⏰ ${task.name}`;
    const body = `${cat.icon} ${cat.label} — em 30 minutos (${task.time})`;

    if (swReady) {
      await scheduleViaSW(title, body, diff);
    } else if (notifEnabled) {
      setTimeout(() => new Notification(title, { body, icon: "/favicon.ico", requireInteraction: true }), diff);
    }
  }, [notifEnabled, swReady]);

  const addTask = useCallback((overrideDate) => {
    if (!newTask.name.trim()) return;
    const task = {
      ...newTask,
      id: Date.now(),
      done: false,
      date: overrideDate || newTask.date || today.toISOString().split("T")[0],
    };
    setTasks(t => [...t, task]);
    scheduleNotification(task);
    setNewTask({ name: "", category: "faculdade", time: "", date: "" });
    setShowAddTask(false);
  }, [newTask, scheduleNotification, today]);

  const addEvent = useCallback((overrideDate) => {
    if (!newEvent.name.trim()) return;
    const event = { ...newEvent, id: Date.now(), date: overrideDate || newEvent.date };
    if (!event.date) return;
    setEvents(e => [...e, event]);
    setNewEvent({ name: "", date: "", time: "", desc: "", category: "faculdade" });
    setShowAddEvent(false);
  }, [newEvent]);

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

  const todayStr = today.toISOString().split("T")[0];
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
            <div className="header-title">AGENDA GUSTAVO</div>
            <div className="header-date">{DAYS[today.getDay()]}, {today.getDate()} de {MONTHS[today.getMonth()]}</div>
          </div>
          <button className={`notif-btn ${notifEnabled ? "active" : ""}`} onClick={requestNotifications}>
            {notifEnabled ? "🔔 Notif. ativas" : "🔕 Ativar notif."}
          </button>
        </div>

        <div className="tabs">
          {[["hoje", "📋 Hoje"], ["agenda", "📅 Agenda"], ["metas", "🎯 Metas"]].map(([key, label]) => (
            <button key={key} className={`tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        <div className="main">
          {/* HOJE */}
          {tab === "hoje" && (
            <>
              {!notifEnabled && (
                <div className="notif-banner">
                  🔔 <span>Ative as notificações no botão acima para ser avisado <strong>30 minutos antes</strong> de cada tarefa!</span>
                </div>
              )}

              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-num">{todayTasks.length}</div>
                  <div className="stat-lbl">Tarefas hoje</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num">{doneTasks}</div>
                  <div className="stat-lbl">Concluídas</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num">{todayTasks.length > 0 ? Math.round(doneTasks / todayTasks.length * 100) : 0}%</div>
                  <div className="stat-lbl">Progresso</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="section-title">Tarefas de Hoje</div>
                <button className="btn btn-secondary" style={{ fontSize: 12, padding: "6px 14px", marginBottom: 14 }} onClick={() => setShowAddTask(!showAddTask)}>
                  {showAddTask ? "✕ Cancelar" : "+ Nova tarefa"}
                </button>
              </div>

              {showAddTask && (
                <div className="add-form">
                  <div className="form-row">
                    <input className="input" placeholder="Nome da tarefa..." value={newTask.name}
                      onChange={e => setNewTask({ ...newTask, name: e.target.value })}
                      onKeyDown={e => e.key === "Enter" && addTask()} />
                  </div>
                  <div className="form-row">
                    <select className="select" value={newTask.category} onChange={e => setNewTask({ ...newTask, category: e.target.value })}>
                      {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                    <input className="input" type="time" value={newTask.time} onChange={e => setNewTask({ ...newTask, time: e.target.value })} style={{ maxWidth: 130 }} />
                    <input className="input" type="date" value={newTask.date || todayStr} onChange={e => setNewTask({ ...newTask, date: e.target.value })} style={{ maxWidth: 160 }} />
                    <button className="btn btn-primary" onClick={() => addTask()}>Adicionar</button>
                  </div>
                </div>
              )}

              {todayTasks.length === 0 ? (
                <div className="empty"><div className="empty-icon">✅</div>Nenhuma tarefa para hoje!</div>
              ) : (
                todayTasks.map(task => {
                  const cat = CATEGORIES[task.category] || CATEGORIES.outro;
                  return (
                    <div key={task.id} className={`task-item ${task.done ? "done" : ""}`}>
                      <div className={`task-check ${task.done ? "checked" : ""}`} onClick={() => toggleTask(task.id)} />
                      <div className="task-content">
                        <div className="task-name">{task.name}</div>
                        <div className="task-meta">
                          <span className="task-cat" style={{ background: cat.color + "22", color: cat.color }}>{cat.icon} {cat.label}</span>
                          {task.time && <span className="task-time">⏰ {task.time} (aviso 30min antes)</span>}
                        </div>
                      </div>
                      <button className="task-delete" onClick={() => deleteTask(task.id)}>✕</button>
                    </div>
                  );
                })
              )}

              {allUpcoming.slice(0, 3).length > 0 && (
                <>
                  <div className="section-title" style={{ marginTop: 28 }}>Próximos Eventos</div>
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

          {/* AGENDA */}
          {tab === "agenda" && (
            <>
              <div className="calendar">
                <div className="calendar-header">
                  <button className="cal-nav" onClick={() => setCalDate(new Date(calYear, calMonth - 1, 1))}>‹</button>
                  <div className="calendar-title">{MONTHS[calMonth]} {calYear}</div>
                  <button className="cal-nav" onClick={() => setCalDate(new Date(calYear, calMonth + 1, 1))}>›</button>
                </div>
                <div className="calendar-grid">
                  {DAYS.map(d => <div key={d} className="cal-day-name">{d}</div>)}
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

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="section-title">{selectedDay}/{calMonth + 1}/{calYear}</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <button className="btn btn-secondary" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => setShowAddTask(!showAddTask)}>+ Tarefa</button>
                  <button className="btn btn-secondary" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => setShowAddEvent(!showAddEvent)}>+ Evento</button>
                </div>
              </div>

              {showAddTask && (
                <div className="add-form">
                  <div className="form-row">
                    <input className="input" placeholder="Nome da tarefa..." value={newTask.name} onChange={e => setNewTask({ ...newTask, name: e.target.value })} />
                    <select className="select" value={newTask.category} onChange={e => setNewTask({ ...newTask, category: e.target.value })}>
                      {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                    <input className="input" type="time" value={newTask.time} onChange={e => setNewTask({ ...newTask, time: e.target.value })} style={{ maxWidth: 130 }} />
                    <button className="btn btn-primary" onClick={() => addTask(selectedDateStr)}>Add</button>
                  </div>
                </div>
              )}

              {showAddEvent && (
                <div className="add-form">
                  <div className="form-row">
                    <input className="input" placeholder="Nome do evento..." value={newEvent.name} onChange={e => setNewEvent({ ...newEvent, name: e.target.value })} />
                    <input className="input" type="time" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} style={{ maxWidth: 130 }} />
                  </div>
                  <div className="form-row">
                    <input className="input" placeholder="Descrição (opcional)" value={newEvent.desc} onChange={e => setNewEvent({ ...newEvent, desc: e.target.value })} />
                    <select className="select" value={newEvent.category} onChange={e => setNewEvent({ ...newEvent, category: e.target.value })}>
                      {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                    <button className="btn btn-primary" onClick={() => addEvent(selectedDateStr)}>Add</button>
                  </div>
                </div>
              )}

              {selectedTasks.length === 0 && selectedEvents.length === 0 ? (
                <div className="empty"><div className="empty-icon">📅</div>Nenhuma tarefa ou evento neste dia.</div>
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

          {/* METAS */}
          {tab === "metas" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="section-title">Metas de Longo Prazo</div>
                <button className="btn btn-secondary" style={{ fontSize: 12, padding: "6px 14px", marginBottom: 14 }} onClick={() => setShowAddGoal(!showAddGoal)}>
                  {showAddGoal ? "✕ Cancelar" : "+ Nova meta"}
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
                    <input className="input" type="number" placeholder="Meta total (ex: 30)" value={newGoal.target} onChange={e => setNewGoal({ ...newGoal, target: e.target.value })} style={{ maxWidth: 160 }} />
                    <input className="input" placeholder="Unidade (ex: aulas, km, horas)" value={newGoal.unit} onChange={e => setNewGoal({ ...newGoal, unit: e.target.value })} />
                    <input className="input" type="date" value={newGoal.deadline} onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })} style={{ maxWidth: 160 }} />
                    <button className="btn btn-primary" onClick={addGoal}>Adicionar</button>
                  </div>
                </div>
              )}

              {goals.length === 0 ? (
                <div className="empty"><div className="empty-icon">🎯</div>Nenhuma meta cadastrada ainda.</div>
              ) : (
                goals.map(goal => {
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
                })
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
