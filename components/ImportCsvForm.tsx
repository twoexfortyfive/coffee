'use client';

import { useState, useTransition } from 'react';
import Papa from 'papaparse';
import { csvImportSchema, type CsvImportRow } from '@/app/lib/coffeeSchema';
import { importCoffees } from '@/app/lib/actions';

const inputClass =
  'w-full rounded border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-400 focus:outline-none';

const requiredFields = ['date', 'company', 'name', 'country', 'process', 'rating'] as const;

export default function ImportCsvForm() {
  const [rows, setRows] = useState<CsvImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleFile = (file: File) => {
    Papa.parse<CsvImportRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRows = results.data.map((row) => ({
          ...row,
          date: row.date?.trim?.() ?? '',
          company: row.company?.trim?.() ?? '',
          name: row.name?.trim?.() ?? '',
          country: row.country?.trim?.() ?? '',
          process: row.process?.trim?.() ?? '',
          rating: row.rating?.toString().trim?.() ?? ''
        }));

        const validationErrors: string[] = [];
        parsedRows.forEach((row, index) => {
          const missing = requiredFields.filter((field) => !row[field]);
          if (missing.length) {
            validationErrors.push(`Row ${index + 1}: Missing ${missing.join(', ')}`);
          }
          const validation = csvImportSchema.safeParse(row);
          if (!validation.success) {
            validationErrors.push(`Row ${index + 1}: ${validation.error.errors[0]?.message}`);
          }
        });

        setRows(parsedRows);
        setErrors(validationErrors);
      }
    });
  };

  const handleImport = () => {
    startTransition(async () => {
      await importCoffees(rows);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium text-neutral-700">CSV File</label>
        <input
          type="file"
          accept=".csv"
          className={inputClass}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {rows.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Preview (first 20 rows)</h2>
            <div className="mt-2 overflow-x-auto rounded border border-neutral-200 bg-white">
              <table className="min-w-full divide-y divide-neutral-200 text-xs">
                <thead className="bg-neutral-50 text-left text-[11px] uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Company</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Country</th>
                    <th className="px-3 py-2">Process</th>
                    <th className="px-3 py-2">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {rows.slice(0, 20).map((row, index) => (
                    <tr key={`${row.name}-${index}`}>
                      <td className="px-3 py-2">{row.date}</td>
                      <td className="px-3 py-2">{row.company}</td>
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2">{row.country}</td>
                      <td className="px-3 py-2">{row.process}</td>
                      <td className="px-3 py-2">{row.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-medium">Fix these issues before importing:</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            disabled={errors.length > 0 || isPending}
            onClick={handleImport}
            className="rounded border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Importing...' : 'Import rows'}
          </button>
        </div>
      )}
    </div>
  );
}
