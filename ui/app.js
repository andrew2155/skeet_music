const player = document.getElementById('player');
const urlInput = document.getElementById('urlInput');
const addBtn = document.getElementById('addBtn');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const volumeSlider = document.getElementById('volumeSlider');
const seekSlider = document.getElementById('seekSlider');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const trackTitleEl = document.getElementById('trackTitle');
const trackArtistEl = document.getElementById('trackArtist');
const albumArtEl = document.getElementById('albumArt');
const libraryEl = document.getElementById('library');
const currentTrackEl = document.getElementById('currentTrack');
const carPlayOverlay = document.getElementById('carPlayOverlay');
const carPlayPlay = document.getElementById('carPlayPlay');
const carPlayPause = document.getElementById('carPlayPause');
const carPlayNext = document.getElementById('carPlayNext');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

let playlist = JSON.parse(localStorage.getItem('musicPlaylist')) || [];
let currentIndex = -1;

// Render library (playlist)
function renderLibrary() {
    libraryEl.innerHTML = '';
    playlist.forEach((url, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fas fa-music"></i> ${url}`;
        li.addEventListener('click', () => playTrack(index));
        libraryEl.appendChild(li);
    });
}

// Play track
function playTrack(index) {
    if (index < 0 || index >= playlist.length) return;
    currentIndex = index;
    player.src = playlist[index];
    player.play();
    updateNowPlaying(playlist[index]);
    updateCarPlay();
}

// Update now playing info (placeholder art/artist)
function updateNowPlaying(url) {
    trackTitleEl.textContent = url;  // Use URL as title; extend for metadata later
    trackArtistEl.textContent = 'Unknown Artist';
    albumArtEl.src = 'assets/placeholder_art.png';  // Replace with real art fetch later
    currentTrackEl.textContent = url || 'None';
}

// Format time (mm:ss)
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// Update CarPlay display
function updateCarPlay() {
    if (carPlayOverlay.classList.contains('hidden')) return;
    currentTrackEl.textContent = playlist[currentIndex] || 'None';
}

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tabContents.forEach(content => content.classList.add('hidden'));
        document.getElementById(`${btn.dataset.tab}Tab`).classList.remove('hidden');
    });
});

// Event listeners
addBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (url) {
        playlist.push(url);
        localStorage.setItem('musicPlaylist', JSON.stringify(playlist));
        renderLibrary();
        urlInput.value = '';
    }
});

playBtn.addEventListener('click', () => {
    if (currentIndex === -1 && playlist.length > 0) playTrack(0);
    else player.play();
});

pauseBtn.addEventListener('click', () => player.pause());

stopBtn.addEventListener('click', () => {
    player.pause();
    player.currentTime = 0;
});

prevBtn.addEventListener('click', () => playTrack(currentIndex - 1));
nextBtn.addEventListener('click', () => playTrack(currentIndex + 1));

volumeSlider.addEventListener('input', (e) => player.volume = e.target.value);

seekSlider.addEventListener('input', (e) => {
    player.currentTime = (e.target.value / 100) * player.duration;
});

// Player updates
player.addEventListener('timeupdate', () => {
    seekSlider.value = (player.currentTime / player.duration) * 100 || 0;
    currentTimeEl.textContent = formatTime(player.currentTime);
});

player.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(player.duration);
});

carPlayPlay.addEventListener('click', () => player.play());
carPlayPause.addEventListener('click', () => player.pause());
carPlayNext.addEventListener('click', () => playTrack(currentIndex + 1));

// NUI messages (for CarPlay toggle)
window.addEventListener('message', (event) => {
    const { action, show } = event.data;
    if (action === 'toggleCarPlay') {
        carPlayOverlay.classList.toggle('hidden', !show);
        updateCarPlay();
    }
});

// Detect iframe (phone app) vs global NUI
if (window.top !== window.self) {
    document.querySelector('.container').style.display = 'block';
    carPlayOverlay.style.display = 'none';  // Hide overlay in phone
} else {
    document.querySelector('.container').style.display = 'none';  // Hide app UI globally
}

// Init
renderLibrary();
player.volume = 0.5;