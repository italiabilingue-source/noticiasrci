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
import { Textarea } from "@/components/ui/textarea";
import type { TickerMessageData, TickerMessage } from "@/lib/types";

const formSchema = z.object({
  message: z.string().min(1, "El mensaje no puede estar vacío."),
});

type TickerFormProps = {
  onSubmit: (data: TickerMessageData) => Promise<void>;
  initialData?: TickerMessage | null;
  isSubmitting: boolean;
};

export function TickerForm({ onSubmit, initialData, isSubmitting }: TickerFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: initialData?.message || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensaje del Cintillo</FormLabel>
              <FormControl>
                <Textarea placeholder="Introduce el mensaje para el cintillo de noticias" className="min-h-[100px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar Mensaje"}
        </Button>
      </form>
    </Form>
  );
}
