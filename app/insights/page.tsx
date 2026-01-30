import { prisma } from '@/app/lib/prisma';

export default async function InsightsPage() {
  const [processes, countries, tags, topCoffees] = await Promise.all([
    prisma.coffeeEntry.groupBy({
      by: ['process'],
      _avg: { rating: true },
      orderBy: { _avg: { rating: 'desc' } },
      take: 5
    }),
    prisma.coffeeEntry.groupBy({
      by: ['country'],
      _avg: { rating: true },
      orderBy: { _avg: { rating: 'desc' } },
      take: 5
    }),
    prisma.tag.findMany({
      include: { _count: { select: { coffeeTags: true } } },
      orderBy: { coffeeTags: { _count: 'desc' } },
      take: 10
    }),
    prisma.coffeeEntry.findMany({
      orderBy: [{ rating: 'desc' }, { date: 'desc' }],
      take: 10
    })
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Insights</h1>
        <p className="text-sm text-neutral-500">Quick summaries of what you like.</p>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Top processes</h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-700">
            {processes.length === 0 && <li>No data yet.</li>}
            {processes.map((item) => (
              <li key={item.process} className="flex items-center justify-between">
                <span>{item.process}</span>
                <span>{item._avg.rating?.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Top countries</h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-700">
            {countries.length === 0 && <li>No data yet.</li>}
            {countries.map((item) => (
              <li key={item.country} className="flex items-center justify-between">
                <span>{item.country}</span>
                <span>{item._avg.rating?.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Top flavour tags</h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-700">
            {tags.length === 0 && <li>No data yet.</li>}
            {tags.map((tag) => (
              <li key={tag.id} className="flex items-center justify-between">
                <span>{tag.name}</span>
                <span>{tag._count.coffeeTags}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Your highest rated coffees</h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-700">
            {topCoffees.length === 0 && <li>No data yet.</li>}
            {topCoffees.map((coffee) => (
              <li key={coffee.id} className="flex items-center justify-between">
                <span>
                  {coffee.company} — {coffee.name}
                </span>
                <span>{coffee.rating}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
