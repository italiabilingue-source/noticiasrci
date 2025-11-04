"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { Loader2 } from 'lucide-react';
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NewsSlider() {
  const [api, setApi] = useState<CarouselApi>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const defaultImage = PlaceHolderImages.find(p => p.id === 'breaking-news');

  useEffect(() => {
    const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
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

  useEffect(() => {
    if (!api || articles.length === 0) return;

    let timeout: NodeJS.Timeout;

    const onSelect = () => {
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
  }, [api, articles]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Carousel setApi={setApi} className="h-screen w-screen" opts={{ loop: true }}>
      <CarouselContent>
        {articles.map((article) => (
          <CarouselItem key={article.id}>
            <div className="relative h-screen w-screen">
              <Image
                src={article.imageUrl || defaultImage?.imageUrl || ''}
                alt={article.title}
                fill
                className="object-cover"
                priority
                data-ai-hint={defaultImage?.imageHint || 'news abstract'}
              />
              <div className="absolute inset-0 bg-black/50" />
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <Card className="max-w-3xl bg-black/60 text-white border-white/20 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-4xl md:text-6xl font-bold font-headline leading-tight">
                            {article.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg md:text-xl text-white/80">
                            {article.content}
                        </p>
                    </CardContent>
                </Card>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
