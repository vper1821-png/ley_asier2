import { createContext, useContext, useRef, useEffect } from 'react';

const DataCacheContext = createContext(null);

export function DataCacheProvider({ children }) {
  const cache = useRef({});

  const get = (key) => cache.current[key];
  const set = (key, data) => { cache.current[key] = data; };
  const clear = (key) => { if (key) delete cache.current[key]; else cache.current = {}; };

  return (
    <DataCacheContext.Provider value={{ get, set, clear }}>
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  return useContext(DataCacheContext);
}
