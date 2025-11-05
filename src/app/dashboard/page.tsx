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
import { DataTable } from "./data-table";
import { getColumns as getArticleColumns } from "./columns";
import { getColumns as getTickerColumns } from "./ticker-columns";
import type { Article, ArticleData, TickerMessage, TickerMessageData, ArticleFormData } from "@/lib/types";
import { PlusCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


function DashboardClient() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const [isTickerDialogOpen, setIsTickerDialogOpen] = useState(false);
  const [editingTicker, setEditingTicker] = useState<TickerMessage | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const qArticles = query(collection(db, "articles"), orderBy("createdAt", "desc"));
    const unsubscribeArticles = onSnapshot(
      qArticles,
      (snapshot) => {
        const articlesData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Article)
        );
        setArticles(articlesData);
        if(loading) setLoading(false);
      },
      (error) => {
        console.error("Error al obtener artículos:", error);
        toast({ title: "Error", description: "No se pudieron obtener los artículos.", variant: "destructive" });
        setLoading(false);
      }
    );

    const qTicker = query(collection(db, "ticker_messages"), orderBy("createdAt", "desc"));
    const unsubscribeTicker = onSnapshot(
      qTicker,
      (snapshot) => {
        const tickerData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as TickerMessage)
        );
        setTickerMessages(tickerData);
        if(loading) setLoading(false);
      },
      (error) => {
        console.error("Error al obtener mensajes del cintillo:", error);
        toast({ title: "Error", description: "No se pudieron obtener los mensajes del cintillo.", variant: "destructive" });
        setLoading(false);
      }
    );


    return () => {
      unsubscribeArticles();
      unsubscribeTicker();
    };
  }, [toast, loading]);

  const handleArticleFormSubmit = async (data: ArticleFormData) => {
    setIsSubmitting(true);
    try {
      let imageUrl = editingArticle?.imageUrl || "";

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
      
      <Tabs defaultValue="articles">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="articles">Artículos de Noticias</TabsTrigger>
            <TabsTrigger value="ticker">Mensajes del Cintillo</TabsTrigger>
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
            {loading ? <p>Cargando artículos...</p> : <DataTable columns={articleColumns} data={articles} />}
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
            {loading ? <p>Cargando mensajes...</p> : <DataTable columns={tickerColumns} data={tickerMessages} />}
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
