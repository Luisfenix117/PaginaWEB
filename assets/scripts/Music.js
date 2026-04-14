/* === CONFIGURACIÓN DE AUDIO === */
const audio = new Audio();
const playerContainer = document.querySelector('.panel-right');

const playlist = [
    { name: "EPSYLON_RANGE", file: "assets/audio/EpsylonRange.mp3", vol: 0.08 },
    { name: "COLORS", file: "assets/audio/Colors.mp3", vol: 0.015 },
    { 
        name: "ROLL_CALL", 
        file: "assets/audio/RollCall.mp3", 
        vol: 0.10, 
        startTime: 74 
    }
];

let currentTrackIndex = 0;

function loadTrack(index) {
    const track = playlist[index];
    audio.src = track.file;
    
    // Aplicamos volumen y tiempo de inicio
    audio.volume = track.vol || 0.1;
    audio.currentTime = track.startTime || 0;
    
    audio.load();

    // Actualizamos el ACTIVITY_LOG (específico del panel derecho)
    const systemId = document.querySelector('.panel-right .system-id');
    if (systemId) {
        systemId.innerText = `ACTIVITY_LOG // ${track.name}`;
    }
}

function playAmbient() {
    if (!audio.src) loadTrack(currentTrackIndex);
    
    audio.play().then(() => {
        playerContainer.classList.add('is-playing');
    }).catch(err => console.warn("Interacción requerida"));
}

function pauseAmbient() {
    audio.pause();
    playerContainer.classList.remove('is-playing');
}

function nextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
    playAmbient();
}

// Eventos automáticos
audio.addEventListener('ended', nextTrack);
window.addEventListener('load', () => loadTrack(0));