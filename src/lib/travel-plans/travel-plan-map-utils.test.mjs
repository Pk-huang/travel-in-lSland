import test from 'node:test';
import assert from 'node:assert/strict';

import { buildTravelMapMarkers } from './travel-plan-map-utils.js';

const day = {
  dayId: 'day-1',
  stops: [
    {
      stopId: 'stop-a',
      name: 'Reykjavík Harbor',
      lat: 64.1466,
      lon: -21.9426,
      note: 'First stop',
    },
    {
      stopId: 'stop-b',
      name: 'No coordinates stop',
      note: 'No map target',
    },
  ],
  timelineSections: [
    {
      sectionId: 'section-1',
      label: 'Morning',
      items: [
        {
          itemId: 'item-1',
          name: 'Blue Lagoon',
          lat: 63.8818,
          lon: -22.4499,
          description: 'Thermal spa',
        },
        {
          itemId: 'item-2',
          name: 'Another stop',
          description: 'No coordinates',
        },
      ],
    },
  ],
};

test('buildTravelMapMarkers merges stops and timeline items with stable ordering and location state', () => {
  const markers = buildTravelMapMarkers(day);

  assert.equal(markers.length, 4);
  assert.deepEqual(markers.map((marker) => marker.name), ['Reykjavík Harbor', 'No coordinates stop', 'Blue Lagoon', 'Another stop']);
  assert.deepEqual(markers.map((marker) => marker.hasLocation), [true, false, true, false]);
  assert.deepEqual(markers.map((marker) => marker.kind), ['stop', 'stop', 'timeline', 'timeline']);
  assert.equal(markers[0].sequence, 1);
  assert.equal(markers[1].sequence, 2);
  assert.equal(markers[2].sequence, 3);
  assert.equal(markers[3].sequence, 4);
});
