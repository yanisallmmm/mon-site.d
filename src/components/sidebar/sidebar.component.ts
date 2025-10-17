import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaService } from '../../media.service';
import { PlayerService } from '../../player.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  mediaService = inject(MediaService);
  playerService = inject(PlayerService);
  themeToggled = output<void>();

  createNewPlaylist() {
    const playlistName = prompt('Enter new playlist name:');
    if (playlistName) {
      this.mediaService.createPlaylist(playlistName);
    }
  }
}
