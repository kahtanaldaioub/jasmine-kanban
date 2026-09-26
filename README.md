# Jasmine — Kanban Garden

A fully offline Vanilla HTML/CSS/JavaScript Kanban task manager based on the supplied final-project brief.

## Run
Open `index.html` directly in a modern browser. No build step, npm package, CDN, or external library is required.

## Structure
- `index.html` — application shell and accessible SVG icons
- `css/style.css` — jasmine visual system, responsive layout, petal animation, dark mode, print styles
- `js/app.js` — application orchestration and UI events
- `js/task.js` — task model and board columns
- `js/dragdrop.js` — HTML5 drag/drop behavior and reorder handling
- `js/storage.js` — localStorage and JSON export/import
- `js/filters.js` — search, highlighting, filters, sorting
- `js/ui.js` — shared UI helpers and petal generator
- `js/utils.js` — formatting and small helpers

## Notes
The brief requests multiple files, no libraries/frameworks, localStorage persistence, HTML5 drag/drop, responsive behavior, dark mode, export/import, activity, statistics, subtasks, comments, keyboard shortcuts, WIP limits and movement restrictions. This build implements those core requirements with an intentionally calm jasmine/botanical UI. Subtask names save as they are edited, and successful task drops play a soft synthesized chime.
