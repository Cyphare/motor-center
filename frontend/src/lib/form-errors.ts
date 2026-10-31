import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { ApiRequestError } from "@/lib/api-client";

/**
 * Maps backend Zod field errors (errors=[{field,location,message}]) onto
 * react-hook-form fields so they render inline. Backend validation nests the
 * field under `body.<name>`, so we strip a leading `body.` segment. Fields that
 * do not exist on the form are ignored (the toast still surfaces the message).
 */
export function applyApiFieldErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
  knownFields: readonly Path<TFieldValues>[]
): void {
  if (!(error instanceof ApiRequestError)) return;
  for (const fieldError of error.fieldErrors) {
    const name = fieldError.field.replace(/^body\./, "") as Path<TFieldValues>;
    if (knownFields.includes(name)) {
      setError(name, { type: "server", message: fieldError.message });
    }
  }
}
