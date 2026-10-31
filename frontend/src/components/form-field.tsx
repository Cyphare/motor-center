"use client";

import * as React from "react";
import type {
  Control,
  FieldPath,
  FieldValues,
  ControllerRenderProps,
} from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField as RhfFormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export interface FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  description?: string;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  /**
   * Optional custom control render. When omitted a standard Input is rendered.
   */
  render?: (
    field: ControllerRenderProps<TFieldValues, TName>
  ) => React.ReactNode;
}

/**
 * Labeled field wrapper around react-hook-form's Controller. Renders a plain
 * Input by default, or a custom control via `render`. Presentation only.
 */
export function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  placeholder,
  type = "text",
  render,
}: FormFieldProps<TFieldValues, TName>) {
  return (
    <RhfFormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            {render ? (
              render(field)
            ) : (
              <Input type={type} placeholder={placeholder} {...field} />
            )}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
