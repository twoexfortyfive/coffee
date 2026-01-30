import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const normalizeTitleCase = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed
    .toLowerCase()
    .split(' ')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
    .join(' ');
};

const splitTags = (value?: string | null) => {
  if (!value) return [];
  const rawParts = value
    .split(',')
    .flatMap((segment) => segment.split(' and '))
    .map((segment) => segment.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(rawParts));
};

const seedData = [
  {
    date: '2024-05-12',
    company: 'Atlas Coffee Club',
    name: 'Guatemala Huehuetenango',
    country: 'Guatemala',
    process: 'Washed',
    cupProfileRaw: 'Citrus, Cacao, Almond',
    rating: 4.5,
    brewMethod: 'V60',
    serve: 'BLACK'
  },
  {
    date: '2024-05-16',
    company: 'Onyx Coffee Lab',
    name: 'Colombia Aponte',
    country: 'Colombia',
    process: 'Honey',
    cupProfileRaw: 'Cherry, Honey, Orange',
    rating: 4.2,
    brewMethod: 'Kalita',
    serve: 'BLACK'
  },
  {
    date: '2024-05-21',
    company: 'Stumptown',
    name: 'Ethiopia Duromina',
    country: 'Ethiopia',
    process: 'Natural',
    cupProfileRaw: 'Blueberry, Floral and Lemon',
    rating: 4.8,
    brewMethod: 'Chemex',
    serve: 'BLACK'
  },
  {
    date: '2024-05-28',
    company: 'Blue Bottle',
    name: 'Kenya Nyeri',
    country: 'Kenya',
    process: 'Washed',
    cupProfileRaw: 'Blackcurrant, Tomato, Brown sugar',
    rating: 4.0,
    brewMethod: 'Espresso',
    serve: 'WITH_MILK'
  },
  {
    date: '2024-06-02',
    company: 'Heart',
    name: 'Costa Rica La Rosa',
    country: 'Costa Rica',
    process: 'Anaerobic',
    cupProfileRaw: 'Papaya, Peach and Violet',
    rating: 4.7,
    brewMethod: 'Aeropress',
    serve: 'BLACK'
  },
  {
    date: '2024-06-08',
    company: 'Intelligentsia',
    name: 'Rwanda Karongi',
    country: 'Rwanda',
    process: 'Washed',
    cupProfileRaw: 'Lime, Honey, Tea',
    rating: 3.9,
    brewMethod: 'French Press',
    serve: 'WITH_MILK'
  },
  {
    date: '2024-06-14',
    company: 'Counter Culture',
    name: 'Peru Cajamarca',
    country: 'Peru',
    process: 'Washed',
    cupProfileRaw: 'Chocolate, Nougat, Plum',
    rating: 4.1,
    brewMethod: 'Moka Pot',
    serve: 'BLACK'
  },
  {
    date: '2024-06-20',
    company: 'Bird Rock',
    name: 'Indonesia Sumatra',
    country: 'Indonesia',
    process: 'Wet Hulled',
    cupProfileRaw: 'Earthy, Dark chocolate, Spice',
    rating: 3.7,
    brewMethod: 'Cold Brew',
    serve: 'BLACK'
  }
];

async function main() {
  await prisma.coffeeTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.coffeeEntry.deleteMany();

  for (const entry of seedData) {
    const coffee = await prisma.coffeeEntry.create({
      data: {
        date: new Date(entry.date),
        company: entry.company,
        name: entry.name,
        country: normalizeTitleCase(entry.country),
        process: normalizeTitleCase(entry.process),
        cupProfileRaw: entry.cupProfileRaw,
        rating: entry.rating,
        brewMethod: entry.brewMethod,
        serve: entry.serve
      }
    });

    const tags = splitTags(entry.cupProfileRaw);
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
      data: tagRecords.map((tag) => ({ coffeeId: coffee.id, tagId: tag.id }))
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
