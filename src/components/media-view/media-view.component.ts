import { Component, ChangeDetectionStrategy, inject, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaService } from '../../media.service';
import { PlayerService } from '../../player.service';
import { MediaItem } from '../../models';

@Component({
  selector: 'app-media-view',
  imports: [CommonModule],
  templateUrl: './media-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaViewComponent implements AfterViewInit {
  mediaService = inject(MediaService);
  playerService = inject(PlayerService);
  isDragging = signal(false);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  videoContainer: HTMLElement | null = null;
  
  ngAfterViewInit() {
    this.videoContainer = document.getElementById('video-container');
    if(this.videoContainer) {
       const videoElement = this.playerService.getVideoElement();
       videoElement.className = "max-w-full max-h-full";
       videoElement.controls = true;
       this.videoContainer.appendChild(videoElement);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.mediaService.addFiles(input.files);
    }
  }

  addFiles() {
    this.fileInput.nativeElement.click();
  }
  
  playTrack(track: MediaItem) {
    this.playerService.loadAndPlay(track, this.mediaService.library());
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) {
      return '0:00';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  // Drag and drop handlers
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    if (event.dataTransfer?.files) {
      this.mediaService.addFiles(event.dataTransfer.files);
    }
  }
}
