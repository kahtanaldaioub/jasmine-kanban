import { load, save, loadLog, saveLog, exportData } from "./storage.js";
import { columns, seed, blankTask } from "./task.js";
import {
  uid,
  escapeHTML,
  initials,
  relativeTime,
  dateLabel,
  overdue,
  duration,
} from "./utils.js";
import { filterTasks, highlight } from "./filters.js";
import { setupDnD } from "./dragdrop.js";
import { $, $$, openModal, closeModals, toast, petals } from "./ui.js";
let data = load() || seed,
  log = loadLog(),
  deleted = null,
  logFilter = "all";
const state = {
  query: "",
  priority: "all",
  label: "all",
  assignee: "all",
  status: "all",
  sort: "created-desc",
};
const names = () =>
  [...new Set(data.map((t) => t.assignee).filter(Boolean))].sort();
function persist() {
  save(data);
  saveLog(log);
}
function activity(type, text) {
  log.unshift({ id: uid("log"), type, text, time: new Date().toISOString() });
  persist();
  renderActivity();
}
function addOrEditTask(id, columnId = "todo") {
  const t = id ? data.find((x) => x.id === id) : blankTask(columnId);
  if (id) {
    fillForm(t);
  } else {
    fillForm(t);
    $("#taskId").value = "";
  }
  $("#modalTitle").textContent = id ? "Edit task" : "New task";
  openModal("#taskModal");
}
function fillForm(t) {
  $("#taskId").value = t.id;
  $("#taskTitle").value = t.title;
  $("#taskDescription").value = t.description;
  $("#taskPriority").value = t.priority;
  $("#taskLabel").value = t.label;
  $("#taskAssignee").value = t.assignee;
  $("#taskDeadline").value = t.deadline;
  $("#taskHours").value = t.estimatedHours;
  $("#taskColumn").value = t.columnId;
  $("#titleCount").textContent = `${t.title.length} / 100`;
  renderSubtasks(t);
  renderComments(t);
}
function renderSubtasks(t) {
  $("#subtasks").innerHTML =
    t.subtasks
      .map(
        (s) =>
          `<div class="sub-row" data-sub="${s.id}"><input type="checkbox" ${s.done ? "checked" : ""}><input type="text" value="${escapeHTML(s.text)}"><button type="button" class="sub-delete">×</button></div>`,
      )
      .join("") ||
    '<div class="muted" style="font-size:10px;padding:6px 0">No subtasks yet.</div>';
}
function renderComments(t) {
  $("#commentCount").textContent = t.comments.length;
  $("#comments").innerHTML =
    t.comments
      .map(
        (c) =>
          `<div class="comment" data-comment="${c.id}"><div class="avatar">${initials(c.author)}</div><div class="comment-body"><div class="comment-meta"><b>${escapeHTML(c.author)}</b> · ${relativeTime(c.timestamp)}${c.edited ? " · edited" : ""}</div><div class="comment-text">${escapeHTML(c.text)}</div></div><button type="button" class="comment-edit">Edit</button><button type="button" class="comment-delete">×</button></div>`,
      )
      .join("") ||
    '<div class="muted" style="font-size:10px;padding:6px 0">No comments yet.</div>';
}
function render() {
  const filtered = filterTasks(data, state);
  $("#board").innerHTML = columns
    .map((c) => {
      const all = data.filter((t) => t.columnId === c.id),
        tasks = filtered.filter((t) => t.columnId === c.id);
      return `<article class="column ${c.limit && all.length >= c.limit ? "is-full" : ""}" data-column="${c.id}"><div class="column-head"><div class="column-title"><span class="column-dot"></span>${c.name}${c.limit ? ` <span class="muted">/ ${c.limit}</span>` : ""}</div><span class="count">${all.length}</span></div><div class="cards">${tasks.map(card).join("")}${tasks.length === 0 ? '<div class="empty">A quiet patch of garden.</div>' : ""}</div><button class="column-add" data-add="${c.id}">+ Add task</button></article>`;
    })
    .join("");
  updateAssignees();
  updateProgress();
  renderActivity();
}
function card(t) {
  const q = state.query,
    done = t.subtasks.length ? t.subtasks.filter((s) => s.done).length : 0,
    pct = t.subtasks.length ? Math.round((done / t.subtasks.length) * 100) : 0;
  return `<div class="card priority-${t.priority}" draggable="true" data-id="${t.id}"><div class="card-top"><div><h3>${highlight(t.title, q)}</h3><div class="badges"><span class="badge priority">${t.priority}</span>${t.label ? `<span class="badge label">${t.label}</span>` : ""}</div></div><div class="card-menu"><button data-edit="${t.id}" title="Edit">✎</button><button data-delete="${t.id}" title="Delete">×</button></div></div>${t.description ? `<p class="desc">${highlight(t.description, q)}</p>` : ""}${t.subtasks.length ? `<div class="sub-progress"><div class="sub-progress-top"><span>Checklist</span><span>${done}/${t.subtasks.length}</span></div><div class="sub-track"><i style="width:${pct}%"></i></div></div>` : ""}<div class="card-meta"><span class="assignee">${t.assignee ? `<span class="avatar">${initials(t.assignee)}</span>${escapeHTML(t.assignee)}` : "Unassigned"}</span><span class="deadline ${overdue(t.deadline) && t.columnId !== "done" ? "overdue" : ""}">${t.deadline ? dateLabel(t.deadline) : ""}${t.comments.length ? ` · ${t.comments.length} note${t.comments.length > 1 ? "s" : ""}` : ""}</span></div>${t.columnId === "done" && t.completedAt ? `<div class="muted" style="font-size:9px;margin-top:8px">${duration(t.createdAt, t.completedAt)}</div>` : ""}</div>`;
}
function updateAssignees() {
  const sel = $("#assigneeFilter"),
    cur = sel.value;
  sel.innerHTML =
    '<option value="all">All people</option>' +
    names()
      .map((n) => `<option value="${escapeHTML(n)}">${escapeHTML(n)}</option>`)
      .join("");
  sel.value = names().includes(cur) ? cur : "all";
}
function updateProgress() {
  const done = data.filter((t) => t.columnId === "done").length,
    pct = data.length ? Math.round((done / data.length) * 100) : 0;
  $("#weeklyProgress").style.width = pct + "%";
  $("#weeklyText").textContent = pct + "%";
}
function renderActivity() {
  const rows = log.filter((x) => logFilter === "all" || x.type === logFilter);
  $("#activityList").innerHTML = rows.length
    ? rows
        .slice(0, 60)
        .map(
          (x) =>
            `<div class="activity-item"><span class="activity-time">${new Date(x.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span><div class="activity-copy"><div class="activity-type">${x.type}</div>${escapeHTML(x.text)}</div></div>`,
        )
        .join("")
    : '<div class="empty">No moments recorded yet.</div>';
}
function moveTask(id, target, beforeId = null) {
  const t = data.find((x) => x.id === id);
  if (!t) return false;
  const source = t.columnId,
    from = columns.find((c) => c.id === source),
    to = columns.find((c) => c.id === target),
    diff =
      columns.findIndex((c) => c.id === target) -
      columns.findIndex((c) => c.id === source);
  if (diff > 1) {
    toast("That would skip a garden step. Move one column at a time.");
    return false;
  }
  if (
    to.limit &&
    data.filter((x) => x.columnId === target && x.id !== id).length >= to.limit
  ) {
    toast(`${to.name} is at its ${to.limit}-task WIP limit.`);
    return false;
  }
  t.columnId = target;
  t.updatedAt = new Date().toISOString();
  if (target === "progress" && !t.startedAt)
    t.startedAt = new Date().toISOString();
  if (target === "done" && !t.completedAt)
    t.completedAt = new Date().toISOString();
  if (source !== target)
    activity("moved", `Moved “${t.title}” from ${from.name} → ${to.name}`);
  else activity("edited", `Reordered “${t.title}”`);
  if (beforeId) {
    const same = data.filter((x) => x.columnId === target && x.id !== id),
      at = data.indexOf(same.find((x) => x.id === beforeId));
    if (at >= 0) {
      data.splice(data.indexOf(t), 1);
      data.splice(at, 0, t);
    }
  }
  persist();
  return true;
}
function openDelete(id) {
  deleted = data.find((t) => t.id === id);
  openModal("#confirmModal");
}
function doDelete() {
  if (!deleted) return;
  const t = deleted;
  data = data.filter((x) => x.id !== t.id);
  activity("deleted", `Deleted task “${t.title}”`);
  closeModals();
  render();
  toast(`Deleted “${t.title}”`, () => {
    data.push(t);
    activity("created", `Restored task “${t.title}”`);
    render();
  });
  deleted = null;
}
function stats() {
  const total = data.length,
    done = data.filter((t) => t.columnId === "done").length,
    over = data.filter(
      (t) => t.columnId !== "done" && overdue(t.deadline),
    ).length;
  const avg = data
    .filter((t) => t.completedAt)
    .map((t) => new Date(t.completedAt) - new Date(t.createdAt));
  const avgH = avg.length
    ? Math.round(avg.reduce((a, b) => a + b, 0) / avg.length / 36e5)
    : 0;
  const by = (key, values) =>
    values
      .map((v) => {
        const n = data.filter((t) => t[key] === v).length;
        return `<div class="bar-row"><span>${v}</span><div class="bar"><i style="width:${total ? Math.round((n / total) * 100) : 0}%"></i></div><b>${total ? Math.round((n / total) * 100) : 0}%</b></div>`;
      })
      .join("");
  $("#statsContent").innerHTML =
    `<div class="stats-grid"><div class="stat"><b>${total}</b><span>Total tasks</span></div><div class="stat"><b>${total ? Math.round((done / total) * 100) : 0}%</b><span>Completion</span></div><div class="stat"><b>${over}</b><span>Overdue</span></div><div class="stat"><b>${avgH}h</b><span>Avg completion</span></div></div><div class="stat-section"><h3>By priority</h3>${by("priority", ["high", "medium", "low"])}</div><div class="stat-section"><h3>By label</h3>${by("label", ["design", "development", "testing", "documentation"])}</div><div class="stat-section"><h3>By column</h3>${columns
      .map((c) => {
        const n = data.filter((t) => t.columnId === c.id).length;
        return `<div class="bar-row"><span>${c.name}</span><div class="bar"><i style="width:${total ? Math.round((n / total) * 100) : 0}%"></i></div><b>${n}</b></div>`;
      })
      .join("")}</div>`;
}
$("#todayChip").textContent = new Date().toLocaleDateString(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});
$("#newTaskBtn").onclick = () => addOrEditTask();
$("#overlay").onclick = closeModals;
$$(".modal-close,.modal-cancel,.stats-close").forEach(
  (b) => (b.onclick = closeModals),
);
$("#confirmCancel").onclick = closeModals;
$("#confirmDelete").onclick = doDelete;
$("#statsBtn").onclick = () => {
  stats();
  openModal("#statsModal");
};
$("#activityBtn").onclick = () => $("#activityDrawer").classList.add("open");
$(".close-drawer").onclick = () =>
  $("#activityDrawer").classList.remove("open");
$("#taskTitle").oninput = (e) =>
  ($("#titleCount").textContent = `${e.target.value.length} / 100`);
$("#taskForm").onsubmit = (e) => {
  e.preventDefault();
  const id = $("#taskId").value;
  let t = id
    ? data.find((x) => x.id === id)
    : blankTask($("#taskColumn").value);
  const oldPriority = t.priority;
  Object.assign(t, {
    title: $("#taskTitle").value.trim(),
    description: $("#taskDescription").value.trim(),
    priority: $("#taskPriority").value,
    label: $("#taskLabel").value,
    assignee: $("#taskAssignee").value.trim(),
    deadline: $("#taskDeadline").value,
    estimatedHours: $("#taskHours").value,
    columnId: $("#taskColumn").value,
    updatedAt: new Date().toISOString(),
  });
  if (t.columnId === "progress" && !t.startedAt)
    t.startedAt = new Date().toISOString();
  if (t.columnId === "done" && !t.completedAt)
    t.completedAt = new Date().toISOString();
  if (!id) {
    data.push(t);
    activity("created", `Created task “${t.title}”`);
  } else {
    activity(
      "edited",
      `Edited “${t.title}”${oldPriority !== t.priority ? ` and changed priority to ${t.priority}` : ""}`,
    );
  }
  persist();
  closeModals();
  render();
};
$("#addSubtask").onclick = () => {
  const id = $("#taskId").value;
  if (!id) return toast("Save the task first, then add subtasks.");
  const t = data.find((x) => x.id === id);
  t.subtasks.push({ id: uid("sub"), text: "New subtask", done: false });
  persist();
  renderSubtasks(t);
  $("#subtasks").lastElementChild.querySelector('input[type="text"]').focus();
};
$("#subtasks").addEventListener("input", (e) => {
  if (e.target.type !== "text") return;
  const id = $("#taskId").value,
    t = data.find((x) => x.id === id),
    row = e.target.closest(".sub-row");
  if (!t || !row) return;
  const s = t.subtasks.find((x) => x.id === row.dataset.sub);
  if (!s) return;
  s.text = e.target.value;
  persist();
});
$("#subtasks").addEventListener("change", (e) => {
  const id = $("#taskId").value,
    t = data.find((x) => x.id === id),
    row = e.target.closest(".sub-row");
  if (!t || !row || e.target.type !== "checkbox") return;
  const s = t.subtasks.find((x) => x.id === row.dataset.sub);
  if (!s) return;
  s.done = e.target.checked;
  persist();
  render();
});
$("#subtasks").addEventListener("click", (e) => {
  if (!e.target.classList.contains("sub-delete")) return;
  const t = data.find((x) => x.id === $("#taskId").value);
  t.subtasks = t.subtasks.filter(
    (s) => s.id !== e.target.closest(".sub-row").dataset.sub,
  );
  persist();
  renderSubtasks(t);
  render();
});
$("#addComment").onclick = () => {
  const id = $("#taskId").value,
    t = data.find((x) => x.id === id),
    author = $("#commentAuthor").value.trim(),
    text = $("#commentText").value.trim();
  if (!author || !text) return toast("Add your name and a comment.");
  t.comments.push({
    id: uid("com"),
    author,
    text,
    timestamp: new Date().toISOString(),
    edited: false,
  });
  $("#commentAuthor").value = "";
  $("#commentText").value = "";
  persist();
  activity("edited", `Added comment on “${t.title}”`);
  renderComments(t);
  render();
};
$("#comments").addEventListener("click", (e) => {
  const row = e.target.closest(".comment");
  if (!row) return;
  const t = data.find((x) => x.id === $("#taskId").value),
    c = t.comments.find((x) => x.id === row.dataset.comment);
  if (e.target.classList.contains("comment-delete")) {
    t.comments = t.comments.filter((x) => x.id !== c.id);
    persist();
    renderComments(t);
    render();
  }
  if (e.target.classList.contains("comment-edit")) {
    const next = prompt("Edit comment", c.text);
    if (next !== null) {
      c.text = next;
      c.edited = true;
      c.timestamp = new Date().toISOString();
      persist();
      renderComments(t);
      render();
    }
  }
});
$("#board").addEventListener("click", (e) => {
  const edit = e.target.closest("[data-edit]"),
    del = e.target.closest("[data-delete]"),
    add = e.target.closest("[data-add]"),
    cardEl = e.target.closest(".card");
  if (edit) addOrEditTask(edit.dataset.edit);
  else if (del) openDelete(del.dataset.delete);
  else if (add) addOrEditTask(null, add.dataset.add);
  else if (cardEl) addOrEditTask(cardEl.dataset.id);
});
$("#searchInput").oninput = (e) => {
  state.query = e.target.value;
  render();
};
[
  ["priorityFilter", "priority"],
  ["labelFilter", "label"],
  ["assigneeFilter", "assignee"],
  ["statusFilter", "status"],
  ["sortSelect", "sort"],
].forEach(
  ([id, key]) =>
    ($("#" + id).onchange = (e) => {
      state[key] = e.target.value;
      render();
    }),
);
$("#clearFilters").onclick = () => {
  Object.assign(state, {
    query: "",
    priority: "all",
    label: "all",
    assignee: "all",
    status: "all",
  });
  $("#searchInput").value = "";
  ["priorityFilter", "labelFilter", "assigneeFilter", "statusFilter"].forEach(
    (id) => ($("#" + id).value = "all"),
  );
  render();
};
$("#themeBtn").onclick = () => {
  const dark = document.documentElement.dataset.theme !== "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "";
  localStorage.setItem("jasmine-theme", dark ? "dark" : "light");
};
if (localStorage.getItem("jasmine-theme") === "dark")
  document.documentElement.dataset.theme = "dark";
$("#exportBtn").onclick = () => exportData(data, log);
$("#importBtn").onclick = () => $("#importFile").click();
$("#importFile").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (!Array.isArray(parsed.data)) throw Error();
    data = parsed.data;
    log = Array.isArray(parsed.log) ? parsed.log : [];
    persist();
    render();
    toast("Board restored.");
  } catch {
    toast("That file is not a valid Jasmine board export.");
  }
  e.target.value = "";
};
$$(".activity-filters button").forEach(
  (b) =>
    (b.onclick = () => {
      $$(".activity-filters button").forEach((x) =>
        x.classList.remove("active"),
      );
      b.classList.add("active");
      logFilter = b.dataset.log;
      renderActivity();
    }),
);
$("#moreBtn").onclick = () =>
  toast("Shortcuts: N new task · F search · D theme · ? help");
document.addEventListener("keydown", (e) => {
  if (
    ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
  ) {
    if (e.key === "Escape") closeModals();
    return;
  }
  if (e.key.toLowerCase() === "n") {
    e.preventDefault();
    addOrEditTask();
  }
  if (e.key.toLowerCase() === "f") {
    e.preventDefault();
    $("#searchInput").focus();
  }
  if (e.key.toLowerCase() === "d") $("#themeBtn").click();
  if (e.key === "Escape") {
    closeModals();
    $("#activityDrawer").classList.remove("open");
  }
  if (e.key === "?") toast("N new task · F search · D theme · Esc close");
});
const landing = document.querySelector("#landingPage");
const appShell = document.querySelector("#appShell");
function openWorkspace() {
  landing?.classList.add("leaving");
  setTimeout(() => {
    if (landing) landing.style.display = "none";
    appShell?.classList.add("visible");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 260);
}
$("#enterWorkspace")?.addEventListener("click", openWorkspace);
$("#startJourney")?.addEventListener("click", openWorkspace);
$("#footerEnter")?.addEventListener("click", openWorkspace);
petals();
setupDnD({ board: $("#board"), getTasks: () => data, moveTask, render, toast });
render();
