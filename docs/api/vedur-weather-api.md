# Vedur Weather API

**Base URL:** https://api.vedur.is/weather  
**OpenAPI:** https://api.vedur.is/weather/openapi.json  
**API version header:** `X-Vi-Api-Version: 2026-02-17`

---

## 1. What this API is for

Vedur is the main official weather source for Iceland. It is the best source for:

- station metadata
- latest weather observations
- weather aggregation by time period
- weather warnings and forecast-related context
- road-risk proxy signals such as wind, rain, snow, and visibility

---

## 2. Important limitations

- This is a weather API, not a traffic incident API.
- It does not replace official road-closure data.
- Some endpoints require choosing between `station_id`, `region_id`, or `polygon`.
- `parameters=basic` is usually enough for MVP work.
- `parameters=all` returns more fields, but it is heavier.

---

## 3. Postman-ready endpoints

### 3.1 OpenAPI document

- **GET** https://api.vedur.is/weather/openapi.json

Use this first if you want the full schema.

### 3.2 Capabilities

- **GET** https://api.vedur.is/weather/capabilities

Shows available endpoints.

### 3.3 Stations

- **GET** https://api.vedur.is/weather/stations?region_id=12

Returns stations for the whole country.

### 3.4 Latest AWS observations

- **GET** https://api.vedur.is/weather/observations/aws/hour/latest?region_id=12&parameters=basic

### 3.5 Latest SYNOP observations

- **GET** https://api.vedur.is/weather/observations/synop/latest?region_id=12&parameters=basic

---

## 4. Suggested headers

```http
Accept: application/json
X-Vi-Api-Version: 2026-02-17
```

---

## 5. Example JSON shapes

### 5.1 Station response

```json
{
  "station": 1475,
  "name": "Reykjavík",
  "abbr": "reitr",
  "type": "sj",
  "lat": 64.12755,
  "lon": -21.902,
  "ele": 52,
  "wigos": "0-20000-0-04130",
  "owner": "Vedur",
  "start": 1949,
  "ending": null
}
```

### 5.2 AWS latest observation

```json
[
  {
    "station": 1475,
    "name": "Reykjavík",
    "time": "2026-06-18T12:00:00Z",
    "t": 12.5,
    "f": 8.1,
    "fg": 12.4,
    "d_txt": "NW",
    "rh": 68,
    "r": 0.0,
    "snd": 0,
    "ps": 1005.2
  }
]
```

### 5.3 SYNOP latest observation

```json
[
  {
    "station": 1,
    "name": "Reykjavík",
    "time": "2026-06-18T12:00:00Z",
    "t": 11.8,
    "tw": 10.7,
    "rh": 71,
    "f": 7.4,
    "d_txt_is": "NV",
    "p": 1004.8,
    "sun": 0,
    "snd": 0
  }
]
```

---

## 6. Field reference

### Core road-risk fields

| Field | Meaning | Why it matters |
|---|---|---|
| `t` | Air temperature | Freeze / ice risk |
| `f` | Wind speed | Driving stability |
| `fg` | Wind gust | Sudden hazard |
| `d_txt` / `d_txt_is` | Wind direction text | Exposure on open roads |
| `rh` | Relative humidity | Frost / fog context |
| `r` | Precipitation | Wet / snow risk |
| `snd` | Snow depth | Winter road conditions |
| `ps` / `p` | Pressure | Storm context |
| `sun` | Sun-related value | Daylight / visibility context |

### Useful station / region inputs

- `station_id`: specific station list
- `region_id`: Iceland forecast region
- `polygon`: WKT polygon for geographic filtering

---

## 7. Region IDs

| Region | Value |
|---|---:|
| Höfuðborgarsvæðið | 1 |
| Suðurland | 2 |
| Faxaflói | 3 |
| Breiðafjörður | 4 |
| Vestfirðir | 5 |
| Strandir og norðurland vestra | 6 |
| Norðurland eystra | 7 |
| Austurland að Glettingi | 8 |
| Austfirðir | 9 |
| Suðausturland | 10 |
| Miðhálendi | 11 |
| Allt landið | 12 |

---

## 8. Recommended MVP use

If the project goal is road-risk or travel safety, this API can support:

- ice risk warnings
- storm risk warnings
- snow and rain impact signals
- region-level summary cards
- station-level detail screens

---

## 9. Practical notes

- Use `basic` first.
- Start with `region_id=12` for the whole country.
- Switch to specific stations later if you need detailed local views.
- Keep the response shape small in Postman until you confirm the endpoint works.
