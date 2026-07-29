export function buildTravelMapMarkers(day) {
  const markers = [];
  const seen = new Set();

  const pushMarker = (marker) => {
    const dedupeKey = `${marker.kind}:${marker.name}:${marker.lat ?? 'n'}:${marker.lon ?? 'n'}`;
    if (seen.has(dedupeKey)) {
      return;
    }

    seen.add(dedupeKey);
    markers.push(marker);
  };

  day.stops.forEach((stop, index) => {
    pushMarker({
      kind: 'stop',
      markerId: `travel-stop-${day.dayId}-${stop.stopId}`,
      name: stop.name,
      lat: stop.lat ?? null,
      lon: stop.lon ?? null,
      note: stop.note,
      hasLocation: stop.lat != null && stop.lon != null,
      sequence: index + 1,
    });
  });

  day.timelineSections.forEach((section) => {
    section.items.forEach((item, index) => {
      pushMarker({
        kind: 'timeline',
        markerId: `travel-item-${day.dayId}-${item.itemId}`,
        name: item.name,
        lat: item.lat ?? null,
        lon: item.lon ?? null,
        note: item.description,
        hasLocation: item.lat != null && item.lon != null,
        sequence: markers.filter((marker) => marker.kind === 'stop').length + index + 1,
      });
    });
  });

  return markers;
}
