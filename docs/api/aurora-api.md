# Aurora / Northern Lights API

**Updated:** 2026-06-18

---

## 1. Short conclusion

For aurora features, the best public setup is:

1. NOAA aurora forecast JSON
2. Vedur weather API for Iceland cloud / visibility context
3. Vedur northern lights page as reference only

There is no clearly documented stable public Vedur JSON API for aurora index or Kp value.

---

## 2. Best public aurora source

### NOAA SWPC aurora forecast JSON

- **URL:** https://services.swpc.noaa.gov/json/ovation_aurora_latest.json
- **Type:** Public JSON
- **Auth:** None
- **Use case:** aurora probability, aurora oval, map display, alerts

### Why use it

- machine-readable
- easy to test in Postman
- good for global aurora activity signals

---

## 3. Iceland-related reference page

### Vedur northern lights page

- **URL:** https://vedur.is/vedur/spar/nordurljos/
- **Type:** public webpage
- **Status:** not a documented JSON API
- **Use case:** Iceland-local northern lights forecast reference

---

## 4. What to combine with aurora data

Aurora visibility also depends on local weather.

Use Vedur for:

- cloud cover
- wind speed
- precipitation
- visibility-related context
- station or region coverage

Useful Vedur endpoints:

- https://api.vedur.is/weather/openapi.json
- https://api.vedur.is/weather/capabilities
- https://api.vedur.is/weather/stations?region_id=12
- https://api.vedur.is/weather/observations/aws/hour/latest?region_id=12&parameters=basic

---

## 5. Postman test URLs

### NOAA

- **GET** https://services.swpc.noaa.gov/json/ovation_aurora_latest.json

### Vedur

- **GET** https://api.vedur.is/weather/openapi.json
- **GET** https://api.vedur.is/weather/observations/aws/hour/latest?region_id=12&parameters=basic
- **GET** https://api.vedur.is/weather/stations?region_id=12
- **GET** https://vedur.is/vedur/spar/nordurljos/

### Suggested headers

```http
Accept: application/json
X-Vi-Api-Version: 2026-02-17
```

---

## 6. Example NOAA JSON shape

```json
{
  "Observation Time": "2026-06-18T08:11:00Z",
  "Forecast Time": "2026-06-18T09:14:00Z",
  "Data Format": "[Longitude, Latitude, Aurora]",
  "coordinates": [
    [0, 64, 2],
    [1, 64, 3],
    [2, 64, 4]
  ]
}
```

### Important fields

| Field | Meaning |
|---|---|
| `Observation Time` | Latest observation time |
| `Forecast Time` | Forecast generation time |
| `Data Format` | Coordinate layout |
| `coordinates` | Aurora intensity grid |

---

## 7. Practical limitations

- NOAA is global, not Iceland-specific.
- Vedur page is useful, but not a stable API contract.
- Kp value is not clearly exposed as a dedicated public Vedur endpoint.
- For a real product, combine aurora and weather before showing a recommendation.

---

## 8. Suggested MVP logic

1. Read NOAA aurora JSON.
2. Read Vedur weather for Iceland.
3. Combine them into one result.
4. Present a simple status:
   - high aurora chance
   - aurora possible
   - aurora likely blocked by clouds
   - low aurora chance

---

## 9. Summary

- **Aurora data:** NOAA yes
- **Iceland weather support:** Vedur yes
- **Stable public Vedur aurora API:** not confirmed
