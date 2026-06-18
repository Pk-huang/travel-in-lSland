# Iceland Traffic / Road Data

**Updated:** 2026-06-18

---

## 1. Short conclusion

For Iceland road and traffic data, public open APIs are limited.

What works best today:

- **Vedur Weather API** for road-risk signals
- **APIs.is** as a community aggregator
- **Umferdin** as a public webpage reference
- **NOAA aurora** only if you also want northern lights

There is no clearly confirmed stable public official API for real-time traffic incidents, closures, or congestion.

---

## 2. Main sources

### 2.1 Vedur Weather API

- **Base:** https://api.vedur.is/weather
- **OpenAPI:** https://api.vedur.is/weather/openapi.json
- **Use case:** weather conditions that affect driving safety
- **Strength:** official, structured, reliable

### 2.2 APIs.is

- **Base:** https://apis.is/
- **Docs:** https://docs.apis.is/
- **Use case:** aggregated public data such as weather, flights, earthquakes, bus, fuel, addresses
- **Strength:** many data categories in one place
- **Caveat:** community aggregator, not the official source

### 2.3 Umferdin / Road Authority

- **Web:** https://umferdin.is/
- **Use case:** traffic incidents, closures, and road-related public information on the website
- **Caveat:** no stable documented public API was confirmed

---

## 3. What each source is good for

| Source | Good for | Limitations |
|---|---|---|
| Vedur | road-risk, weather, warnings | no traffic incidents |
| APIs.is | quick public aggregation | not official, limited traffic depth |
| Umferdin | closures and incident info on web | webpage first, API unclear |

---

## 4. Road-risk fields from Vedur

These are the fields most useful for road safety:

| Field | Meaning |
|---|---|
| `t` | temperature |
| `f` | wind speed |
| `fg` | wind gust |
| `d_txt` / `d_txt_is` | wind direction text |
| `rh` | relative humidity |
| `r` | precipitation |
| `snd` | snow depth |
| `ps` / `p` | pressure |
| `sun` | daylight / sun-related context |

---

## 5. Postman-ready URLs

### Vedur

- **GET** https://api.vedur.is/weather/openapi.json
- **GET** https://api.vedur.is/weather/capabilities
- **GET** https://api.vedur.is/weather/stations?region_id=12
- **GET** https://api.vedur.is/weather/observations/aws/hour/latest?region_id=12&parameters=basic
- **GET** https://api.vedur.is/weather/observations/synop/latest?region_id=12&parameters=basic

### APIs.is

- **GET** https://apis.is/
- **GET** https://docs.api.is/

### Umferdin

- **GET** https://umferdin.is/

---

## 6. Suggested headers

```http
Accept: application/json
X-Vi-Api-Version: 2026-02-17
```

---

## 7. Known limitations

- No confirmed public traffic incidents API
- No confirmed public closures API
- No confirmed public congestion API
- No confirmed public road camera API
- Bus APIs exist in APIs.is, but are optional and not required for the current MVP

---

## 8. Recommended MVP scope

If you only need road-risk, then Vedur alone is enough for a first version.

If you need real traffic events later, you will likely need a second source or web scraping.

---

## 9. Next step suggestion

If this project grows, separate the docs into more folders like:

- weather
- traffic
- aurora
- flights
- public-transport

This folder is a good first grouping for API research.
