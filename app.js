// Allow using jsmediatags from CDN
const jsmediatags = window.jsmediatags;

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let library = [];
  let playlists = [];
  let currentTrack = null;
  let isPlaying = false;
  let isMuted = false;
  let queue = [];
  let currentIndex = 0;
  let currentVolume = 1;

  // --- DOM ELEMENTS ---
  const fileInput = document.getElementById('file-input');
  const addFilesBtn = document.getElementById('add-files-btn');
  const emptyLibraryView = document.getElementById('empty-library-view');
  const libraryView = document.getElementById('library-view');
  const libraryTableBody = document.getElementById('library-table-body');
  const mainContent = document.getElementById('main-content');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const createPlaylistBtn = document.getElementById('create-playlist-btn');
  const playlistsList = document.getElementById('playlists-list');

  // Player Elements
  const playerAlbumArt = document.getElementById('player-album-art');
  const playerTrackTitle = document.getElementById('player-track-title');
  const playerTrackArtist = document.getElementById('player-track-artist');
  const prevBtn = document.getElementById('prev-btn');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const nextBtn = document.getElementById('next-btn');
  const currentTimeEl = document.getElementById('current-time');
  const durationEl = document.getElementById('duration');
  const seekSlider = document.getElementById('seek-slider');
  const muteBtn = document.getElementById('mute-btn');
  const volumeIcon = document.getElementById('volume-icon');
  const muteIcon = document.getElementById('mute-icon');
  const volumeSlider = document.getElementById('volume-slider');
  
  // Video Elements
  const videoContainer = document.getElementById('video-container');
  const mediaViewContainer = document.getElementById('media-view-container');
  const videoElement = document.createElement('video');
  videoElement.className = "max-w-full max-h-full";
  videoElement.controls = true;
  videoContainer.appendChild(videoElement);

  const audioElement = new Audio();

  // --- HELPER FUNCTIONS ---
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) {
      return '0:00';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const getActiveElement = () => currentTrack?.type === 'video' ? videoElement : audioElement;

  // --- LOCAL STORAGE ---
  const savePlaylists = () => {
    localStorage.setItem('sonic-playlists', JSON.stringify(playlists));
  };

  const loadFromLocalStorage = () => {
    const storedPlaylists = localStorage.getItem('sonic-playlists');
    if (storedPlaylists) {
      playlists = JSON.parse(storedPlaylists);
      renderPlaylists();
    }
    // Library is not persisted due to File object limitations
    library = [];
    renderLibrary();
  };


  // --- UI RENDERING ---
  const renderLibrary = () => {
    libraryTableBody.innerHTML = ''; // Clear existing table
    if (library.length === 0) {
      emptyLibraryView.style.display = 'flex';
      libraryView.style.display = 'none';
    } else {
      emptyLibraryView.style.display = 'none';
      libraryView.style.display = 'block';
      library.forEach((track, index) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-base-300/50 cursor-pointer group';
        if(currentTrack?.id === track.id) {
            row.classList.add('text-brand');
        }
        
        row.innerHTML = `
          <td class="px-6 py-4 text-center">
            <span class="group-hover:hidden">${index + 1}</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 hidden group-hover:inline text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
            </svg>
          </td>
          <th scope="row" class="px-6 py-4 font-medium whitespace-nowrap ${currentTrack?.id === track.id ? '' : 'text-white'}">
            <div class="flex items-center gap-4">
              <img src="${track.coverArtUrl || 'https://picsum.photos/40'}" class="w-10 h-10 rounded" alt="cover"/>
              <div>
                <div class="text-base text-white">${track.title}</div>
                <div>${track.artist}</div>
              </div>
            </div>
          </th>
          <td class="px-6 py-4">${track.album}</td>
          <td class="px-6 py-4 text-right">${formatTime(track.duration)}</td>
        `;
        row.addEventListener('click', () => playTrack(track));
        libraryTableBody.appendChild(row);
      });
    }
  };
  
  const renderPlaylists = () => {
      playlistsList.innerHTML = '';
      playlists.forEach(playlist => {
          const li = document.createElement('li');
          li.innerHTML = `<a href="#" class="block p-2 rounded hover:bg-base-400 text-sm text-base-subtle font-medium transition-colors duration-200">${playlist.name}</a>`;
          playlistsList.appendChild(li);
      });
  }

  const updatePlayerUI = () => {
    if (currentTrack) {
      playerAlbumArt.src = currentTrack.coverArtUrl || 'https://picsum.photos/64';
      playerTrackTitle.textContent = currentTrack.title;
      playerTrackArtist.textContent = currentTrack.artist;
    } else {
      playerAlbumArt.src = 'https://picsum.photos/64';
      playerTrackTitle.textContent = 'No song playing';
      playerTrackArtist.textContent = 'Select a song from your library';
    }
    
    // Update play/pause icon
    if (isPlaying) {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
    }
    
    // Update mute/unmute icon
    if (isMuted || currentVolume === 0) {
        volumeIcon.style.display = 'none';
        muteIcon.style.display = 'block';
    } else {
        volumeIcon.style.display = 'block';
        muteIcon.style.display = 'none';
    }

    renderLibrary(); // Re-render to highlight current track
  };
  
  const showVideoPlayer = (show) => {
    if (show) {
        videoContainer.style.display = 'flex';
        mediaViewContainer.style.display = 'none';
    } else {
        videoContainer.style.display = 'none';
        mediaViewContainer.style.display = 'block';
    }
  };

  // --- MEDIA & METADATA ---
  const readMetadata = (file) => {
    return new Promise((resolve) => {
      const isVideo = file.type.startsWith('video/');
      const url = URL.createObjectURL(file);
      const mediaEl = isVideo ? document.createElement('video') : new Audio();

      mediaEl.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url);
        const duration = mediaEl.duration;

        if (isVideo || !file.type.startsWith('audio/mpeg')) {
          resolve({ title: file.name.replace(/\.[^/.]+$/, ""), artist: 'Unknown Artist', album: 'Unknown Album', duration: duration || 0, type: isVideo ? 'video' : 'audio' });
          return;
        }

        jsmediatags.read(file, {
          onSuccess: (tag) => {
            const tags = tag.tags;
            const picture = tags.picture;
            let coverArtUrl;
            if (picture) {
              const base64String = btoa(String.fromCharCode.apply(null, picture.data));
              coverArtUrl = `data:${picture.format};base64,${base64String}`;
            }
            resolve({ title: tags.title || file.name.replace(/\.[^/.]+$/, ""), artist: tags.artist || 'Unknown Artist', album: tags.album || 'Unknown Album', duration: duration || 0, coverArtUrl, type: 'audio' });
          },
          onError: () => resolve({ title: file.name.replace(/\.[^/.]+$/, ""), artist: 'Unknown Artist', album: 'Unknown Album', duration: duration || 0, type: 'audio' })
        });
      });
      mediaEl.src = url;
    });
  };

  const handleAddFiles = async (files) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const metadata = await readMetadata(file);
      library.push({
        id: crypto.randomUUID(),
        file: file,
        ...metadata,
      });
    }
    renderLibrary();
  };

  // --- PLAYER LOGIC ---
  const playTrack = (track) => {
    queue = library;
    currentIndex = library.findIndex(t => t.id === track.id);
    currentTrack = track;
    
    // Stop and reset both elements
    audioElement.pause();
    videoElement.pause();
    
    const mediaUrl = URL.createObjectURL(track.file);
    const activeElement = getActiveElement();
    
    showVideoPlayer(track.type === 'video');

    activeElement.src = mediaUrl;
    activeElement.play();
    isPlaying = true;
    updatePlayerUI();
  };

  const togglePlayPause = () => {
    if (!currentTrack) return;
    const activeElement = getActiveElement();
    if (isPlaying) {
      activeElement.pause();
    } else {
      activeElement.play();
    }
    isPlaying = !isPlaying;
    updatePlayerUI();
  };
  
  const nextTrack = () => {
    if(queue.length === 0) return;
    currentIndex = (currentIndex + 1) % queue.length;
    playTrack(queue[currentIndex]);
  };
  
  const prevTrack = () => {
    if(queue.length === 0) return;
    currentIndex = (currentIndex - 1 + queue.length) % queue.length;
    playTrack(queue[currentIndex]);
  };

  const seek = (time) => {
      getActiveElement().currentTime = time;
  };
  
  const setVolume = (volume) => {
      audioElement.volume = volume;
      videoElement.volume = volume;
      currentVolume = volume;
      if (volume > 0 && isMuted) {
          isMuted = false;
          audioElement.muted = false;
          videoElement.muted = false;
      }
      updatePlayerUI();
  }
  
  const toggleMute = () => {
    isMuted = !isMuted;
    audioElement.muted = isMuted;
    videoElement.muted = isMuted;
    updatePlayerUI();
  }

  // --- EVENT LISTENERS ---
  addFilesBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => handleAddFiles(e.target.files));

  // Drag and Drop
  mainContent.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    emptyLibraryView.classList.add('border-brand');
    emptyLibraryView.classList.remove('border-base-200');
  });
  mainContent.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    emptyLibraryView.classList.remove('border-brand');
    emptyLibraryView.classList.add('border-base-200');
  });
  mainContent.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    emptyLibraryView.classList.remove('border-brand');
    emptyLibraryView.classList.add('border-base-200');
    if (e.dataTransfer?.files) {
      handleAddFiles(e.dataTransfer.files);
    }
  });
  
  // Theme Toggle
  themeToggleBtn.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
  });
  
  // Playlist
  createPlaylistBtn.addEventListener('click', () => {
      const playlistName = prompt('Enter new playlist name:');
      if(playlistName && playlistName.trim()) {
          playlists.push({ id: crypto.randomUUID(), name: playlistName.trim(), trackIds: [] });
          savePlaylists();
          renderPlaylists();
      }
  });

  // Player Controls
  playPauseBtn.addEventListener('click', togglePlayPause);
  nextBtn.addEventListener('click', nextTrack);
  prevBtn.addEventListener('click', prevTrack);
  muteBtn.addEventListener('click', toggleMute);

  seekSlider.addEventListener('input', (e) => {
      const duration = getActiveElement().duration;
      if(duration) {
          const seekTime = (e.target.value / 100) * duration;
          seek(seekTime);
      }
  });
  
  volumeSlider.addEventListener('input', (e) => setVolume(parseFloat(e.target.value)));

  const setupMediaListeners = (element) => {
    element.addEventListener('timeupdate', () => {
      const { currentTime, duration } = element;
      currentTimeEl.textContent = formatTime(currentTime);
      if(duration) {
          const progress = (currentTime / duration) * 100;
          seekSlider.value = progress;
      }
    });
    element.addEventListener('durationchange', () => {
      durationEl.textContent = formatTime(element.duration);
    });
    element.addEventListener('ended', nextTrack);
    element.addEventListener('volumechange', () => {
        volumeSlider.value = element.volume;
        updatePlayerUI();
    });
  };

  setupMediaListeners(audioElement);
  setupMediaListeners(videoElement);
  
  // --- INITIALIZATION ---
  const init = () => {
    loadFromLocalStorage();
    updatePlayerUI();
  };

  init();
});
