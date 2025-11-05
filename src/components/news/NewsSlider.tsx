'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Article, PlayerSettings } from '@/lib/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Loader2, Play, Pause, ArrowRight, Maximize, Minimize } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';

const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const getYouTubePlaylistId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /[?&]list=([^#&?]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
};

const isVideoUrl = (url: string): boolean => {
    if(!url) return false;
    return url.match(/\.(mp4|webm|ogg)$/i) !== null;
}

const getSpotifyEmbedUrl = (url: string): string | null => {
    if (!url || !url.includes('spotify.com')) return null;
    try {
        const urlObject = new URL(url);
        const pathnameParts = urlObject.pathname.split('/');
        const typeIndex = pathnameParts.findIndex(part => part === 'playlist' || part === 'album' || part === 'track' || part === 'artist');
        
        if (typeIndex === -1 || typeIndex + 1 >= pathnameParts.length) {
            return null;
        }

        const embedType = pathnameParts[typeIndex];
        const embedId = pathnameParts[typeIndex + 1];

        if (!embedId) return null;

        return `https://open.spotify.com/embed/${embedType}/${embedId}?utm_source=generator&theme=0`;
    } catch (error) {
        console.error("Invalid URL for Spotify embed", error);
        return null;
    }
};


export function NewsSlider() {
  const [api, setApi] = useState<CarouselApi>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [playerSettings, setPlayerSettings] = useState<PlayerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const defaultImage = PlaceHolderImages.find((p) => p.id === 'breaking-news');

  useEffect(() => {
    const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
    const unsubscribeArticles = onSnapshot(q, (querySnapshot) => {
      const articlesData: Article[] = [];
      querySnapshot.forEach((doc) => {
        articlesData.push({ id: doc.id, ...doc.data() } as Article);
      });
      setArticles(articlesData);
      setLoading(false);
    });

    const settingsRef = doc(db, "player_settings", "main");
    const unsubscribePlayer = onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data() as PlayerSettings;
            setPlayerSettings(data);
        } else {
            setPlayerSettings(null);
        }
    });

    return () => {
        unsubscribeArticles();
        unsubscribePlayer();
    };
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const scrollNext = useCallback(() => {
    api?.scrollNext();
  }, [api]);
  
  const toggleFullscreen = () => {
    if (!sliderRef.current) return;

    if (!document.fullscreenElement) {
        sliderRef.current.requestFullscreen().catch(err => {
            alert(`Error al intentar activar el modo de pantalla completa: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);


  useEffect(() => {
    if (!api || articles.length === 0 || !isPlaying) return;

    let timeout: NodeJS.Timeout;

    const onSelect = () => {
      clearTimeout(timeout);
      
      const selectedIndex = api.selectedScrollSnap();
      const article = articles[selectedIndex];
      const duration = (article?.duration || 10) * 1000;

      timeout = setTimeout(() => {
        api.scrollNext();
      }, duration);
    };

    api.on('select', onSelect);
    api.on('reInit', onSelect);
    onSelect();

    return () => {
      clearTimeout(timeout);
      api.off('select', onSelect);
      api.off('reInit', onSelect);
    };
  }, [api, articles, isPlaying]);

  const musicUrl = playerSettings?.musicUrl || '';
  const spotifyEmbedUrl = getSpotifyEmbedUrl(musicUrl);
  const youtubePlaylistId = getYouTubePlaylistId(musicUrl);

  const MusicPlayer = () => {
    if (spotifyEmbedUrl) {
      return (
        <iframe
          style={{ borderRadius: '12px' }}
          src={spotifyEmbedUrl}
          width="300"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
      );
    }
    if (youtubePlaylistId) {
      return (
         <iframe 
            width="300" 
            height="80" 
            src={`https://www.youtube.com/embed/videoseries?list=${youtubePlaylistId}&autoplay=1&mute=0&loop=1`}
            frameBorder="0" 
            allow="autoplay; encrypted-media" 
            allowFullScreen
          ></iframe>
      );
    }
    return null;
  };


  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <span className="sr-only">Cargando...</span>
      </div>
    );
  }

  return (
    <div ref={sliderRef} className="bg-black relative h-screen w-screen">
      <Carousel setApi={setApi} className="h-full w-full" opts={{ loop: true }}>
        <CarouselContent>
          {articles.map((article) => {
            const youtubeVideoId = getYouTubeVideoId(article.imageUrl);
            const isDirectVideo = isVideoUrl(article.imageUrl);

            return (
              <CarouselItem key={article.id}>
                {youtubeVideoId ? (
                  <div className="relative h-screen w-screen">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=1&loop=1&playlist=${youtubeVideoId}&controls=0&showinfo=0&autohide=1&modestbranding=1`}
                      frameBorder="0"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      className="h-full w-full"
                    ></iframe>
                  </div>
                ) : isDirectVideo ? (
                    <div className="relative h-screen w-screen">
                        <video 
                            src={article.imageUrl}
                            autoPlay
                            loop
                            muted
                            className="h-full w-full object-cover"
                        ></video>
                    </div>
                ) : article.imageUrl ? (
                  <div className="relative h-screen w-screen">
                    <Image
                      src={article.imageUrl}
                      alt={article.title || 'Noticia sin título'}
                      fill
                      className="object-cover"
                      priority
                      data-ai-hint={defaultImage?.imageHint || 'news abstract'}
                    />
                  </div>
                ) : (
                  <div className="relative h-screen w-screen bg-card flex flex-col items-center justify-center p-8 text-center">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold font-headline mb-8 text-card-foreground">{article.title}</h1>
                    <p className="text-xl md:text-2xl lg:text-3xl xl:text-4xl text-card-foreground whitespace-pre-wrap">{article.content}</p>
                  </div>
                )}
              </CarouselItem>
            );
          })}
        </CarouselContent>
        
        {(spotifyEmbedUrl || youtubePlaylistId) && (
            <div className="absolute bottom-5 left-5 z-10">
                <MusicPlayer />
            </div>
        )}

        <div className="absolute bottom-5 right-5 z-10 flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={togglePlay} className="bg-black/50 border-white/20 text-white hover:bg-white/20 hover:text-white">
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                <span className="sr-only">{isPlaying ? "Pausar" : "Reproducir"}</span>
            </Button>
            <Button variant="outline" size="icon" onClick={scrollNext} className="bg-black/50 border-white/20 text-white hover:bg-white/20 hover:text-white">
                <ArrowRight className="h-5 w-5" />
                <span className="sr-only">Siguiente</span>
            </Button>
            <Button variant="outline" size="icon" onClick={toggleFullscreen} className="bg-black/50 border-white/20 text-white hover:bg-white/20 hover:text-white">
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                <span className="sr-only">{isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}</span>
            </Button>
        </div>
      </Carousel>
    </div>
  );
}
