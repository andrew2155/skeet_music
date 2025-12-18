const audio = document.getElementById('audio');
const root = document.getElementById('root');
const carplay = document.getElementById('carplay');

const $ = (id) => document.getElementById(id);

let data = {
  settings: { volume: 0.65, shuffle: 0, repeat_mode: 'off' },
  tracks: [],
  playlists: [],
  playlistItems: []
};

let now = { title: null, artist: null, album: null, url: null, artwork_url: null, track_id: null };
let overlay = { x:24, y:24, w:820, h:415 };

function nui(name, payload = {}) {
  return fetch(`https://${GetParentResourceName()}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(payload)
  }).then(r => r.json()).catch(() => ({}));
}

function fmtTime(sec){
  if (!isFinite(sec) || sec < 0) sec = 0;
  sec = Math.floor(sec);
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2,'0');
  return `${m}:${s}`;
}

function setVisible(v){
  root.classList.toggle('hidden', !v);
}

function applyOverlay(){
  carplay.style.left = `${overlay.x}px`;
  carplay.style.top = `${overlay.y}px`;
  carplay.style.width = `${overlay.w}px`;
  carplay.style.height = `${overlay.h}px`;

  const closeBtn = document.getElementById('close');
  closeBtn.style.left = `${overlay.x + overlay.w + 10}px`;
  closeBtn.style.top = `${overlay.y}px`;
}

function renderNow(){
  $('nowTitleTop').textContent = now.title || 'Not Playing';
  $('nowTitle').textContent = now.title || 'Not Playing';
  $('nowArtist').textContent = now.artist || '—';
  $('nowAlbum').textContent = now.album || '—';
  $('art').src = now.artwork_url || 'assets/placeholder_art.png';
  $('btnPlay').textContent = audio.paused ? '▶' : '⏸';
}

function setTab(tab){
  $('tabNow').classList.toggle('on', tab === 'now');
  $('tabLib').classList.toggle('on', tab === 'lib');
  $('tabPl').classList.toggle('on', tab === 'pl');

  $('panelNow').classList.toggle('hidden', tab !== 'now');
  $('panelLib').classList.toggle('hidden', tab !== 'lib');
  $('panelPl').classList.toggle('hidden', tab !== 'pl');
}

function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, (m) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}

function renderLibrary(){
  const p = $('panelLib');
  p.innerHTML = '';
  data.tracks.forEach(t => {
    const row = document.createElement('div');
    row.className = 'item';
    row.innerHTML = `
      <div class="meta">
        <div class="t">${escapeHtml(t.title)}</div>
        <div class="s">${escapeHtml(t.artist || 'Saved URL')}</div>
      </div>
      <div class="btns">
        <button data-play="${t.id}">Play</button>
        <button data-del="${t.id}">Delete</button>
      </div>
    `;
    row.querySelector(`[data-play="${t.id}"]`).onclick = () => playTrack(t);
    row.querySelector(`[data-del="${t.id}"]`).onclick = async () => {
      const r = await nui('music:deleteTrack', { track_id: t.id });
      if (r.ok) await refresh();
    };
    p.appendChild(row);
  });
}

function renderPlaylists(){
  const p = $('panelPl');
  p.innerHTML = '';

  const top = document.createElement('div');
  top.className = 'item';
  top.innerHTML = `
    <div class="meta">
      <div class="t">Playlists</div>
      <div class="s">Create and add saved URLs</div>
    </div>
    <div class="btns">
      <button id="plCreate">Create</button>
    </div>
  `;
  p.appendChild(top);

  top.querySelector('#plCreate').onclick = async () => {
    const name = prompt('Playlist name?');
    if (!name) return;
    const r = await nui('music:createPlaylist', { name });
    if (r.ok) await refresh();
  };

  data.playlists.forEach(pl => {
    const row = document.createElement('div');
    row.className = 'item';
    row.innerHTML = `
      <div class="meta">
        <div class="t">${escapeHtml(pl.name)}</div>
        <div class="s">Tap to open</div>
      </div>
      <div class="btns">
        <button data-open="${pl.id}">Open</button>
        <button data-del="${pl.id}">Delete</button>
      </div>
    `;
    row.querySelector(`[data-open="${pl.id}"]`).onclick = () => openPlaylist(pl.id, pl.name);
    row.querySelector(`[data-del="${pl.id}"]`).onclick = async () => {
      const r = await nui('music:deletePlaylist', { playlist_id: pl.id });
      if (r.ok) await refresh();
    };
    p.appendChild(row);
  });
}

function openPlaylist(pid, name){
  const p = $('panelPl');
  p.innerHTML = '';

  const head = document.createElement('div');
  head.className = 'item';
  head.innerHTML = `
    <div class="meta">
      <div class="t">${escapeHtml(name)}</div>
      <div class="s">Add tracks from Library (saved URLs)</div>
    </div>
    <div class="btns">
      <button id="backPl">Back</button>
    </div>
  `;
  p.appendChild(head);
  head.querySelector('#backPl').onclick = () => renderPlaylists();

  const items = data.playlistItems
    .filter(i => Number(i.playlist_id) === Number(pid))
    .sort((a,b) => (a.sort_order||0) - (b.sort_order||0));

  items.forEach(it => {
    const t = data.tracks.find(x => Number(x.id) === Number(it.track_id));
    if (!t) return;

    const row = document.createElement('div');
    row.className = 'item';
    row.innerHTML = `
      <div class="meta">
        <div class="t">${escapeHtml(t.title)}</div>
        <div class="s">${escapeHtml(t.artist || 'Saved URL')}</div>
      </div>
      <div class="btns">
        <button data-play="${t.id}">Play</button>
        <button data-rem="${t.id}">Remove</button>
      </div>
    `;
    row.querySelector(`[data-play="${t.id}"]`).onclick = () => playTrack(t);
    row.querySelector(`[data-rem="${t.id}"]`).onclick = async () => {
      const r = await nui('music:removeFromPlaylist', { playlist_id: pid, track_id: t.id });
      if (r.ok) await refresh();
    };
    p.appendChild(row);
  });

  const add = document.createElement('div');
  add.className = 'item';
  add.innerHTML = `
    <div class="meta">
      <div class="t">Add from Library</div>
      <div class="s">Pick a saved track to add</div>
    </div>
    <div class="btns">
      <button id="addTrack">Add</button>
    </div>
  `;
  p.appendChild(add);

  add.querySelector('#addTrack').onclick = async () => {
    if (!data.tracks.length) return alert('No saved tracks. Save a URL first.');
    const pick = prompt('Enter track ID to add (from Library list).');
    const tid = Number(pick);
    if (!tid) return;
    const r = await nui('music:addToPlaylist', { playlist_id: pid, track_id: tid });
    if (r.ok) await refresh();
  };
}

function playUrl(title, url, artist=null, artwork_url=null){
  now = { title, url, artist, artwork_url, album: 'Saved URL', track_id: null };
  audio.src = url;
  audio.play().catch(()=>{});
  renderNow();
  nui('music:setPlaying', { playing: true });
  nui('music:saveLast', { track_id:null, url, title, artist, artwork_url, position:0 });
}

function playTrack(t){
  now = { title: t.title, url: t.url, artist: t.artist, artwork_url: t.artwork_url, album: 'Library', track_id: t.id };
  audio.src = t.url;
  audio.play().catch(()=>{});
  renderNow();
  nui('music:setPlaying', { playing: true });
  nui('music:saveLast', { track_id:t.id, url:t.url, title:t.title, artist:t.artist, artwork_url:t.artwork_url, position:0 });
}

async function refresh(){
  const d = await nui('music:getData', {});
  if (!d || !d.settings) return;

  data = d;
  audio.volume = Number(data.settings.volume ?? 0.65);
  $('vol').value = String(Math.round(audio.volume * 100));

  renderLibrary();
  renderPlaylists();
  renderNow();
}

function wire(){
  $('close').onclick = () => nui('music:close', {});
  $('btnBack').onclick = () => setTab('now');

  $('tabNow').onclick = () => setTab('now');
  $('tabLib').onclick = () => { setTab('lib'); renderLibrary(); };
  $('tabPl').onclick = () => { setTab('pl'); renderPlaylists(); };

  $('btnPlay').onclick = () => {
    if (!audio.src) return;
    if (audio.paused) audio.play().catch(()=>{});
    else audio.pause();
    renderNow();
    nui('music:setPlaying', { playing: !audio.paused });
  };
  $('btnPrev').onclick = () => { if (audio.src) audio.currentTime = 0; };
  $('btnNext').onclick = () => { if (audio.duration) audio.currentTime = Math.max(0, audio.duration - 0.3); };

  $('vol').addEventListener('input', () => {
    audio.volume = Number($('vol').value) / 100;
  });
  $('vol').addEventListener('change', () => {
    nui('music:setSettings', { volume: audio.volume });
  });

  $('seek').addEventListener('input', () => {
    if (!audio.duration) return;
    const pct = Number($('seek').value) / 100;
    audio.currentTime = pct * audio.duration;
  });

  audio.addEventListener('timeupdate', () => {
    $('tCur').textContent = fmtTime(audio.currentTime);
    $('tEnd').textContent = fmtTime(Math.max(0, (audio.duration || 0) - (audio.currentTime || 0)));
    if (audio.duration) $('seek').value = String((audio.currentTime / audio.duration) * 100);
    nui('music:saveLast', { ...now, position: audio.currentTime || 0, track_id: now.track_id || null });
  });

  audio.addEventListener('pause', () => nui('music:setPlaying', { playing: false }));
  audio.addEventListener('play',  () => nui('music:setPlaying', { playing: true }));
}

window.addEventListener('message', async (e) => {
  const msg = e.data || {};
  if (msg.action === 'music:show') {
    overlay = msg.data?.overlay || overlay;
    applyOverlay();
    setVisible(true);
    setTab('now');
    await refresh();
  }
  if (msg.action === 'music:hide') {
    setVisible(false);
  }
  if (msg.action === 'music:init') {
    data = msg.data || data;
    audio.volume = Number(data.settings?.volume ?? 0.65);
    $('vol').value = String(Math.round(audio.volume * 100));
    renderLibrary();
    renderPlaylists();

    // restore last track display (no autoplay)
    const s = data.settings || {};
    if (s.last_url) {
      now = {
        track_id: s.last_track_id,
        url: s.last_url,
        title: s.last_title,
        artist: s.last_artist,
        artwork_url: s.last_artwork_url,
        album: 'Last Played'
      };
      renderNow();
    }
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  wire();
  // Start hidden; overlay is opened by client
  setVisible(false);
});
