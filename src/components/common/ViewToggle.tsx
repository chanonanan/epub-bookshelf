import { Grid, List } from 'lucide-react';

interface Props {
  viewMode: 'list' | 'card';
  onChange: (mode: 'list' | 'card') => void;
}

export function ViewToggle({ viewMode, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        className={`p-2 rounded ${viewMode === 'list' ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}
        onClick={() => onChange('list')}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        className={`p-2 rounded ${viewMode === 'card' ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}
        onClick={() => onChange('card')}
      >
        <Grid className="w-4 h-4" />
      </button>
    </div>
  );
}
