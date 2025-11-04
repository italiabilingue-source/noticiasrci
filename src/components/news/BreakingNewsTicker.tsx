"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Article } from "@/lib/types";
import { Flame } from "lucide-react";

export function BreakingNewsTicker() {
  const [importantArticles, setImportantArticles] = useState<Article[]>([]);

  useEffect(() => {
    const q = query(collection(db, "articles"), where("isImportant", "==", true));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const articles: Article[] = [];
      querySnapshot.forEach((doc) => {
        articles.push({ id: doc.id, ...doc.data() } as Article);
      });
      setImportantArticles(articles);
    });

    return () => unsubscribe();
  }, []);

  if (importantArticles.length === 0) {
    return null;
  }

  const tickerText = importantArticles.map((article) => article.title).join(" ••• ");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-10 items-center overflow-hidden bg-destructive text-destructive-foreground">
      <style jsx>{`
        .ticker-wrap {
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
        }
        .ticker-move {
          display: inline-block;
          white-space: nowrap;
          padding-right: 100%;
          animation: ticker 30s linear infinite;
        }
        @keyframes ticker {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-100%, 0, 0);
          }
        }
      `}</style>
      <div className="ticker-wrap">
        <div className="ticker-move flex items-center">
            <Flame className="mx-4 h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-semibold">{tickerText}</span>
        </div>
        <div className="ticker-move flex items-center" aria-hidden="true">
            <Flame className="mx-4 h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-semibold">{tickerText}</span>
        </div>
      </div>
    </div>
  );
}
