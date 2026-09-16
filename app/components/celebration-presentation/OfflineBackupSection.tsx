"use client";

import { useEffect, useState } from "react";

type BackupPresentation = {
  publicId: string;
  personName: string;
  birthDate: string | null;
  deathDate: string | null;
  featuredPhotoUrl: string | null;
};

type BackupItem = {
  id: number;
  itemType: "photo" | "video";
  sourceUrl: string;
  storagePath?: string | null;
  caption: string;
  attribution: string;
  sortOrder: number;
  durationSeconds?: number | null;
};

type BackupMusic = {
  id: number;
  sourceType: "uploaded" | "library";
  sourceUrl: string;
  storagePath?: string | null;
  title?: string | null;
  artist?: string | null;
  sortOrder: number;
};

type BackupManifest = {
  presentation: BackupPresentation;
  items: BackupItem[];
  music: BackupMusic[];
};

type OfflineBackupSectionProps = {
  publicId: string;
  personName: string;
  paymentStatus: string;
  status: string;
};

type OfflineItem = {
  type: "photo" | "video";
  file: string;
  caption: string;
  attribution: string;
};

type OfflineMusic = {
  file: string;
  title: string;
  artist: string;
};

type OfflinePlayerManifest = {
  personName: string;
  birthDate: string | null;
  deathDate: string | null;
  featuredPhotoFile: string | null;
  items: OfflineItem[];
  music: OfflineMusic[];
};

function safeFolderName(value: string) {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "Celebration of Life";
}

function extensionFromPath(
  value: string | null | undefined,
  allowed: Set<string>,
  fallback: string
) {
  const clean = String(value || "")
    .split("?")[0]
    .split("#")[0];

  const match = clean.match(/\.([a-zA-Z0-9]{2,5})$/);
  const extension = match?.[1]?.toLowerCase() || "";

  return allowed.has(extension) ? extension : fallback;
}

const PHOTO_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "avif",
]);

const MUSIC_EXTENSIONS = new Set([
  "mp3",
  "m4a",
  "aac",
  "wav",
  "ogg",
]);

function jsonForInlineScript(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function createOfflinePlayerHtml(manifest: OfflinePlayerManifest) {
  const data = jsonForInlineScript(manifest);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Celebration of Life — Offline Backup</title>
<style>
  :root { color-scheme: dark; font-family: Arial, Helvetica, sans-serif; }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 100%; height: 100%; background: #06090d; color: #fff; }
  body { overflow: hidden; }
  button, input { font: inherit; }
  #app { position: relative; width: 100vw; height: 100vh; overflow: hidden; background: #070b10; }
  .screen { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 36px; text-align: center; }
  .start, .closing { background: radial-gradient(circle at center, #33453e 0%, #16231f 42%, #070b10 100%); }
  .card { position: relative; z-index: 2; width: min(900px, 94vw); }
  .eyebrow { text-transform: uppercase; letter-spacing: .22em; color: #f2d99d; font-size: clamp(17px, 2vw, 24px); }
  .portrait { width: min(260px, 42vw); height: min(330px, 52vw); object-fit: cover; border: 2px solid #f2d99d; border-radius: 18px; box-shadow: 0 22px 70px rgba(0,0,0,.55); margin: 24px auto 0; display: block; }
  h1 { font-family: Georgia, 'Times New Roman', serif; font-size: clamp(38px, 7vw, 76px); margin: 22px 0 0; line-height: 1.02; }
  .dates { margin-top: 18px; color: #e5e7eb; font-size: clamp(20px, 2.5vw, 30px); }
  .tagline { margin-top: 22px; font-family: Georgia, 'Times New Roman', serif; font-style: italic; color: #f6e4b5; font-size: clamp(20px, 2.4vw, 30px); }
  .primary { margin-top: 30px; border: 0; border-radius: 999px; background: #f0b84a; color: #16130c; padding: 15px 28px; font-weight: 800; cursor: pointer; }
  .media-screen { position: absolute; inset: 0 0 70px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #000; }
  .photo-bg { position: absolute; inset: -5%; width: 110%; height: 110%; object-fit: cover; filter: blur(26px); opacity: .25; transform: scale(1.05); }
  .shade { position: absolute; inset: 0; background: rgba(0,0,0,.56); }
  .photo-main { position: relative; z-index: 2; max-width: 100%; max-height: 100%; object-fit: contain; }
  video { width: 100%; height: 100%; object-fit: contain; background: #000; }
  .caption { position: absolute; z-index: 4; left: 0; right: 0; bottom: 0; padding: 80px 26px 28px; background: linear-gradient(transparent, rgba(0,0,0,.9)); text-align: center; pointer-events: none; }
  .caption-text { font-family: Georgia, 'Times New Roman', serif; font-size: clamp(20px, 3vw, 34px); text-shadow: 0 2px 4px #000; }
  .attribution { margin-top: 8px; color: #e5e7eb; font-size: 18px; }
  .controls { position: absolute; z-index: 10; left: 0; right: 0; bottom: 0; min-height: 70px; background: rgba(0,0,0,.78); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; gap: 10px; padding: 10px 14px; flex-wrap: wrap; }
  .controls button { border: 1px solid rgba(255,255,255,.38); background: transparent; color: white; border-radius: 999px; padding: 9px 15px; cursor: pointer; font-weight: 700; }
  .controls button:hover { background: rgba(255,255,255,.12); }
  .volume { display: flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,.38); border-radius: 999px; padding: 7px 12px; }
  .volume input { width: 110px; }
  .counter { color: #d1d5db; font-size: 14px; min-width: 70px; }
  .hidden { display: none !important; }
  .empty { max-width: 700px; padding: 30px; font-size: 22px; }
  @media (max-width: 720px) { .media-screen { inset-bottom: 116px; } .controls { min-height: 116px; } }
</style>
</head>
<body>
<div id="app">
  <section id="startScreen" class="screen start"></section>
  <section id="mediaScreen" class="media-screen hidden"></section>
  <section id="closingScreen" class="screen closing hidden"></section>
  <div id="controls" class="controls hidden">
    <button id="pauseButton" type="button">Pause</button>
    <button id="restartButton" type="button">Restart</button>
    <button id="loopButton" type="button">Loop: On</button>
    <div class="volume">
      <button id="muteButton" type="button">Mute</button>
      <input id="volumeSlider" type="range" min="0" max="1" step="0.05" value="0.7" aria-label="Presentation volume" />
      <span id="volumeValue">70%</span>
    </div>
    <button id="fullScreenButton" type="button">Full Screen</button>
    <span id="counter" class="counter"></span>
  </div>
  <audio id="musicPlayer" preload="auto"></audio>
</div>
<script>
const data = ${data};
const PHOTO_MS = 7000;
const CLOSING_MS = 8000;
let currentIndex = 0;
let musicIndex = 0;
let started = false;
let paused = false;
let loop = true;
let muted = false;
let volume = 0.7;
let photoTimer = null;
let closingTimer = null;
let currentVideo = null;

const startScreen = document.getElementById('startScreen');
const mediaScreen = document.getElementById('mediaScreen');
const closingScreen = document.getElementById('closingScreen');
const controls = document.getElementById('controls');
const musicPlayer = document.getElementById('musicPlayer');
const pauseButton = document.getElementById('pauseButton');
const loopButton = document.getElementById('loopButton');
const muteButton = document.getElementById('muteButton');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const counter = document.getElementById('counter');

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}
function formatDate(value) {
  if (!value) return '';
  const parts = value.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}
function dateLine() {
  return [formatDate(data.birthDate), formatDate(data.deathDate)].filter(Boolean).join(' — ');
}
function portraitHtml() {
  return data.featuredPhotoFile ? '<img class="portrait" src="' + encodeURI(data.featuredPhotoFile) + '" alt="' + escapeHtml(data.personName) + '">' : '';
}
function startMarkup(closing) {
  return '<div class="card">' +
    '<div class="eyebrow">' + (closing ? 'In Loving Memory' : 'Celebration of Life') + '</div>' +
    portraitHtml() +
    '<h1>' + escapeHtml(data.personName) + '</h1>' +
    (dateLine() ? '<div class="dates">' + escapeHtml(dateLine()) + '</div>' : '') +
    (closing ? '<div class="tagline">Where Life\\'s Stories Are Told.</div>' : '') +
    '<button class="primary" id="' + (closing ? 'replayOffline' : 'beginOffline') + '" type="button">' + (closing ? 'Replay Presentation' : 'Begin Presentation') + '</button>' +
    '</div>';
}
function renderStart() {
  startScreen.innerHTML = data.items.length ? startMarkup(false) : '<div class="empty">This offline backup does not contain any presentation photos or videos.</div>';
  startScreen.classList.remove('hidden');
  mediaScreen.classList.add('hidden');
  closingScreen.classList.add('hidden');
  controls.classList.add('hidden');
  const button = document.getElementById('beginOffline');
  if (button) button.addEventListener('click', begin);
}
function clearTimers() {
  if (photoTimer) clearTimeout(photoTimer);
  if (closingTimer) clearTimeout(closingTimer);
  photoTimer = null;
  closingTimer = null;
}
function configureMusic() {
  if (!data.music.length) return;
  const track = data.music[musicIndex % data.music.length];
  const expected = encodeURI(track.file);
  if (!musicPlayer.src.endsWith(expected)) musicPlayer.src = track.file;
  musicPlayer.volume = volume * 0.35;
  musicPlayer.muted = muted;
}
function playMusicIfAppropriate() {
  configureMusic();
  const item = data.items[currentIndex];
  if (started && !paused && item && item.type === 'photo' && data.music.length) {
    musicPlayer.play().catch(() => {});
  } else {
    musicPlayer.pause();
  }
}
function renderCurrent() {
  clearTimers();
  if (!started || !data.items.length) return;
  const item = data.items[currentIndex];
  startScreen.classList.add('hidden');
  closingScreen.classList.add('hidden');
  mediaScreen.classList.remove('hidden');
  controls.classList.remove('hidden');
  currentVideo = null;
  counter.textContent = (currentIndex + 1) + ' of ' + data.items.length;

  const caption = item.caption ? '<div class="caption"><div class="caption-text">' + escapeHtml(item.caption) + '</div>' + (item.attribution ? '<div class="attribution">' + escapeHtml(item.attribution) + '</div>' : '') + '</div>' : '';

  if (item.type === 'photo') {
    mediaScreen.innerHTML = '<img class="photo-bg" src="' + encodeURI(item.file) + '" alt=""><div class="shade"></div><img class="photo-main" src="' + encodeURI(item.file) + '" alt="' + escapeHtml(item.caption || data.personName) + '">' + caption;
    playMusicIfAppropriate();
    if (!paused) photoTimer = setTimeout(advance, PHOTO_MS);
    return;
  }

  musicPlayer.pause();
  mediaScreen.innerHTML = '<video id="offlineVideo" src="' + encodeURI(item.file) + '" playsinline></video>' + caption;
  currentVideo = document.getElementById('offlineVideo');
  currentVideo.volume = volume;
  currentVideo.muted = muted;
  currentVideo.addEventListener('ended', advance, { once: true });
  if (!paused) currentVideo.play().catch(() => {});
}
function advance() {
  if (currentIndex < data.items.length - 1) {
    currentIndex += 1;
    renderCurrent();
    return;
  }
  showClosing();
}
function showClosing() {
  clearTimers();
  currentVideo = null;
  mediaScreen.classList.add('hidden');
  controls.classList.add('hidden');
  closingScreen.innerHTML = startMarkup(true) + (loop ? '<div style="position:absolute;bottom:24px;color:#d1d5db">Loop is on. The presentation will restart automatically.</div>' : '');
  closingScreen.classList.remove('hidden');
  const replay = document.getElementById('replayOffline');
  if (replay) replay.addEventListener('click', restart);
  if (data.music.length && loop && !paused) {
    musicPlayer.play().catch(() => {});
  } else {
    musicPlayer.pause();
  }
  if (loop) closingTimer = setTimeout(() => { currentIndex = 0; paused = false; renderCurrent(); }, CLOSING_MS);
}
function begin() {
  started = true;
  paused = false;
  currentIndex = 0;
  musicIndex = 0;
  musicPlayer.currentTime = 0;
  renderCurrent();
}
function restart() {
  clearTimers();
  if (currentVideo) { currentVideo.pause(); currentVideo.currentTime = 0; }
  musicPlayer.pause();
  musicPlayer.currentTime = 0;
  currentIndex = 0;
  musicIndex = 0;
  started = false;
  paused = false;
  pauseButton.textContent = 'Pause';
  renderStart();
}
function togglePause() {
  paused = !paused;
  pauseButton.textContent = paused ? 'Resume' : 'Pause';
  if (currentVideo) {
    if (paused) currentVideo.pause(); else currentVideo.play().catch(() => {});
  } else {
    if (paused) musicPlayer.pause(); else renderCurrent();
  }
}
function applyVolume() {
  musicPlayer.volume = volume * 0.35;
  musicPlayer.muted = muted;
  if (currentVideo) { currentVideo.volume = volume; currentVideo.muted = muted; }
  volumeValue.textContent = muted ? '0%' : Math.round(volume * 100) + '%';
  muteButton.textContent = muted ? 'Unmute' : 'Mute';
}
musicPlayer.addEventListener('ended', () => {
  if (!data.music.length) return;
  musicIndex = (musicIndex + 1) % data.music.length;
  musicPlayer.src = data.music[musicIndex].file;
  musicPlayer.currentTime = 0;
  playMusicIfAppropriate();
});
pauseButton.addEventListener('click', togglePause);
document.getElementById('restartButton').addEventListener('click', restart);
loopButton.addEventListener('click', () => { loop = !loop; loopButton.textContent = 'Loop: ' + (loop ? 'On' : 'Off'); });
muteButton.addEventListener('click', () => { muted = !muted; applyVolume(); });
volumeSlider.addEventListener('input', event => { volume = Number(event.target.value); if (volume > 0) muted = false; applyVolume(); });
document.getElementById('fullScreenButton').addEventListener('click', () => document.documentElement.requestFullscreen?.().catch(() => {}));
applyVolume();
renderStart();
</script>
</body>
</html>`;
}

function createReadme(
  personName: string,
  launcherFileName: string,
  supportFolderName: string
) {
  return `MYEMEMORIAL — CELEBRATION OF LIFE OFFLINE BACKUP

Presentation: ${personName}

IMPORTANT — COMPLETE THIS TEST BEFORE THE EVENT

1. Keep the presentation starter file and the support-files folder together in the same location.
2. Turn off Wi-Fi before testing.
3. Double-click ${launcherFileName}.
4. Do not open, delete, rename, or move the folder named "${supportFolderName}". The presentation uses those files automatically.
5. Play the entire presentation from beginning to end.
6. Confirm every photo, video, caption, and music track works and that the volume is correct.
7. Use MyEMemorial Step 3 to copy a second complete backup to a USB thumb drive.
8. Bring both the tested event laptop and the USB thumb drive to the event.

The offline backup is independent of the hosted MyEMemorial presentation. It does not require internet access once all files have been saved successfully.

If you make changes to the online presentation after creating this backup, create a NEW offline backup and test it again before the event.
`;
}

async function writeTextFile(directory: any, name: string, content: string) {
  const fileHandle = await directory.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

async function saveRemoteFile(directory: any, name: string, sourceUrl: string) {
  const response = await fetch(sourceUrl, {
    method: "GET",
    mode: "cors",
    credentials: "omit",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`A backup file could not be downloaded (${response.status}).`);
  }

  if (!response.body) {
    throw new Error("This browser could not stream a backup file to disk.");
  }

  const fileHandle = await directory.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();

  try {
    await response.body.pipeTo(writable);
  } catch (error) {
    try {
      await writable.abort();
    } catch {
      // Nothing else to do.
    }
    throw error;
  }
}

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export default function OfflineBackupSection({
  publicId,
  personName,
  paymentStatus,
  status,
}: OfflineBackupSectionProps) {
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [completed, setCompleted] = useState(false);
  const [supported, setSupported] = useState(true);
  const [backupLocationHandle, setBackupLocationHandle] =
    useState<any | null>(null);
  const [copyingToUsb, setCopyingToUsb] = useState(false);

  useEffect(() => {
    setSupported(
      typeof (window as any).showDirectoryPicker === "function"
    );
  }, []);

  const safePersonName = safeFolderName(personName);
  const launcherFileName =
    `START CELEBRATION OF LIFE - ${safePersonName}.html`;
  const supportFolderName =
    `MyEMemorial Presentation Files - ${safePersonName} - DO NOT DELETE`;
  const usbFolderName =
    `Celebration of Life - ${safePersonName}`;

  const eligible = paymentStatus === "paid" && status === "active";

  if (!eligible) {
    return null;
  }

  async function getReadyManifest(): Promise<BackupManifest> {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const response = await fetch(
        `/api/celebration-presentations/${encodeURIComponent(
          publicId
        )}/offline-backup`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "The offline backup could not be prepared."
        );
      }

      if (result?.status === "ready" && result?.manifest) {
        return result.manifest as BackupManifest;
      }

      setMessage(
        result?.preparingVideos
          ? `Preparing ${result.preparingVideos} video${
              result.preparingVideos === 1 ? "" : "s"
            } for backup...`
          : "Preparing your presentation files..."
      );

      await delay(2500);
    }

    throw new Error(
      "The videos are taking longer than expected to prepare. Please try the backup again in a few minutes."
    );
  }

  async function createBackup() {
    setErrorMessage("");
    setMessage("");
    setCompleted(false);

    const picker = (window as any).showDirectoryPicker;

    if (typeof picker !== "function") {
      setErrorMessage(
        "Offline backup requires Google Chrome or Microsoft Edge on a laptop or desktop computer. Open your private presentation link there and try again."
      );
      return;
    }

    let saveLocation: any;

    try {
      saveLocation = await picker.call(window, {
        id: `celebration-backup-${publicId.slice(0, 8)}`,
        mode: "readwrite",
        startIn: "desktop",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error("CELEBRATION OFFLINE BACKUP FOLDER PICKER ERROR:", error);
      setErrorMessage(
        error instanceof Error
          ? `The save location could not be selected: ${error.message}`
          : "The save location could not be selected."
      );
      return;
    }

    try {
      setWorking(true);
      setMessage("Preparing the offline presentation...");

      const supportDirectory = await saveLocation.getDirectoryHandle(
        supportFolderName,
        { create: true }
      );
      const mediaDirectory = await supportDirectory.getDirectoryHandle(
        "media",
        { create: true }
      );

      const prepareResponse = await fetch(
        `/api/celebration-presentations/${encodeURIComponent(
          publicId
        )}/offline-backup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "prepare" }),
        }
      );

      const prepareResult = await prepareResponse.json();

      if (!prepareResponse.ok) {
        throw new Error(
          prepareResult?.error || "The offline backup could not be prepared."
        );
      }

      const manifest = await getReadyManifest();
      const offlineItems: OfflineItem[] = [];
      const offlineMusic: OfflineMusic[] = [];
      const photoFilesByUrl = new Map<string, string>();

      const featuredPhotoUrl = manifest.presentation.featuredPhotoUrl;
      const featuredPhotoIsTimelinePhoto = Boolean(
        featuredPhotoUrl &&
          manifest.items.some(
            (item) =>
              item.itemType === "photo" &&
              item.sourceUrl === featuredPhotoUrl
          )
      );
      const totalFiles =
        manifest.items.length +
        manifest.music.length +
        (featuredPhotoUrl && !featuredPhotoIsTimelinePhoto ? 1 : 0);
      let savedFiles = 0;

      for (const [index, item] of manifest.items.entries()) {
        if (item.itemType === "photo") {
          const extension = extensionFromPath(
            item.storagePath || item.sourceUrl,
            PHOTO_EXTENSIONS,
            "jpg"
          );
          const name = `photo-${String(index + 1).padStart(3, "0")}.${extension}`;
          setMessage(
            `Saving presentation files... ${savedFiles + 1} of ${totalFiles}`
          );
          await saveRemoteFile(mediaDirectory, name, item.sourceUrl);
          savedFiles += 1;

          const file = `${supportFolderName}/media/${name}`;
          photoFilesByUrl.set(item.sourceUrl, file);
          offlineItems.push({
            type: "photo",
            file,
            caption: item.caption || "",
            attribution: item.attribution || "",
          });
          continue;
        }

        const name = `video-${String(index + 1).padStart(3, "0")}.mp4`;
        setMessage(
          `Saving presentation files... ${savedFiles + 1} of ${totalFiles}`
        );
        await saveRemoteFile(mediaDirectory, name, item.sourceUrl);
        savedFiles += 1;
        offlineItems.push({
          type: "video",
          file: `${supportFolderName}/media/${name}`,
          caption: item.caption || "",
          attribution: item.attribution || "",
        });
      }

      for (const [index, track] of manifest.music.entries()) {
        const extension = extensionFromPath(
          track.storagePath || track.sourceUrl,
          MUSIC_EXTENSIONS,
          "mp3"
        );
        const name = `music-${String(index + 1).padStart(2, "0")}.${extension}`;
        setMessage(
          `Saving presentation files... ${savedFiles + 1} of ${totalFiles}`
        );
        await saveRemoteFile(mediaDirectory, name, track.sourceUrl);
        savedFiles += 1;
        offlineMusic.push({
          file: `${supportFolderName}/media/${name}`,
          title: track.title || `Music ${index + 1}`,
          artist: track.artist || "",
        });
      }

      let featuredPhotoFile: string | null = null;

      if (featuredPhotoUrl) {
        const existing = photoFilesByUrl.get(featuredPhotoUrl);

        if (existing) {
          featuredPhotoFile = existing;
        } else {
          const extension = extensionFromPath(
            featuredPhotoUrl,
            PHOTO_EXTENSIONS,
            "jpg"
          );
          const name = `featured-photo.${extension}`;
          setMessage(
            `Saving presentation files... ${savedFiles + 1} of ${totalFiles}`
          );
          await saveRemoteFile(mediaDirectory, name, featuredPhotoUrl);
          savedFiles += 1;
          featuredPhotoFile = `${supportFolderName}/media/${name}`;
        }
      }

      const offlineManifest: OfflinePlayerManifest = {
        personName: manifest.presentation.personName,
        birthDate: manifest.presentation.birthDate,
        deathDate: manifest.presentation.deathDate,
        featuredPhotoFile,
        items: offlineItems,
        music: offlineMusic,
      };

      await writeTextFile(
        saveLocation,
        launcherFileName,
        createOfflinePlayerHtml(offlineManifest)
      );

      await writeTextFile(
        supportDirectory,
        "READ ME - TEST BEFORE EVENT.txt",
        createReadme(
          manifest.presentation.personName,
          launcherFileName,
          supportFolderName
        )
      );

      await writeTextFile(
        supportDirectory,
        "backup-manifest.json",
        JSON.stringify(
          {
            createdAt: new Date().toISOString(),
            publicId,
            launcherFileName,
            supportFolderName,
            presentation: offlineManifest,
          },
          null,
          2
        )
      );

      await fetch(
        `/api/celebration-presentations/${encodeURIComponent(
          publicId
        )}/offline-backup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "complete" }),
        }
      ).catch(() => undefined);

      setBackupLocationHandle(saveLocation);
      setCompleted(true);
      setMessage(
        `Offline presentation saved in “${saveLocation.name}”. Look for “${launcherFileName}” and the support folder beside it. Next, turn off Wi-Fi and follow Step 2.`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The offline backup could not be created."
      );
      setMessage("");
    } finally {
      setWorking(false);
    }
  }

  async function selectSavedPresentationLocation() {
    const picker = (window as any).showDirectoryPicker;

    if (typeof picker !== "function") {
      throw new Error(
        "Selecting the saved presentation requires Google Chrome or Microsoft Edge on a laptop or desktop computer."
      );
    }

    const directory = await picker.call(window, {
      id: "celebration-saved-presentation-location",
      mode: "read",
      startIn: "desktop",
    });

    await directory.getFileHandle(launcherFileName);
    await directory.getDirectoryHandle(supportFolderName);

    setBackupLocationHandle(directory);
    return directory;
  }

  async function copyDirectoryContents(
    sourceDirectory: any,
    destinationDirectory: any
  ) {
    for await (const [name, handle] of sourceDirectory.entries()) {
      if (handle.kind === "directory") {
        const destinationSubdirectory =
          await destinationDirectory.getDirectoryHandle(name, {
            create: true,
          });
        await copyDirectoryContents(
          handle,
          destinationSubdirectory
        );
        continue;
      }

      const sourceFile = await handle.getFile();
      const destinationFile =
        await destinationDirectory.getFileHandle(name, {
          create: true,
        });
      const writable = await destinationFile.createWritable();

      try {
        await writable.write(sourceFile);
      } finally {
        await writable.close();
      }
    }
  }

  async function copyFile(
    sourceDirectory: any,
    sourceName: string,
    destinationDirectory: any,
    destinationName = sourceName
  ) {
    const sourceHandle = await sourceDirectory.getFileHandle(sourceName);
    const sourceFile = await sourceHandle.getFile();
    const destinationHandle = await destinationDirectory.getFileHandle(
      destinationName,
      { create: true }
    );
    const writable = await destinationHandle.createWritable();

    try {
      await writable.write(sourceFile);
    } finally {
      await writable.close();
    }
  }

  async function backupToThumbDrive() {
    setErrorMessage("");
    setMessage("");

    let sourceLocation = backupLocationHandle;

    if (!sourceLocation) {
      try {
        setMessage(
          "Select Desktop — or the folder where you saved the offline presentation — then click Select Folder."
        );
        sourceLocation = await selectSavedPresentationLocation();
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setMessage("");
          return;
        }

        setErrorMessage(
          `Select the location that contains both “${launcherFileName}” and “${supportFolderName}”, then try again.`
        );
        setMessage("");
        return;
      }
    }

    const picker = (window as any).showDirectoryPicker;

    if (typeof picker !== "function") {
      setErrorMessage(
        "USB backup requires Google Chrome or Microsoft Edge on a laptop or desktop computer."
      );
      return;
    }

    let usbDirectory: any;

    try {
      usbDirectory = await picker.call(window, {
        id: "celebration-usb-backup",
        mode: "readwrite",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? `The thumb drive could not be selected: ${error.message}`
          : "The thumb drive could not be selected."
      );
      return;
    }

    try {
      setCopyingToUsb(true);
      setMessage(
        "Copying the complete presentation to the thumb drive. Keep the drive connected until this finishes..."
      );

      const destination = await usbDirectory.getDirectoryHandle(
        usbFolderName,
        { create: true }
      );

      await copyFile(
        sourceLocation,
        launcherFileName,
        destination
      );

      const sourceSupportDirectory =
        await sourceLocation.getDirectoryHandle(supportFolderName);
      const destinationSupportDirectory =
        await destination.getDirectoryHandle(supportFolderName, {
          create: true,
        });

      await copyDirectoryContents(
        sourceSupportDirectory,
        destinationSupportDirectory
      );

      setMessage(
        `USB backup complete. Open “${usbFolderName}” on the thumb drive and double-click “${launcherFileName}” to start the backup presentation.`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `The USB backup could not be completed: ${error.message}`
          : "The USB backup could not be completed."
      );
      setMessage("");
    } finally {
      setCopyingToUsb(false);
    }
  }

  return (
    <section className="mt-8 rounded-3xl border border-[#cdbf9f] bg-[#fffdf8]/95 p-6 shadow-sm sm:p-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-base font-bold uppercase tracking-[0.16em] text-[#8d6c3f]">
          Event Readiness
        </p>
        <h2 className="mt-2 font-serif text-3xl font-bold text-[#173a31]">
          Create an Offline Backup
        </h2>
        <p className="mt-3 text-lg leading-8 text-[#344f43]">
          Do not rely on venue Wi-Fi. Save the offline presentation directly to the event laptop&apos;s Desktop, test it with Wi-Fi turned off, then make a second complete copy on a USB thumb drive.
        </p>
      </div>

      <div className="mx-auto mt-6 grid max-w-4xl gap-4 sm:grid-cols-3">
        <div className="flex flex-col rounded-2xl bg-[#f8f4e9] p-5 text-center">
          <p className="text-lg font-bold text-[#173a31]">
            1. Save to Desktop
          </p>
          <div className="mt-2 flex-1 text-left text-base leading-7 text-stone-700">
            <p>
              Click <span className="font-semibold">Create Offline Backup</span>.
            </p>
            <p className="mt-2">
              When the folder window opens, click <span className="font-bold text-stone-900">Desktop</span> on the left, then click <span className="font-bold text-stone-900">Select Folder</span>.
            </p>
            <p className="mt-2">
              MyEMemorial will place one obvious <span className="font-semibold">START CELEBRATION OF LIFE</span> file on the Desktop and a support-files folder beside it.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void createBackup()}
            disabled={working || !supported}
            className="mt-4 min-h-12 rounded-full bg-[#244f40] px-5 py-2.5 text-base font-bold text-white transition hover:bg-[#193b30] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {working
              ? "Creating Backup..."
              : "Create Offline Backup"}
          </button>
        </div>

        <div className="flex flex-col rounded-2xl bg-[#f8f4e9] p-5 text-center">
          <p className="text-lg font-bold text-[#173a31]">
            2. Test Offline
          </p>
          <div className="mt-2 flex-1 text-left text-base leading-7 text-stone-700">
            <p>
              <span className="font-bold text-stone-900">A.</span>{" "}
              Turn off Wi-Fi on the event laptop.
            </p>
            <p className="mt-2">
              <span className="font-bold text-stone-900">B.</span>{" "}
              Show the Desktop. On Windows, press <span className="font-bold text-stone-900">Windows key + D</span>.
            </p>
            <p className="mt-2">
              <span className="font-bold text-stone-900">C.</span>{" "}
              Double-click <span className="font-bold text-[#173a31]">{launcherFileName}</span>.
            </p>
            <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 font-semibold text-amber-900">
              Leave “{supportFolderName}” on the Desktop beside the Start file. Do not open, rename, move, or delete it.
            </p>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl bg-[#f8f4e9] p-5 text-center">
          <p className="text-lg font-bold text-[#173a31]">
            3. USB Backup
          </p>
          <div className="mt-2 flex-1 text-left text-base leading-7 text-stone-700">
            <p>
              After the offline test passes, turn Wi-Fi back on and plug in a thumb drive.
            </p>
            <p className="mt-2">
              Click <span className="font-semibold">Back Up to Thumb Drive</span>. MyEMemorial will copy the Start file and all required support files for you.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void backupToThumbDrive()}
            disabled={copyingToUsb || working || !supported}
            className="mt-4 min-h-12 rounded-full border-2 border-[#8d6c3f] bg-white px-5 py-2.5 text-base font-bold text-[#6f542f] transition hover:bg-[#fff8e8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {copyingToUsb
              ? "Copying to USB..."
              : "Back Up to Thumb Drive"}
          </button>
        </div>
      </div>

      {!supported && (
        <p className="mx-auto mt-6 max-w-3xl rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-center text-base font-semibold text-amber-900">
          To create and manage the offline backup, open your private presentation link in Google Chrome or Microsoft Edge on a laptop or desktop computer.
        </p>
      )}

      <p className="mx-auto mt-5 max-w-3xl text-center text-base leading-7 text-stone-600">
        The only file the customer needs to open is “{launcherFileName}”. Keep the support-files folder beside it. We strongly recommend a tested copy on the event laptop and a second complete copy on a USB thumb drive.
      </p>

      {message && (
        <p
          className={`mx-auto mt-5 max-w-3xl rounded-2xl px-4 py-3 text-center text-base font-semibold ${
            completed
              ? "bg-green-50 text-green-800"
              : "bg-stone-100 text-stone-700"
          }`}
          aria-live="polite"
        >
          {message}
        </p>
      )}

      {errorMessage && (
        <p
          className="mx-auto mt-5 max-w-3xl rounded-2xl bg-red-50 px-4 py-3 text-center text-base font-semibold text-red-700"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </section>
  );
}
