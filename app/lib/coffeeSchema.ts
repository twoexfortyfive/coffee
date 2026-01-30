import { z } from 'zod';

export const ratingOptions = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;

export const coffeeFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  company: z.string().min(1, 'Company is required'),
  name: z.string().min(1, 'Name is required'),
  region: z.string().optional().nullable(),
  country: z.string().min(1, 'Country is required'),
  location: z.string().optional().nullable(),
  altitude: z.string().optional().nullable(),
  process: z.string().min(1, 'Process is required'),
  varietal: z.string().optional().nullable(),
  cupProfileRaw: z.string().optional().nullable(),
  grindSetting: z
    .string()
    .optional()
    .nullable()
    .transform((value) => (value === '' || value === null ? null : value)),
  brewMethod: z.string().optional().nullable(),
  serve: z
    .union([z.enum(['BLACK', 'WITH_MILK']), z.literal('')])
    .optional()
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  rating: z.string().min(1, 'Rating is required'),
  notes: z.string().optional().nullable(),
  nicholasNotes: z.string().optional().nullable()
});

export type CoffeeFormInput = z.infer<typeof coffeeFormSchema>;

export const coffeeFiltersSchema = z.object({
  query: z.string().optional(),
  country: z.string().optional(),
  process: z.string().optional(),
  brewMethod: z.string().optional(),
  serve: z.string().optional(),
  minRating: z.string().optional(),
  sort: z.string().optional()
});

export const csvImportSchema = z.object({
  date: z.string().min(1),
  company: z.string().min(1),
  name: z.string().min(1),
  region: z.string().optional(),
  country: z.string().min(1),
  location: z.string().optional(),
  altitude: z.string().optional(),
  process: z.string().min(1),
  varietal: z.string().optional(),
  cupProfileRaw: z.string().optional(),
  grindSetting: z.string().optional(),
  brewMethod: z.string().optional(),
  serve: z.string().optional(),
  rating: z.string().min(1),
  notes: z.string().optional(),
  nicholasNotes: z.string().optional()
});

export type CsvImportRow = z.infer<typeof csvImportSchema>;
