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
import { db } from "@/lib/firebase";
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
import { DataTable } from "./data-table";
import { getColumns } from "./columns";
import type { Article, ArticleData } from "@/lib/types";
import { PlusCircle } from "lucide-react";

function DashboardClient() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const articlesData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Article)
        );
        setArticles(articlesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error al obtener artículos:", error);
        toast({ title: "Error", description: "No se pudieron obtener los artículos.", variant: "destructive" });
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [toast]);

  const handleFormSubmit = async (data: ArticleData) => {
    setIsSubmitting(true);
    try {
      if (editingArticle) {
        const articleRef = doc(db, "articles", editingArticle.id);
        await updateDoc(articleRef, data);
        toast({ title: "Éxito", description: "Artículo actualizado correctamente." });
      } else {
        await addDoc(collection(db, "articles"), { ...data, createdAt: serverTimestamp() });
        toast({ title: "Éxito", description: "Artículo creado correctamente." });
      }
      setIsDialogOpen(false);
      setEditingArticle(null);
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar el artículo.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setIsDialogOpen(true);
  };

  const handleDelete = async (articleId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este artículo?")) {
      try {
        await deleteDoc(doc(db, "articles", articleId));
        toast({ title: "Éxito", description: "Artículo eliminado correctamente." });
      } catch (error) {
        toast({ title: "Error", description: "No se pudo eliminar el artículo.", variant: "destructive" });
      }
    }
  };
  
  const columns = useMemo(() => getColumns(handleEdit, handleDelete), []);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold tracking-tighter font-headline">Panel de Control</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
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
              onSubmit={handleFormSubmit}
              initialData={editingArticle}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </div>
      {loading ? <p>Cargando artículos...</p> : <DataTable columns={columns} data={articles} />}
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
