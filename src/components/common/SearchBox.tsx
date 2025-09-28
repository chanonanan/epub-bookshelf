import { useSearchParams } from 'react-router-dom';

export function SearchBox() {
  const [params, setParams] = useSearchParams();
  const value = params.get('search') ?? '';

  const updateSearch = (v: string) => {
    if (v) {
      params.set('search', v);
    } else {
      params.delete('search');
    }
    setParams(params);
  };

  return (
    <input
      type="text"
      placeholder="Search books..."
      value={value}
      onChange={(e) => updateSearch(e.target.value)}
      className="px-3 py-2 border rounded w-full md:w-64"
    />
  );
}
