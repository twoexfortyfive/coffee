import Link from 'next/link';
import { prisma } from '../lib/prisma';
import { coffeeFiltersSchema } from '../lib/coffeeSchema';

const buildSort = (sort?: string) => {
  switch (sort) {
    case 'rating_desc':
      return [{ rating: 'desc' as const }, { date: 'desc' as const }];
    case 'company_asc':
      return [{ company: 'asc' as const }];
    default:
      return [{ date: 'desc' as const }];
  }
};

export default async function CoffeesPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const parsed = coffeeFiltersSchema.safeParse({
    query: typeof searchParams.query === 'string' ? searchParams.query : undefined,
    country: typeof searchParams.country === 'string' ? searchParams.country : undefined,
    process: typeof searchParams.process === 'string' ? searchParams.process : undefined,
    brewMethod:
      typeof searchParams.brewMethod === 'string' ? searchParams.brewMethod : undefined,
    serve: typeof searchParams.serve === 'string' ? searchParams.serve : undefined,
    minRating:
      typeof searchParams.minRating === 'string' ? searchParams.minRating : undefined,
    sort: typeof searchParams.sort === 'string' ? searchParams.sort : undefined
  });

  const filters = parsed.success ? parsed.data : {};
  const query = filters.query?.trim();
  const minRating = filters.minRating ? Number(filters.minRating) : undefined;

  const where = {
    AND: [
      query
        ? {
            OR: [
              { company: { contains: query, mode: 'insensitive' as const } },
              { name: { contains: query, mode: 'insensitive' as const } },
              { country: { contains: query, mode: 'insensitive' as const } },
              { process: { contains: query, mode: 'insensitive' as const } },
              { cupProfileRaw: { contains: query, mode: 'insensitive' as const } },
              { notes: { contains: query, mode: 'insensitive' as const } }
            ]
          }
        : {},
      filters.country ? { country: filters.country } : {},
      filters.process ? { process: filters.process } : {},
      filters.brewMethod ? { brewMethod: filters.brewMethod } : {},
      filters.serve
        ? { serve: filters.serve === 'BLACK' ? 'BLACK' : 'WITH_MILK' }
        : {},
      Number.isFinite(minRating) ? { rating: { gte: minRating } } : {}
    ]
  };

  const [coffees, countryOptions, processOptions, brewOptions] = await Promise.all([
    prisma.coffeeEntry.findMany({
      where,
      orderBy: buildSort(filters.sort)
    }),
    prisma.coffeeEntry.findMany({
      distinct: ['country'],
      select: { country: true },
      orderBy: { country: 'asc' }
    }),
    prisma.coffeeEntry.findMany({
      distinct: ['process'],
      select: { process: true },
      orderBy: { process: 'asc' }
    }),
    prisma.coffeeEntry.findMany({
      distinct: ['brewMethod'],
      select: { brewMethod: true },
      orderBy: { brewMethod: 'asc' }
    })
  ]);

  const countries = countryOptions.map((option) => option.country);
  const processes = processOptions.map((option) => option.process);
  const brewMethods = brewOptions
    .map((option) => option.brewMethod)
    .filter((option): option is string => Boolean(option));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Coffees</h1>
          <p className="text-sm text-neutral-500">Search, filter, and review your brews.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/coffees/new"
            className="rounded border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm text-white"
          >
            Add coffee
          </Link>
          <Link
            href="/import"
            className="rounded border border-neutral-300 px-4 py-2 text-sm text-neutral-700"
          >
            Import CSV
          </Link>
        </div>
      </div>

      <form className="grid gap-4 rounded border border-neutral-200 bg-white p-4 md:grid-cols-6">
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-neutral-500">Search</label>
          <input
            name="query"
            defaultValue={filters.query}
            placeholder="Company, name, notes..."
            className="mt-1 w-full rounded border border-neutral-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">Country</label>
          <select
            name="country"
            defaultValue={filters.country ?? ''}
            className="mt-1 w-full rounded border border-neutral-200 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">Process</label>
          <select
            name="process"
            defaultValue={filters.process ?? ''}
            className="mt-1 w-full rounded border border-neutral-200 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {processes.map((process) => (
              <option key={process} value={process}>
                {process}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">Brew Method</label>
          <select
            name="brewMethod"
            defaultValue={filters.brewMethod ?? ''}
            className="mt-1 w-full rounded border border-neutral-200 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {brewMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">Serve</label>
          <select
            name="serve"
            defaultValue={filters.serve ?? ''}
            className="mt-1 w-full rounded border border-neutral-200 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="BLACK">Black</option>
            <option value="WITH_MILK">With Milk</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">Min rating</label>
          <select
            name="minRating"
            defaultValue={filters.minRating ?? ''}
            className="mt-1 w-full rounded border border-neutral-200 px-3 py-2 text-sm"
          >
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((rating) => (
              <option key={rating} value={rating}>
                {rating}+
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-500">Sort</label>
          <select
            name="sort"
            defaultValue={filters.sort ?? 'date_desc'}
            className="mt-1 w-full rounded border border-neutral-200 px-3 py-2 text-sm"
          >
            <option value="date_desc">Date (newest)</option>
            <option value="rating_desc">Rating (high to low)</option>
            <option value="company_asc">Company (A-Z)</option>
          </select>
        </div>
        <div className="md:col-span-6">
          <button className="rounded border border-neutral-300 px-4 py-2 text-sm text-neutral-700">
            Apply filters
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Process</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {coffees.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-neutral-500">
                  No coffees yet. Add your first brew.
                </td>
              </tr>
            ) : (
              coffees.map((coffee) => (
                <tr key={coffee.id}>
                  <td className="px-4 py-3 text-neutral-700">
                    {coffee.date.toISOString().split('T')[0]}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{coffee.company}</td>
                  <td className="px-4 py-3 text-neutral-700">{coffee.name}</td>
                  <td className="px-4 py-3 text-neutral-700">{coffee.country}</td>
                  <td className="px-4 py-3 text-neutral-700">{coffee.process}</td>
                  <td className="px-4 py-3 text-neutral-700">{coffee.rating}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/coffees/${coffee.id}`}
                      className="text-sm text-neutral-900 underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
