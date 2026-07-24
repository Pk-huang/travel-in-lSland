import rawTravelPlans from "@/fixtures/travel-plans.iceland-three.json";

import { travelPlanCollectionSchema } from "@/src/schemas/domain";
import type { TravelPlanCollection } from "@/src/types";

export type TravelPlansState = {
  data: TravelPlanCollection;
};

const parsedTravelPlans = travelPlanCollectionSchema.safeParse(rawTravelPlans);

const fallbackTravelPlans: TravelPlanCollection = {
  generatedAt: new Date(0).toISOString(),
  plans: [],
};

const travelPlansData = parsedTravelPlans.success
  ? parsedTravelPlans.data
  : fallbackTravelPlans;

if (!parsedTravelPlans.success) {
  // 旅行計劃資料若不合法，先回傳空集合避免中斷地圖/面板渲染。
  console.error("Invalid travel plan fixture", parsedTravelPlans.error.flatten());
}

export function useTravelPlans(): TravelPlansState {
  return {
    data: travelPlansData,
  };
}
