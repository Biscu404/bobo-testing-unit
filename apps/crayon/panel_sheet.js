/* The SHEET panel: undo, a new sheet, save, export, the desktop's background, and the drawer of saved sheets. Its own window (panels.js); every button is something the
   main window does (`env.sheet`), and each makes its click. */
export function buildSheet(body, sess, env) {
  const box = document.createElement('div');
  box.className = 'drawtools drawpanel';
  body.appendChild(box);
  const grid = document.createElement('div');
  grid.className = 'drawcols';
  box.appendChild(grid);
  [['UNDO', 'undo'], ['NEW', 'newSheet'], ['SAVE', 'save'], ['EXPORT PNG', 'exportPng'], ['BACKGROUND', 'background'], ['DRAWINGS', 'drawings']].forEach(([label, fn]) => {
    const b = document.createElement('button');
    b.className = 'tl'; b.textContent = label;
    b.addEventListener('mousedown', ev => { ev.stopPropagation(); env.click(); env.sheet[fn](); });
    grid.appendChild(b);
  });
}
