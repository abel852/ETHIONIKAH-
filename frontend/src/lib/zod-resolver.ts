import { z } from "zod";
import type { Resolver, FieldErrors } from "react-hook-form";

export function zodResolver<T extends z.ZodTypeAny>(schema: T): Resolver<z.infer<T>> {
  return async (values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data as z.infer<T>, errors: {} as FieldErrors<z.infer<T>> };
    }
    const errors: FieldErrors<z.infer<T>> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (path) {
        setNestedError(errors, issue.path, { message: issue.message, type: issue.code });
      }
    }
    return { values: {} as z.infer<T>, errors };
  };
}

function setNestedError(obj: any, path: (string | number)[], error: { message: string; type: string }) {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }
  const lastKey = path[path.length - 1];
  current[lastKey] = error;
}
