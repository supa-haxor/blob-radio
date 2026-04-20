import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { 
  QueueItem, 
  MusicState, 
  onMusicState, 
  onMusicQueueUpdate,
  emitAddToQueue, 
  emitSkipSong, 
  emitClearQueue, 
  emitRemoveSong,
  emitShuffleQueue,
  initSocket
} from '../socket';

// Remove duplicate QueueItem interface as it's imported from socket.ts
// export interface QueueItem { ... } - REMOVED

interface MusicQueueContextType {
  queue: QueueItem[];
  history: QueueItem[];
  currentSong: QueueItem | null;
  addToQueue: (url: string, addedBy?: string) => Promise<{ success: boolean; songTitle?: string; count?: number; errorMessage?: string }>;
  skipSong: () => void;
  clearQueue: () => void;
  removeFromQueue: (index: number) => void;
  shuffleQueue: () => void;
  getNext3Songs: () => QueueItem[];
  updateSongTitle: (videoId: string, title: string) => void;
}

const MusicQueueContext = createContext<MusicQueueContextType | null>(null);

interface MusicQueueProviderProps {
  children: React.ReactNode;
}

// Extract YouTube video ID from various URL formats
const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*[&?]v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

// Extract YouTube playlist ID from URL
const extractPlaylistId = (url: string): string | null => {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*[&?]list=([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

// Check if URL is a playlist
const isPlaylistUrl = (url: string): boolean => {
  return extractPlaylistId(url) !== null;
};

// Check if URL is a valid YouTube URL (single video or playlist)
const isValidYouTubeUrl = (url: string): boolean => {
  return extractVideoId(url) !== null || extractPlaylistId(url) !== null;
};

// Fetch playlist videos using YouTube Data API
const fetchPlaylistVideos = async (playlistId: string): Promise<{videoId: string, title: string}[]> => {
  // For now, we'll try a simple approach without API key
  // You can add your API key here directly or use environment variables
  const API_KEY = ''; // Add your YouTube Data API key here
  
  if (!API_KEY) {
    // Fallback: try to parse playlist page (less reliable)
    throw new Error('YouTube API key required for playlist support.\n\nTo enable playlists:\n1. Get a YouTube Data API key from Google Cloud Console\n2. Add it to the API_KEY variable in MusicQueueStore.tsx\n\nFor now, please add individual videos from the playlist.');
  }
  
  const videos: {videoId: string, title: string}[] = [];
  let nextPageToken = '';
  
  try {
    do {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch playlist');
      }
      
      data.items.forEach((item: any) => {
        if (item.snippet?.resourceId?.videoId) {
          videos.push({
            videoId: item.snippet.resourceId.videoId,
            title: item.snippet.title || 'Unknown Title'
          });
        }
      });
      
      nextPageToken = data.nextPageToken || '';
    } while (nextPageToken);
    
    return videos;
  } catch (error) {
    console.error('Error fetching playlist:', error);
    throw error;
  }
};

// Fetch video details using YouTube Data API
const fetchVideoDetails = async (videoId: string): Promise<{
  title: string;
  duration: string;
  durationSeconds: number;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt?: string;
  viewCount?: number;
}> => {
  // For now, we'll try a simple approach without API key using oEmbed
  // For full functionality, you would use YouTube Data API with an API key
  
  try {
    // First try YouTube oEmbed API (doesn't require API key, but limited data)
    const oEmbedResponse = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (!oEmbedResponse.ok) {
      throw new Error('Video not found or private');
    }
    
    const oEmbedData = await oEmbedResponse.json();
    
    // For now, return basic info from oEmbed (duration not available without API key)
    return {
      title: oEmbedData.title || 'Unknown Title',
      duration: 'Unknown', // Would need YouTube Data API for duration
      durationSeconds: 0, // Would need YouTube Data API for duration
      thumbnailUrl: oEmbedData.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      channelTitle: oEmbedData.author_name || 'Unknown Channel',
      publishedAt: undefined,
      viewCount: undefined
    };
  } catch (error) {
    console.error('Error fetching video details:', error);
    // Fallback with basic info
    return {
      title: 'Loading...',
      duration: 'Unknown',
      durationSeconds: 0,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      channelTitle: 'Unknown Channel'
    };
  }
};

export const MusicQueueProvider: React.FC<MusicQueueProviderProps> = ({ children }) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<QueueItem[]>([]);
  const [currentSong, setCurrentSong] = useState<QueueItem | null>(null);

  // Initialize socket connection and listen for music state updates
  useEffect(() => {
    // Initialize socket connection
    initSocket();
    
    // Listen for music state updates from server (when currentSong changes)
    const cleanupMusicState = onMusicState((state: MusicState) => {
      setQueue(state.queue);
      setHistory(state.history);
      setCurrentSong(state.currentSong); // Use the actual currentSong from server
    });
    
    // Listen for queue-only updates (when songs are added but currentSong doesn't change)
    const cleanupQueueUpdate = onMusicQueueUpdate((data) => {
      setQueue(data.queue);
      // Don't update currentSong or history, just the queue
    });
    
    return () => {
      cleanupMusicState();
      cleanupQueueUpdate();
    };
  }, []);

  const addToQueue = useCallback(async (url: string, addedBy?: string): Promise<{ success: boolean; songTitle?: string; count?: number; errorMessage?: string }> => {
    // First, validate if it's a valid YouTube URL
    if (!isValidYouTubeUrl(url)) {
      return { success: false, errorMessage: 'Please paste a valid YouTube link' };
    }
    
    // Check if it's a playlist URL
    if (isPlaylistUrl(url)) {
      const playlistId = extractPlaylistId(url);
      if (!playlistId) {
        return { success: false, errorMessage: 'Invalid YouTube playlist URL.' };
      }

      try {
        const videos = await fetchPlaylistVideos(playlistId);
        
        if (videos.length === 0) {
          return { success: false, errorMessage: 'Playlist is empty or could not be loaded.' };
        }

        // Add all videos from playlist to queue with details
        for (const video of videos) {
          const details = await fetchVideoDetails(video.videoId);
          const newItem: QueueItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Unique ID
            videoId: video.videoId,
            title: details.title,
            url: `https://www.youtube.com/watch?v=${video.videoId}`,
            addedBy,
            duration: details.duration,
            durationSeconds: details.durationSeconds,
            thumbnailUrl: details.thumbnailUrl,
            channelTitle: details.channelTitle,
            publishedAt: details.publishedAt,
            viewCount: details.viewCount
          };
          
          // Use socket to add each song to the queue
          emitAddToQueue(newItem);
        }

        return { success: true, count: videos.length, songTitle: `${videos.length} songs from playlist` };
      } catch (error) {
        console.error('Failed to load playlist:', error);
        return { success: false, errorMessage: 'Failed to load playlist. Please check the URL and try again.' };
      }
    } else {
      // Handle single video
      const videoId = extractVideoId(url);
      
      if (!videoId) {
        return { success: false, errorMessage: 'Please paste a valid YouTube link' };
      }

      try {
        // Fetch video details before adding to queue
        const details = await fetchVideoDetails(videoId);
        
        const newItem: QueueItem = {
          id: Date.now().toString(),
          videoId,
          title: details.title,
          url,
          addedBy,
          duration: details.duration,
          durationSeconds: details.durationSeconds,
          thumbnailUrl: details.thumbnailUrl,
          channelTitle: details.channelTitle,
          publishedAt: details.publishedAt,
          viewCount: details.viewCount
        };

        // Use socket to add to queue instead of direct state update
        emitAddToQueue(newItem);
        return { success: true, songTitle: details.title };
      } catch (error) {
        console.error('Error fetching video details:', error);
        return { success: false, errorMessage: 'Failed to get video information. Please check the URL and try again.' };
      }
    }
  }, []);

  const skipSong = useCallback(() => {
    // Use socket to skip song instead of direct state manipulation
    emitSkipSong();
  }, []);

  const clearQueue = useCallback(() => {
    // Use socket to clear queue instead of direct state manipulation
    emitClearQueue();
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    // Use socket to remove song instead of direct state manipulation
    emitRemoveSong(index);
  }, []);

  const shuffleQueue = useCallback(() => {
    // Use socket to shuffle queue instead of direct state manipulation
    emitShuffleQueue();
  }, []);

  const getNext3Songs = useCallback((): QueueItem[] => {
    // Return the next 3 songs after current (skip index 0 which is current)
    return queue.slice(1, 4);
  }, [queue]);

  const updateSongTitle = useCallback((videoId: string, title: string) => {
    setQueue(prev => {
      const newQueue = prev.map(item =>
        item.videoId === videoId ? { ...item, title } : item
      );
      return newQueue;
    });
    
    // Also update history if the song is there
    setHistory(prev => {
      const newHistory = prev.map(item =>
        item.videoId === videoId ? { ...item, title } : item
      );
      return newHistory;
    });
  }, []);

  const value = {
    queue,
    history,
    currentSong,
    addToQueue,
    skipSong,
    clearQueue,
    removeFromQueue,
    shuffleQueue,
    getNext3Songs,
    updateSongTitle
  };

  return (
    <MusicQueueContext.Provider value={value}>
      {children}
    </MusicQueueContext.Provider>
  );
};

export const useMusicQueue = (): MusicQueueContextType => {
  const context = useContext(MusicQueueContext);
  if (!context) {
    throw new Error('useMusicQueue must be used within a MusicQueueProvider');
  }
  return context;
}; 