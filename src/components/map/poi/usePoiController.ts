"use client";

import { useMemo } from "react";

import type { PointOfInterest } from "../../../types/domain";
import { useInfoModeState } from "@/src/app-shell/hooks/useInfoModeState";
import { useWorkspaceStore } from "../../../lib/store/workspace";

export type PoiDetailContent = {
  title: string;
  description?: string;
  longDescription?: string;
  imageUrl?: string;
  imageAlt?: string;
  images: Array<{ imageUrl: string; alt?: string }>;
  tags: string[];
  travelInfo?: string;
  cautionNotes: string[];
};

export type PoiInteractionState = {
  activePoiId: string | null;
  poiFocusEnabled: boolean;
  visiblePois: PointOfInterest[];
  activePoi: PointOfInterest | null;
  isActive: (poiId: string) => boolean;
  selectPoi: (poiId: string) => void;
  getDetailContent: (poi: PointOfInterest) => PoiDetailContent;
};

export function usePoiController(pointsOfInterest: PointOfInterest[]): PoiInteractionState {
  const activePoiId = useWorkspaceStore((s) => s.activePoiId);
  const poiFocusEnabled = useWorkspaceStore((s) => s.poiFocusEnabled);
  const setActivePoi = useWorkspaceStore((s) => s.setActivePoi);
  const setPoiFocusEnabled = useWorkspaceStore((s) => s.setPoiFocusEnabled);
  const { setMode } = useInfoModeState();

  const visiblePois = useMemo(() => {
    if (poiFocusEnabled && activePoiId) {
      return pointsOfInterest.filter((poi) => poi.id === activePoiId);
    }

    return pointsOfInterest;
  }, [pointsOfInterest, activePoiId, poiFocusEnabled]);

  const activePoi = useMemo(() => {
    if (!activePoiId) {
      return null;
    }

    return pointsOfInterest.find((poi) => poi.id === activePoiId) ?? null;
  }, [activePoiId, pointsOfInterest]);

  return useMemo(() => {
    const selectPoi = (poiId: string) => {
      const shouldToggleOff = activePoiId === poiId && poiFocusEnabled;
      setActivePoi(shouldToggleOff ? null : poiId);
      setPoiFocusEnabled(!shouldToggleOff);
      setMode("poi");
    };

    return {
      activePoiId,
      poiFocusEnabled,
      visiblePois,
      activePoi,
      isActive: (poiId: string) => poiFocusEnabled && activePoiId === poiId,
      selectPoi,
      getDetailContent: (poi: PointOfInterest) => ({
        title: poi.labelZhHant || poi.label,
        description: poi.descriptionShort,
        longDescription: poi.descriptionLong || poi.description,
        imageUrl: poi.imageGallery[0]?.imageUrl ?? poi.imageUrl,
        imageAlt: `${poi.label} photo`,
        images:
          poi.imageGallery.length > 0
            ? poi.imageGallery
            : [{ imageUrl: poi.imageUrl, alt: `${poi.label} photo` }],
        tags: poi.tags.slice(0, 4),
        travelInfo: poi.travel?.publicTransport,
        cautionNotes: poi.cautionNotes.slice(0, 3),
      }),
    };
  }, [activePoi, activePoiId, poiFocusEnabled, visiblePois, setActivePoi, setPoiFocusEnabled, setMode]);
}
