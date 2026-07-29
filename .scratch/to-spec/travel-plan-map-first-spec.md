## Problem Statement

The current travel-planning experience is only partially connected to the map. Users can see a day-by-day itinerary in the side panel, but the experience still feels disconnected from the 3D scene: travel stops are not consistently surfaced as map-first interactions, and the relationship between itinerary content, map focus, and POI context is not yet clear. As a result, users cannot easily move from reading a travel plan to understanding where each stop sits on the island, nor can they quickly reason about the sequence and geography of the day.

## Solution

Provide a more coherent travel-planning experience in which the itinerary becomes a first-class map interaction surface. Users should be able to move between day selection, itinerary items, and map focus without losing context, and the map should make it obvious which stops are part of the selected day and how they relate to the surrounding POI and weather information.

## User Stories

1. As a traveler planning a day in Iceland, I want to switch between travel days in the side panel, so that I can inspect the itinerary for the correct day without confusion.
2. As a traveler reviewing a day plan, I want the selected day’s stops and timeline items to be visually represented on the map, so that I can understand the geographic flow of the day at a glance.
3. As a traveler exploring a stop in the itinerary, I want to click it and focus the camera on its location, so that I can understand where it sits in the landscape.
4. As a traveler comparing an itinerary stop with nearby POIs, I want the map to preserve the current POI and weather context while I focus on a travel item, so that I can make a more informed decision.
5. As a traveler using the map, I want the current travel day to be clearly reflected in the visible map markers, so that I do not confuse the selected day with other itinerary content.
6. As a traveler reviewing a stop detail, I want the itinerary entry to clearly communicate whether it has a map location and whether it can be focused, so that I know when interaction is available.
7. As a traveler using the app on a desktop or mobile device, I want the travel-plan interaction to remain usable without breaking the existing map controls, so that the experience stays consistent across devices.
8. As a traveler working with a day plan that includes stops without coordinates, I want the app to degrade gracefully, so that I can still read the plan without encountering a broken interaction state.
9. As a traveler who wants to move from itinerary to route guidance, I want the existing map-focus and route-related interactions to remain intact, so that the new travel-planning experience complements rather than replaces current behavior.
10. As a product maintainer, I want the travel-planning interaction to reuse the existing workspace state and map layers, so that the feature can be delivered with minimal additional architectural complexity.
11. As a traveler reviewing the plan, I want stops and timeline items to have a consistent visual hierarchy on the map, so that I can distinguish primary route stops from supporting details.
12. As a traveler exploring a long day plan, I want the selected day’s stops to appear in a stable and predictable order, so that I can follow the progression of the itinerary with confidence.
13. As a traveler moving between days, I want the map to update promptly when I switch the selected day, so that the visible markers remain aligned with the current itinerary state.
14. As a traveler inspecting the map, I want the current focus target to be reset when I interact outside the itinerary surface, so that the map does not remain pinned to an old travel stop unintentionally.
15. As a traveler with incomplete travel data, I want the app to show the available information without failing, so that the experience remains usable while the dataset is still being filled in.

## Implementation Decisions

- The feature will be delivered as a travel-plan interaction enhancement within the existing map and panel architecture rather than as a separate workflow.
- The selected travel day will continue to be managed through the existing workspace store, and the map will derive the visible travel markers from that selected day state.
- The current travel stop rendering layer will be extended to support consistent map affordances for itinerary stops and timeline items, including stable ordering and clear interaction behavior.
- The existing map-focus mechanism will be reused so that clicking an itinerary item focuses the camera on its geographic position, matching the behavior already used for stations, roads, and POIs.
- The panel experience will remain the existing control panel and timeline-driven interface, but itinerary entries will expose clearer interaction affordances and better support for map focus.
- The feature should preserve current behavior for POI focus, weather mode, and road mode; travel-plan interactions should integrate with those states rather than replace them.
- Where travel data lacks coordinates, the UI should continue to render the item as an itinerary entry without enabling map focus, preventing broken or misleading interactions.
- The implementation should prefer the highest existing seam available: the shared workspace data layer, the map layer, and the itinerary panel, rather than introducing a new parallel data flow.
- The behavior should be defined in terms of the existing domain concepts of travel plan, travel day, travel stop, and timeline item, using the vocabulary already used in the project’s travel-plan data contract.

## Testing Decisions

- Tests should focus on observable behavior in the UI and interaction state rather than implementation details such as internal hook calls or component composition.
- The primary modules to test are the day-selection behavior in the control panel, the map marker derivation for the selected day, and the map-focus behavior triggered by itinerary interactions.
- Good tests will verify that selecting a day changes the visible travel markers, that clicking a location-enabled itinerary item triggers map focus, and that items without coordinates remain present but non-interactive.
- Existing UI and state-management patterns in the app should be treated as prior art, especially the current behavior for POI selection, road/station focus, and day selection in the control panel.
- Where possible, tests should cover the boundary between user interaction and workspace state updates, ensuring the interaction remains predictable and does not leave stale focus targets behind.

## Out of Scope

- Full travel-plan editing workflows such as drag-and-drop reordering, adding new stops, or deleting itinerary entries.
- AI-generated itinerary optimization or automatic route re-planning.
- New map rendering technologies or a separate travel-planning view outside the existing 3D map and control panel experience.
- Any backend persistence layer for travel plans; the feature is scoped to the existing client-side data flow.

## Further Notes

This spec is intentionally scoped to the travel-plan map interaction gap described in the repository’s travel-plan UI decision notes. It should be treated as the next implementation milestone after the current static travel-plan UI is in place, and it should be implemented in a way that preserves the app’s existing map-first interaction model.
