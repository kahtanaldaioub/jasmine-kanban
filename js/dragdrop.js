let audioContext;

function playDropSound() {
  const AudioContext = window.AudioContext;
  if (!AudioContext) return;
  audioContext ||= new AudioContext();
  if (audioContext.state === "suspended") {
    audioContext.resume().catch((error) => {
      console.error("Could not resume drag-and-drop audio.", error);
    });
  }

  const now = audioContext.currentTime,
    oscillator = audioContext.createOscillator(),
    volume = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(520, now);
  oscillator.frequency.exponentialRampToValueAtTime(780, now + 0.08);
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(0.045, now + 0.012);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
  oscillator.connect(volume);
  volume.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.14);
}

export function setupDnD({ board, getTasks, moveTask, render, toast }) {
  let dragged = null;
  board.addEventListener("dragstart", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    dragged = card.dataset.id;
    card.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", dragged);
  });
  board.addEventListener("dragend", (e) => {
    e.target.closest(".card")?.classList.remove("dragging");
    board
      .querySelectorAll(".column")
      .forEach((c) => c.classList.remove("drag-over"));
    dragged = null;
  });
  board.addEventListener("dragover", (e) => {
    const col = e.target.closest(".column");
    if (!col || !dragged) return;
    e.preventDefault();
    col.classList.add("drag-over");
    const cards = col.querySelector(".cards");
    const card = e.target.closest(".card");
    cards.querySelectorAll(".drop-line").forEach((x) => x.remove());
    if (card && card.dataset.id !== dragged) {
      const line = document.createElement("div");
      line.className = "drop-line";
      card.before(line);
    }
  });
  board.addEventListener("dragleave", (e) => {
    const col = e.target.closest(".column");
    if (col && !col.contains(e.relatedTarget)) {
      col.classList.remove("drag-over");
      col.querySelectorAll(".drop-line").forEach((x) => x.remove());
    }
  });
  board.addEventListener("drop", (e) => {
    e.preventDefault();
    const col = e.target.closest(".column");
    if (!col || !dragged) return;
    const target = col.dataset.column;
    const source = getTasks().find((t) => t.id === dragged);
    const idx = Array.from(col.querySelectorAll(".card")).findIndex(
      (c) => c.getBoundingClientRect().top > e.clientY,
    );
    const visibleCards = Array.from(col.querySelectorAll(".card")).filter(
      (c) => c.dataset.id !== dragged,
    );
    const before = visibleCards[idx]?.dataset.id || null;
    col.classList.remove("drag-over");
    col.querySelectorAll(".drop-line").forEach((x) => x.remove());
    if (moveTask(dragged, target, before)) playDropSound();
    render();
  });
}
