import { ModeToggle } from '@/components/ModeToggle';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-xl py-8 md:hidden">
      <header className="mb-8">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Settings aria-hidden="true" className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Settings</h1>
      </header>

      <section
        aria-labelledby="appearance-heading"
        className="flex items-center justify-between gap-4 rounded-lg border p-4"
      >
        <div>
          <h2 id="appearance-heading" className="font-medium">
            Appearance
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose light, dark, or system theme.
          </p>
        </div>
        <ModeToggle />
      </section>
    </div>
  );
}
