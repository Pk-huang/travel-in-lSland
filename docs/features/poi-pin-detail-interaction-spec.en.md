# Feature Specification: POI Pin Interaction in Map Mode

## Basic Information
- **Feature Name**: Map Mode: POI Pin Interaction
- **Priority**: P2 (small interaction enhancement)
- **Module**: Map interaction / POI mode
- **Status**: Implemented (spec record)

## Background and Purpose
When users switch to POI mode, the map should display interactive POI pins so they can quickly identify points of interest and inspect additional detail by selecting a pin. The goal is to make POI mode more than a static list by connecting it directly to map-based visual interaction and improving the overall experience of discovery and orientation.

## User Goals
- Quickly recognize different points of interest in POI mode
- Inspect POI descriptions and detailed information by clicking a pin
- Keep pin selection and map focus behavior consistent so the interface does not feel stale or misaligned

## Feature Description
When a user enters POI map mode, the system displays POI pins on the map. These pins support the following behaviors:
- Users can click a pin to view richer detail content
- Clicking a pin sets it as the current selection and updates the map focus and panel state
- The detailed content should expand above the pin
- Clicking an empty map area should clear the selection and collapse the detail content

## Implementation-ready Requirements

### 1. Interaction Behavior
- When POI mode is active, the map should display POI pins.
- Clicking a pin should set that POI as the current selection and switch the related POI info state.
- After selection, a detail card should appear above the pin.
- Clicking the same pin again should toggle the expanded and collapsed state without duplicating content.
- Clicking empty map space should clear the selection and collapse the detail card.
- Switching to another map mode should also clear the current POI selection.

### 2. Visual and UI Requirements
- POI pins should appear as recognizable landmark markers.
- Selected and hovered states should have stronger border, shadow, and highlight treatment.
- The detail card should use a dark or semi-transparent surface to avoid visual conflict with the map.
- The detail content should appear above the pin and not directly overlap the pin body.
- When a POI is selected, the detail panel should provide a richer information hierarchy that is easy to scan.
- The detail card should present information in a clear reading order: title, summary, detailed description, and supplementary details; transportation and caution notes should be separated into distinct blocks for quick scanning.
- If multiple images are available for a POI, the panel should display an image section and allow the user to switch between images; if only one image exists, it should be displayed statically without leaving blank space.

### 3. Data Content and Source
- The detail view should include the POI name, description, short summary, images, tags, transportation info, and caution notes.
- Content should prioritize fields such as imageGallery, descriptionShort, descriptionLong, tags, travel.publicTransport, and cautionNotes.
- If some fields are missing, the system should fall back to existing short descriptions or default content to avoid empty states.

### 4. Implementation Boundary
- The main work is the interaction and presentation of the POI map layer and marker component.
- The change should not require a full redesign of the map system or abstraction for unrelated marker types.
- If the existing data structure is sufficient, the implementation should use it directly rather than introducing a new data flow.

## Interaction Flow
```text
User switches to POI mode
    ↓
Map displays POI pins
    ↓
User clicks a POI pin
    ↓
System shows a richer detail card for that POI
    ↓
System updates the selected state and POI mode info state
    ↓
When the user clicks empty space, the selection is cleared and the detail card collapses
```

## Related Modules
- POI map layer: src/components/map/PoiLayer.tsx
- Main map canvas: src/components/map/MapCanvas.tsx
- Workspace state management: src/lib/store/workspace.ts
- Map marker component: src/components/ui/map-marker-tag.tsx

## Acceptance Criteria
- [x] POI pins are shown when POI mode is active
- [x] Clicking a POI pin shows a detail card
- [x] Clicking a POI pin preserves the selected state of that POI
- [x] Clicking an empty map area clears the selection state
- [x] The detail card and pin body do not conflict or break layout
- [x] The detail panel can display images, summary text, detailed description, and tags
- [x] If a POI provides multiple images, the panel supports image switching
- [x] The panel can show transportation information and caution notes

## Test Scenarios
- Clicking a single POI normally
- Switching between different POIs and updating the content shown
- Collapsing the detail card when clicking empty space
- Maintaining stable interaction when clicking the same POI repeatedly
- Switching images correctly when a POI provides multiple images
- Displaying transportation and caution sections correctly when those fields are present

## Out of Scope
- Redesign of POI image preview experience
- Full redesign of the POI mode navigation flow
- Shared abstraction refactor for other map marker types such as roads and stations

## Further Notes
This feature evolves POI mode from a static pin display into an interactive map entry point for richer POI exploration. It can later be extended to other marker types using the same interaction model.
