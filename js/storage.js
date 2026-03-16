const Storage = (() => {
  // Use chrome.storage.local if available, fall back to localStorage for dev
  const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

  async function get(keys) {
    if (isExtension) {
      return new Promise((resolve) => {
        chrome.storage.local.get(keys, resolve);
      });
    }
    const result = {};
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const key of keyList) {
      const val = localStorage.getItem(key);
      if (val !== null) {
        try {
          result[key] = JSON.parse(val);
        } catch {
          result[key] = val;
        }
      }
    }
    return result;
  }

  async function set(data) {
    if (isExtension) {
      return new Promise((resolve) => {
        chrome.storage.local.set(data, resolve);
      });
    }
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  async function remove(keys) {
    if (isExtension) {
      return new Promise((resolve) => {
        chrome.storage.local.remove(keys, resolve);
      });
    }
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const key of keyList) {
      localStorage.removeItem(key);
    }
  }

  async function clear() {
    if (isExtension) {
      return new Promise((resolve) => {
        chrome.storage.local.clear(resolve);
      });
    }
    localStorage.clear();
  }

  async function getData() {
    const data = await get(['userName', 'birthDate', 'lifeExpectancyYears', 'viewMode', 'milestones']);
    return {
      userName: data.userName || '',
      birthDate: data.birthDate || null,
      lifeExpectancyYears: data.lifeExpectancyYears || 76,
      viewMode: data.viewMode || 'weeks',
      milestones: data.milestones || [],
    };
  }

  return { get, set, remove, clear, getData };
})();
