import { useState, useEffect, useCallback } from 'react';
import { createDefaultMood } from '../config/moodSchema';
import { getTodayKey } from '../config/moodUtils';

export default function useMoods() {
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const todayKey = getTodayKey();
      const result = await window.storage.get(`mood:${todayKey}`);

      if (result?.value) {
        setToday(JSON.parse(result.value));
      } else {
        setToday(createDefaultMood());
      }

      const keys = await window.storage.list('mood:');
      if (keys?.keys) {
        const entries = await Promise.all(
          keys.keys.slice(0, 90).map(async (key) => {
            try {
              const result = await window.storage.get(key);
              return result?.value ? { date: key.replace('mood:', ''), data: JSON.parse(result.value) } : null;
            } catch {
              return null;
            }
          })
        );
        setHistory(entries.filter(e => e !== null).sort((a, b) => b.date.localeCompare(a.date)));
      }
    } catch (err) {
      setError(err.message || 'Failed to load mood data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateMood = useCallback(async (updatedMood) => {
    setToday(updatedMood);
    setIsSaving(true);

    try {
      const todayKey = getTodayKey();
      await window.storage.set(`mood:${todayKey}`, JSON.stringify(updatedMood));
      await loadData();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [loadData]);

  return {
    today,
    history,
    updateMood,
    isLoading,
    isSaving,
    error,
    retry: loadData
  };
}
