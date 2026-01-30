# Coffee Diary MVP

A simple coffee diary built with Next.js App Router, Prisma, SQLite, Zod, and React Hook Form.

## Folder structure

```
app/
  coffees/
    [id]/
    new/
  import/
  insights/
  lib/
components/
prisma/
styles/
```

## Install

```bash
npm install
```

Create a local `.env` file (or copy `.env.example`) with the SQLite connection:

```bash
cp .env.example .env
```

## Prisma migrate

```bash
npx prisma migrate dev --name init
```

## Prisma seed

```bash
npx prisma db seed
```

## Run dev server

```bash
npm run dev
```

## CSV import format

Required columns: `date`, `company`, `name`, `country`, `process`, `rating`.
Other optional columns match the form field names.
