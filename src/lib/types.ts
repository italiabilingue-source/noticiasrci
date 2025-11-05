import type { Timestamp } from "firebase/firestore";

export interface Article {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: Timestamp;
  duration: number;
}

export type ArticleFormData = {
  title?: string;
  content?: string;
  image?: File | null;
  imageUrl?: string;
  duration?: number;
};

export type MultipleImagesFormData = {
    images: FileList | null;
    duration?: number;
};


export type ArticleData = Omit<Article, "id" | "createdAt">;

export interface TickerMessage {
  id: string;
  message: string;
  createdAt: Timestamp;
}

export type TickerMessageData = Omit<TickerMessage, 'id' | 'createdAt'>;

export interface PlayerSettings {
    id?: string;
    musicUrl: string;
}

export type PlayerSettingsData = Omit<PlayerSettings, 'id'>;