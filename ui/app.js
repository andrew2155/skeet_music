const player = document.getElementById('player');
const urlInput = document.getElementById('urlInput');
const addBtn = document.getElementById('addBtn');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const volumeSlider = document.getElementById('volumeSlider');
const playlistEl = document.getElementById('playlist');
const currentTrackEl = document.getElementById('currentTrack');
const carPlayOverlay = document.getElementById('carPlayOverlay');
const carPlayPlay = document.getElementById('carPlayPlay');
const carPlayPause = document.getElementById('carPlayPause');
const carPlayNext = document.getElementById('carPlayNext');

let playlist = JSON.parse(localStorage.getItem('musicPlaylist')) || [];
let currentIndex = -1;

// Render playlist
function renderPlaylist() {
    playlistEl.innerHTML = '';
    playlist.forEach((url, index) => {
        const li = document.createElement('li');
        li.textContent = url;
        li.addEventListener('click', () => playTrack(index));
        playlistEl.appendChild(li);
    });
}

// Play track
function playTrack(index) {
    if (index < 0 || index >= playlist.length) return;
    currentIndex = index;
    player.src = playlist[index];
    player.play();
    currentTrackEl.textContent = playlist[index];
    updateCarPlay();
}

// Update CarPlay display
function updateCarPlay() {
    if (carPlayOverlay.classList.contains('hidden')) return;
    currentTrackEl.textContent = playlist[currentIndex] || 'None';
}

// Event listeners
addBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (url) {
        playlist.push(url);
        localStorage.setItem('musicPlaylist', JSON.stringify(playlist));
        renderPlaylist();
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

volumeSlider.addEventListener('input', (e) => {
    player.volume = e.target.value;
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

// Init
renderPlaylist();
player.volume = 0.5;