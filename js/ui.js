export const $ = (s) => document.querySelector(s);
export const $$ = (s) => [...document.querySelectorAll(s)];
export function openModal(id) {
  $("#overlay").classList.add("open");
  $(id).classList.add("open");
}
export function closeModals() {
  $("#overlay").classList.remove("open");
  $$(".modal").forEach((m) => m.classList.remove("open"));
}
export function toast(msg, action) {
  const el = $("#toast");
  $("#toastText").textContent = msg;
  const btn = $("#toastAction");
  btn.hidden = !action;
  btn.onclick = () => {
    action?.();
    el.classList.remove("show");
  };
  el.classList.add("show");
  clearTimeout(window.__toast);
  window.__toast = setTimeout(
    () => el.classList.remove("show"),
    action ? 10000 : 3000,
  );
}
export function petals() {
  const f = $(".petal-field");
  for (let i = 0; i < 22; i++) {
    const p = document.createElement("span");
    p.className = "petal";
    p.style.left = `${Math.random() * 100}%`;
    p.style.setProperty("--x", `${(Math.random() - 0.5) * 180}px`);
    p.style.animationDuration = `${9 + Math.random() * 14}s,${3 + Math.random() * 4}s`;
    p.style.animationDelay = `-${Math.random() * 18}s,${-Math.random() * 4}s`;
    p.style.opacity = 0.35 + Math.random() * 0.5;
    f.appendChild(p);
  }
}
