export interface MediaItem {
  id: string;
  file: File;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverArtUrl?: string; // data URL for the image
  type: 'audio' | 'video';
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
}
