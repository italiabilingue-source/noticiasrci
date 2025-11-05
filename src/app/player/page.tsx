"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PlayerSettings } from '@/lib/types';
import { Loader2 } from 'lucide-react';

// Función para transformar la URL de Spotify a una URL para el embed
const getSpotifyEmbedUrl = (url: string): string | null => {
    try {
        const urlObject = new URL(url);
        // spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
        // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...
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


export default function PlayerPage() {
    const [playerSettings, setPlayerSettings] = useState<PlayerSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const settingsRef = doc(db, "player_settings", "main");
        const unsubscribe = onSnapshot(settingsRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data() as PlayerSettings;
                setPlayerSettings(data);
                setError(null);
            } else {
                setError("No se encontró la configuración del reproductor. Por favor, configura una playlist en el dashboard.");
                setPlayerSettings(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching player settings:", err);
            setError("Error al cargar la configuración del reproductor.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const embedUrl = playerSettings?.currentSpotifyPlaylistUrl 
        ? getSpotifyEmbedUrl(playerSettings.currentSpotifyPlaylistUrl) 
        : null;

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <span className="ml-4 text-lg">Cargando reproductor...</span>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background text-destructive-foreground p-8">
                <p className="text-center text-lg">{error}</p>
            </div>
        )
    }

    if (!embedUrl) {
         return (
            <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground p-8">
                <p className="text-center text-lg">La URL de Spotify no es válida o no está configurada. Revísala en el dashboard.</p>
            </div>
        )
    }

    return (
        <div className="h-screen w-screen bg-black">
            <iframe
                style={{ borderRadius: '12px' }}
                src={embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen={true}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
            ></iframe>
        </div>
    );
}
