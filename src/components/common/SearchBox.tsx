import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '../ui/input';

export function SearchBox() {
  const [params, setParams] = useSearchParams();
  const searchParam = params.get('search') ?? '';
  const [value, setValue] = useState(searchParam);

  // keep local input state in sync if param changes externally
  useEffect(() => {
    setValue(searchParam);
  }, [searchParam]);

  // debounce updating URL params
  useEffect(() => {
    const id = setTimeout(() => {
      if (value) {
        params.set('search', value);
      } else {
        params.delete('search');
      }
      setParams(params, { replace: true });
    }, 400); // 400ms debounce

    return () => clearTimeout(id);
  }, [value, params, setParams]);

  return (
    <Input
      type="text"
      placeholder="Search books..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="px-3 py-2 border rounded w-full md:w-64"
    />
  );
}
