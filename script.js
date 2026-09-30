const DAILY_GOAL = 60 * 60; // 1 hour in seconds

let data = JSON.parse(localStorage.getItem("phoneAwayData")) || {
  xp: 0,
  streak: 0,
  bestStreak: 0,
  totalAway: 0,
  lastCompleted: null,
  achievements: {
    a30: false,
    a60: false,
    a7: false,
    a30day: false
  },
  history: []
};

let session = {
  running: false,
  startTime: null,
  timer: null,
  completed: false
};

function save() {
  localStorage.setItem("phoneAwayData", JSON.stringify(data));
}

function formatTime(seconds) {
  seconds = Math.max(0, Math.floor(seconds));

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatShort(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getRank(xp) {
  if (xp >= 10000) return "PHONE LEGEND 👑";
  if (xp >= 7000) return "DIGITAL MONK 🧘";
  if (xp >= 4000) return "PHONE NINJA 🥷";
  if (xp >= 2000) return "PHONE ESCAPER 🏃";
  if (xp >= 1000) return "FOCUS WARRIOR ⚔️";
  if (xp >= 500) return "SCREEN BREAKER 🔥";
  return "PHONE BEGINNER";
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function yesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function updateUI() {
  document.getElementById("xp").textContent = data.xp;
  document.getElementById("xpText").textContent = `${data.xp} XP`;
  document.getElementById("streak").textContent = data.streak;
  document.getElementById("bestStreak").textContent = data.bestStreak;
  document.getElementById("rankName").textContent = getRank(data.xp);
  document.getElementById("totalAway").textContent = formatShort(data.totalAway);

  updateAchievements();
  renderHistory();
}

function updateAchievements() {
  const map = {
    a30: data.achievements.a30,
    a60: data.achievements.a60,
    a7: data.achievements.a7,
    a30day: data.achievements.a30day
  };

  Object.keys(map).forEach(id => {
    const el = document.getElementById(id);

    if (map[id]) {
      el.classList.remove("locked");
      el.classList.add("unlocked");
    }
  });
}

function renderHistory() {
  const list = document.getElementById("historyList");

  if (!data.history.length) {
    list.innerHTML = `<p class="empty">No sessions yet.</p>`;
    return;
  }

  list.innerHTML = data.history
    .slice(0, 10)
    .map(item => `
      <div class="session">
        <span>${item.date}</span>
        <strong>${formatShort(item.seconds)} • +${item.xp} XP</strong>
      </div>
    `)
    .join("");
}

function startSession() {
  if (session.running) return;

  session.running = true;
  session.startTime = Date.now();
  session.completed = false;

  document.getElementById("startBtn").disabled = true;
  document.getElementById("stopBtn").disabled = false;
  document.getElementById("status").textContent =
    "🔥 Streak session active. Put the phone down!";

  session.timer = setInterval(updateTimer, 250);
  updateTimer();
}

function updateTimer() {
  if (!session.running) return;

  const elapsed = Math.floor((Date.now() - session.startTime) / 1000);

  document.getElementById("timer").textContent = formatTime(elapsed);

  const percentage = Math.min((elapsed / DAILY_GOAL) * 100, 100);
  document.getElementById("progressBar").style.width = `${percentage}%`;

  if (elapsed >= DAILY_GOAL && !session.completed) {
    session.completed = true;
    completeGoal(elapsed);
  }
}

function completeGoal(elapsed) {
  stopTimerOnly();

  const today = todayString();

  // Prevent completing the same daily streak twice.
  if (data.lastCompleted !== today) {

    if (data.lastCompleted === yesterdayString()) {
      data.streak++;
    } else {
      data.streak = 1;
    }

    data.bestStreak = Math.max(data.bestStreak, data.streak);

    // 100 XP for completing the daily goal.
    data.xp += 100;

    data.totalAway += elapsed;

    data.history.unshift({
      date: today,
      seconds: elapsed,
      xp: 100
    });

    data.lastCompleted = today;

    checkAchievements(elapsed);

    save();
    updateUI();

    showCelebration(
      "🔥",
      "STREAK COMPLETE!",
      `You stayed away for ${formatShort(elapsed)}.<br><br>+100 XP<br>🔥 ${data.streak} day streak`
    );
  } else {
    data.totalAway += elapsed;

    data.history.unshift({
      date: today,
      seconds: elapsed,
      xp: 0
    });

    save();
    updateUI();

    showCelebration(
      "📵",
      "SESSION COMPLETE",
      "Today's streak is already secured!<br><br>Keep going."
    );
  }

  resetTimerDisplay();
}

function stopSession() {
  if (!session.running) return;

  const elapsed = Math.floor((Date.now() - session.startTime) / 1000);

  stopTimerOnly();

  if (elapsed < DAILY_GOAL) {
    data.totalAway += elapsed;

    // Give 1 XP per completed minute.
    const earnedXP = Math.floor(elapsed / 60);

    data.xp += earnedXP;

    if (elapsed >= 60) {
      data.history.unshift({
        date: todayString(),
        seconds: elapsed,
        xp: earnedXP
      });
    }

    save();
    updateUI();

    document.getElementById("status").textContent =
      `Session ended. +${earnedXP} XP earned.`;
  }

  resetTimerDisplay();
}

function stopTimerOnly() {
  clearInterval(session.timer);

  session.running = false;
  session.timer = null;

  document.getElementById("startBtn").disabled = false;
  document.getElementById("stopBtn").disabled = true;
}

function resetTimerDisplay() {
  document.getElementById("timer").textContent = "00:00:00";
  document.getElementById("progressBar").style.width = "0%";
}

function checkAchievements(elapsed) {

  if (data.totalAway >= 30 * 60) {
    data.achievements.a30 = true;
  }

  if (data.totalAway >= 60 * 60) {
    data.achievements.a60 = true;
  }

  if (data.streak >= 7) {
    data.achievements.a7 = true;
  }

  if (data.streak >= 30) {
    data.achievements.a30day = true;
  }
}

function showCelebration(icon, title, text) {
  document.getElementById("celebrationIcon").textContent = icon;
  document.getElementById("celebrationTitle").textContent = title;
  document.getElementById("celebrationText").innerHTML = text;
  document.getElementById("celebration").classList.remove("hidden");
}

function closeCelebration() {
  document.getElementById("celebration").classList.add("hidden");
}

function resetData() {
  const answer = confirm(
    "Reset ALL Phone Away progress, XP, streak and history?"
  );

  if (!answer) return;

  localStorage.removeItem("phoneAwayData");

  data = {
    xp: 0,
    streak: 0,
    bestStreak: 0,
    totalAway: 0,
    lastCompleted: null,
    achievements: {
      a30: false,
      a60: false,
      a7: false,
      a30day: false
    },
    history: []
  };

  updateUI();
  resetTimerDisplay();

  document.getElementById("status").textContent =
    "Progress reset. Ready to begin.";
}

// Restore the interface when the page loads.
updateUI();
