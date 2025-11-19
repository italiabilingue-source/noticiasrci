"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ArticleFormData, Article } from "@/lib/types";

const formSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  image: z.any().optional(),
  imageUrl: z.string().url("URL inválida").optional().or(z.literal('')),
  duration: z.coerce.number().int().positive("La duración debe ser un número positivo de segundos.").default(10),
});

type ArticleFormProps = {
  onSubmit: (data: ArticleFormData) => Promise<void>;
  initialData?: Article | null;
  isSubmitting: boolean;
};

const isVideoUrl = (url: string): boolean => {
    if(!url) return false;
    // Check for common video file extensions
    return url.match(/\.(mp4|webm|ogg)$/i) !== null;
}

const isVideoType = (type: string): boolean => {
    return type.startsWith('video/');
}

export function ArticleForm({ onSubmit, initialData, isSubmitting }: ArticleFormProps) {
  const [preview, setPreview] = useState<string | null>(initialData?.imageUrl || null);
  const [previewType, setPreviewType] = useState<'image' | 'video' | null>(null);
  
  const form = useForm<ArticleFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      image: null,
      imageUrl: initialData?.imageUrl || "",
      duration: initialData?.duration || 10,
    },
  });

  const imageFile = form.watch("image");
  const currentImageUrl = form.watch("imageUrl");

  useEffect(() => {
    let objectUrl: string | null = null;
    
    if (imageFile && imageFile.length > 0) {
      const file = imageFile[0];
      objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      if (isVideoType(file.type)) {
        setPreviewType('video');
      } else {
        setPreviewType('image');
      }
    } else if (currentImageUrl) {
      setPreview(currentImageUrl);
      if (isVideoUrl(currentImageUrl)) {
          setPreviewType('video');
      } else {
          setPreviewType('image');
      }
    } else if (initialData?.imageUrl) {
      setPreview(initialData.imageUrl);
       if (isVideoUrl(initialData.imageUrl)) {
          setPreviewType('video');
      } else {
          setPreviewType('image');
      }
    } else {
      setPreview(null);
      setPreviewType(null);
    }
    
    return () => {
        if(objectUrl) URL.revokeObjectURL(objectUrl);
    }

  }, [imageFile, currentImageUrl, initialData]);

  const handleSubmit = (data: ArticleFormData) => {
    const formData: ArticleFormData = {
        ...data,
        image: data.image && data.image.length > 0 ? data.image[0] : null,
    };
    onSubmit(formData);
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Introduce el título del artículo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenido</FormLabel>
              <FormControl>
                <Textarea placeholder="Introduce el contenido del artículo" className="min-h-[120px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="image"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
                <FormLabel>Subir Imagen o Video (prioridad sobre URL)</FormLabel>
                <FormControl>
                    <Input 
                        type="file" 
                        accept="image/*,video/*" 
                        onChange={(e) => onChange(e.target.files)}
                        {...rest}
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de Imagen o Video de YouTube</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {preview && (
            <div className="mt-4">
                <p className="text-sm font-medium">Vista previa:</p>
                <div className="relative w-full aspect-video mt-2 rounded-md overflow-hidden border">
                    {previewType === 'image' && <Image src={preview} alt="Vista previa" fill objectFit="cover" />}
                    {previewType === 'video' && <video src={preview} autoPlay loop muted className="w-full h-full object-cover" />}
                </div>
            </div>
        )}

        <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duración en carrusel (s)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar Artículo"}
        </Button>
      </form>
    </Form>
  );
}
