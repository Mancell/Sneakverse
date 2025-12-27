"use client";

import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Play, Pause, Volume2, SkipBack } from 'lucide-react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTiktok } from '@fortawesome/free-brands-svg-icons';

export interface TikTokVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  title?: string | null;
  author?: string | null;
  duration?: number; // Video süresi saniye cinsinden
}

interface TikTokVideoCardProps {
  video: TikTokVideo;
  isPlaying?: boolean;
  onPlayChange?: (playing: boolean) => void;
  onHover?: () => void;
}

export function TikTokVideoCard({ video, isPlaying: externalIsPlaying, onPlayChange, onHover }: TikTokVideoCardProps) {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [animationProgress, setAnimationProgress] = useState<number>(0);
  const [volume, setVolume] = useState<number>(75);
  const [isDraggingVolume, setIsDraggingVolume] = useState<boolean>(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const videoDuration = video.duration || 60; // Default 60 saniye
  

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isDraggingProgress && videoRef.current) {
      interval = setInterval(() => {
        if (videoRef.current) {
          const currentTime = videoRef.current.currentTime;
          const duration = videoRef.current.duration || videoDuration;
          const progress = (currentTime / duration) * 100;
          setAnimationProgress(progress);
          
          if (progress >= 100) {
            setIsPlaying(false);
            setAnimationProgress(0);
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
            }
          }
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isDraggingProgress, videoDuration]);

  // External isPlaying prop'unu takip et
  useEffect(() => {
    if (externalIsPlaying !== undefined) {
      setIsPlaying(externalIsPlaying);
    }
  }, [externalIsPlaying]);

  // Cleanup hover timeout
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
      // Volume'u her zaman güncel tut
      videoRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [isPlaying, isMuted, volume]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    });
  };
  
  const handleVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingVolume(true);
    handleVolumeChange(e);
    
    const handleMouseMove = (e: MouseEvent) => handleVolumeChange(e);
    const handleMouseUp = () => {
      setIsDraggingVolume(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleVolumeChange = (e: MouseEvent | React.MouseEvent) => {
    if (!volumeBarRef.current) return;
    
    const rect = volumeBarRef.current.getBoundingClientRect();
    let newVolume = ((e.clientX - rect.left) / rect.width) * 100;
    newVolume = Math.max(0, Math.min(100, newVolume));
    setVolume(newVolume);
    
    const willBeMuted = newVolume === 0;
    setIsMuted(willBeMuted);
    
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
    }
  };
  
  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingProgress(true);
    handleProgressChange(e);
    
    const handleMouseMove = (e: MouseEvent) => handleProgressChange(e);
    const handleMouseUp = () => {
      setIsDraggingProgress(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleProgressChange = (e: MouseEvent | React.MouseEvent) => {
    if (!progressBarRef.current || !videoRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    let newProgress = ((e.clientX - rect.left) / rect.width) * 100;
    newProgress = Math.max(0, Math.min(100, newProgress));
    setAnimationProgress(newProgress);
    
    const duration = videoRef.current.duration || videoDuration;
    videoRef.current.currentTime = (newProgress / 100) * duration;
  };
  
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (videoRef.current) {
      if (newMuted) {
        videoRef.current.volume = 0;
      } else {
        // Eğer volume 0 ise 75'e ayarla, değilse mevcut volume'u kullan
        const newVolume = volume === 0 ? 75 : volume;
        setVolume(newVolume);
        videoRef.current.volume = newVolume / 100;
      }
    }
  };
  
  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    onPlayChange?.(newPlayingState);
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const currentTime = (animationProgress / 100) * videoDuration;
  
  const VolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <Volume2 size={16} className="text-white" style={{ opacity: 0.7 }} />;
    }
    return <Volume2 size={16} className="text-white" />;
  };

  // Video URL'den embed veya video tipini belirle
  const isYouTube = video.videoUrl.includes('youtube.com') || video.videoUrl.includes('youtu.be');
  const isVideoFile = video.videoUrl.match(/\.(mp4|webm|ogg|mov)$/i);
  
  // Debug: Video tipini logla
  useEffect(() => {
    console.log('[TikTokVideoCard] Video URL:', video.videoUrl);
    console.log('[TikTokVideoCard] isVideoFile:', isVideoFile);
    console.log('[TikTokVideoCard] isYouTube:', isYouTube);
  }, [video.videoUrl, isVideoFile, isYouTube]);
  
  return (
    <div 
      ref={cardRef}
      className="rounded-xl overflow-hidden relative cursor-pointer group"
      style={{
        width: '360px',
        height: '520px',
        background: '#000',
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.5)'
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        // Hover'da 300ms sonra otomatik başlat
        hoverTimeoutRef.current = setTimeout(() => {
          if (!isPlaying) {
            setIsPlaying(true);
            onPlayChange?.(true);
          }
          onHover?.();
        }, 300);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        // Hover timeout'unu temizle
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Video - Tüm kartı kaplar */}
      <div className="absolute inset-0 w-full h-full">
        {isVideoFile ? (
          <video
            ref={videoRef}
            src={video.videoUrl}
            poster={video.thumbnailUrl}
            className="w-full h-full object-cover cursor-pointer"
            muted={isMuted}
            loop
            playsInline
            controls={false}
            preload="metadata"
            onClick={togglePlay}
            onError={(e) => {
              const videoEl = e.currentTarget;
              console.error('[TikTokVideoCard] Video error:', {
                error: videoEl.error,
                code: videoEl.error?.code,
                message: videoEl.error?.message,
                videoUrl: video.videoUrl,
              });
            }}
            onLoadedData={() => {
              console.log('[TikTokVideoCard] Video loaded:', video.videoUrl);
              if (videoRef.current) {
                console.log('[TikTokVideoCard] Video duration:', videoRef.current.duration);
              }
            }}
            onCanPlay={() => {
              console.log('[TikTokVideoCard] Video can play:', video.videoUrl);
            }}
          />
        ) : isYouTube ? (
          <iframe
            src={video.videoUrl}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={video.title || "YouTube video"}
          />
        ) : video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title || "Video thumbnail"}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-500/20 to-black/40 flex items-center justify-center">
            <div className="text-center text-white/50">
              <Play size={48} className="mx-auto mb-2" />
              <p className="text-sm">Video</p>
            </div>
          </div>
        )}
      </div>

      {/* Üst overlay - TikTok benzeri minimal bilgiler */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon 
              icon={faTiktok} 
              className="w-5 h-5"
              style={{ color: '#FF0050' }}
            />
            <span className="text-white text-sm font-semibold">@{video.author || 'user'}</span>
          </div>
        </div>
        {video.title && (
          <p className="text-white text-sm mt-2 line-clamp-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            {video.title}
          </p>
        )}
      </div>

      {/* Orta play/pause butonu */}
      {isVideoFile && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 z-10"
          style={{ opacity: isHovered && !isPlaying ? 1 : 0 }}
        >
          <button 
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-[#FF0050]/80 backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-[#FF0050] pointer-events-auto"
            style={{ 
              boxShadow: '0 0 30px rgba(255, 0, 80, 0.6)',
            }}
          >
            <Play size={28} className="text-white ml-1" />
          </button>
        </div>
      )}
      
      {/* Alt overlay - Video kontrolleri */}
      <div 
        className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none"
      >
        {/* Progress bar */}
        {isVideoFile && (
          <div 
            ref={progressBarRef}
            className="w-full h-1 bg-white/20 rounded-full cursor-pointer relative mb-3 overflow-hidden pointer-events-auto"
            onMouseDown={handleProgressMouseDown}
          >
            <div 
              className="h-full rounded-full transition-all duration-150"
              style={{ 
                width: `${animationProgress}%`,
                background: '#FF0050',
                boxShadow: '0 0 6px rgba(255, 0, 80, 0.6)'
              }}
            />
          </div>
        )}
        
        {/* Video kontrolleri */}
        {isVideoFile && (
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2">
              <button 
                className="w-8 h-8 rounded-full bg-[#FF0050]/80 backdrop-blur-sm flex items-center justify-center hover:bg-[#FF0050] transition-all duration-300"
                onClick={togglePlay}
                style={{ boxShadow: '0 0 10px rgba(255, 0, 80, 0.4)' }}
              >
                {isPlaying ? 
                  <Pause size={16} className="text-white" /> : 
                  <Play size={16} className="text-white ml-0.5" />
                }
              </button>
              
              <button 
                className="w-8 h-8 rounded-full bg-[#FF0050]/80 backdrop-blur-sm flex items-center justify-center hover:bg-[#FF0050] transition-colors duration-300"
                onClick={toggleMute}
                style={{ boxShadow: '0 0 10px rgba(255, 0, 80, 0.4)' }}
              >
                <VolumeIcon />
              </button>
              
              <div 
                ref={volumeBarRef}
                className="w-16 h-1 bg-white/20 rounded-full cursor-pointer relative group/volume hover:bg-white/30 transition-colors duration-200"
                onMouseDown={handleVolumeMouseDown}
              >
                <div 
                  className="h-full rounded-full transition-colors duration-300" 
                  style={{ 
                    width: `${isMuted ? 0 : volume}%`,
                    background: '#FF0050',
                    boxShadow: '0 0 4px rgba(255, 0, 80, 0.6)'
                  }} 
                />
              </div>
            </div>
            
            <div className="text-xs text-white/80 tabular-nums" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              {formatTime(currentTime)} / {formatTime(videoDuration)}
            </div>
          </div>
        )}
      </div>
      
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.005);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes wave1 {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        @keyframes wave2 {
          0%, 100% { height: 5px; }
          50% { height: 12px; }
        }
        @keyframes wave3 {
          0%, 100% { height: 7px; }
          50% { height: 18px; }
        }
        @keyframes wave4 {
          0%, 100% { height: 5px; }
          50% { height: 14px; }
        }
        @keyframes wave5 {
          0%, 100% { height: 3px; }
          50% { height: 13px; }
        }
      `}</style>
    </div>
  );
}

