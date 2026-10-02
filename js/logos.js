/* ===================================================================
   CasacasStore – Marca de ligas y equipos (compartido por tienda y panel)
   Si se cargó un logo se muestra en lugar del emoji de la liga o del
   punto de color del equipo, al mismo tamaño que el texto que lo rodea.
   =================================================================== */

function leagueMark(league) {
  if (!league) return '';
  return league.logo ? `<img class="mark-img" src="${league.logo}" alt="">` : (league.icon || '');
}

function teamMark(team) {
  if (!team) return '';
  return team.logo
    ? `<img class="mark-img" src="${team.logo}" alt="">`
    : `<span class="team-dot" style="background:${team.color}"></span>`;
}
