# Postman Quickstart

**Updated:** 2026-06-18

---

## 1. Default headers

Use these for most Vedur requests:

```http
Accept: application/json
X-Vi-Api-Version: 2026-02-17
```

NOAA aurora requests usually only need:

```http
Accept: application/json
```

---

## 2. Fast test order

### Aurora path

1. https://services.swpc.noaa.gov/json/ovation_aurora_latest.json
2. https://api.vedur.is/weather/openapi.json
3. https://api.vedur.is/weather/observations/aws/hour/latest?region_id=12&parameters=basic
4. https://api.vedur.is/weather/stations?region_id=12
5. https://vedur.is/vedur/spar/nordurljos/

### Road-risk path

1. https://api.vedur.is/weather/openapi.json
2. https://api.vedur.is/weather/capabilities
3. https://api.vedur.is/weather/observations/aws/hour/latest?region_id=12&parameters=basic
4. https://api.vedur.is/weather/observations/synop/latest?region_id=12&parameters=basic
5. https://api.vedur.is/weather/stations?region_id=12

---

## 3. Response format reminders

### NOAA aurora

- JSON object
- includes observation time, forecast time, and coordinate grid
- good for map and score logic

### Vedur station data

- JSON array of station objects
- each station includes name, location, station type, and status

### Vedur observations

- JSON array of observation objects
- fields depend on AWS or SYNOP endpoint

---

## 4. Common usage rules

- Start with `region_id=12` for country-wide testing
- Use `parameters=basic` first
- Check the OpenAPI document when you need the exact parameter list
- Treat webpage sources as reference only unless they return stable JSON
