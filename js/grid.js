const Grid = (() => {
  let currentBirthDate = null;
  let currentViewMode = 'weeks';
  let milestoneMap = new Map();

  function render(birthDate, lifeExpectancyYears, viewMode, milestones) {
    currentBirthDate = birthDate;
    currentViewMode = viewMode;
    milestoneMap = Milestones.buildMilestoneMap(milestones, birthDate, viewMode);

    const gridLived = document.getElementById('grid-lived');
    const gridRemaining = document.getElementById('grid-remaining');
    gridLived.innerHTML = '';
    gridRemaining.innerHTML = '';

    const lifeData = Utils.getLifeData(birthDate, lifeExpectancyYears);

    let livedCount, remainingCount, totalCount;
    if (viewMode === 'weeks') {
      livedCount = lifeData.weeksLived;
      totalCount = lifeData.totalWeeks;
      remainingCount = lifeData.weeksRemaining;
    } else {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      livedCount = Utils.dateToMonthIndex(birthDate, now);
      totalCount = lifeExpectancyYears * 12;
      remainingCount = Math.max(0, totalCount - livedCount);
    }

    // Measure the parent panel (not the grid itself, which starts empty)
    const sqSizeLived = calcSquareSize(gridLived.parentElement, livedCount);
    const sqSizeRemaining = calcSquareSize(gridRemaining.parentElement, remainingCount);

    // Render lived (red)
    renderPanel(gridLived, livedCount, sqSizeLived, 'sq-lived', 0, livedCount, totalCount);

    // Render remaining (green)
    renderPanel(gridRemaining, remainingCount, sqSizeRemaining, 'sq-remaining', livedCount, livedCount, totalCount);
  }

  function calcSquareSize(panel, count) {
    if (count <= 0) return { size: 6, gap: 2, cols: 1 };
    const w = panel.clientWidth;
    // Subtract the header height
    const header = panel.querySelector('.panel-header');
    const headerH = header ? header.offsetHeight + 12 : 0;
    const h = panel.clientHeight - headerH;
    const gap = 2;

    // Use a fixed square size and calculate how many columns fit
    // Then check if all squares fit vertically — if not, shrink
    let sqSize = 8;

    // Try sizes from large to small until everything fits
    for (let trySize = 14; trySize >= 3; trySize--) {
      const cols = Math.floor((w + gap) / (trySize + gap));
      if (cols < 1) continue;
      const rows = Math.ceil(count / cols);
      const totalH = rows * (trySize + gap) - gap;
      if (totalH <= h) {
        sqSize = trySize;
        const finalCols = cols;
        return { size: sqSize, gap, cols: finalCols };
      }
    }

    // Fallback: smallest size
    const cols = Math.floor((w + gap) / (3 + gap));
    return { size: 3, gap, cols: Math.max(1, cols) };
  }

  function renderPanel(container, count, sizeInfo, className, startIndex, livedCount, totalCount) {
    const { size, gap, cols } = sizeInfo;
    container.style.gap = gap + 'px';
    container.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;
    container.style.gridAutoRows = size + 'px';

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const globalIndex = startIndex + i;
      const sq = document.createElement('div');
      sq.className = 'sq ' + className;
      sq.dataset.index = globalIndex;
      sq.style.width = size + 'px';
      sq.style.height = size + 'px';

      // Current week = last square in lived grid
      if (className === 'sq-lived' && i === count - 1) {
        sq.classList.add('sq-current');
      }

      // Era coloring
      if (className === 'sq-lived') {
        const era = Utils.getEra(i, livedCount);
        sq.classList.add('era-' + era);
      } else {
        const era = Utils.getEra(i, count);
        sq.classList.add('era-' + era);
      }

      // Milestone
      const milestone = milestoneMap.get(globalIndex);
      if (milestone) {
        sq.classList.add('milestone');
        sq.dataset.milestoneId = milestone.id;
      }

      sq.addEventListener('mouseenter', handleHover);
      sq.addEventListener('mouseleave', hideTooltip);
      if (className === 'sq-lived') {
        sq.addEventListener('click', handleClick);
      }

      fragment.appendChild(sq);
    }
    container.appendChild(fragment);
  }

  function handleHover(e) {
    const sq = e.target;
    const index = parseInt(sq.dataset.index, 10);
    const tooltip = document.getElementById('tooltip');
    let text = '';

    if (currentViewMode === 'weeks') {
      const year = Math.floor(index / 52);
      const week = (index % 52) + 1;
      text = `Year ${year}, Week ${week}`;
      const date = Utils.weekToDate(currentBirthDate, index);
      text += ` — ${Utils.formatDate(date)}`;
    } else {
      const year = Math.floor(index / 12);
      const month = index % 12;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const birth = new Date(currentBirthDate);
      const actualMonth = (birth.getMonth() + month) % 12;
      text = `Year ${year}, ${monthNames[actualMonth]}`;
    }

    const milestone = milestoneMap.get(index);
    if (milestone) {
      text += ` — ${milestone.emoji || ''} ${milestone.label}`;
    }

    tooltip.textContent = text;
    tooltip.classList.remove('hidden');

    const rect = sq.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 + 'px';
    tooltip.style.top = rect.top - 8 + 'px';
  }

  function hideTooltip() {
    document.getElementById('tooltip').classList.add('hidden');
  }

  function handleClick(e) {
    const sq = e.target;
    if (!sq.classList.contains('sq-lived') && !sq.classList.contains('milestone')) {
      return;
    }

    const index = parseInt(sq.dataset.index, 10);
    const popover = document.getElementById('milestone-popover');
    const labelInput = document.getElementById('milestone-label');
    const deleteBtn = document.getElementById('milestone-delete');
    const emojiPicker = document.getElementById('emoji-picker');

    emojiPicker.innerHTML = '';
    let selectedEmoji = '🌟';
    for (const emoji of Milestones.EMOJIS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emoji-btn';
      btn.textContent = emoji;
      btn.addEventListener('click', () => {
        emojiPicker.querySelectorAll('.emoji-btn').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedEmoji = emoji;
      });
      emojiPicker.appendChild(btn);
    }

    const existing = milestoneMap.get(index);
    if (existing) {
      labelInput.value = existing.label;
      deleteBtn.classList.remove('hidden');
      deleteBtn.onclick = async () => {
        await Milestones.remove(existing.id);
        popover.classList.add('hidden');
        App.refresh();
      };
      selectedEmoji = existing.emoji || '🌟';
    } else {
      labelInput.value = '';
      deleteBtn.classList.add('hidden');
    }

    requestAnimationFrame(() => {
      const btns = emojiPicker.querySelectorAll('.emoji-btn');
      btns.forEach((b) => {
        if (b.textContent === selectedEmoji) b.classList.add('selected');
      });
    });

    const rect = sq.getBoundingClientRect();
    popover.style.left = Math.min(rect.left, window.innerWidth - 260) + 'px';
    popover.style.top = Math.min(rect.bottom + 8, window.innerHeight - 200) + 'px';
    popover.classList.remove('hidden');
    popover.dataset.index = index;
    labelInput.focus();

    const form = document.getElementById('milestone-form');
    form.onsubmit = async (ev) => {
      ev.preventDefault();
      const label = labelInput.value.trim();
      if (!label) return;

      let date;
      if (currentViewMode === 'weeks') {
        date = Utils.weekToDate(currentBirthDate, index).toISOString().slice(0, 10);
      } else {
        date = Utils.monthIndexToDate(currentBirthDate, index).toISOString().slice(0, 10);
      }

      if (existing) {
        await Milestones.update(existing.id, { label, emoji: selectedEmoji, date });
      } else {
        await Milestones.add({ label, emoji: selectedEmoji, date });
      }

      popover.classList.add('hidden');
      App.refresh();
    };
  }

  document.addEventListener('click', (e) => {
    const popover = document.getElementById('milestone-popover');
    if (!popover.classList.contains('hidden') && !popover.contains(e.target) && !e.target.classList.contains('sq')) {
      popover.classList.add('hidden');
    }
  });

  return { render };
})();
