import { Injectable, signal, effect, computed } from '@angular/core';
import { MediaItem } from './models';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private audioContext: AudioContext | null = null;
  private audio!: HTMLAudioElement;
  private video!: HTMLVideoElement;
  
  currentTrack = signal<MediaItem | null>(null);
  isPlaying = signal(false);
  currentTime = signal(0);
  duration = signal(0);
  volume = signal(1);
  isMuted = signal(false);
  
  queue = signal<MediaItem[]>([]);
  currentIndex = signal(0);
  
  isShowingVideo = computed(() => this.currentTrack()?.type === 'video');

  constructor() {
    if (typeof window !== 'undefined') {
        this.audio = new Audio();
        this.video = document.createElement('video');
        this.setupListeners(this.audio);
        this.setupListeners(this.video);
    }
  }

  private get activeElement(): HTMLAudioElement | HTMLVideoElement {
    return this.isShowingVideo() ? this.video : this.audio;
  }

  private setupListeners(element: HTMLMediaElement) {
     element.addEventListener('timeupdate', () => this.currentTime.set(element.currentTime));
     element.addEventListener('durationchange', () => this.duration.set(element.duration));
     element.addEventListener('ended', () => this.next());
     element.addEventListener('volumechange', () => this.volume.set(element.volume));
  }

  loadAndPlay(track: MediaItem, playlist: MediaItem[]) {
    this.queue.set(playlist);
    const trackIndex = playlist.findIndex(t => t.id === track.id);
    this.currentIndex.set(trackIndex > -1 ? trackIndex : 0);
    this.currentTrack.set(track);

    const mediaUrl = URL.createObjectURL(track.file);
    
    // Stop and reset both elements
    this.audio.pause();
    this.video.pause();
    this.audio.src = '';
    this.video.src = '';

    if(track.type === 'video') {
        this.video.src = mediaUrl;
        this.video.play();
    } else {
        this.audio.src = mediaUrl;
        this.audio.play();
    }

    this.isPlaying.set(true);
  }

  togglePlayPause() {
    if (this.isPlaying()) {
      this.activeElement.pause();
      this.isPlaying.set(false);
    } else {
      if (this.currentTrack()) {
        this.activeElement.play();
        this.isPlaying.set(true);
      }
    }
  }

  seek(time: number) {
    this.activeElement.currentTime = time;
    this.currentTime.set(time);
  }

  setVolume(volume: number) {
    this.audio.volume = volume;
    this.video.volume = volume;
    if (volume > 0) this.isMuted.set(false);
  }
  
  toggleMute() {
    const muteState = !this.isMuted();
    this.audio.muted = muteState;
    this.video.muted = muteState;
    this.isMuted.set(muteState);
  }

  next() {
    const nextIndex = (this.currentIndex() + 1) % this.queue().length;
    if (this.queue().length > 0) {
      this.loadAndPlay(this.queue()[nextIndex], this.queue());
    }
  }

  previous() {
    const prevIndex = (this.currentIndex() - 1 + this.queue().length) % this.queue().length;
    if (this.queue().length > 0) {
      this.loadAndPlay(this.queue()[prevIndex], this.queue());
    }
  }

  getVideoElement(): HTMLVideoElement {
    return this.video;
  }
}
