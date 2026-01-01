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

      const allMoods = await window.storage.getAll();
      const entries = Object.entries(allMoods).map(([date, data]) => ({ date, data }));
      entries.sort((a, b) => b.date.localeCompare(a.date));
      setHistory(entries);
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
