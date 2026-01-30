import ImportCsvForm from '@/components/ImportCsvForm';

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Import CSV</h1>
        <p className="text-sm text-neutral-500">
          Upload a CSV with your coffee history. Required columns: date, company, name, country,
          process, rating.
        </p>
      </div>
      <ImportCsvForm />
    </div>
  );
}
