'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Article } from '@/lib/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Loader2, Play, Pause, ArrowRight, Maximize, Minimize } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { BreakingNewsTicker } from './BreakingNewsTicker';

export function NewsSlider() {
  const [api, setApi] = useState<CarouselApi>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const defaultImage = PlaceHolderImages.find((p) => p.id === 'breaking-news');

  useEffect(() => {
    const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const articlesData: Article[] = [];
      querySnapshot.forEach((doc) => {
        articlesData.push({ id: doc.id, ...doc.data() } as Article);
      });
      setArticles(articlesData);
      setLoading(false);
    });
    return () => unsubscribe();
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
      // Clear previous timeout
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

    // Start the first timeout
    onSelect();

    return () => {
      clearTimeout(timeout);
      api.off('select', onSelect);
      api.off('reInit', onSelect);
    };
  }, [api, articles, isPlaying]);

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
          {articles.map((article) => (
            <CarouselItem key={article.id}>
              {article.imageUrl ? (
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
          ))}
        </CarouselContent>
        <div className="absolute bottom-12 right-5 z-10 flex items-center gap-2">
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
      <div className="absolute bottom-0 left-0 right-0">
        <BreakingNewsTicker />
      </div>
    </div>
  );
}
