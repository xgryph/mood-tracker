export const dimensions = [
  { id: 'overall', label: 'Overall', emoji: '\u{1F60A}', left: 'Low', right: 'Great' },
  { id: 'home', label: 'Home', emoji: '\u{1F3E0}', left: 'Conflict', right: 'Harmony' },
  { id: 'work', label: 'Work', emoji: '\u{1F4BC}', left: 'Stressed', right: 'Flow' },
  { id: 'health', label: 'Health', emoji: '\u{1F34E}', left: 'Sluggish', right: 'Energized' },
  { id: 'sleep', label: 'Sleep', emoji: '\u{1F4A4}', left: 'Restless', right: 'Restorative' },
  { id: 'social', label: 'Social', emoji: '\u{1F465}', left: 'Isolated', right: 'Connected' }
];

export const createDefaultMood = () =>
  dimensions.reduce((acc, dim) => ({ ...acc, [dim.id]: 0 }), {});
