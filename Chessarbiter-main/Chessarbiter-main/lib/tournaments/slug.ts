import { prisma } from "@/lib/db/prisma";

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function createUniqueTournamentSlug(title: string, existingId?: string) {
  const base = slugify(title) || "turniej";
  let slug = base;
  let counter = 2;

  while (true) {
    const existing = await prisma.tournament.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!existing || existing.id === existingId) {
      return slug;
    }

    slug = `${base}-${counter}`;
    counter += 1;
  }
}
