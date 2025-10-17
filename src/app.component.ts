import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { PlayerBarComponent } from './components/player-bar/player-bar.component';
import { MediaViewComponent } from './components/media-view/media-view.component';
import { PlayerService } from './player.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SidebarComponent, PlayerBarComponent, MediaViewComponent],
})
export class AppComponent {
  playerService = inject(PlayerService);
  theme = signal<'dark' | 'light'>('dark');

  toggleTheme() {
    this.theme.update(current => (current === 'dark' ? 'light' : 'dark'));
    if (this.theme() === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
