import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  activities,
  foodOptions,
  studySpots,
  campusEvents,
  type CampusOption,
  type NoiseLevel,
  type TimeOfDay,
} from "./campus-data.js";

/**
 * TODO 1: This helper currently ignores both filters.
 * Make the exercise tests pass without changing the fixture data or test expectations.
 */
export function withinBudgetAndArea<T extends CampusOption>(
  options: T[],
  maxCostKsh: number,
  area?: string,
): T[] {
  const requestedArea = area?.trim().toLowerCase();

  return options.filter((option) => {
    const isAffordable = option.costKsh <= maxCostKsh;
    const isInArea =
      !requestedArea || option.area.toLowerCase() === requestedArea;

    return isAffordable && isInArea;
  });
}
export const findStudySpots = tool(
({ area, noiseLevel, maxCostKsh }) => {
  const matches = withinBudgetAndArea(studySpots, maxCostKsh, area).filter(
    (spot) => spot.noiseLevel === noiseLevel,
  );

  return JSON.stringify(matches);
},
  {
    name: "find_study_spots",
    description:
      "Find trusted study spaces from the local campus guide. Use this instead of inventing venues or prices.",
    schema: z.object({
      area: z.string().optional().describe("Preferred Nairobi area"),
      noiseLevel: z.enum(["quiet", "social"]).describe("Preferred study atmosphere"),
      maxCostKsh: z.number().nonnegative().describe("Maximum amount available for the study space"),
    }),
  },
);

export const findActivities = tool(
  ({ area, interests, maxCostKsh, timeOfDay }) => {
  const requestedInterests = interests.map((interest) =>
    interest.trim().toLowerCase(),
  );

  const matches = withinBudgetAndArea(activities, maxCostKsh, area).filter(
    (activity) =>
      activity.timeOfDay.includes(timeOfDay) &&
      activity.interests.some((interest) =>
        requestedInterests.includes(interest.toLowerCase()),
      ),
  );

  return JSON.stringify(matches);
},
  {
    name: "find_activities",
    description:
      "Find affordable social or recreational activities from the local campus guide.",
    schema: z.object({
      area: z.string().optional().describe("Preferred Nairobi area"),
      interests: z.array(z.string()).min(1).describe("Activities the student enjoys"),
      maxCostKsh: z.number().nonnegative().describe("Maximum amount available for the activity"),
      timeOfDay: z.enum(["morning", "afternoon", "evening"]),
    }),
  },
);

export const findFoodOptions = tool(
  ({ area, maxCostKsh, dietaryPreference }) => {
  const requestedPreference = dietaryPreference?.trim().toLowerCase();

  const matches = withinBudgetAndArea(foodOptions, maxCostKsh, area).filter(
    (food) =>
      !requestedPreference ||
      food.dietaryOptions.some(
        (option) => option.toLowerCase() === requestedPreference,
      ),
  );

  return JSON.stringify(matches);
},
  {
    name: "find_food_options",
    description: "Find student-friendly food options with known local prices.",
    schema: z.object({
      area: z.string().optional().describe("Preferred Nairobi area"),
      maxCostKsh: z.number().nonnegative().describe("Maximum amount available for food"),
      dietaryPreference: z.string().optional().describe("For example vegetarian or vegan"),
    }),
  },
);
export const findCampusEvents = tool(
  ({ date, interest, maxEntryPriceKsh }) => {
    const requestedInterest = interest.trim().toLowerCase();

    const matches = campusEvents.filter(
      (event) =>
        event.date.toLowerCase() === date.trim().toLowerCase() &&
        event.costKsh <= maxEntryPriceKsh &&
        event.interests.some(
          (eventInterest) =>
            eventInterest.toLowerCase() === requestedInterest,
        ),
    );

    return JSON.stringify(matches);
  },
  {
    name: "find_campus_events",
    description:
      "Find trusted campus events by date, interest, and maximum entry price. Use this instead of inventing events or prices.",
    schema: z.object({
      date: z.string().describe("Day when the student wants an event"),
      interest: z
        .string()
        .describe("Interest such as technology, art, music, or nature"),
      maxEntryPriceKsh: z
        .number()
        .nonnegative()
        .describe("Maximum amount the student can pay to enter"),
    }),
  },
);

export const campusTools = [findStudySpots, findActivities, findFoodOptions];

// Exporting these keeps the exercise vocabulary visible in editor tooltips.
export type CampusToolPreferences = {
  noiseLevel: NoiseLevel;
  timeOfDay: TimeOfDay;
};
