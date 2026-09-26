const KEY = "jasmine-kanban-v1";
const LOG = "jasmine-kanban-activity-v1";
export const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
};
export const save = (data) => localStorage.setItem(KEY, JSON.stringify(data));
export const loadLog = () => {
  try {
    return JSON.parse(localStorage.getItem(LOG)) || [];
  } catch {
    return [];
  }
};
export const saveLog = (log) =>
  localStorage.setItem(LOG, JSON.stringify(log.slice(0, 200)));


export const exportData = (data, log) => {
  const blob = new Blob([JSON.stringify({ version: 1, data, log }, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `jasmine-board-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
};
