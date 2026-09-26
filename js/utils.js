export const uid = (p) =>
  `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
export const escapeHTML = (s) =>
  String(s ?? "").replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ],
  );
export const initials = (s) =>
  String(s || "?")
    .trim()
    .split(/\s+/)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const relativeTime = (iso) => {
  const d = Date.now() - new Date(iso).getTime(),
    m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

export const dateLabel = (d) =>
  d
    ? new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "";
export const overdue = (d) => d && new Date(`${d}T23:59:59`) < new Date();
export const duration = (a, b) => {
  if (!a || !b) return "";
  let h = Math.max(0, Math.floor((new Date(b) - new Date(a)) / 36e5)),
    days = Math.floor(h / 24);
  h %= 24;
  return days ? `Took ${days}d${h ? `, ${h}h` : ""}` : `Took ${h}h`;
};
