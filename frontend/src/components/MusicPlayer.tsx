import { useState, useEffect, useRef } from 'react';
import '../styles/MusicPlayer.css';
import { FaVolumeOff, FaVolumeDown, FaVolumeUp, FaPlus, FaList, FaStream, FaListOl, FaListUl, FaMusic, FaBars, FaLayerGroup } from 'react-icons/fa';
import { useMusicQueue } from '../store/MusicQueueStore';
import { emitTimeUpdate, emitPlayPause, onMusicTimeSync, onMusicPlaybackState, onMusicState, MusicState } from '../socket';

// Declare YouTube API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const MusicPlayer = () => {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [firstElementWidth, setFirstElementWidth] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [volume, setVolume] = useState(80);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songTitle, setSongTitle] = useState("No song playing");
  
  const titleRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLSpanElement>(null);
  const firstElementRef = useRef<HTMLSpanElement>(null);
  const titleGroupRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const volumeControlRef = useRef<HTMLDivElement>(null);
  const volumeTrackRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const skipSongRef = useRef<(() => void) | null>(null);
  
  const [isAnimating, setIsAnimating] = useState(true);
  const pausedRef = useRef(false);
  const positionRef = useRef(0);
  const pauseTimeoutRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  // Use the music queue
  const { currentSong, skipSong, updateSongTitle } = useMusicQueue();

  // Keep ref updated with latest skipSong function
  skipSongRef.current = skipSong;

  // Initialize YouTube API
  useEffect(() => {
    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Define the callback function
    window.onYouTubeIframeAPIReady = () => {
      if (playerRef.current) {
        const ytPlayer = new window.YT.Player(playerRef.current, {
          height: '0',
          width: '0',
          videoId: '', // Start with no video
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            showinfo: 0,
          },
          events: {
            onReady: (event: any) => {
              // Store player in ref immediately (synchronous)
              youtubePlayerRef.current = event.target;
              // Also store in state for other uses
              setPlayer(event.target);
              // Set initial volume
              event.target.setVolume(volume);
              // Start progress tracking immediately when player is ready
              setTimeout(() => {
                startProgressTracking();
              }, 100);
              // Don't auto-play, let user add songs via chat
            },
            onStateChange: (event: any) => {
              // Use numeric values instead of constants that might not be available yet
              if (event.data === 1) { // Playing
                setIsPlaying(true);
                const duration = event.target.getDuration();
                setTotalTime(duration);
                // Update song title from YouTube
                const videoData = event.target.getVideoData();
                const actualTitle = videoData.title || currentSong?.title || 'Unknown Title';
                setSongTitle(actualTitle);
                // Update the queue with the actual title
                if (currentSong && videoData.title) {
                  updateSongTitle(currentSong.videoId, videoData.title);
                }
              } else if (event.data === 2) { // Paused
                setIsPlaying(false);
              } else if (event.data === 0) { // Ended
                setIsPlaying(false);
                setProgress(100);
                // Auto-play next song in queue using ref to ensure latest function
                if (skipSongRef.current) {
                  skipSongRef.current();
                }
              } else if (event.data === 3) { // Buffering
                // Video is buffering
              } else if (event.data === 5) { // Video cued
                // Video is cued
              } else if (event.data === -1) { // Unstarted
                // Video is unstarted
              }
            },
            onError: (event: any) => {
              console.error('YouTube player error:', event.data);
            }
          }
        });
      }
    };

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Load new video when currentSong changes
  useEffect(() => {
    if (youtubePlayerRef.current && currentSong) {
      youtubePlayerRef.current.loadVideoById(currentSong.videoId);
      setSongTitle(currentSong.title);
      setProgress(0);
      setCurrentTime(0);
    } else if (!currentSong) {
      // No song in queue - stop music completely
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.pauseVideo();
      }
      setSongTitle("No song playing");
      setProgress(0);
      setCurrentTime(0);
      setTotalTime(0);
      setIsPlaying(false);
    }
  }, [currentSong]);

  // Progress tracking functions
  const startProgressTracking = () => {
    if (progressIntervalRef.current) return;
    
    progressIntervalRef.current = window.setInterval(() => {
      const currentPlayer = youtubePlayerRef.current;
      if (currentPlayer) {
        try {
          // Check YouTube player state directly instead of relying on React state
          const playerState = currentPlayer.getPlayerState();
          
          // Only update progress and log when actually playing
          if (playerState === 1) { // Playing
            const current = currentPlayer.getCurrentTime();
            const total = currentPlayer.getDuration();
            
            // Update progress only when playing and we have valid values
            if (total > 0 && current >= 0) {
              setCurrentTime(current);
              const progressPercent = (current / total) * 100;
              setProgress(progressPercent);
            }
            
            // Update React state if needed
            if (!isPlaying) {
              setIsPlaying(true);
            }
          } else {
            // Only update React state if it needs changing
            if (isPlaying) {
              setIsPlaying(false);
            }
          }
          
        } catch (error) {
          console.error('Error updating progress:', error);
        }
      }
    }, 500); // Update every 500ms for smoother progress
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Update YouTube player volume when volume state changes
  useEffect(() => {
    if (player) {
      player.setVolume(volume);
    }
  }, [volume, player]);

  // Socket synchronization effects
  useEffect(() => {
    // Listen for time sync from other users
    const cleanupTimeSync = onMusicTimeSync((data) => {
      if (youtubePlayerRef.current && currentSong) {
        const currentPlayer = youtubePlayerRef.current;
        const currentPlayerTime = currentPlayer.getCurrentTime();
        const timeDiff = Math.abs(currentPlayerTime - data.currentTime);
        
        // Only sync if time difference is significant (more than 2 seconds)
        if (timeDiff > 2) {
          currentPlayer.seekTo(data.currentTime, true);
        }
        
        // Sync playback state
        if (data.isPlaying && !isPlaying) {
          currentPlayer.playVideo();
        } else if (!data.isPlaying && isPlaying) {
          currentPlayer.pauseVideo();
        }
      }
    });
    
    // Listen for playback state changes
    const cleanupPlaybackState = onMusicPlaybackState((data) => {
      if (youtubePlayerRef.current && currentSong) {
        if (data.isPlaying && !isPlaying) {
          youtubePlayerRef.current.playVideo();
        } else if (!data.isPlaying && isPlaying) {
          youtubePlayerRef.current.pauseVideo();
        }
      }
    });
    
    return () => {
      cleanupTimeSync();
      cleanupPlaybackState();
    };
  }, [currentSong, isPlaying]);

  // NEW: Handle initial synchronization when music state is received from server
  useEffect(() => {
    // This effect handles the initial sync when a user connects/reloads
    // We need to wait for both the YouTube player and the music state to be ready
    
    if (!youtubePlayerRef.current || !currentSong) return;
    
    // Listen for initial music state to sync with server
    const cleanup = onMusicState((serverState: MusicState) => {
      if (!youtubePlayerRef.current || !serverState.currentSong) return;
      
      const currentPlayer = youtubePlayerRef.current;
      const playerState = currentPlayer.getPlayerState();
      
      // Calculate how much time has passed since the server's last update
      const now = Date.now();
      const timeSinceUpdate = (now - serverState.lastUpdateTime) / 1000; // Convert to seconds
      const estimatedCurrentTime = serverState.currentTime + (serverState.isPlaying ? timeSinceUpdate : 0);
      
      // Only sync if this looks like an initial connection (player state is unstarted or we're way off)
      const currentPlayerTime = currentPlayer.getCurrentTime();
      const isInitialConnection = playerState === -1 || playerState === 5 || Math.abs(currentPlayerTime - estimatedCurrentTime) > 5;
      
      if (isInitialConnection && serverState.currentSong.videoId === currentSong.videoId) {
        // Seek to the estimated current position
        if (estimatedCurrentTime > 0) {
          currentPlayer.seekTo(estimatedCurrentTime, true);
        }
        
        // Start playing if the server says it should be playing
        if (serverState.isPlaying) {
          currentPlayer.playVideo();
        } else {
          currentPlayer.pauseVideo();
        }
        
        // Update local state to match
        setIsPlaying(serverState.isPlaying);
        setCurrentTime(estimatedCurrentTime);
        if (currentPlayer.getDuration() > 0) {
          setTotalTime(currentPlayer.getDuration());
          const progressPercent = (estimatedCurrentTime / currentPlayer.getDuration()) * 100;
          setProgress(progressPercent);
        }
      }
    });
    
    return cleanup;
  }, [youtubePlayerRef.current, currentSong]); // Only run when player or song changes

  // Emit time updates to synchronize with other users
  useEffect(() => {
    if (!youtubePlayerRef.current || !currentSong || !isPlaying) return;
    
    const interval = setInterval(() => {
      const currentPlayer = youtubePlayerRef.current;
      if (currentPlayer && currentPlayer.getPlayerState() === 1) { // Playing
        const currentTime = currentPlayer.getCurrentTime();
        emitTimeUpdate(currentTime, true);
      }
    }, 2000); // Send updates every 2 seconds
    
    return () => clearInterval(interval);
  }, [currentSong, isPlaying]);

  // Format time in mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Format remaining time as countdown (e.g., "-0:34")
  const formatRemainingTime = (currentSeconds: number, totalSeconds: number): string => {
    const remaining = Math.max(0, totalSeconds - currentSeconds);
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    return `-${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Measure element widths on mount
  useEffect(() => {
    if (titleRef.current && spacerRef.current && firstElementRef.current) {
      // Measure actual first element with title + spacer together
      const firstElemWidth = firstElementRef.current.offsetWidth;
      setFirstElementWidth(firstElemWidth);
    }
  }, []);

  // Handle volume slider drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!volumeTrackRef.current) return;
      
      const rect = volumeTrackRef.current.getBoundingClientRect();
      const relativeY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      const percentage = 100 - (relativeY / rect.height * 100);
      
      setVolume(Math.max(0, Math.min(100, Math.round(percentage))));
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      document.body.classList.remove('volume-dragging');
      setIsDragging(false);
      
      // Remove the event listeners immediately 
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.body.classList.remove('volume-dragging');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Debug tracking for isDragging state changes
  useEffect(() => {
    // Debug tracking removed
  }, [isDragging]);

  // Manual animation control
  useEffect(() => {
    if (!titleGroupRef.current || !containerRef.current || !firstElementWidth) return;
    
    let animationFrame: number;
    
    // Use the measured first element width for reset position
    const resetPosition = firstElementWidth;
    const animationSpeed = 0.3; // Medium speed
    
    const animate = () => {
      if (!titleGroupRef.current) return;
      
      // If paused, don't move
      if (pausedRef.current) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }
      
      positionRef.current -= animationSpeed;
      
      // Reset when we reach exactly the start of the second title
      if (Math.abs(positionRef.current) >= resetPosition) {
        // Pause for 3 seconds before resetting
        pausedRef.current = true;
        
        pauseTimeoutRef.current = window.setTimeout(() => {
          positionRef.current = 0;
          pausedRef.current = false;
          
          // Make sure the group resets to zero position immediately
          if (titleGroupRef.current) {
            titleGroupRef.current.style.transform = `translateX(0px)`;
          }
        }, 3000);
      }
      
      if (titleGroupRef.current && !pausedRef.current) {
        titleGroupRef.current.style.transform = `translateX(${positionRef.current}px)`;
      }
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    if (isAnimating) {
      animationFrame = requestAnimationFrame(animate);
    }
    
    return () => {
      cancelAnimationFrame(animationFrame);
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, [firstElementWidth, isAnimating]);

  // Handler to prevent event propagation for all events
  const stopPropagation = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up
    setIsLiked(prev => !prev);
    
    // Only control playback if there's a current song
    const currentPlayer = youtubePlayerRef.current;
    if (currentPlayer && currentSong) {
      const newPlayingState = !isPlaying;
      
      if (newPlayingState) {
        currentPlayer.playVideo();
      } else {
        currentPlayer.pauseVideo();
      }
      
      // Emit the playback state change to synchronize with other users
      emitPlayPause(newPlayingState);
    }
  };
  
  // Handle track click for volume control
  const handleVolumeTrackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (volumeTrackRef.current) {
      const rect = volumeTrackRef.current.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const percentage = 100 - (relativeY / rect.height * 100);
      setVolume(Math.max(0, Math.min(100, Math.round(percentage))));
    }
  };
  
  // Start dragging the volume handle
  const handleVolumeTrackMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Add a class to the body to indicate dragging is happening
    document.body.classList.add('volume-dragging');
    
    handleVolumeTrackClick(e);
    setIsDragging(true);
  };

  // Handle mouseup on document to ensure we catch it
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        document.body.classList.remove('volume-dragging');
        setIsDragging(false);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  // Get the appropriate volume icon based on current volume
  const getVolumeIcon = () => {
    if (volume === 0) return <FaVolumeOff />;
    if (volume < 50) return <FaVolumeDown />;
    return <FaVolumeUp />;
  };

  // Ensure dragging state is cleaned up if component unmounts during drag
  useEffect(() => {
    return () => {
      if (isDragging) {
        document.removeEventListener('mousemove', () => {});
        document.removeEventListener('mouseup', () => {});
      }
    };
  }, [isDragging]);

  return (
    <div 
      className="music-player"
    >
      {/* Hidden YouTube player */}
      <div ref={playerRef} style={{ display: 'none' }}></div>
      
      <div className="song-info">
        <div className="thumbnail">
          {currentSong ? (
            <img 
              src={`https://img.youtube.com/vi/${currentSong.videoId}/hqdefault.jpg`}
              alt={currentSong.title}
              className="thumbnail-image"
              onError={(e) => {
                // Fallback to lower quality if high quality fails
                const target = e.target as HTMLImageElement;
                if (target.src.includes('hqdefault')) {
                  target.src = `https://img.youtube.com/vi/${currentSong.videoId}/mqdefault.jpg`;
                } else if (target.src.includes('mqdefault')) {
                  target.src = `https://img.youtube.com/vi/${currentSong.videoId}/default.jpg`;
                }
              }}
            />
          ) : (
            <div className="thumbnail-placeholder"></div>
          )}
        </div>
        <div 
          className="song-details"
          onClick={stopPropagation}
          onMouseDown={stopPropagation}
          onMouseUp={stopPropagation}
          onTouchStart={stopPropagation}
          onTouchEnd={stopPropagation}
          onTouchMove={stopPropagation}
        >
          <div ref={containerRef} className="title-container">
            <div className="title-scroll">
              <div ref={titleRef} className="title-measure">{songTitle}</div>
              <span ref={spacerRef} className="spacer-measure"> • </span>
              <div 
                ref={titleGroupRef} 
                className="title-group"
                style={{ animation: 'none' }} // Disable CSS animation
              >
                <span ref={firstElementRef} className="first-element">
                  <span className="title-item">{songTitle}</span>
                  <span className="title-spacer"> • </span>
                </span>
                <span className="title-item">{songTitle}</span>
                <span className="title-spacer"> • </span>
                <span className="title-item">{songTitle}</span>
              </div>
            </div>
          </div>
          <div className="player-controls">
            {/* <button 
              className={`like-button ${isLiked ? 'liked' : ''}`}
              onClick={handleLikeClick}
            >
              <span className="heart-icon">❤</span>
            </button> */}
            <div className="progress-wrapper">
              <span className="time current-time">{formatTime(currentTime)}</span>
              <div className="progress-container">
                <div 
                  className="progress-bar"
                  style={{ width: `${progress}%` }}
                ></div>
                <div 
                  className="progress-handle"
                  style={{ left: `${progress}%` }}
                ></div>
              </div>
              <span className="time total-time">{formatRemainingTime(currentTime, totalTime)}</span>
            </div>
            
            <div 
              className={`volume-control ${isDragging ? 'dragging' : ''}`} 
              ref={volumeControlRef}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => {
                if (!isDragging) {
                  setShowVolumeSlider(false);
                }
              }}
            >
              <button 
                className="volume-button" 
                tabIndex={0}
                aria-label={volume === 0 ? "Unmute" : "Mute"}
              >
                {getVolumeIcon()}
              </button>
              {(showVolumeSlider || isDragging) && (
                <div className="volume-slider-container">
                  <div 
                    ref={volumeTrackRef}
                    className="volume-track"
                    onClick={handleVolumeTrackClick}
                    onMouseDown={handleVolumeTrackMouseDown}
                  >
                    <div 
                      className="volume-fill" 
                      style={{ height: `${volume}%` }}
                    />
                    <div 
                      className="volume-handle" 
                      style={{ bottom: `${volume}%` }}
                    />
                  </div>
                  <div className="volume-value">{volume}</div>
                </div>
              )}
            </div>
            
            {/* Add songs to queue button */}
            {/* <button 
              className="control-button add-song-button"
              onClick={(e) => {
                e.stopPropagation();
                // Will be implemented in the future
              }}
            >
              <FaPlus />
            </button> */}
            
            {/* View queue button */}
            {/* <button 
              className="control-button view-queue-button"
              onClick={(e) => {
                e.stopPropagation();
                // Will be implemented in the future
              }}
            >
              <FaListOl />
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer; 