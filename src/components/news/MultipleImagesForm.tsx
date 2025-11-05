"use client";

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
import type { MultipleImagesFormData } from "@/lib/types";
import { useState } from "react";

const formSchema = z.object({
  images: z.custom<FileList>().refine(files => files && files.length > 0, 'Debes seleccionar al menos un archivo.'),
  duration: z.coerce.number().int().positive("La duración debe ser un número positivo de segundos.").default(10),
});

type MultipleImagesFormProps = {
  onSubmit: (data: MultipleImagesFormData) => Promise<void>;
  isSubmitting: boolean;
};

export function MultipleImagesForm({ onSubmit, isSubmitting }: MultipleImagesFormProps) {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      images: null,
      duration: 10,
    },
  });

  const imagesRef = form.register("images");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
        const files = Array.from(event.target.files);
        setFileNames(files.map(file => file.name));
        form.setValue("images", event.target.files);
    }
  };

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit({
        images: data.images,
        duration: data.duration,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormItem>
            <FormLabel>Subir Imágenes/Videos</FormLabel>
            <FormControl>
                <Input type="file" accept="image/*,video/*" multiple {...imagesRef} onChange={handleFileChange} />
            </FormControl>
             <FormMessage />
        </FormItem>

        {fileNames.length > 0 && (
            <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Archivos seleccionados:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground max-h-40 overflow-y-auto">
                    {fileNames.map((name, index) => (
                        <li key={index}>{name}</li>
                    ))}
                </ul>
            </div>
        )}

        <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duración en carrusel (s) por diapositiva</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Subiendo archivos..." : `Subir ${fileNames.length} archivo(s)`}
        </Button>
      </form>
    </Form>
  );
}
