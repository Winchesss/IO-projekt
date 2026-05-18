const STORAGE_KEY = "cts-state-v3";
const OLD_STORAGE_KEYS = ["cts-state-v2", "cts-state-v1"];

const DEFAULT_STATE = {
  users: [],
  currentUserId: null,
  selectedTournamentId: null,
  tournaments: [],
};

const DEFAULT_TOURNAMENT = {
  name: "Nowy turniej szachowy",
  place: "Sala gry",
  startDate: "",
  endDate: "",
  timeControl: "10+5",
  roundsCount: 7,
  status: "draft",
  system: "swiss",
};

const resultOptions = [
  ["", "Nie wpisano"],
  ["1-0", "1-0"],
  ["0-1", "0-1"],
  ["0.5-0.5", "0.5-0.5"],
  ["1-bye", "BYE 1 pkt"],
  ["0-bye", "BYE 0 pkt"],
];

let state = clone(DEFAULT_STATE);
let storageAvailable = true;
let pendingRegistrationTournamentId = null;
let editingTournament = false;

window.addEventListener("error", (event) => {
  const banner = document.querySelector("#error-banner");
  const message = document.querySelector("#error-message");
  if (!banner || !message) return;
  message.textContent = event.error?.message || event.message || "Nieznany błąd JavaScript.";
  banner.classList.remove("hidden");
});

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix = "id") {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID().slice(0, 8)}`;
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`;
}

function safeStorageGet(key) {
  try {
    storageAvailable = true;
    return localStorage.getItem(key);
  } catch {
    storageAvailable = false;
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
}

function loadState() {
  const raw = safeStorageGet(STORAGE_KEY);
  if (raw) {
    try {
      state = normalizeState(JSON.parse(raw));
      ensureSelectedTournament();
      return;
    } catch {
      state = clone(DEFAULT_STATE);
    }
  }

  for (const key of OLD_STORAGE_KEYS) {
    const legacyRaw = safeStorageGet(key);
    if (!legacyRaw) continue;
    try {
      state = normalizeState(JSON.parse(legacyRaw));
      ensureSelectedTournament();
      saveState();
      return;
    } catch {
      // Ignore broken legacy data and try the next key.
    }
  }

  state = clone(DEFAULT_STATE);
  ensureSelectedTournament();
}

function saveState() {
  safeStorageSet(STORAGE_KEY, JSON.stringify(state));
}

function normalizeState(value) {
  const source = value && typeof value === "object" ? value : {};
  const users = Array.isArray(source.users)
    ? source.users.map((user) => ({
      id: String(user.id || createId("user")),
      name: String(user.name || user.username || "").trim(),
      role: user.role === "judge" ? "judge" : "user",
    })).filter((user) => user.name)
    : [];

  let tournamentSources = [];
  if (Array.isArray(source.tournaments)) {
    tournamentSources = source.tournaments;
  } else if (source.tournament || source.name || source.players || source.participants || source.rounds) {
    tournamentSources = [source.tournament || source];
  }

  const tournaments = tournamentSources.map(normalizeTournament).filter(Boolean);
  return {
    users,
    currentUserId: users.some((user) => user.id === source.currentUserId) ? source.currentUserId : null,
    selectedTournamentId: tournaments.some((tournament) => tournament.id === source.selectedTournamentId)
      ? source.selectedTournamentId
      : tournaments[0]?.id || null,
    tournaments,
  };
}

function normalizeTournament(value) {
  if (!value || typeof value !== "object") return null;
  const roundsCount = Number(value.roundsCount ?? value.rounds ?? DEFAULT_TOURNAMENT.roundsCount);
  const tournament = {
    id: String(value.id || createId("tournament")),
    name: String(value.name || DEFAULT_TOURNAMENT.name).trim() || DEFAULT_TOURNAMENT.name,
    place: String(value.place ?? value.venue ?? DEFAULT_TOURNAMENT.place).trim(),
    startDate: String(value.startDate || ""),
    endDate: String(value.endDate || ""),
    timeControl: String(value.timeControl ?? DEFAULT_TOURNAMENT.timeControl).trim(),
    roundsCount: Number.isFinite(roundsCount) && roundsCount > 0 ? roundsCount : DEFAULT_TOURNAMENT.roundsCount,
    status: ["draft", "active", "finished"].includes(value.status) ? value.status : "draft",
    system: value.system === "roundRobin" ? "roundRobin" : "swiss",
    players: normalizePlayers(value.players || value.participants || []),
    rounds: normalizeRounds(value.rounds || value.roundsData || value.roundsList || []),
    createdBy: value.createdBy || null,
  };
  if (tournament.rounds.length > 0 && tournament.status === "draft") tournament.status = "active";
  return tournament;
}

function normalizePlayers(players) {
  if (!Array.isArray(players)) return [];
  return players.map((player) => {
    const fullName = String(player.name || "").trim();
    const parts = fullName.split(/\s+/).filter(Boolean);
    return {
      id: String(player.id || createId("player")),
      userId: player.userId || null,
      firstName: String(player.firstName || parts[0] || "").trim(),
      lastName: String(player.lastName || parts.slice(1).join(" ") || "").trim(),
      rating: Number(player.rating) || 0,
      title: String(player.title || "").trim(),
      federation: String(player.federation || "").trim().toUpperCase(),
      club: String(player.club || "").trim(),
      score: Number(player.score) || 0,
      buchholz: Number(player.buchholz) || 0,
    };
  }).filter((player) => getPlayerName(player));
}

function normalizeRounds(rounds) {
  if (!Array.isArray(rounds)) return [];
  return rounds.map((round, roundIndex) => ({
    id: String(round.id || createId("round")),
    number: Number(round.number || roundIndex + 1),
    status: round.status === "closed" ? "closed" : "open",
    pairings: Array.isArray(round.pairings)
      ? round.pairings.map((pairing, pairingIndex) => ({
        id: String(pairing.id || createId("pairing")),
        board: Number(pairing.board || pairingIndex + 1),
        whiteId: pairing.whiteId || null,
        blackId: pairing.blackId || null,
        result: pairing.result || "",
      }))
      : [],
  }));
}

function getCurrentUser() {
  return state.users.find((user) => user.id === state.currentUserId) || null;
}

function isJudge() {
  return getCurrentUser()?.role === "judge";
}

function isRegularUser() {
  return getCurrentUser()?.role === "user";
}

function getSelectedTournament() {
  return state.tournaments.find((tournament) => tournament.id === state.selectedTournamentId) || null;
}

function setSelectedTournament(tournamentId) {
  state.selectedTournamentId = tournamentId;
  pendingRegistrationTournamentId = null;
  editingTournament = false;
  ensureSelectedTournament();
  saveState();
  renderApp();
}

function ensureSelectedTournament() {
  if (!state.selectedTournamentId && state.tournaments.length > 0) {
    state.selectedTournamentId = state.tournaments[0].id;
  }

  if (
    state.selectedTournamentId &&
    !state.tournaments.some((tournament) => tournament.id === state.selectedTournamentId)
  ) {
    state.selectedTournamentId = state.tournaments[0]?.id || null;
  }
}

function renderApp() {
  ensureSelectedTournament();
  const currentUser = getCurrentUser();
  if (!currentUser) return renderLoginView();
  if (isJudge()) return renderJudgeView();
  if (isRegularUser()) return renderPlayerView();
}

function renderLoginView() {
  appRoot().innerHTML = `
    <section class="login-view">
      <article class="panel login-card">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Logowanie</p>
            <h1>Chess Tournament System</h1>
          </div>
          <span class="status-pill">niezalogowany</span>
        </div>
        <p class="hero-text">Zaloguj się jako zawodnik albo sędzia. Aplikacja działa bez backendu i zapisuje dane w localStorage.</p>
        <form class="stack-form" data-form="login">
          <label>Nazwa użytkownika<input name="name" type="text" placeholder="np. Anna Nowak" autocomplete="username" required /></label>
          <label>Rola<select name="role"><option value="user">user - zawodnik</option><option value="judge">judge - sędzia</option></select></label>
          <button class="btn" type="submit">Zaloguj</button>
        </form>
      </article>
    </section>
  `;
}

function renderHeader(title) {
  const user = getCurrentUser();
  return `
    <header class="hero">
      <div class="hero-copy">
        <p class="eyebrow">${isJudge() ? "Panel sędziego" : "Panel zawodnika"}</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="hero-text">Zalogowany jako: <strong>${escapeHtml(user.name)}</strong> (${isJudge() ? "sędzia" : "zawodnik"}).</p>
      </div>
      <div class="hero-actions">
        ${isJudge() ? `<button class="btn btn-secondary" type="button" data-action="load-demo">Wczytaj demo</button><button class="btn btn-danger" type="button" data-action="clear-data">Wyczyść dane</button>` : ""}
        <button class="btn btn-secondary" type="button" data-action="logout">Wyloguj</button>
      </div>
    </header>
  `;
}

function renderPlayerView() {
  appRoot().innerHTML = `
    ${renderHeader("Turnieje")}
    <section class="panel">
      <div class="panel-heading"><div><p class="eyebrow">Lista</p><h2>Dostępne turnieje</h2></div></div>
      ${renderPlayerTournamentList()}
    </section>
    ${renderPlayerDetails()}
  `;
}

function renderPlayerTournamentList() {
  const user = getCurrentUser();
  if (state.tournaments.length === 0) return `<div class="empty-state">Brak turniejów. Poproś sędziego o utworzenie turnieju.</div>`;
  return `<div class="tournament-list">${state.tournaments.map((tournament) => {
    const selected = tournament.id === state.selectedTournamentId;
    const registered = tournament.players.some((player) => player.userId === user.id);
    return `
      <article class="tournament-card ${selected ? "is-selected" : ""}">
        <button class="tournament-select" type="button" data-action="select-tournament" data-tournament-id="${tournament.id}">
          <strong>${escapeHtml(tournament.name)}</strong>
          <span>${escapeHtml(tournament.place || "bez miejsca")} · ${escapeHtml(formatDates(tournament))} · ${tournament.roundsCount} rund · ${tournament.players.length} zawodników</span>
          ${registered ? `<em>Jesteś zapisany</em>` : ""}
        </button>
        <div class="inline-actions">
          <button class="chip-btn accent" type="button" data-action="select-tournament" data-tournament-id="${tournament.id}">Szczegóły</button>
          ${registered
            ? `<button class="chip-btn" type="button" data-action="unregister" data-tournament-id="${tournament.id}">Wypisz się</button>`
            : `<button class="chip-btn accent" type="button" data-action="show-registration" data-tournament-id="${tournament.id}">Zapisz się</button>`}
        </div>
      </article>
    `;
  }).join("")}</div>`;
}

function renderPlayerDetails() {
  const tournament = getSelectedTournament();
  if (!tournament) return "";
  return `
    ${pendingRegistrationTournamentId ? renderRegistrationForm(pendingRegistrationTournamentId) : ""}
    <section class="panel"><div class="panel-heading"><div><p class="eyebrow">Szczegóły</p><h2>${escapeHtml(tournament.name)}</h2></div></div>${renderTournamentSummary(tournament)}</section>
    ${renderPlayersSection(tournament, false)}
    ${renderRoundsSection(tournament, false)}
    ${renderStandingsSection(tournament)}
  `;
}

function renderRegistrationForm(tournamentId) {
  const tournament = state.tournaments.find((entry) => entry.id === tournamentId);
  if (!tournament) return "";
  const user = getCurrentUser();
  const [firstName = "", ...lastNameParts] = user.name.split(/\s+/);
  return `
    <section class="panel">
      <div class="panel-heading"><div><p class="eyebrow">Zapis</p><h2>${escapeHtml(tournament.name)}</h2></div></div>
      <form class="stack-form" data-form="registration" data-tournament-id="${tournament.id}">
        <div class="field-row"><label>Imię<input name="firstName" type="text" value="${escapeAttribute(firstName)}" required /></label><label>Nazwisko<input name="lastName" type="text" value="${escapeAttribute(lastNameParts.join(" "))}" required /></label></div>
        <div class="field-row thirds"><label>Ranking<input name="rating" type="number" min="0" value="1600" /></label><label>Tytuł<input name="title" type="text" /></label><label>Narodowość<input name="federation" type="text" maxlength="3" placeholder="POL" /></label></div>
        <label>Klub<input name="club" type="text" placeholder="Klub Szachowy" /></label>
        <div class="inline-actions"><button class="btn" type="submit">Potwierdź zapis</button><button class="btn btn-secondary" type="button" data-action="cancel-registration">Anuluj</button></div>
      </form>
    </section>
  `;
}

function renderJudgeView() {
  const tournament = getSelectedTournament();
  appRoot().innerHTML = `
    ${renderHeader("Zarządzanie turniejami")}
    <section class="panel">
      <div class="panel-heading">
        <div><p class="eyebrow">Turnieje</p><h2>${tournament ? `Aktualny turniej: ${escapeHtml(tournament.name)}` : "Brak turniejów"}</h2></div>
        <div class="inline-actions">
          <button class="btn" type="button" data-action="new-tournament">Dodaj turniej</button>
          ${tournament ? `<button class="btn btn-secondary" type="button" data-action="edit-tournament">Edytuj turniej</button><button class="btn btn-danger" type="button" data-action="delete-tournament">Usuń turniej</button>` : ""}
        </div>
      </div>
      ${renderJudgeTournamentSelector()}
    </section>
    ${tournament ? renderJudgeWorkspace(tournament) : `<section class="panel"><div class="empty-state">Brak wybranego turnieju.</div></section>`}
  `;
}

function renderJudgeTournamentSelector() {
  if (state.tournaments.length === 0) return `<div class="empty-state">Nie ma jeszcze turniejów. Dodaj pierwszy turniej, aby rozpocząć pracę.</div>`;
  return `
    <label class="select-line">Wybierz aktualny turniej
      <select data-action="select-tournament-select">${state.tournaments.map((tournament) => `<option value="${tournament.id}" ${tournament.id === state.selectedTournamentId ? "selected" : ""}>${escapeHtml(tournament.name)}</option>`).join("")}</select>
    </label>
    <div class="tournament-list compact">${state.tournaments.map((tournament) => `
      <article class="tournament-card ${tournament.id === state.selectedTournamentId ? "is-selected" : ""}">
        <button class="tournament-select" type="button" data-action="select-tournament" data-tournament-id="${tournament.id}">
          <strong>${escapeHtml(tournament.name)}</strong>
          <span>${escapeHtml(tournament.place || "bez miejsca")} · ${tournament.players.length} zawodników · ${tournament.rounds.length}/${tournament.roundsCount} rund</span>
        </button>
      </article>
    `).join("")}</div>
  `;
}

function renderJudgeWorkspace(tournament) {
  return `
    ${editingTournament ? renderTournamentForm(tournament) : ""}
    <section class="top-grid">
      <article class="panel stats-panel"><div class="panel-heading"><div><p class="eyebrow">Przegląd</p><h2>Statystyki</h2></div></div>${renderTournamentSummary(tournament)}<p class="form-note ${storageAvailable ? "" : "is-warning"}">${storageAvailable ? "Dane, użytkownicy i sesja są zapisywane lokalnie w przeglądarce." : "Przeglądarka blokuje localStorage."}</p>${renderStatsGrid(tournament)}</article>
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Rejestracja</p><h2>Dodaj zawodnika</h2></div></div>${renderJudgePlayerForm(tournament)}</article>
    </section>
    ${renderPlayersSection(tournament, true)}
    ${renderRoundsSection(tournament, true)}
    ${renderStandingsSection(tournament)}
  `;
}

function renderTournamentForm(tournament) {
  return `
    <section class="panel">
      <div class="panel-heading"><div><p class="eyebrow">Konfiguracja</p><h2>Edytuj turniej</h2></div></div>
      <form class="stack-form" data-form="tournament-edit">
        <label>Nazwa turnieju<input name="name" type="text" value="${escapeAttribute(tournament.name)}" required /></label>
        <div class="field-row"><label>Miejsce<input name="place" type="text" value="${escapeAttribute(tournament.place)}" /></label><label>Tempo gry<input name="timeControl" type="text" value="${escapeAttribute(tournament.timeControl)}" /></label></div>
        <div class="field-row thirds"><label>Data startu<input name="startDate" type="date" value="${escapeAttribute(tournament.startDate)}" /></label><label>Data końca<input name="endDate" type="date" value="${escapeAttribute(tournament.endDate)}" /></label><label>Liczba rund<input name="roundsCount" type="number" min="1" max="30" value="${tournament.roundsCount}" /></label></div>
        <div class="field-row"><label>Status<select name="status">${["draft", "active", "finished"].map((status) => `<option value="${status}" ${status === tournament.status ? "selected" : ""}>${status}</option>`).join("")}</select></label><label>System<select name="system"><option value="swiss" ${tournament.system === "swiss" ? "selected" : ""}>Szwajcarski</option><option value="roundRobin" ${tournament.system === "roundRobin" ? "selected" : ""}>Kołowy</option></select></label></div>
        <div class="inline-actions"><button class="btn" type="submit">Zapisz zmiany</button><button class="btn btn-secondary" type="button" data-action="cancel-tournament-form">Anuluj</button></div>
      </form>
    </section>
  `;
}

function renderJudgePlayerForm(tournament) {
  const disabled = tournament.rounds.length > 0 ? "disabled" : "";
  return `
    <form class="stack-form" data-form="judge-player">
      <div class="field-row"><label>Imię<input name="firstName" type="text" required ${disabled} /></label><label>Nazwisko<input name="lastName" type="text" required ${disabled} /></label></div>
      <div class="field-row thirds"><label>Ranking<input name="rating" type="number" min="0" value="1600" ${disabled} /></label><label>Tytuł<input name="title" type="text" ${disabled} /></label><label>Narodowość<input name="federation" type="text" maxlength="3" placeholder="POL" ${disabled} /></label></div>
      <label>Klub<input name="club" type="text" ${disabled} /></label>
      <p class="form-note ${disabled ? "is-warning" : ""}">${disabled ? "Lista startowa jest zablokowana po wygenerowaniu rund." : "Zawodników można dodawać do momentu wygenerowania pierwszej rundy."}</p>
      <button class="btn" type="submit" ${disabled}>Dodaj zawodnika</button>
    </form>
  `;
}

function renderTournamentSummary(tournament) {
  return `
    <div class="summary-grid">
      <span><strong>Miejsce:</strong> ${escapeHtml(tournament.place || "brak")}</span>
      <span><strong>Daty:</strong> ${escapeHtml(formatDates(tournament))}</span>
      <span><strong>Tempo:</strong> ${escapeHtml(tournament.timeControl || "brak")}</span>
      <span><strong>Rundy:</strong> ${tournament.rounds.length}/${tournament.roundsCount}</span>
      <span><strong>Status:</strong> ${escapeHtml(tournament.status)}</span>
      <span><strong>Zawodnicy:</strong> ${tournament.players.length}</span>
    </div>
  `;
}

function renderStatsGrid(tournament) {
  const standings = computeStandings(tournament);
  const leader = standings[0];
  const finishedRounds = tournament.rounds.filter((round) => round.status === "closed").length;
  const games = tournament.rounds.reduce((sum, round) => sum + round.pairings.filter((pairing) => pairing.blackId).length, 0);
  const stats = [["Turnieje", state.tournaments.length], ["Zawodnicy", tournament.players.length], ["Rundy zakończone", `${finishedRounds}/${tournament.roundsCount}`], ["Partie", games], ["Lider", leader ? `${getPlayerName(leader)} (${leader.points})` : "brak"]];
  return `<div class="stats-grid">${stats.map(([label, value]) => `<article class="stat-card"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></article>`).join("")}</div>`;
}

function renderPlayersSection(tournament, editable) {
  return `
    <section class="panel">
      <div class="panel-heading"><div><p class="eyebrow">Lista startowa</p><h2>Zawodnicy</h2></div></div>
      <div class="table-wrap"><table><thead><tr><th>#</th><th>Zawodnik</th><th>Klub</th><th>FED</th><th>Ranking</th><th>${editable ? "Akcje" : ""}</th></tr></thead><tbody>${renderPlayersRows(tournament, editable)}</tbody></table></div>
    </section>
  `;
}

function renderPlayersRows(tournament, editable) {
  if (tournament.players.length === 0) return `<tr><td colspan="6" class="empty-state">Brak zawodników w tym turnieju.</td></tr>`;
  const standingsMap = new Map(computeStandings(tournament).map((player) => [player.id, player]));
  return [...tournament.players].sort((a, b) => b.rating - a.rating).map((player, index) => {
    const scored = standingsMap.get(player.id);
    return `
      <tr>
        <td>${index + 1}</td>
        <td><div class="player-meta"><strong>${escapeHtml(getPlayerName(player))}</strong><span>${escapeHtml(player.title || "zawodnik")} · ${(scored?.points ?? 0).toFixed(1)} pkt${player.userId ? " · konto użytkownika" : ""}</span></div></td>
        <td>${escapeHtml(player.club || "-")}</td><td class="mono">${escapeHtml(player.federation || "-")}</td><td>${player.rating}</td>
        <td>${editable ? `<button class="chip-btn" type="button" data-action="remove-player" data-player-id="${player.id}">Usuń</button>` : ""}</td>
      </tr>
    `;
  }).join("");
}

function renderRoundsSection(tournament, editable) {
  return `
    <section class="panel">
      <div class="panel-heading">
        <div><p class="eyebrow">Kojarzenia</p><h2>Rundy</h2></div>
        ${editable ? `<div class="inline-actions"><button class="btn" type="button" data-action="generate-round">Generuj następną rundę</button><button class="btn btn-secondary" type="button" data-action="close-round">Zamknij bieżącą rundę</button></div>` : ""}
      </div>
      <div class="rounds-container">${renderRounds(tournament, editable)}</div>
    </section>
  `;
}

function renderRounds(tournament, editable) {
  if (tournament.rounds.length === 0) return `<div class="empty-state">Nie wygenerowano jeszcze żadnej rundy.</div>`;
  return [...tournament.rounds].sort((a, b) => b.number - a.number).map((round) => `
    <section class="round-card">
      <div class="round-header"><div><p class="eyebrow">Runda</p><h3>${round.number}</h3></div><span class="status-pill">${round.status === "open" ? "otwarta" : "zamknięta"}</span></div>
      <div class="table-wrap"><table><thead><tr><th>Szachownica</th><th>Białe</th><th>Czarne</th><th>Wynik</th></tr></thead><tbody>${round.pairings.map((pairing) => renderPairingRow(tournament, round, pairing, editable)).join("")}</tbody></table></div>
    </section>
  `).join("");
}

function renderPairingRow(tournament, round, pairing, editable) {
  const white = getPlayerById(pairing.whiteId, tournament);
  const black = pairing.blackId ? getPlayerById(pairing.blackId, tournament) : null;
  const disabled = !editable || round.status === "closed" || !pairing.blackId ? "disabled" : "";
  return `
    <tr class="pairing-row">
      <td>${pairing.board}</td><td>${escapeHtml(white ? getPlayerName(white) : "Nieznany zawodnik")}</td><td>${escapeHtml(black ? getPlayerName(black) : "BYE")}</td>
      <td><select data-action="result" data-round-id="${round.id}" data-pairing-id="${pairing.id}" ${disabled}>${resultOptions.filter(([value]) => (pairing.blackId ? !value.includes("bye") : true)).map(([value, label]) => `<option value="${value}" ${value === pairing.result ? "selected" : ""}>${label}</option>`).join("")}</select></td>
    </tr>
  `;
}

function renderStandingsSection(tournament) {
  const standings = computeStandings(tournament);
  return `
    <section class="panel">
      <div class="panel-heading"><div><p class="eyebrow">Klasyfikacja</p><h2>Tabela</h2></div>${isJudge() ? `<button class="btn btn-secondary" type="button" data-action="export-standings">Eksport CSV</button>` : ""}</div>
      <div class="table-wrap"><table><thead><tr><th>M-ce</th><th>Zawodnik</th><th>Pkt</th><th>Buchholz</th><th>SB</th><th>Wygrane</th><th>Ranking</th></tr></thead><tbody>
        ${standings.length === 0 ? `<tr><td colspan="7" class="empty-state">Tabela pojawi się po dodaniu zawodników.</td></tr>` : standings.map((player, index) => `
          <tr><td>${index + 1}</td><td><div class="standings-player"><strong>${escapeHtml(getPlayerName(player))}</strong><span>${escapeHtml(player.club || "bez klubu")} · ${escapeHtml(player.federation || "-")}</span></div></td><td>${player.points.toFixed(1)}</td><td>${player.buchholz.toFixed(1)}</td><td>${player.sb.toFixed(2)}</td><td>${player.wins}</td><td>${player.rating}</td></tr>
        `).join("")}
      </tbody></table></div>
    </section>
  `;
}

function handleLogin(form) {
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const role = data.get("role") === "judge" ? "judge" : "user";
  if (!name) return alert("Podaj nazwę użytkownika.");
  let user = state.users.find((entry) => entry.name.toLowerCase() === name.toLowerCase() && entry.role === role);
  if (!user) {
    user = { id: createId("user"), name, role };
    state.users.push(user);
  }
  state.currentUserId = user.id;
  saveState();
  renderApp();
}

function handleLogout() {
  state.currentUserId = null;
  pendingRegistrationTournamentId = null;
  editingTournament = false;
  saveState();
  renderApp();
}

function startNewTournament() {
  if (!isJudge()) return;
  const tournament = normalizeTournament({ ...DEFAULT_TOURNAMENT, name: `Nowy turniej ${state.tournaments.length + 1}`, createdBy: getCurrentUser()?.id || null });
  state.tournaments.push(tournament);
  state.selectedTournamentId = tournament.id;
  editingTournament = true;
  ensureSelectedTournament();
  saveState();
  renderApp();
}

function updateSelectedTournament(formData) {
  const tournament = getSelectedTournament();
  if (!tournament || !isJudge()) return;
  tournament.name = String(formData.get("name") || DEFAULT_TOURNAMENT.name).trim();
  tournament.place = String(formData.get("place") || "").trim();
  tournament.startDate = String(formData.get("startDate") || "");
  tournament.endDate = String(formData.get("endDate") || "");
  tournament.timeControl = String(formData.get("timeControl") || "").trim();
  tournament.roundsCount = Number(formData.get("roundsCount")) || tournament.roundsCount;
  tournament.status = ["draft", "active", "finished"].includes(formData.get("status")) ? formData.get("status") : tournament.status;
  tournament.system = formData.get("system") === "roundRobin" ? "roundRobin" : "swiss";
  editingTournament = false;
  saveState();
  renderApp();
}

function deleteSelectedTournament() {
  if (!isJudge()) return;
  const tournament = getSelectedTournament();
  if (!tournament || !window.confirm(`Usunąć turniej "${tournament.name}"?`)) return;
  state.tournaments = state.tournaments.filter((entry) => entry.id !== tournament.id);
  ensureSelectedTournament();
  editingTournament = false;
  saveState();
  renderApp();
}

function registerCurrentUserForTournament(tournamentId, playerData) {
  const tournament = state.tournaments.find((entry) => entry.id === tournamentId);
  const user = getCurrentUser();
  if (!tournament || !user || !isRegularUser()) return;
  if (tournament.players.some((player) => player.userId === user.id)) return alert("Jesteś już zapisany do tego turnieju.");
  tournament.players.push(createPlayer({ ...playerData, userId: user.id }));
  state.selectedTournamentId = tournament.id;
  pendingRegistrationTournamentId = null;
  saveState();
  renderApp();
}

function unregisterCurrentUserFromTournament(tournamentId) {
  const user = getCurrentUser();
  const tournament = state.tournaments.find((entry) => entry.id === tournamentId);
  if (!user || !tournament || !isRegularUser()) return;
  if (tournament.rounds.length > 0) return alert("Nie można wypisać się po rozpoczęciu turnieju.");
  tournament.players = tournament.players.filter((player) => player.userId !== user.id);
  saveState();
  renderApp();
}

function addPlayerToSelectedTournament(playerData) {
  const tournament = getSelectedTournament();
  if (!tournament || !isJudge()) return;
  if (tournament.rounds.length > 0) return alert("Nie można dodawać zawodników po wygenerowaniu rund.");
  const player = createPlayer(playerData);
  if (!player.firstName || !player.lastName) return alert("Podaj imię i nazwisko zawodnika.");
  tournament.players.push(player);
  saveState();
  renderApp();
}

function createPlayer(data) {
  return {
    id: createId("player"),
    userId: data.userId || null,
    firstName: String(data.firstName || "").trim(),
    lastName: String(data.lastName || "").trim(),
    rating: Number(data.rating) || 0,
    title: String(data.title || "").trim(),
    federation: String(data.federation || "").trim().toUpperCase(),
    club: String(data.club || "").trim(),
    score: 0,
    buchholz: 0,
  };
}

function removePlayer(playerId) {
  const tournament = getSelectedTournament();
  if (!tournament || !isJudge()) return;
  if (tournament.rounds.length > 0) return alert("Nie można usuwać zawodników po wygenerowaniu rund.");
  tournament.players = tournament.players.filter((player) => player.id !== playerId);
  saveState();
  renderApp();
}

function generateNextRound() {
  const tournament = getSelectedTournament();
  if (!tournament) return alert("Najpierw wybierz turniej.");
  if (!isJudge()) return;
  if (tournament.players.length < 2) return alert("Do wygenerowania rundy potrzeba co najmniej 2 zawodników.");
  if (tournament.rounds.some((round) => round.status === "open")) return alert("Najpierw zamknij bieżącą rundę.");
  const nextRoundNumber = tournament.rounds.length + 1;
  if (nextRoundNumber > Number(tournament.roundsCount)) return alert("Wszystkie rundy zostały już wygenerowane.");
  const pairings = tournament.system === "roundRobin" ? createRoundRobinPairings(tournament, nextRoundNumber) : createSwissPairings(tournament);
  if (pairings.length === 0) return;
  tournament.rounds.push({ id: createId("round"), number: nextRoundNumber, status: "open", pairings });
  tournament.status = "active";
  saveState();
  renderApp();
}

function createSwissPairings(tournament) {
  const standings = computeStandings(tournament);
  const standingsMap = new Map(standings.map((player) => [player.id, player]));
  const history = getMatchHistory(tournament);
  const available = [...standings].sort((a, b) => b.points - a.points || b.rating - a.rating);
  const pairings = [];
  let board = 1;

  if (available.length % 2 === 1) {
    const byeIndexFromEnd = [...available].reverse().findIndex((player) => (history.get(player.id)?.byeCount || 0) === 0);
    const byeIndex = byeIndexFromEnd === -1 ? available.length - 1 : available.length - 1 - byeIndexFromEnd;
    const byePlayer = available.splice(byeIndex, 1)[0];
    pairings.push({ id: createId("pairing"), board: board++, whiteId: byePlayer.id, blackId: null, result: "1-bye" });
  }

  while (available.length > 1) {
    const player = available.shift();
    let bestIndex = 0;
    let bestScore = -Infinity;
    available.forEach((candidate, index) => {
      const score = getPairingScore(player, candidate, history, standingsMap);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    const opponent = available.splice(bestIndex, 1)[0];
    const colors = decideColors(player, opponent, history);
    pairings.push({ id: createId("pairing"), board: board++, whiteId: colors.whiteId, blackId: colors.blackId, result: "" });
  }

  return pairings;
}

function createRoundRobinPairings(tournament, nextRoundNumber) {
  const players = [...tournament.players];
  if (players.length % 2 === 1) players.push({ id: "bye", firstName: "BYE", lastName: "", rating: 0 });
  const roundsNeeded = players.length - 1;
  if (nextRoundNumber > roundsNeeded) {
    alert(`System kołowy dla tej liczby zawodników ma maksymalnie ${roundsNeeded} rund.`);
    return [];
  }
  const rotated = [...players];
  for (let i = 1; i < nextRoundNumber; i += 1) rotated.splice(1, 0, rotated.pop());
  const pairings = [];
  for (let i = 0; i < rotated.length / 2; i += 1) {
    const a = rotated[i];
    const b = rotated[rotated.length - 1 - i];
    if (a.id === "bye" || b.id === "bye") {
      const realPlayer = a.id === "bye" ? b : a;
      pairings.push({ id: createId("pairing"), board: i + 1, whiteId: realPlayer.id, blackId: null, result: "1-bye" });
    } else {
      const invert = nextRoundNumber % 2 === 0;
      pairings.push({ id: createId("pairing"), board: i + 1, whiteId: invert ? b.id : a.id, blackId: invert ? a.id : b.id, result: "" });
    }
  }
  return pairings;
}

function closeCurrentRound() {
  const tournament = getSelectedTournament();
  if (!tournament || !isJudge()) return;
  const currentRound = [...tournament.rounds].reverse().find((round) => round.status === "open");
  if (!currentRound) return alert("Brak otwartej rundy.");
  if (currentRound.pairings.some((pairing) => !pairing.result)) return alert("Uzupełnij wszystkie wyniki przed zamknięciem rundy.");
  currentRound.status = "closed";
  if (tournament.rounds.length >= tournament.roundsCount) tournament.status = "finished";
  saveState();
  renderApp();
}

function submitResult(roundId, pairingId, result) {
  const tournament = getSelectedTournament();
  if (!tournament || !isJudge()) return;
  const round = tournament.rounds.find((entry) => entry.id === roundId);
  const pairing = round?.pairings.find((entry) => entry.id === pairingId);
  if (!round || !pairing || round.status === "closed") return;
  pairing.result = result;
  saveState();
  renderApp();
}

function loadDemo() {
  if (!isJudge()) return;
  const first = normalizeTournament({
    name: "Open Warszawa 2026",
    place: "Warszawa",
    startDate: "2026-06-01",
    endDate: "2026-06-03",
    timeControl: "90+30",
    roundsCount: 7,
    system: "swiss",
    createdBy: getCurrentUser()?.id || null,
    players: [
      ["Jan", "Kowalski", 2180, "FM", "POL", "Hetman Warszawa"],
      ["Marek", "Nowak", 2055, "CM", "POL", "Polonia Wrocław"],
      ["Adam", "Zieliński", 1980, "", "POL", "Cracovia Chess"],
      ["Piotr", "Wysocki", 1920, "", "POL", "Gambit Gdańsk"],
    ].map(([firstName, lastName, rating, title, federation, club]) => ({ id: createId("player"), firstName, lastName, rating, title, federation, club })),
  });
  const second = normalizeTournament({ name: "Rapid Junior Cup", place: "Kraków", startDate: "2026-07-12", endDate: "2026-07-12", timeControl: "15+10", roundsCount: 5, system: "roundRobin", createdBy: getCurrentUser()?.id || null, players: [] });
  state.tournaments = [first, second];
  state.selectedTournamentId = first.id;
  ensureSelectedTournament();
  saveState();
  renderApp();
}

function clearData() {
  if (!isJudge()) return;
  if (!window.confirm("Usunąć wszystkie turnieje, użytkowników i sesję?")) return;
  state = clone(DEFAULT_STATE);
  pendingRegistrationTournamentId = null;
  editingTournament = false;
  ensureSelectedTournament();
  saveState();
  renderApp();
}

function exportStandingsCsv() {
  const tournament = getSelectedTournament();
  if (!tournament || !isJudge()) return;
  const standings = computeStandings(tournament);
  if (standings.length === 0) return alert("Brak danych do eksportu.");
  const rows = [
    ["Place", "Name", "Club", "Federation", "Points", "Buchholz", "SB", "Wins", "Rating"],
    ...standings.map((player, index) => [index + 1, getPlayerName(player), player.club || "", player.federation || "", player.points.toFixed(1), player.buchholz.toFixed(1), player.sb.toFixed(2), player.wins, player.rating]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${tournament.name.replaceAll(/\s+/g, "-").toLowerCase()}-standings.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function scoreForResult(result, color) {
  if (!result) return 0;
  if (result === "0.5-0.5") return 0.5;
  if (result === "1-bye") return color === "white" ? 1 : 0;
  if (result === "0-bye") return 0;
  if (result === "1-0") return color === "white" ? 1 : 0;
  if (result === "0-1") return color === "black" ? 1 : 0;
  return 0;
}

function computeStandings(tournament = getSelectedTournament()) {
  if (!tournament) return [];
  const standings = tournament.players.map((player) => ({ ...player, points: 0, wins: 0, buchholz: 0, sb: 0, games: [] }));
  const map = new Map(standings.map((player) => [player.id, player]));
  tournament.rounds.forEach((round) => {
    round.pairings.forEach((pairing) => {
      const white = map.get(pairing.whiteId);
      if (!white) return;
      const whiteScore = scoreForResult(pairing.result, "white");
      white.points += whiteScore;
      white.games.push({ opponentId: pairing.blackId, score: whiteScore });
      if (whiteScore === 1 && pairing.blackId) white.wins += 1;
      if (!pairing.blackId) return;
      const black = map.get(pairing.blackId);
      if (!black) return;
      const blackScore = scoreForResult(pairing.result, "black");
      black.points += blackScore;
      black.games.push({ opponentId: pairing.whiteId, score: blackScore });
      if (blackScore === 1) black.wins += 1;
    });
  });
  standings.forEach((player) => {
    player.buchholz = player.games.reduce((total, game) => total + (game.opponentId ? map.get(game.opponentId)?.points || 0 : 0), 0);
    player.sb = player.games.reduce((total, game) => total + (game.opponentId ? (map.get(game.opponentId)?.points || 0) * game.score : 0), 0);
    player.score = player.points;
  });
  standings.sort((a, b) => b.points - a.points || b.buchholz - a.buchholz || b.sb - a.sb || b.wins - a.wins || b.rating - a.rating);
  return standings;
}

function getMatchHistory(tournament) {
  const history = new Map();
  tournament.players.forEach((player) => history.set(player.id, { opponents: new Set(), colors: [], byeCount: 0 }));
  tournament.rounds.forEach((round) => {
    round.pairings.forEach((pairing) => {
      const white = history.get(pairing.whiteId);
      if (white) white.colors.push("white");
      if (!pairing.blackId) {
        if (white) white.byeCount += 1;
        return;
      }
      const black = history.get(pairing.blackId);
      white?.opponents.add(pairing.blackId);
      black?.opponents.add(pairing.whiteId);
      black?.colors.push("black");
    });
  });
  return history;
}

function getPairingScore(candidateA, candidateB, history, standingsMap) {
  const recordA = history.get(candidateA.id);
  const recordB = history.get(candidateB.id);
  if (!recordA || !recordB) return -Infinity;
  if (recordA.opponents.has(candidateB.id)) return -1000;
  const pointsGap = Math.abs((standingsMap.get(candidateA.id)?.points || 0) - (standingsMap.get(candidateB.id)?.points || 0));
  const ratingGap = Math.abs(candidateA.rating - candidateB.rating) / 100;
  const colorPressure = Math.abs(balanceColor(recordA.colors) - balanceColor(recordB.colors));
  return 100 - pointsGap * 12 - ratingGap - colorPressure * 2;
}

function balanceColor(colors) {
  return colors.reduce((total, color) => total + (color === "white" ? 1 : -1), 0);
}

function decideColors(playerA, playerB, history) {
  const balanceA = balanceColor(history.get(playerA.id)?.colors || []);
  const balanceB = balanceColor(history.get(playerB.id)?.colors || []);
  if (balanceA > balanceB) return { whiteId: playerB.id, blackId: playerA.id };
  if (balanceB > balanceA) return { whiteId: playerA.id, blackId: playerB.id };
  return playerA.rating >= playerB.rating ? { whiteId: playerA.id, blackId: playerB.id } : { whiteId: playerB.id, blackId: playerA.id };
}

function getPlayerById(playerId, tournament = getSelectedTournament()) {
  return tournament?.players.find((player) => player.id === playerId) || null;
}

function getPlayerName(player) {
  return `${player.firstName || ""} ${player.lastName || ""}`.trim();
}

function formatDates(tournament) {
  if (tournament.startDate && tournament.endDate) return `${tournament.startDate} - ${tournament.endDate}`;
  if (tournament.startDate) return tournament.startDate;
  if (tournament.endDate) return tournament.endDate;
  return "bez dat";
}

function formObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function appRoot() {
  return document.querySelector("#app");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

document.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  const type = form.dataset.form;
  if (type === "login") handleLogin(form);
  if (type === "registration") registerCurrentUserForTournament(form.dataset.tournamentId, formObject(form));
  if (type === "judge-player") addPlayerToSelectedTournament(formObject(form));
  if (type === "tournament-edit") updateSelectedTournament(new FormData(form));
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "logout") handleLogout();
  if (action === "select-tournament") setSelectedTournament(button.dataset.tournamentId);
  if (action === "show-registration") {
    pendingRegistrationTournamentId = button.dataset.tournamentId;
    state.selectedTournamentId = button.dataset.tournamentId;
    saveState();
    renderApp();
  }
  if (action === "cancel-registration") {
    pendingRegistrationTournamentId = null;
    renderApp();
  }
  if (action === "unregister") unregisterCurrentUserFromTournament(button.dataset.tournamentId);
  if (action === "new-tournament") startNewTournament();
  if (action === "edit-tournament") {
    editingTournament = true;
    renderApp();
  }
  if (action === "cancel-tournament-form") {
    editingTournament = false;
    renderApp();
  }
  if (action === "delete-tournament") deleteSelectedTournament();
  if (action === "remove-player") removePlayer(button.dataset.playerId);
  if (action === "generate-round") generateNextRound();
  if (action === "close-round") closeCurrentRound();
  if (action === "load-demo") loadDemo();
  if (action === "clear-data") clearData();
  if (action === "export-standings") exportStandingsCsv();
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target.matches("[data-action='select-tournament-select']")) setSelectedTournament(target.value);
  if (target.matches("select[data-action='result']")) submitResult(target.dataset.roundId, target.dataset.pairingId, target.value);
});

loadState();
renderApp();
