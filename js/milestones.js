const Milestones = (() => {
  const EMOJIS = ['🎓', '💼', '💍', '👶', '🏠', '✈️', '🎉', '🏆', '❤️', '🎵', '📚', '🚀', '🌟', '🎨', '🏋️', '🐾'];

  const SUGGESTIONS = [
    { label: 'Graduated', emoji: '🎓' },
    { label: 'First Job', emoji: '💼' },
    { label: 'Got Married', emoji: '💍' },
    { label: 'First Child', emoji: '👶' },
    { label: 'Bought a Home', emoji: '🏠' },
    { label: 'Traveled Abroad', emoji: '✈️' },
    { label: 'Started a Business', emoji: '🚀' },
    { label: 'Adopted a Pet', emoji: '🐾' },
  ];

  async function getAll() {
    const data = await Storage.get('milestones');
    return data.milestones || [];
  }

  async function add(milestone) {
    const milestones = await getAll();
    milestone.id = 'm_' + Date.now();
    milestone.color = milestone.color || '#f59e0b';
    milestones.push(milestone);
    await Storage.set({ milestones });
    return milestone;
  }

  async function update(id, updates) {
    const milestones = await getAll();
    const idx = milestones.findIndex((m) => m.id === id);
    if (idx !== -1) {
      Object.assign(milestones[idx], updates);
      await Storage.set({ milestones });
    }
    return milestones[idx];
  }

  async function remove(id) {
    let milestones = await getAll();
    milestones = milestones.filter((m) => m.id !== id);
    await Storage.set({ milestones });
  }

  function buildMilestoneMap(milestones, birthDate, viewMode) {
    const map = new Map();
    for (const m of milestones) {
      let key;
      if (viewMode === 'weeks') {
        key = Utils.dateToWeekIndex(birthDate, m.date);
      } else {
        key = Utils.dateToMonthIndex(birthDate, m.date);
      }
      map.set(key, m);
    }
    return map;
  }

  return { EMOJIS, SUGGESTIONS, getAll, add, update, remove, buildMilestoneMap };
})();
