# Product Search Website (Next.js)

A simple product lookup website where users can search by full or partial part number, apply optional filters, and upload CSV/Excel/JSON product files.

## Features
- Loads a local data file from `public/data/products.csv` by default.
- Upload support for `.csv`, `.xlsx`, `.xls`, and `.json` files.
- Case-insensitive, partial match search on part number.
- Results table includes:
  - Part Number
  - Product Name/Description
  - Category/Product Family
  - Compatibility/OEM
  - Length/Speed/Type
  - Notes
- Automatic filters if matching columns exist (such as product family, OEM, speed, cable type, type).
- Displays **"No matching products found."** when there are no results.

## Product Data File (where to put your data)
Put your default file at:

- `public/data/products.csv`

The app reads this file on startup. You can replace it anytime with your own export.

### Recommended CSV columns
Use headers like these (case-insensitive alias matching is supported):

- `Part Number`
- `Product Name` or `Description`
- `Product Family` or `Category`
- `Compatibility` or `OEM`
- `Length`, `Speed`, `Type` (any or all)
- `Notes`

You can include extra columns too.

## Run locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000`.

## Production build
```bash
npm run build
npm run start
```

## Deploy

### Option A: Vercel (recommended)
1. Push this project to GitHub.
2. Import the repo in Vercel.
3. Deploy with default Next.js settings.

### Option B: Self-hosted Node server
1. Run `npm run build`.
2. Run `npm run start` on your server.
3. Reverse-proxy port `3000` with Nginx/Caddy.

## Notes
- You can upload a file in the UI at runtime without replacing the default file.
- For Excel, the first worksheet is used.
