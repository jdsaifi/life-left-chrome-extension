const Utils = (() => {
  const MS_PER_DAY = 86400000;
  const MS_PER_WEEK = MS_PER_DAY * 7;

  function daysBetween(dateA, dateB) {
    const a = new Date(dateA);
    const b = new Date(dateB);
    a.setHours(0, 0, 0, 0);
    b.setHours(0, 0, 0, 0);
    return Math.floor((b - a) / MS_PER_DAY);
  }

  function weeksBetween(dateA, dateB) {
    return Math.floor(daysBetween(dateA, dateB) / 7);
  }

  function getLifeData(birthDate, lifeExpectancyYears) {
    const birth = new Date(birthDate);
    const now = new Date();
    birth.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const totalWeeks = lifeExpectancyYears * 52;
    const totalDays = lifeExpectancyYears * 365;
    const weeksLived = weeksBetween(birth, now);
    const daysLived = daysBetween(birth, now);
    const weeksRemaining = Math.max(0, totalWeeks - weeksLived);
    const daysRemaining = Math.max(0, totalDays - daysLived);
    const yearsLived = Math.floor(daysLived / 365.25);
    const percentLived = Math.min(100, (weeksLived / totalWeeks) * 100);

    return {
      totalWeeks,
      totalDays,
      weeksLived,
      daysLived,
      weeksRemaining,
      daysRemaining,
      yearsLived,
      percentLived,
      lifeExpectancyYears,
    };
  }

  function weekToDate(birthDate, weekIndex) {
    const birth = new Date(birthDate);
    birth.setHours(0, 0, 0, 0);
    return new Date(birth.getTime() + weekIndex * MS_PER_WEEK);
  }

  function dateToWeekIndex(birthDate, date) {
    return weeksBetween(birthDate, date);
  }

  function dateToMonthIndex(birthDate, date) {
    const birth = new Date(birthDate);
    const d = new Date(date);
    return (d.getFullYear() - birth.getFullYear()) * 12 + (d.getMonth() - birth.getMonth());
  }

  function monthIndexToDate(birthDate, monthIndex) {
    const birth = new Date(birthDate);
    const year = birth.getFullYear() + Math.floor(monthIndex / 12);
    const month = birth.getMonth() + (monthIndex % 12);
    return new Date(year, month, 1);
  }

  function getEra(weekIndex, totalWeeks) {
    const ratio = weekIndex / totalWeeks;
    if (ratio < 0.25) return 0;
    if (ratio < 0.5) return 1;
    if (ratio < 0.75) return 2;
    return 3;
  }

  function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return {
    daysBetween,
    weeksBetween,
    getLifeData,
    weekToDate,
    dateToWeekIndex,
    dateToMonthIndex,
    monthIndexToDate,
    getEra,
    formatDate,
  };
})();
