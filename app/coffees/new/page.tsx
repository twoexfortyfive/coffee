import CoffeeForm from '@/components/CoffeeForm';
import { createCoffee } from '@/app/lib/actions';

export default function NewCoffeePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add coffee</h1>
        <p className="text-sm text-neutral-500">Capture a new brew and tasting notes.</p>
      </div>
      <CoffeeForm onSubmit={createCoffee} submitLabel="Save coffee" />
    </div>
  );
}
