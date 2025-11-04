"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { TickerMessage } from "@/lib/types";
import { Flame } from "lucide-react";

export function BreakingNewsTicker() {
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);

  useEffect(() => {
    const q = query(collection(db, "ticker_messages"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages: TickerMessage[] = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as TickerMessage);
      });
      setTickerMessages(messages);
    });

    return () => unsubscribe();
  }, []);

  if (tickerMessages.length === 0) {
    return null;
  }

  const tickerText = tickerMessages.map((msg) => msg.message).join(" ••• ");

  return (
    <div className="flex h-10 items-center overflow-hidden bg-destructive text-destructive-foreground">
      <style jsx>{`
        .ticker-wrap {
          position: relative;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
        }
        .ticker-move {
          display: flex;
          white-space: nowrap;
          animation: ticker 30s linear infinite;
        }
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>

      <div className="ticker-wrap">
        <div className="ticker-move">
          {/* 🔥 Contenido duplicado para un bucle perfecto */}
          <span className="inline-flex items-center">
            <Flame className="mx-4 h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-semibold">{tickerText}</span>
          </span>
          <span className="inline-flex items-center">
            <Flame className="mx-4 h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-semibold">{tickerText}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

