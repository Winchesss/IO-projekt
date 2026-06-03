"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { profileSchema } from "@/lib/validators/profile";
import { formDataToValues, type FormValues } from "@/lib/forms";

export type ProfileFormState = {
  success?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: FormValues;
};

export async function updateProfileAction(_: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const user = await requireUser();
  const values = formDataToValues(formData);
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: "Popraw błędy w formularzu.", fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  await prisma.playerProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...parsed.data
    },
    update: parsed.data
  });

  revalidatePath("/profil");
  return { success: "Profil został zapisany." };
}
