'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';
import {
  coffeeFormSchema,
  csvImportSchema,
  type CoffeeFormInput
} from './coffeeSchema';
import {
  normalizeTitleCase,
  parseOptionalNumber,
  parseRating,
  splitTags,
  toNullableString
} from './coffeeUtils';

const buildCoffeeData = (data: CoffeeFormInput) => {
  const rating = parseRating(data.rating);
  return {
    date: new Date(data.date.trim()),
    company: data.company.trim(),
    name: data.name.trim(),
    region: toNullableString(data.region ?? undefined),
    country: normalizeTitleCase(data.country),
    location: toNullableString(data.location ?? undefined),
    altitude: toNullableString(data.altitude ?? undefined),
    process: normalizeTitleCase(data.process),
    varietal: toNullableString(data.varietal ?? undefined),
    cupProfileRaw: toNullableString(data.cupProfileRaw ?? undefined),
    grindSetting: parseOptionalNumber(data.grindSetting ?? undefined),
    brewMethod: toNullableString(data.brewMethod ?? undefined),
    serve: data.serve ?? null,
    rating,
    notes: toNullableString(data.notes ?? undefined),
    nicholasNotes: toNullableString(data.nicholasNotes ?? undefined)
  };
};

const syncTagsForCoffee = async (coffeeId: string, cupProfileRaw?: string | null) => {
  const tags = splitTags(cupProfileRaw);
  await prisma.coffeeTag.deleteMany({
    where: { coffeeId }
  });
  if (!tags.length) return;

  const tagRecords = await Promise.all(
    tags.map((tag) =>
      prisma.tag.upsert({
        where: { name: tag },
        update: {},
        create: { name: tag }
      })
    )
  );

  await prisma.coffeeTag.createMany({
    data: tagRecords.map((tag) => ({
      coffeeId,
      tagId: tag.id
    })),
    skipDuplicates: true
  });
};

export const createCoffee = async (data: CoffeeFormInput) => {
  const parsed = coffeeFormSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }
  const coffeeData = buildCoffeeData(parsed.data);
  const coffee = await prisma.coffeeEntry.create({
    data: coffeeData
  });
  await syncTagsForCoffee(coffee.id, coffeeData.cupProfileRaw);
  revalidatePath('/coffees');
  redirect('/coffees');
};

export const updateCoffee = async (id: string, data: CoffeeFormInput) => {
  const parsed = coffeeFormSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }
  const coffeeData = buildCoffeeData(parsed.data);
  await prisma.coffeeEntry.update({
    where: { id },
    data: coffeeData
  });
  await syncTagsForCoffee(id, coffeeData.cupProfileRaw);
  revalidatePath('/coffees');
  revalidatePath(`/coffees/${id}`);
  redirect(`/coffees/${id}`);
};

export const deleteCoffee = async (id: string) => {
  await prisma.coffeeEntry.delete({
    where: { id }
  });
  revalidatePath('/coffees');
  redirect('/coffees');
};

export const importCoffees = async (rows: unknown[]) => {
  const parsedRows = rows.map((row) => csvImportSchema.safeParse(row));
  const invalidRows = parsedRows.filter((row) => !row.success);
  if (invalidRows.length) {
    throw new Error('Invalid CSV rows');
  }

  for (const rowResult of parsedRows) {
    if (!rowResult.success) continue;
    const row = rowResult.data;
    const data = buildCoffeeData({
      date: row.date,
      company: row.company,
      name: row.name,
      region: row.region ?? null,
      country: row.country,
      location: row.location ?? null,
      altitude: row.altitude ?? null,
      process: row.process,
      varietal: row.varietal ?? null,
      cupProfileRaw: row.cupProfileRaw ?? null,
      grindSetting: row.grindSetting ?? null,
      brewMethod: row.brewMethod ?? null,
      serve:
        row.serve?.toLowerCase() === 'with milk'
          ? 'WITH_MILK'
          : row.serve?.toLowerCase() === 'black'
            ? 'BLACK'
            : null,
      rating: row.rating,
      notes: row.notes ?? null,
      nicholasNotes: row.nicholasNotes ?? null
    });

    const coffee = await prisma.coffeeEntry.create({
      data
    });
    await syncTagsForCoffee(coffee.id, data.cupProfileRaw);
  }

  revalidatePath('/coffees');
  revalidatePath('/insights');
  redirect('/coffees');
};
