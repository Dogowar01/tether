import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export function useStorage<T>(key: string, defaultValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key).then(raw => {
      if (raw !== null) {
        try { setValue(JSON.parse(raw)); } catch { /* use default */ }
      }
      setLoaded(true);
    });
  }, [key]);

  const set = useCallback((updater: T | ((prev: T) => T)) => {
    setValue(prev => {
      const next = typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater;
      AsyncStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);

  return [loaded ? value : defaultValue, set];
}
