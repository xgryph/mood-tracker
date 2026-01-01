export const getTodayKey = () => new Date().toISOString().split('T')[0];

export const getGradientForValue = (value) => {
  if (value <= -2) return 'from-rose-400 to-red-500';
  if (value === -1) return 'from-orange-300 to-orange-400';
  if (value === 0) return 'from-amber-200 to-yellow-300';
  if (value === 1) return 'from-lime-300 to-green-400';
  return 'from-emerald-400 to-teal-500';
};

export const getAverageForDay = (data) => {
  if (!data) return null;
  const values = Object.values(data);
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};
