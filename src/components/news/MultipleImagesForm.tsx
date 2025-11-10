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
  images: z.custom<FileList>().refine(files => files && files.length > 0, 'Debes seleccionar al menos un archivo.').nullable(),
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subir Imágenes/Videos</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => {
                    field.onChange(e.target.files);
                    if (e.target.files) {
                      setFileNames(Array.from(e.target.files).map(f => f.name));
                    } else {
                      setFileNames([]);
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {fileNames.length > 0 && (
            <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Archivos seleccionados:</p>
                <ul className="max-h-40 overflow-y-auto rounded-md border p-2 text-sm text-muted-foreground">
                    {fileNames.map((name, index) => (
                        <li key={index} className="truncate">{name}</li>
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
        <Button type="submit" disabled={isSubmitting || fileNames.length === 0}>
          {isSubmitting ? "Subiendo archivos..." : `Subir ${fileNames.length} archivo(s)`}
        </Button>
      </form>
    </Form>
  );
}
