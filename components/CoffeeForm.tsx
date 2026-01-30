'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { coffeeFormSchema, ratingOptions, type CoffeeFormInput } from '@/app/lib/coffeeSchema';
import { clsx } from 'clsx';

const inputClass =
  'w-full rounded border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-400 focus:outline-none';

const labelClass = 'text-sm font-medium text-neutral-700';

const errorClass = 'text-xs text-red-600';

export type CoffeeFormProps = {
  defaultValues?: Partial<CoffeeFormInput>;
  onSubmit: (data: CoffeeFormInput) => Promise<void>;
  submitLabel?: string;
};

export default function CoffeeForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Save coffee'
}: CoffeeFormProps) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CoffeeFormInput>({
    resolver: zodResolver(coffeeFormSchema),
    defaultValues: {
      date: '',
      company: '',
      name: '',
      region: '',
      country: '',
      location: '',
      altitude: '',
      process: '',
      varietal: '',
      cupProfileRaw: '',
      grindSetting: '',
      brewMethod: '',
      serve: undefined,
      rating: '',
      notes: '',
      nicholasNotes: '',
      ...defaultValues
    }
  });

  const onValid = (data: CoffeeFormInput) => {
    startTransition(async () => {
      await onSubmit(data);
    });
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="date">
            Date *
          </label>
          <input id="date" type="date" className={inputClass} {...register('date')} />
          {errors.date && <p className={errorClass}>{errors.date.message}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="company">
            Company / Roaster *
          </label>
          <input id="company" className={inputClass} {...register('company')} />
          {errors.company && <p className={errorClass}>{errors.company.message}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="name">
            Name *
          </label>
          <input id="name" className={inputClass} {...register('name')} />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="region">
            Coffee Region
          </label>
          <input id="region" className={inputClass} {...register('region')} />
        </div>
        <div>
          <label className={labelClass} htmlFor="country">
            Country *
          </label>
          <input id="country" className={inputClass} {...register('country')} />
          {errors.country && <p className={errorClass}>{errors.country.message}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="location">
            Location
          </label>
          <input id="location" className={inputClass} {...register('location')} />
        </div>
        <div>
          <label className={labelClass} htmlFor="altitude">
            Altitude
          </label>
          <input id="altitude" className={inputClass} {...register('altitude')} />
        </div>
        <div>
          <label className={labelClass} htmlFor="process">
            Process *
          </label>
          <input id="process" className={inputClass} {...register('process')} />
          {errors.process && <p className={errorClass}>{errors.process.message}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="varietal">
            Varietal
          </label>
          <input id="varietal" className={inputClass} {...register('varietal')} />
        </div>
        <div>
          <label className={labelClass} htmlFor="cupProfileRaw">
            Cup profile
          </label>
          <input id="cupProfileRaw" className={inputClass} {...register('cupProfileRaw')} />
        </div>
        <div>
          <label className={labelClass} htmlFor="grindSetting">
            Grind setting
          </label>
          <input id="grindSetting" type="number" step="0.1" className={inputClass} {...register('grindSetting')} />
        </div>
        <div>
          <label className={labelClass} htmlFor="brewMethod">
            Brew method
          </label>
          <input id="brewMethod" className={inputClass} {...register('brewMethod')} />
        </div>
        <div>
          <label className={labelClass} htmlFor="serve">
            Serve
          </label>
          <select id="serve" className={inputClass} {...register('serve')}>
            <option value="">Select</option>
            <option value="BLACK">Black</option>
            <option value="WITH_MILK">With Milk</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="rating">
            Rating *
          </label>
          <select id="rating" className={inputClass} {...register('rating')}>
            <option value="">Select</option>
            {ratingOptions.map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
          {errors.rating && <p className={errorClass}>{errors.rating.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          Notes
        </label>
        <textarea id="notes" rows={3} className={inputClass} {...register('notes')} />
      </div>
      <div>
        <label className={labelClass} htmlFor="nicholasNotes">
          Nicholas Notes
        </label>
        <textarea id="nicholasNotes" rows={3} className={inputClass} {...register('nicholasNotes')} />
      </div>

      <button
        type="submit"
        className={clsx(
          'rounded border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm text-white transition',
          isPending && 'cursor-not-allowed opacity-70'
        )}
        disabled={isPending}
      >
        {isPending ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
