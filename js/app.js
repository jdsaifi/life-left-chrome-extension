const App = (() => {
  const QUOTES = [
    "What will you build today that your future self will thank you for?",
    "Every red square was a week you showed up. Keep going.",
    "You don't need more time. You need more intention.",
    "The best time to start was years ago. The second best time is this week.",
    "Small consistent actions beat grand plans every single time.",
    "Your future is shaped by what you do today, not tomorrow.",
    "Progress over perfection. Ship it, learn, repeat.",
    "The people who change the world are the ones who start before they're ready.",
    "Focus on the next square. That's all you ever need to do.",
    "Discipline is choosing between what you want now and what you want most.",
    "You've already survived 100% of your hardest days. Keep building.",
    "Don't wait for motivation. Act first — motivation follows.",
    "Every master was once a beginner who refused to quit.",
    "Stop scrolling. Start creating. Your future self is watching.",
    "You're not behind. You're exactly where your next chapter begins.",
    "What would you attempt if you knew you couldn't fail? Go do that.",
    "Energy flows where attention goes. Point it at something meaningful.",
    "You have enough time. You just need to protect it.",
    "One focused hour beats eight distracted ones. Go deep today.",
    "The green squares are yours to fill. Make them count.",
  ];

  let data = null;

  async function init() {
    data = await Storage.getData();

    if (!data.birthDate) {
      showOnboarding();
    } else {
      showApp();
    }
  }

  function showOnboarding() {
    document.getElementById('onboarding').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');

    const slider = document.getElementById('life-expectancy-input');
    const valueDisplay = document.getElementById('expectancy-value');
    slider.addEventListener('input', () => {
      valueDisplay.textContent = slider.value;
    });

    document.getElementById('onboarding-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const userName = document.getElementById('user-name-input').value.trim();
      const birthDate = document.getElementById('birth-date-input').value;
      const lifeExpectancyYears = parseInt(slider.value, 10);

      if (!birthDate || !userName) return;

      await Storage.set({ userName, birthDate, lifeExpectancyYears, viewMode: 'weeks', milestones: [] });
      data = await Storage.getData();
      showApp();
    });
  }

  function showApp() {
    document.getElementById('onboarding').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    renderStats();
    requestAnimationFrame(() => {
      renderGrid();
    });
    renderQuote();
    setupToggle();
    setupSettings();

    window.addEventListener('resize', () => {
      renderGrid();
    });
  }

  function renderStats() {
    const lifeData = Utils.getLifeData(data.birthDate, data.lifeExpectancyYears);
    const nameEl = document.getElementById('user-name-display');
    const weeksLivedEl = document.getElementById('hero-weeks-lived');
    const weeksLeftEl = document.getElementById('hero-weeks-left');
    const progressFill = document.getElementById('progress-fill');
    const percentText = document.getElementById('percent-text');

    nameEl.textContent = data.userName;

    if (data.viewMode === 'weeks') {
      weeksLivedEl.textContent = lifeData.weeksLived.toLocaleString();
      weeksLeftEl.textContent = lifeData.weeksRemaining.toLocaleString();
      document.getElementById('label-lived').textContent = 'WEEKS LIVED';
      document.getElementById('label-left').textContent = 'WEEKS TO CREATE';
    } else {
      const monthsLived = Math.floor(lifeData.daysLived / 30.44);
      const monthsRemaining = Math.max(0, data.lifeExpectancyYears * 12 - monthsLived);
      weeksLivedEl.textContent = monthsLived.toLocaleString();
      weeksLeftEl.textContent = monthsRemaining.toLocaleString();
      document.getElementById('label-lived').textContent = 'MONTHS LIVED';
      document.getElementById('label-left').textContent = 'MONTHS TO CREATE';
    }

    progressFill.style.width = lifeData.percentLived.toFixed(1) + '%';
    percentText.textContent = lifeData.percentLived.toFixed(1) + '% COMPLETE';
  }

  function renderGrid() {
    Grid.render(data.birthDate, data.lifeExpectancyYears, data.viewMode, data.milestones);
  }

  function renderQuote() {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const quote = QUOTES[dayOfYear % QUOTES.length];
    document.getElementById('quote').textContent = `"${quote}"`;
  }

  function setupToggle() {
    const weeksBtn = document.getElementById('toggle-weeks');
    const daysBtn = document.getElementById('toggle-days');

    const setActive = (mode) => {
      weeksBtn.classList.toggle('active', mode === 'weeks');
      daysBtn.classList.toggle('active', mode === 'days');
    };

    setActive(data.viewMode);

    weeksBtn.addEventListener('click', async () => {
      if (data.viewMode === 'weeks') return;
      data.viewMode = 'weeks';
      await Storage.set({ viewMode: 'weeks' });
      setActive('weeks');
      renderStats();
      renderGrid();
    });

    daysBtn.addEventListener('click', async () => {
      if (data.viewMode === 'days') return;
      data.viewMode = 'days';
      await Storage.set({ viewMode: 'days' });
      setActive('days');
      renderStats();
      renderGrid();
    });
  }

  function setupSettings() {
    const btn = document.getElementById('settings-btn');
    const drawer = document.getElementById('settings-drawer');
    const overlay = document.getElementById('settings-overlay');
    const closeBtn = document.getElementById('settings-close');

    const open = () => {
      drawer.classList.remove('hidden');
      overlay.classList.remove('hidden');
      populateSettings();
    };
    const close = () => {
      drawer.classList.add('hidden');
      overlay.classList.add('hidden');
    };

    btn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);

    document.getElementById('settings-save').addEventListener('click', async () => {
      const userName = document.getElementById('settings-username').value.trim();
      const birthDate = document.getElementById('settings-birthdate').value;
      const lifeExpectancyYears = parseInt(document.getElementById('settings-expectancy').value, 10);
      if (!birthDate || !userName) return;
      await Storage.set({ userName, birthDate, lifeExpectancyYears });
      data = await Storage.getData();
      close();
      renderStats();
      renderGrid();
    });

    document.getElementById('clear-data').addEventListener('click', async () => {
      if (confirm('This will erase all your data. Are you sure?')) {
        await Storage.clear();
        location.reload();
      }
    });
  }

  function populateSettings() {
    document.getElementById('settings-username').value = data.userName;
    document.getElementById('settings-birthdate').value = data.birthDate;
    const slider = document.getElementById('settings-expectancy');
    const valueDisplay = document.getElementById('settings-expectancy-value');
    slider.value = data.lifeExpectancyYears;
    valueDisplay.textContent = data.lifeExpectancyYears;
    slider.oninput = () => { valueDisplay.textContent = slider.value; };

    const list = document.getElementById('milestone-list');
    list.innerHTML = '';
    for (const m of data.milestones) {
      const item = document.createElement('div');
      item.className = 'milestone-item';
      item.innerHTML = `
        <span class="milestone-item-emoji">${m.emoji || '🌟'}</span>
        <span class="milestone-item-label">${m.label}</span>
        <span class="milestone-item-date">${m.date}</span>
        <button class="milestone-item-delete" data-id="${m.id}">&times;</button>
      `;
      item.querySelector('.milestone-item-delete').addEventListener('click', async () => {
        await Milestones.remove(m.id);
        data = await Storage.getData();
        populateSettings();
        renderGrid();
      });
      list.appendChild(item);
    }

    const suggestions = document.getElementById('milestone-suggestions');
    suggestions.innerHTML = '';
    for (const s of Milestones.SUGGESTIONS) {
      const exists = data.milestones.some((m) => m.label === s.label);
      if (exists) continue;
      const btn = document.createElement('button');
      btn.className = 'suggestion-btn';
      btn.textContent = `${s.emoji} ${s.label}`;
      btn.addEventListener('click', async () => {
        const date = prompt(`When did "${s.label}" happen? (YYYY-MM-DD)`);
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
        await Milestones.add({ label: s.label, emoji: s.emoji, date });
        data = await Storage.getData();
        populateSettings();
        renderGrid();
      });
      suggestions.appendChild(btn);
    }
  }

  async function refresh() {
    data = await Storage.getData();
    renderStats();
    renderGrid();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { refresh };
})();
