"use client";

import { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';

export interface YouTubeVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  title?: string | null;
  author?: string | null;
}

interface YouTubeVideoCardProps {
  video: YouTubeVideo;
  isPlaying?: boolean;
  onPlayChange?: (playing: boolean) => void;
  onHover?: () => void;
}

// YouTube URL'ini embed formatına çevir
function getYouTubeEmbedUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    console.error('[YouTubeVideoCard] Invalid URL:', url);
    return '';
  }
  
  console.log('[YouTubeVideoCard] Parsing URL:', url);
  
  // YouTube URL formatlarını kontrol et
  let videoId = '';
  
  // youtube.com/shorts/VIDEO_ID (YouTube Shorts)
  const shortsMatch = url.match(/(?:youtube\.com\/shorts\/)([^&\n?#]+)/);
  if (shortsMatch && shortsMatch[1]) {
    videoId = shortsMatch[1].split('?')[0]; // Remove query params
    console.log('[YouTubeVideoCard] Found video ID from Shorts URL:', videoId);
  }
  
  // youtube.com/watch?v=VIDEO_ID
  if (!videoId) {
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([^&\n?#]+)/);
    if (watchMatch && watchMatch[1]) {
      videoId = watchMatch[1];
      console.log('[YouTubeVideoCard] Found video ID from watch URL:', videoId);
    }
  }
  
  // youtu.be/VIDEO_ID
  if (!videoId) {
    const shortMatch = url.match(/(?:youtu\.be\/)([^&\n?#]+)/);
    if (shortMatch && shortMatch[1]) {
      videoId = shortMatch[1].split('?')[0]; // Remove query params
      console.log('[YouTubeVideoCard] Found video ID from short URL:', videoId);
    }
  }
  
  // youtube.com/embed/VIDEO_ID
  if (!videoId) {
    const embedMatch = url.match(/(?:youtube\.com\/embed\/)([^&\n?#]+)/);
    if (embedMatch && embedMatch[1]) {
      videoId = embedMatch[1].split('?')[0]; // Remove query params
      console.log('[YouTubeVideoCard] Found video ID from embed URL:', videoId);
    }
  }
  
  // youtube.com/watch?feature=...&v=VIDEO_ID
  if (!videoId) {
    const watchParamMatch = url.match(/[?&]v=([^&\n?#]+)/);
    if (watchParamMatch && watchParamMatch[1]) {
      videoId = watchParamMatch[1];
      console.log('[YouTubeVideoCard] Found video ID from watch param:', videoId);
    }
  }
  
  if (videoId) {
    // YouTube embed parametreleri - "Tekrar İzle" ve "Abone Ol" butonlarını gizlemek için
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&controls=1&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0&autohide=1&loop=0&playlist=${videoId}&widget_referrer=${typeof window !== 'undefined' ? window.location.origin : ''}`;
    console.log('[YouTubeVideoCard] Generated embed URL:', embedUrl);
    return embedUrl;
  }

  // Eğer zaten embed URL ise, parametreleri güncelle
  if (url.includes('youtube.com/embed/')) {
    const baseUrl = url.split('?')[0];
    const videoIdFromUrl = baseUrl.split('/embed/')[1];
    const embedUrl = `${baseUrl}?rel=0&modestbranding=1&playsinline=1&controls=1&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0&autohide=1&loop=0&playlist=${videoIdFromUrl}&widget_referrer=${typeof window !== 'undefined' ? window.location.origin : ''}`;
    console.log('[YouTubeVideoCard] Using existing embed URL:', embedUrl);
    return embedUrl;
  }

  // Fallback: URL'yi olduğu gibi döndür
  console.warn('[YouTubeVideoCard] Could not parse YouTube URL:', url);
  return url;
}

// YouTube thumbnail URL'ini al
function getYouTubeThumbnailUrl(url: string): string {
  if (!url) return '';
  
  let videoId = '';
  
  // youtube.com/shorts/VIDEO_ID (YouTube Shorts)
  const shortsMatch = url.match(/(?:youtube\.com\/shorts\/)([^&\n?#]+)/);
  if (shortsMatch && shortsMatch[1]) {
    videoId = shortsMatch[1].split('?')[0]; // Remove query params
  }
  
  // youtube.com/watch?v=VIDEO_ID
  if (!videoId) {
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([^&\n?#]+)/);
    if (watchMatch && watchMatch[1]) {
      videoId = watchMatch[1];
    }
  }
  
  // youtu.be/VIDEO_ID
  if (!videoId) {
    const shortMatch = url.match(/(?:youtu\.be\/)([^&\n?#]+)/);
    if (shortMatch && shortMatch[1]) {
      videoId = shortMatch[1].split('?')[0]; // Remove query params
    }
  }
  
  // youtube.com/embed/VIDEO_ID
  if (!videoId) {
    const embedMatch = url.match(/(?:youtube\.com\/embed\/)([^&\n?#]+)/);
    if (embedMatch && embedMatch[1]) {
      videoId = embedMatch[1].split('?')[0]; // Remove query params
    }
  }
  
  // youtube.com/watch?feature=...&v=VIDEO_ID
  if (!videoId) {
    const watchParamMatch = url.match(/[?&]v=([^&\n?#]+)/);
    if (watchParamMatch && watchParamMatch[1]) {
      videoId = watchParamMatch[1];
    }
  }
  
  if (videoId) {
    // Try maxresdefault first, fallback to hqdefault if not available
    // hqdefault is more reliable, especially for YouTube Shorts
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }

  return '';
}

export function YouTubeVideoCard({ video, isPlaying: externalIsPlaying, onPlayChange, onHover }: YouTubeVideoCardProps) {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const cardRef = useRef<HTMLDivElement>(null);

  // YouTube URL'ini embed formatına çevir
  useEffect(() => {
    console.log('[YouTubeVideoCard] 🔄 Processing video:', {
      id: video.id,
      videoUrl: video.videoUrl,
      title: video.title
    });
    
    if (!video.videoUrl) {
      console.error('[YouTubeVideoCard] ❌ No video URL provided!');
      return;
    }
    
    const embed = getYouTubeEmbedUrl(video.videoUrl);
    console.log('[YouTubeVideoCard] ✅ Generated embed URL:', embed);
    
    if (!embed) {
      console.error('[YouTubeVideoCard] ❌ Failed to generate embed URL from:', video.videoUrl);
    }
    
    setEmbedUrl(embed);
    
    // Thumbnail URL'ini al - fallback ekle
    const thumb = video.thumbnailUrl || getYouTubeThumbnailUrl(video.videoUrl) || '/images/video-placeholder.jpg';
    console.log('[YouTubeVideoCard] Thumbnail URL:', thumb);
    setThumbnailUrl(thumb);
  }, [video.videoUrl, video.thumbnailUrl, video.id]);

  // External isPlaying prop'unu takip et
  useEffect(() => {
    console.log('[YouTubeVideoCard] External isPlaying changed:', externalIsPlaying, 'Current isPlaying:', isPlaying);
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

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    onPlayChange?.(newPlayingState);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[YouTubeVideoCard] Card clicked');
    console.log('[YouTubeVideoCard] Current state - isPlaying:', isPlaying, 'embedUrl:', embedUrl, 'videoUrl:', video.videoUrl);
    
    if (!embedUrl) {
      console.error('[YouTubeVideoCard] No embed URL available!');
      return;
    }
    
    if (!isPlaying) {
      console.log('[YouTubeVideoCard] Starting playback with embed URL:', embedUrl);
      setIsPlaying(true);
      onPlayChange?.(true);
    } else {
      console.log('[YouTubeVideoCard] Video is already playing');
    }
  };

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
      onClick={handleCardClick}
      onMouseEnter={() => {
        setIsHovered(true);
        onHover?.();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        // Hover timeout'unu temizle
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
      }}
    >
      {/* Video/Thumbnail - Tüm kartı kaplar */}
      <div className="absolute inset-0 w-full h-full">
        {isPlaying && embedUrl ? (
          <div className="w-full h-full" onClick={(e) => e.stopPropagation()}>
            <iframe
              ref={iframeRef}
              key={`iframe-${video.id}-${isPlaying}`} // Force re-render when playing state changes
              src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1&mute=0&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
              className="w-full h-full border-0 pointer-events-auto"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen={false}
              title={video.title || "YouTube video"}
              loading="eager"
              onLoad={() => {
                console.log('[YouTubeVideoCard] ✅ Iframe loaded successfully');
                console.log('[YouTubeVideoCard] Iframe URL:', embedUrl);
              }}
              onError={(e) => {
                console.error('[YouTubeVideoCard] ❌ Iframe error:', e);
              }}
              style={{ pointerEvents: 'auto' }}
            />
          </div>
        ) : (
          <>
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={video.title || "YouTube video thumbnail"}
                fill
                className="object-cover"
                onError={(e) => {
                  // Fallback to default thumbnail if hqdefault fails
                  const target = e.target as HTMLImageElement;
                  if (target.src.includes('hqdefault.jpg')) {
                    // Try mqdefault as fallback
                    const videoId = thumbnailUrl.match(/\/vi\/([^\/]+)\//)?.[1];
                    if (videoId) {
                      target.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                    }
                  } else if (target.src.includes('mqdefault.jpg')) {
                    // Final fallback to default
                    const videoId = thumbnailUrl.match(/\/vi\/([^\/]+)\//)?.[1];
                    if (videoId) {
                      target.src = `https://img.youtube.com/vi/${videoId}/default.jpg`;
                    }
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-black/40 flex items-center justify-center">
                <div className="text-center text-white/50">
                  <FontAwesomeIcon 
                    icon={faYoutube} 
                    className="w-16 h-16 mb-2"
                    style={{ color: '#FF0000' }}
                  />
                  <p className="text-sm">YouTube Video</p>
                </div>
              </div>
            )}
            {/* Play button overlay */}
            {!isPlaying && (
              <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 z-10"
                style={{ opacity: isHovered ? 1 : 0.8 }}
              >
                <div className="w-20 h-20 rounded-full bg-[#FF0000]/90 backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-[#FF0000] pointer-events-none"
                  style={{ 
                    boxShadow: '0 0 30px rgba(255, 0, 0, 0.6)',
                  }}
                >
                  <Play size={32} className="text-white ml-1" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Üst overlay - YouTube benzeri minimal bilgiler */}
      {!isPlaying && (
        <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon 
                icon={faYoutube} 
                className="w-5 h-5"
                style={{ color: '#FF0000' }}
              />
              <span className="text-white text-sm font-semibold">{video.author || 'YouTube'}</span>
            </div>
          </div>
          {video.title && (
            <p className="text-white text-sm mt-2 line-clamp-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              {video.title}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

