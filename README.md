# District Location Mapper

Vercel-ready Next.js application for district-wise image map location pinning and management.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- **MongoDB** via Mongoose (MongoDB Atlas recommended)
- Zod validation
- Custom image-map interaction layer (zoom, pan, click, drag)

## Quick start

```bash
cp .env.example .env
npm install
npm run db:seed
npm run dev
```

By default the app uses **local JSON data** in `data/db.json` (no MongoDB required).

Open [http://localhost:3000](http://localhost:3000).

### Switch to MongoDB later

1. Set in `.env`:

```env
DATA_PROVIDER=mongodb
MONGODB_URI="mongodb+srv://..."
```

2. MongoDB wiring is already prepared via Mongoose models under `src/models/`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Vitest tests |
| `npm run db:seed` | Seed districts, categories, sample pins |

## Database collections

- `districts` — district map metadata (`mapImage`, width/height, status)
- `categories` — location categories
- `locations` — pins with required `pixelX`/`pixelY` and optional lat/lng

## Map engine

Interactive district maps use [Leaflet](https://leafletjs.com/) with `L.CRS.Simple` + `L.imageOverlay` so your exact district PNG/JPG is rendered (not OpenStreetMap tiles).

- **Blue markers** = tourism points (solid blue circles)
- **Red markers** = mandal headquarters (white circle + red ring + center dot)
- Click a point → Leaflet popup with latitude / longitude fields
- Zoom / pan via Leaflet controls

Coordinate conversion:

- Image pixel `(x, y)` top-left origin
- Leaflet CRS.Simple: `lat = height - y`, `lng = x`

## Vercel deployment

1. Push to GitHub.
2. Import in Vercel.
3. Add env var: `MONGODB_URI`
4. Deploy.
5. Run seed once against production:

```bash
MONGODB_URI="..." npm run db:seed
```

No Docker, Express, Nginx, or VPS required.

## Coordinate model

- Clicks store **pixelX / pixelY** relative to the original map image.
- Latitude / longitude stay `null` until calibration is configured.
- Conversion lives in `src/lib/coordinates/coordinateMapper.ts`.
