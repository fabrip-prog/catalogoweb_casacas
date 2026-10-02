/* ===================================================================
   CasacasStore – Ventana de confirmación (compartida por tienda y panel)
   Reemplaza al confirm() del navegador con una ventana del estilo del
   sitio. Devuelve una promesa: true si se confirma, false si se cancela
   (botón, Escape o tocando fuera del cuadro).
   `media` es HTML armado por el propio sitio (foto, logo, ícono);
   los textos se cargan como texto plano.
   =================================================================== */

function confirmDialog({
  kicker,
  title,
  message,
  cascade = [],
  media = '',
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  note = 'Esta acción no se puede deshacer.',
}) {
  const dialog = document.getElementById('confirmDialog') || createConfirmDialog();
  // Navegadores sin <dialog>: el confirm() de siempre
  if (!dialog) return Promise.resolve(confirm([title, message, ...cascade].join('\n')));

  const part = (name) => dialog.querySelector(`[data-confirm="${name}"]`);
  part('kicker').textContent = kicker;
  part('title').textContent = title;
  part('message').textContent = message;
  part('media').innerHTML = media;
  part('media').classList.toggle('hidden', !media);
  part('list').replaceChildren(...cascade.map(text => Object.assign(document.createElement('li'), { textContent: text })));
  part('cascade').classList.toggle('hidden', !cascade.length);
  part('note').textContent = note;
  part('note').classList.toggle('hidden', !note);
  part('cancel').textContent = cancelLabel;
  part('ok').textContent = confirmLabel;

  dialog.showModal();
  // Se resuelve en el mismo clic: el evento `close` del navegador puede demorarse hasta el próximo repintado
  return new Promise(resolve => {
    const finish = (confirmed) => {
      dialog.removeEventListener('click', onClick);
      dialog.removeEventListener('cancel', onEscape);
      if (dialog.open) dialog.close();
      resolve(confirmed);
    };
    const onClick = (e) => {
      const button = e.target.closest('[data-confirm="ok"], [data-confirm="cancel"]');
      if (button) finish(button.dataset.confirm === 'ok');
      else if (e.target === dialog) finish(false);   // tocar fuera del cuadro
    };
    const onEscape = (e) => {
      e.preventDefault();
      finish(false);
    };
    dialog.addEventListener('click', onClick);
    dialog.addEventListener('cancel', onEscape);
  });
}

function createConfirmDialog() {
  const dialog = document.createElement('dialog');
  if (typeof dialog.showModal !== 'function') return null;
  dialog.id = 'confirmDialog';
  dialog.className = 'confirm';
  dialog.setAttribute('aria-labelledby', 'confirmTitle');
  dialog.setAttribute('aria-describedby', 'confirmMessage');
  dialog.innerHTML = `
    <div class="confirm-box">
      <div class="confirm-head">
        <span class="confirm-media hidden" data-confirm="media"></span>
        <div class="min-w-0">
          <p class="label low" data-confirm="kicker"></p>
          <h3 id="confirmTitle" class="confirm-title" data-confirm="title"></h3>
        </div>
      </div>
      <p id="confirmMessage" class="confirm-message" data-confirm="message"></p>
      <div class="confirm-cascade hidden" data-confirm="cascade">
        <p class="label">También se eliminan</p>
        <ul data-confirm="list"></ul>
      </div>
      <p class="confirm-note" data-confirm="note"></p>
      <div class="confirm-actions">
        <button type="button" class="btn btn-outline" data-confirm="cancel" autofocus>Cancelar</button>
        <button type="button" class="btn btn-danger" data-confirm="ok">Eliminar</button>
      </div>
    </div>`;
  document.body.appendChild(dialog);
  return dialog;
}
