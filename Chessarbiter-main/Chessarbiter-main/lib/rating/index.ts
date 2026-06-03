import type { PlayerProfile, TimeControlType } from "@prisma/client";

export function getRatingForTimeControl(profile: Pick<PlayerProfile, "classicalRating" | "rapidRating" | "blitzRating"> | null, timeControl: TimeControlType) {
  if (!profile) {
    return null;
  }

  if (timeControl === "CLASSICAL") {
    return profile.classicalRating;
  }

  if (timeControl === "RAPID") {
    return profile.rapidRating;
  }

  return profile.blitzRating;
}
