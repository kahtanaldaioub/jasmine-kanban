const rank = { high: 3, medium: 2, low: 1 };
export function filterTasks(tasks, state) {
  const q = state.query.trim().toLowerCase();
  return tasks
    .filter((t) => {
      const hay = `${t.title} ${t.description}`.toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (state.priority !== "all" && t.priority !== state.priority)
        return false;
      if (state.label !== "all" && t.label !== state.label) return false;
      if (state.assignee !== "all" && t.assignee !== state.assignee)
        return false;
      if (state.status === "completed" && t.columnId !== "done") return false;
      if (state.status === "active" && t.columnId === "done") return false;
      if (
        state.status === "overdue" &&
        !(
          t.columnId !== "done" &&
          t.deadline &&
          new Date(`${t.deadline}T23:59:59`) < new Date()
        )
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      switch (state.sort) {
        case "created-asc":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "priority-desc":
          return rank[b.priority] - rank[a.priority];
        case "priority-asc":
          return rank[a.priority] - rank[b.priority];
        case "deadline-asc":
          return (a.deadline || "9999").localeCompare(b.deadline || "9999");
        case "alpha-asc":
          return a.title.localeCompare(b.title);
        case "alpha-desc":
          return b.title.localeCompare(a.title);
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
}
export const highlight = (text, q) => {
  const safe = String(text ?? "").replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c],
  );
  if (!q) return safe;
  return safe.replace(
    new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"),
    "<mark>$1</mark>",
  );
};
