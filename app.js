const SUPPORTED_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
];
const MAX_DURATION_SECONDS = 120;
const EXTENSION_BY_MIME = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/ogg': '.ogg',
  'video/quicktime': '.mov',
};

const dropZone = document.getElementById('dropZone');
const videoInput = document.getElementById('videoInput');
const convertButton = document.getElementById('convertButton');
const statusElement = document.getElementById('status');
const gifPreview = document.getElementById('gifPreview');
const downloadLink = document.getElementById('downloadLink');
const placeholderText = document.getElementById('placeholderText');
const yearElement = document.getElementById('year');

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

let selectedFile = null;
let previewUrl = null;
let durationCache = 0;

const ffmpegModule = globalThis.FFmpeg;

if (!ffmpegModule) {
  setStatus(
    'No pudimos cargar el motor de conversión. Verifica tu conexión e intenta nuevamente.',
    'error',
  );
  convertButton.disabled = true;
  throw new Error('FFmpeg module not available');
}

const { createFFmpeg, fetchFile } = ffmpegModule;
const ffmpeg = createFFmpeg({
  log: false,
  corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.4/dist/ffmpeg-core.js',
});

ffmpeg.setProgress(({ ratio }) => {
  if (!selectedFile) return;
  const percent = Math.min(100, Math.round(ratio * 100));
  if (percent >= 100) {
    setStatus('Finalizando conversión…', 'progress');
  } else {
    setStatus(`Procesando fotogramas ${percent}%`, 'progress');
  }
});

function setStatus(message, state = 'idle') {
  if (!statusElement) return;
  statusElement.textContent = message;
  statusElement.dataset.state = state;
}

function clearPreview() {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }
  gifPreview.hidden = true;
  gifPreview.removeAttribute('src');
  downloadLink.hidden = true;
  placeholderText.hidden = false;
}

async function ensureFFmpegLoaded() {
  if (!ffmpeg.isLoaded()) {
    setStatus('Cargando motor de conversión…', 'progress');
    await ffmpeg.load();
  }
}

function formatDuration(seconds) {
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const secs = (total % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function validateType(file) {
  if (!SUPPORTED_TYPES.includes(file.type)) {
    throw new Error('El formato seleccionado no es compatible. Usa MP4, WEBM, OGG o MOV.');
  }
}

function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      if (!video.duration || Number.isNaN(video.duration)) {
        reject(new Error('No pudimos leer la duración del video. Prueba con otro archivo.'));
        return;
      }
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('El video no pudo analizarse. Asegúrate de que el archivo no esté dañado.'));
    };
  });
}

function resolveInputName(file) {
  const mimeExtension = EXTENSION_BY_MIME[file.type];
  if (mimeExtension) {
    return `input-${Date.now()}${mimeExtension}`;
  }

  const nameMatch = file.name && file.name.match(/(\.[a-zA-Z0-9]{2,5})$/);
  const fallbackExtension = nameMatch ? nameMatch[1].toLowerCase() : '.mp4';
  return `input-${Date.now()}${fallbackExtension}`;
}

async function handleFileSelection(file) {
  if (!file) return;

  clearPreview();
  setStatus('Validando archivo…', 'progress');
  convertButton.disabled = true;

  try {
    validateType(file);
    const duration = await getVideoDuration(file);
    if (duration > MAX_DURATION_SECONDS) {
      throw new Error('El video supera los 120 segundos permitidos. Recórtalo y vuelve a intentarlo.');
    }

    selectedFile = file;
    durationCache = duration;
    const sizeMb = (file.size / 1024 / 1024).toFixed(1);
    setStatus(
      `Listo: ${file.name} · ${formatDuration(duration)} · ${sizeMb} MB`,
      'success',
    );
    convertButton.disabled = false;
  } catch (error) {
    selectedFile = null;
    durationCache = 0;
    setStatus(error.message, 'error');
  }
}

async function convertToGif() {
  if (!selectedFile) {
    setStatus('Selecciona un video antes de convertir.', 'error');
    return;
  }

  convertButton.disabled = true;
  setStatus('Preparando conversión…', 'progress');

  let inputName = '';
  const outputName = 'output.gif';

  try {
    await ensureFFmpegLoaded();

    inputName = resolveInputName(selectedFile);

    ffmpeg.FS('writeFile', inputName, await fetchFile(selectedFile));

    await ffmpeg.run(
      '-i',
      inputName,
      '-vf',
      'fps=15,scale=480:-1:flags=lanczos',
      '-t',
      String(MAX_DURATION_SECONDS),
      '-y',
      outputName,
    );

    const data = ffmpeg.FS('readFile', outputName);
    const blob = new Blob([data.buffer], { type: 'image/gif' });

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    previewUrl = URL.createObjectURL(blob);
    gifPreview.src = previewUrl;
    gifPreview.hidden = false;
    placeholderText.hidden = true;

    const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
    downloadLink.href = previewUrl;
    downloadLink.download = `${baseName || 'neongif'}-${formatDuration(durationCache).replace(':', '')}.gif`;
    downloadLink.hidden = false;

    setStatus('Conversión completada. ¡Descarga tu GIF neon!', 'success');
  } catch (error) {
    console.error(error);
    setStatus(`Ocurrió un problema durante la conversión: ${error.message}`, 'error');
  } finally {
    try {
      ffmpeg.FS('unlink', outputName);
    } catch (err) {
      // ignore cleanup errors
    }

    try {
      if (inputName) {
        ffmpeg.FS('unlink', inputName);
      }
    } catch (err) {
      // ignore cleanup errors
    }

    convertButton.disabled = !selectedFile;
  }
}

function preventDefaults(event) {
  event.preventDefault();
  event.stopPropagation();
}

dropZone.addEventListener('dragenter', (event) => {
  preventDefaults(event);
  dropZone.classList.add('is-dragover');
});

dropZone.addEventListener('dragover', (event) => {
  preventDefaults(event);
  dropZone.classList.add('is-dragover');
});

dropZone.addEventListener('dragleave', (event) => {
  preventDefaults(event);
  dropZone.classList.remove('is-dragover');
});

dropZone.addEventListener('drop', (event) => {
  preventDefaults(event);
  dropZone.classList.remove('is-dragover');
  const [file] = event.dataTransfer.files;
  if (file) {
    handleFileSelection(file);
  }
});

dropZone.addEventListener('click', () => {
  videoInput.click();
});

dropZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    videoInput.click();
  }
});

videoInput.addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (file) {
    handleFileSelection(file);
  }
  event.target.value = '';
});

convertButton.addEventListener('click', () => {
  convertToGif();
});

window.addEventListener('beforeunload', () => {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }
});
