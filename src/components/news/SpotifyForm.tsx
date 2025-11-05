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
import type { PlayerSettingsData, PlayerSettings } from "@/lib/types";

const formSchema = z.object({
  currentSpotifyPlaylistUrl: z.string().url("Debe ser una URL válida de Spotify.").or(z.literal("")),
});

type SpotifyFormProps = {
  onSubmit: (data: PlayerSettingsData) => Promise<void>;
  initialData?: PlayerSettings | null;
  isSubmitting: boolean;
};

export function SpotifyForm({ onSubmit, initialData, isSubmitting }: SpotifyFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentSpotifyPlaylistUrl: initialData?.currentSpotifyPlaylistUrl || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="currentSpotifyPlaylistUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de la Playlist de Spotify</FormLabel>
              <FormControl>
                <Input placeholder="Pega una URL o déjalo vacío para quitar la música" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar Playlist"}
        </Button>
      </form>
    </Form>
  );
}
