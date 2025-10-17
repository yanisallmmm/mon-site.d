import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerService } from '../../player.service';

@Component({
  selector: 'app-player-bar',
  imports: [CommonModule],
  templateUrl: './player-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerBarComponent {
  playerService = inject(PlayerService);

  progress = computed(() => {
    const duration = this.playerService.duration();
    return duration > 0 ? (this.playerService.currentTime() / duration) * 100 : 0;
  });

  onSeek(event: Event) {
    const input = event.target as HTMLInputElement;
    const seekTime = (Number(input.value) / 100) * this.playerService.duration();
    this.playerService.seek(seekTime);
  }

  onVolumeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.playerService.setVolume(Number(input.value));
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) {
      return '0:00';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
