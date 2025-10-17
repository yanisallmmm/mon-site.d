import { Injectable, signal, effect } from '@angular/core';
import { MediaItem, Playlist } from './models';

// Allow using jsmediatags from CDN
declare var jsmediatags: any;

@Injectable({ providedIn: 'root' })
export class MediaService {
  library = signal<MediaItem[]>([]);
  playlists = signal<Playlist[]>([]);
  activePlaylistId = signal<string | null>(null);

  constructor() {
    this.loadFromLocalStorage();

    effect(() => {
      localStorage.setItem('media-library', JSON.stringify(this.library()));
    });
    effect(() => {
      // Note: Storing files in playlists is not feasible with JSON.stringify.
      // We only store track IDs.
      localStorage.setItem('media-playlists', JSON.stringify(this.playlists()));
    });
  }

  private loadFromLocalStorage() {
    const storedLibrary = localStorage.getItem('media-library');
    if (storedLibrary) {
      // Note: File objects can't be stored in localStorage.
      // This implementation is for demonstration; a real app would need IndexedDB for files.
      // We are only restoring metadata, not the playable file itself.
      const parsed = JSON.parse(storedLibrary);
      // Let's clear library on reload, as we can't play files anyway.
      // this.library.set(parsed.map((item: any) => ({...item, file: null})));
      this.library.set([]);
    }
    const storedPlaylists = localStorage.getItem('media-playlists');
    if (storedPlaylists) {
      this.playlists.set(JSON.parse(storedPlaylists));
    }
  }

  async addFiles(files: FileList) {
    const newItems: MediaItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const metadata = await this.readMetadata(file);
      newItems.push({
        id: crypto.randomUUID(),
        file: file,
        ...metadata,
      });
    }
    this.library.update(current => [...current, ...newItems]);
  }

  private readMetadata(file: File): Promise<{ title: string; artist: string; album: string; duration: number; coverArtUrl?: string; type: 'audio'|'video' }> {
    return new Promise((resolve) => {
      const isVideo = file.type.startsWith('video/');
      
      const audio = new Audio(URL.createObjectURL(file));
      audio.addEventListener('loadedmetadata', () => {
         URL.revokeObjectURL(audio.src); // Clean up
         const duration = audio.duration;

        if (isVideo || !file.type.startsWith('audio/mpeg')) {
            resolve({
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: 'Unknown Artist',
                album: 'Unknown Album',
                duration: duration || 0,
                type: isVideo ? 'video' : 'audio',
            });
            return;
        }

        jsmediatags.read(file, {
          onSuccess: (tag: any) => {
            const tags = tag.tags;
            const picture = tags.picture;
            let coverArtUrl: string | undefined = undefined;
            if (picture) {
              const base64String = btoa(String.fromCharCode.apply(null, picture.data));
              coverArtUrl = `data:${picture.format};base64,${base64String}`;
            }

            resolve({
              title: tags.title || file.name.replace(/\.[^/.]+$/, ""),
              artist: tags.artist || 'Unknown Artist',
              album: tags.album || 'Unknown Album',
              duration: duration || 0,
              coverArtUrl,
              type: 'audio',
            });
          },
          onError: () => {
            resolve({
              title: file.name.replace(/\.[^/.]+$/, ""),
              artist: 'Unknown Artist',
              album: 'Unknown Album',
              duration: duration || 0,
              type: 'audio',
            });
          }
        });

      });
    });
  }
  
  createPlaylist(name: string) {
    if (!name.trim()) return;
    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name: name.trim(),
      trackIds: []
    };
    this.playlists.update(current => [...current, newPlaylist]);
  }

  getPlaylistTracks(playlistId: string): MediaItem[] {
    const playlist = this.playlists().find(p => p.id === playlistId);
    if (!playlist) return [];
    return this.library().filter(track => playlist.trackIds.includes(track.id));
  }
}
