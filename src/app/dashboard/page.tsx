"use client";

import { useState, useEffect, useMemo } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  writeBatch,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import AuthGuard from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArticleForm } from "@/components/news/ArticleForm";
import { TickerForm } from "@/components/news/TickerForm";
import { MultipleImagesForm } from "@/components/news/MultipleImagesForm";
import { SpotifyForm } from "@/components/news/SpotifyForm";
import { DataTable } from "./data-table";
import { getColumns as getArticleColumns } from "./columns";
import { getColumns as getTickerColumns } from "./ticker-columns";
import type { Article, ArticleData, TickerMessage, TickerMessageData, ArticleFormData, MultipleImagesFormData, PlayerSettings, PlayerSettingsData } from "@/lib/types";
import { PlusCircle, UploadCloud } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


function DashboardClient() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);
  const [playerSettings, setPlayerSettings] = useState<PlayerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const [isTickerDialogOpen, setIsTickerDialogOpen] = useState(false);
  const [editingTicker, setEditingTicker] = useState<TickerMessage | null>(null);
  
  const [isMultiUploadOpen, setIsMultiUploadOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    let active = true;

    const qArticles = query(collection(db, "articles"), orderBy("createdAt", "desc"));
    const unsubscribeArticles = onSnapshot(
      qArticles,
      (snapshot) => {
        if (!active) return;
        const articlesData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Article)
        );
        setArticles(articlesData);
        if(loading) setLoading(false);
      },
      (error) => {
        console.error("Error al obtener artículos:", error);
        toast({ title: "Error", description: "No se pudieron obtener los artículos.", variant: "destructive" });
        if(active) setLoading(false);
      }
    );

    const qTicker = query(collection(db, "ticker_messages"), orderBy("createdAt", "desc"));
    const unsubscribeTicker = onSnapshot(
      qTicker,
      (snapshot) => {
         if (!active) return;
        const tickerData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as TickerMessage)
        );
        setTickerMessages(tickerData);
        if(loading) setLoading(false);
      },
      (error) => {
        console.error("Error al obtener mensajes del cintillo:", error);
        toast({ title: "Error", description: "No se pudieron obtener los mensajes del cintillo.", variant: "destructive" });
        if(active) setLoading(false);
      }
    );

    const playerSettingsRef = doc(db, "player_settings", "main");
    const unsubscribePlayer = onSnapshot(playerSettingsRef, (doc) => {
        if (!active) return;
        if (doc.exists()) {
            setPlayerSettings({ id: doc.id, ...doc.data() } as PlayerSettings);
        } else {
            setPlayerSettings({ currentSpotifyPlaylistUrl: "" });
        }
    }, (error) => {
        console.error("Error fetching player settings:", error);
        toast({ title: "Error", description: "No se pudieron obtener los ajustes del reproductor.", variant: "destructive" });
    });


    return () => {
      active = false;
      unsubscribeArticles();
      unsubscribeTicker();
      unsubscribePlayer();
    };
  }, [toast, loading]);

  const handleArticleFormSubmit = async (data: ArticleFormData) => {
    setIsSubmitting(true);
    try {
      let imageUrl = data.imageUrl || "";

      // If a new image is uploaded, it takes precedence
      if (data.image) {
        const imageRef = ref(storage, `articles/${Date.now()}_${data.image.name}`);
        const snapshot = await uploadBytes(imageRef, data.image);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const articleData: ArticleData = {
        title: data.title || "",
        content: data.content || "",
        imageUrl: imageUrl,
        duration: data.duration || 10,
      };

      if (editingArticle) {
        // If editing, use existing imageUrl if no new one is provided and no file is uploaded
        if (!data.image && !data.imageUrl) {
            articleData.imageUrl = editingArticle.imageUrl || "";
        }
        const articleRef = doc(db, "articles", editingArticle.id);
        await updateDoc(articleRef, articleData);
        toast({ title: "Éxito", description: "Artículo actualizado correctamente." });
      } else {
        await addDoc(collection(db, "articles"), { ...articleData, createdAt: serverTimestamp() });
        toast({ title: "Éxito", description: "Artículo creado correctamente." });
      }
      setIsArticleDialogOpen(false);
      setEditingArticle(null);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "No se pudo guardar el artículo.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMultipleImagesSubmit = async (data: MultipleImagesFormData) => {
    if (!data.images || data.images.length === 0) {
        toast({ title: "Atención", description: "Por favor, selecciona al menos un archivo.", variant: "default" });
        return;
    }
    
    setIsSubmitting(true);
    const imageFiles = Array.from(data.images);
    const totalFiles = imageFiles.length;
    let filesUploaded = 0;

    toast({ title: "Iniciando subida", description: `Subiendo ${totalFiles} archivos...` });

    try {
        for (const image of imageFiles) {
            const imageRef = ref(storage, `articles/${Date.now()}_${image.name}`);
            const snapshot = await uploadBytes(imageRef, image);
            const imageUrl = await getDownloadURL(snapshot.ref);

            const articleData: ArticleData = {
                title: "",
                content: "",
                imageUrl: imageUrl,
                duration: data.duration || 10,
            };

            await addDoc(collection(db, "articles"), { ...articleData, createdAt: serverTimestamp() });
            filesUploaded++;
            toast({
              title: `Progreso: ${filesUploaded}/${totalFiles}`,
              description: `Archivo ${image.name} subido correctamente.`,
            });
        }
        toast({ title: "Éxito", description: "Todos los archivos se han subido y guardado." });
        setIsMultiUploadOpen(false);
    } catch (error) {
        console.error("Error en la subida múltiple:", error);
        toast({ title: "Error", description: "Ocurrió un error durante la subida de uno o más archivos.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };


  const handleTickerFormSubmit = async (data: TickerMessageData) => {
    setIsSubmitting(true);
    try {
      if (editingTicker) {
        const tickerRef = doc(db, "ticker_messages", editingTicker.id);
        await updateDoc(tickerRef, data);
        toast({ title: "Éxito", description: "Mensaje actualizado correctamente." });
      } else {
        await addDoc(collection(db, "ticker_messages"), { ...data, createdAt: serverTimestamp() });
        toast({ title: "Éxito", description: "Mensaje creado correctamente." });
      }
      setIsTickerDialogOpen(false);
      setEditingTicker(null);
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar el mensaje.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSpotifyFormSubmit = async (data: PlayerSettingsData) => {
    setIsSubmitting(true);
    try {
        const settingsRef = doc(db, "player_settings", "main");
        await setDoc(settingsRef, data, { merge: true });
        toast({ title: "Éxito", description: "La playlist de Spotify ha sido actualizada." });
    } catch (error) {
        console.error("Error updating spotify playlist", error);
        toast({ title: "Error", description: "No se pudo actualizar la playlist de Spotify.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setIsArticleDialogOpen(true);
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este artículo?")) {
      try {
        await deleteDoc(doc(db, "articles", articleId));
        toast({ title: "Éxito", description: "Artículo eliminado correctamente." });
      } catch (error) {
        toast({ title: "Error", description: "No se pudo eliminar el artículo.", variant: "destructive" });
      }
    }
  };

  const handleDeleteSelectedArticles = async (articleIds: string[]) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar ${articleIds.length} artículos?`)) {
      try {
        const batch = writeBatch(db);
        articleIds.forEach(id => {
            const docRef = doc(db, "articles", id);
            batch.delete(docRef);
        });
        await batch.commit();
        toast({ title: "Éxito", description: `${articleIds.length} artículos eliminados correctamente.` });
      } catch (error) {
        toast({ title: "Error", description: "No se pudieron eliminar los artículos.", variant: "destructive" });
      }
    }
  };
  
  const handleEditTicker = (ticker: TickerMessage) => {
    setEditingTicker(ticker);
    setIsTickerDialogOpen(true);
  };

  const handleDeleteTicker = async (tickerId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este mensaje?")) {
      try {
        await deleteDoc(doc(db, "ticker_messages", tickerId));
        toast({ title: "Éxito", description: "Mensaje eliminado correctamente." });
      } catch (error) {
        toast({ title: "Error", description: "No se pudo eliminar el mensaje.", variant: "destructive" });
      }
    }
  };


  const articleColumns = useMemo(() => getArticleColumns(handleEditArticle, handleDeleteArticle), []);
  const tickerColumns = useMemo(() => getTickerColumns(handleEditTicker, handleDeleteTicker), []);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold tracking-tighter font-headline">Panel de Control</h1>
      </div>
      
      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="articles">Artículos</TabsTrigger>
            <TabsTrigger value="ticker">Cintillo</TabsTrigger>
            <TabsTrigger value="multi-upload">Subida Múltiple</TabsTrigger>
            <TabsTrigger value="spotify">Música</TabsTrigger>
        </TabsList>
        <TabsContent value="articles">
            <div className="flex justify-end my-4">
                <Dialog open={isArticleDialogOpen} onOpenChange={(open) => {
                    setIsArticleDialogOpen(open);
                    if (!open) setEditingArticle(null);
                    }}>
                    <DialogTrigger asChild>
                        <Button>
                        <PlusCircle className="mr-2" />
                        Nuevo Artículo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[625px]">
                        <DialogHeader>
                        <DialogTitle>{editingArticle ? "Editar Artículo" : "Crear Nuevo Artículo"}</DialogTitle>
                        </DialogHeader>
                        <ArticleForm
                        onSubmit={handleArticleFormSubmit}
                        initialData={editingArticle}
                        isSubmitting={isSubmitting}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            {loading ? <p>Cargando artículos...</p> : <DataTable columns={articleColumns} data={articles} onDeleteSelected={handleDeleteSelectedArticles} />}
        </TabsContent>
        <TabsContent value="ticker">
             <div className="flex justify-end my-4">
                <Dialog open={isTickerDialogOpen} onOpenChange={(open) => {
                    setIsTickerDialogOpen(open);
                    if (!open) setEditingTicker(null);
                    }}>
                    <DialogTrigger asChild>
                        <Button>
                        <PlusCircle className="mr-2" />
                        Nuevo Mensaje
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[625px]">
                        <DialogHeader>
                        <DialogTitle>{editingTicker ? "Editar Mensaje" : "Crear Nuevo Mensaje"}</DialogTitle>
                        </DialogHeader>
                        <TickerForm
                            onSubmit={handleTickerFormSubmit}
                            initialData={editingTicker}
                            isSubmitting={isSubmitting}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            {loading ? <p>Cargando mensajes...</p> : <DataTable columns={tickerColumns} data={tickerMessages} onDeleteSelected={() => {}} />}
        </TabsContent>
        <TabsContent value="multi-upload">
          <div className="flex justify-center my-4">
            <Dialog open={isMultiUploadOpen} onOpenChange={setIsMultiUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg">
                  <UploadCloud className="mr-2" />
                  Seleccionar Archivos para Subir
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>Subida Múltiple de Imágenes/Videos</DialogTitle>
                </DialogHeader>
                <MultipleImagesForm
                  onSubmit={handleMultipleImagesSubmit}
                  isSubmitting={isSubmitting}
                />
              </DialogContent>
            </Dialog>
          </div>
           <div className="text-center text-muted-foreground">
                <p>Usa esta sección para subir varias imágenes o videos a la vez.</p>
                <p>Cada archivo se convertirá en una diapositiva en el carrusel principal.</p>
            </div>
        </TabsContent>
        <TabsContent value="spotify">
            <div className="max-w-md mx-auto my-8">
                 <h2 className="text-2xl font-bold mb-4">Control de Spotify</h2>
                 <p className="text-muted-foreground mb-6">
                    Pega aquí la URL de una playlist de Spotify para que se reproduzca en la página principal.
                 </p>
                {playerSettings ? (
                    <SpotifyForm 
                        onSubmit={handleSpotifyFormSubmit}
                        initialData={playerSettings}
                        isSubmitting={isSubmitting}
                    />
                ) : (
                    <p>Cargando configuración de Spotify...</p>
                )}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardClient />
    </AuthGuard>
  );
}

    