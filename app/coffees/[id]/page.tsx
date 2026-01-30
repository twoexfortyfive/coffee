import { notFound } from 'next/navigation';
import CoffeeForm from '@/components/CoffeeForm';
import { prisma } from '@/app/lib/prisma';
import { deleteCoffee, updateCoffee } from '@/app/lib/actions';

export default async function CoffeeDetailPage({
  params
}: {
  params: { id: string };
}) {
  const coffee = await prisma.coffeeEntry.findUnique({
    where: { id: params.id },
    include: {
      coffeeTags: { include: { tag: true } }
    }
  });

  if (!coffee) {
    notFound();
  }

  const tagList = coffee.coffeeTags.map((entry) => entry.tag.name);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{coffee.name}</h1>
        <p className="text-sm text-neutral-500">{coffee.company}</p>
      </div>

      <section className="grid gap-4 rounded border border-neutral-200 bg-white p-6 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Date</p>
          <p className="text-sm text-neutral-800">{coffee.date.toISOString().split('T')[0]}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Country</p>
          <p className="text-sm text-neutral-800">{coffee.country}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Process</p>
          <p className="text-sm text-neutral-800">{coffee.process}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Rating</p>
          <p className="text-sm text-neutral-800">{coffee.rating}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Brew Method</p>
          <p className="text-sm text-neutral-800">{coffee.brewMethod ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Serve</p>
          <p className="text-sm text-neutral-800">
            {coffee.serve === 'WITH_MILK' ? 'With Milk' : coffee.serve === 'BLACK' ? 'Black' : '—'}
          </p>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Cup profile</p>
          <p className="text-sm text-neutral-800">{coffee.cupProfileRaw ?? '—'}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Tags</p>
          <p className="text-sm text-neutral-800">
            {tagList.length ? tagList.join(', ') : '—'}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Edit coffee</h2>
        <CoffeeForm
          defaultValues={{
            date: coffee.date.toISOString().split('T')[0],
            company: coffee.company,
            name: coffee.name,
            region: coffee.region ?? '',
            country: coffee.country,
            location: coffee.location ?? '',
            altitude: coffee.altitude ?? '',
            process: coffee.process,
            varietal: coffee.varietal ?? '',
            cupProfileRaw: coffee.cupProfileRaw ?? '',
            grindSetting: coffee.grindSetting?.toString() ?? '',
            brewMethod: coffee.brewMethod ?? '',
            serve: coffee.serve ?? undefined,
            rating: coffee.rating.toString(),
            notes: coffee.notes ?? '',
            nicholasNotes: coffee.nicholasNotes ?? ''
          }}
          onSubmit={(data) => updateCoffee(coffee.id, data)}
          submitLabel="Update coffee"
        />
      </section>

      <form action={deleteCoffee.bind(null, coffee.id)}>
        <button className="rounded border border-red-200 px-4 py-2 text-sm text-red-700">
          Delete coffee
        </button>
      </form>
    </div>
  );
}
