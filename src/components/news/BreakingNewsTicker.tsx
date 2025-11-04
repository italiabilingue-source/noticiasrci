"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { TickerMessage } from "@/lib/types";
import { Flame } from "lucide-react";
import { usePathname } from "next/navigation";

export function BreakingNewsTicker() {
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);
  const pathname = usePathname();

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

  // Solo mostrar en la página principal
  if (pathname !== '/' || tickerMessages.length === 0) {
    return null;
  }

  const tickerText = tickerMessages.map((msg) => msg.message).join(" ••• ");

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
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          animation: ticker 30s linear infinite;
        }
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
      <div className="ticker-wrap">
        <div className="ticker-move">
            <Flame className="mx-4 h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-semibold">{tickerText}</span>
        </div>
        <div className="ticker-move" aria-hidden="true">
            <Flame className="mx-4 h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-semibold">{tickerText}</span>
        </div>
      </div>
    </div>
  );
}
