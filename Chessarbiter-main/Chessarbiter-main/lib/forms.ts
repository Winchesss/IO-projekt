export type FormValues = Record<string, string>;

export function formDataToValues(formData: FormData): FormValues {
  const values: FormValues = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      values[key] = value;
    }
  }

  return values;
}

export function formValue(values: FormValues | undefined, key: string, fallback: string | number | null | undefined = ""): string {
  if (values && key in values) {
    return values[key];
  }

  return fallback === null || fallback === undefined ? "" : String(fallback);
}
