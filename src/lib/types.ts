import type { Timestamp } from "firebase/firestore";

export interface Article {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  isImportant: boolean;
  duration: number;
  createdAt: Timestamp;
}

export type ArticleData = Omit<Article, "id" | "createdAt">;
