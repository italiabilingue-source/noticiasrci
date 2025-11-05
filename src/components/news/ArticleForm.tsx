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
  image: z.instanceof(File).nullable().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  duration: z.coerce.number().int().positive("La duración debe ser un número positivo de segundos.").default(10),
});

type ArticleFormProps = {
  onSubmit: (data: ArticleFormData) => Promise<void>;
  initialData?: Article | null;
  isSubmitting: boolean;
};

export function ArticleForm({ onSubmit, initialData, isSubmitting }: ArticleFormProps) {
  const [preview, setPreview] = useState<string | null>(initialData?.imageUrl || null);
  
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

  const imageRef = form.register("image");
  const currentImage = form.watch("image");

  useEffect(() => {
    if (currentImage && currentImage.length > 0) {
      const file = currentImage[0];
      setPreview(URL.createObjectURL(file));
    } else if (initialData?.imageUrl) {
        setPreview(initialData.imageUrl);
    } else {
        setPreview(null);
    }
  }, [currentImage, initialData]);

  const handleSubmit = (data: ArticleFormData) => {
    const formData: ArticleFormData = {
        ...data,
        image: data.image ? data.image[0] : null,
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
        <FormItem>
            <FormLabel>Imagen</FormLabel>
            <FormControl>
                <Input type="file" accept="image/*" {...imageRef} />
            </FormControl>
             <FormMessage />
        </FormItem>
        
        {preview && (
            <div className="mt-4">
                <p className="text-sm font-medium">Vista previa de la imagen:</p>
                <div className="relative w-full h-48 mt-2 rounded-md overflow-hidden border">
                    <Image src={preview} alt="Vista previa" layout="fill" objectFit="cover" />
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
