import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, BarChart3, X } from 'lucide-react';

export default function MoodTracker() {
  const [view, setView] = useState('log');
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [sliderValues, setSliderValues] = useState({}); // Tracks live slider positions during drag

  const dimensions = [
    { id: 'overall', label: 'Overall', emoji: '\u{1F60A}', left: 'Low', right: 'Great' },
    { id: 'home', label: 'Home', emoji: '\u{1F3E0}', left: 'Conflict', right: 'Harmony' },
    { id: 'work', label: 'Work', emoji: '\u{1F4BC}', left: 'Stressed', right: 'Flow' },
    { id: 'health', label: 'Health', emoji: '\u{1F34E}', left: 'Sluggish', right: 'Energized' },
    { id: 'sleep', label: 'Sleep', emoji: '\u{1F4A4}', left: 'Restless', right: 'Restorative' },
    { id: 'social', label: 'Social', emoji: '\u{1F465}', left: 'Isolated', right: 'Connected' }
  ];

  const getTodayKey = () => new Date().toISOString().split('T')[0];

  const getHistoryMap = () => {
    const map = {};
    history.forEach(entry => {
      map[entry.date] = entry.data;
    });
    return map;
  };

  const getAverageForDay = (data) => {
    if (!data) return null;
    const values = Object.values(data);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  const generateCalendarGrid = () => {
    const weeks = [];
    const historyMap = getHistoryMap();

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 83);

    const firstDay = new Date(startDate);
    while (firstDay.getDay() !== 0) {
      firstDay.setDate(firstDay.getDate() - 1);
    }

    let currentDate = new Date(firstDay);
    let week = [];

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const data = historyMap[dateStr];
      const avg = getAverageForDay(data);

      week.push({
        date: dateStr,
        data: data,
        avg: avg,
        isToday: dateStr === getTodayKey(),
        isFuture: currentDate > endDate
      });

      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (week.length > 0) {
      weeks.push(week);
    }

    return weeks;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const todayKey = getTodayKey();
      const result = await window.storage.get(`mood:${todayKey}`);

      if (result?.value) {
        setToday(JSON.parse(result.value));
      } else {
        const defaultMood = dimensions.reduce((acc, dim) => ({ ...acc, [dim.id]: 0 }), {});
        setToday(defaultMood);
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
    } catch (error) {
      const defaultMood = dimensions.reduce((acc, dim) => ({ ...acc, [dim.id]: 0 }), {});
      setToday(defaultMood);
    }
  };

  // Update visual slider position during drag (no save)
  const handleSliderChange = (dimensionId, value) => {
    setSliderValues(prev => ({ ...prev, [dimensionId]: parseFloat(value) }));
  };

  // Snap to nearest integer and save when user releases slider
  const handleSliderRelease = async (dimensionId) => {
    const currentValue = sliderValues[dimensionId];
    if (currentValue === undefined) return;

    const snappedValue = Math.round(currentValue);
    const updated = { ...today, [dimensionId]: snappedValue };

    // Clear the dragging state and update today
    setSliderValues(prev => {
      const next = { ...prev };
      delete next[dimensionId];
      return next;
    });
    setToday(updated);

    setSaving(true);
    try {
      const todayKey = getTodayKey();
      await window.storage.set(`mood:${todayKey}`, JSON.stringify(updated));
      await loadData();
    } catch (error) {
      console.error('Save failed:', error);
    }
    setSaving(false);
  };

  // Get the display value for a dimension (dragging value or saved value)
  const getDisplayValue = (dimensionId) => {
    if (sliderValues[dimensionId] !== undefined) {
      return sliderValues[dimensionId];
    }
    return today[dimensionId];
  };

  const handleDayClick = (dayData) => {
    if (!dayData.data) return;
    setSelectedDate(dayData);
    setShowDayModal(true);
  };

  const closeDayModal = () => {
    setShowDayModal(false);
    setSelectedDate(null);
  };

  const getGradientForValue = (value) => {
    if (value <= -2) return 'from-rose-400 to-red-500';
    if (value === -1) return 'from-orange-300 to-orange-400';
    if (value === 0) return 'from-amber-200 to-yellow-300';
    if (value === 1) return 'from-lime-300 to-green-400';
    return 'from-emerald-400 to-teal-500';
  };

  const getOverallMood = () => {
    if (!today) return 0;
    const avg = Object.values(today).reduce((sum, val) => sum + val, 0) / Object.values(today).length;
    return avg;
  };

  if (!today) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-xl text-purple-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-20">
      <div className={`bg-gradient-to-r ${getGradientForValue(getOverallMood())} text-white px-6 pt-12 pb-8 rounded-b-3xl shadow-lg`}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h1>
          <p className="text-white/90 text-sm">How's your day?</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-4">
        {view === 'log' && (
          <div className="bg-white rounded-3xl shadow-xl p-6 space-y-6 relative">
            <div className={`absolute top-3 right-3 text-sm text-green-600 font-medium transition-opacity duration-300 ${saving ? 'opacity-100' : 'opacity-0'}`}>
              Saved &#x2713;
            </div>

            {dimensions.map((dim, idx) => {
              const displayValue = getDisplayValue(dim.id);
              const isDragging = sliderValues[dim.id] !== undefined;
              const snappedPreview = Math.round(displayValue);

              return (
                <div key={dim.id} className="space-y-3" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{dim.emoji}</span>
                      <span className="font-semibold text-gray-800" style={{ fontFamily: 'system-ui, sans-serif' }}>
                        {dim.label}
                      </span>
                    </div>
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGradientForValue(snappedPreview)} flex items-center justify-center text-white font-bold shadow-md transition-all duration-150 ${isDragging ? 'scale-110' : ''}`}>
                      {snappedPreview > 0 ? '+' : ''}{snappedPreview}
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.01"
                      value={displayValue}
                      onChange={(e) => handleSliderChange(dim.id, e.target.value)}
                      onMouseUp={() => handleSliderRelease(dim.id)}
                      onTouchEnd={() => handleSliderRelease(dim.id)}
                      className="w-full h-3 rounded-full appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right,
                          #fb7185 0%,
                          #fb923c 25%,
                          #fbbf24 50%,
                          #84cc16 75%,
                          #10b981 100%)`
                      }}
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>{dim.left}</span>
                      <span>{dim.right}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="pt-4 text-center text-sm text-gray-500">
              Changes saved automatically
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="bg-white rounded-3xl shadow-xl p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Your Journey
            </h2>

            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Start logging to see your history</p>
            ) : (
              <div className="space-y-6">
                <div className="overflow-x-auto pb-2">
                  <div className="inline-block min-w-full">
                    <div className="flex gap-1 mb-2 text-xs text-gray-500 pl-8">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="w-7 text-center">{day}</div>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {generateCalendarGrid().map((week, weekIdx) => (
                        <div key={weekIdx} className="flex flex-col gap-1">
                          {week.map((day, dayIdx) => {
                            const color = day.isFuture
                              ? 'bg-gray-100'
                              : !day.data
                                ? 'bg-gray-200'
                                : day.avg <= -1.5 ? 'bg-red-500'
                                : day.avg <= -0.5 ? 'bg-orange-400'
                                : day.avg <= 0.5 ? 'bg-yellow-300'
                                : day.avg <= 1.5 ? 'bg-green-400'
                                : 'bg-emerald-500';

                            return (
                              <button
                                key={dayIdx}
                                onClick={() => handleDayClick(day)}
                                disabled={!day.data}
                                className={`w-7 h-7 rounded ${color} ${
                                  day.isToday ? 'ring-2 ring-purple-500 ring-offset-1' : ''
                                } ${
                                  day.data ? 'hover:ring-2 hover:ring-purple-300 cursor-pointer transform hover:scale-110' : 'cursor-default'
                                } transition-all duration-150`}
                                title={day.data ? `${day.date}: ${day.avg.toFixed(1)}` : day.date}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center mt-4 text-xs text-gray-600">
                      <span>Less</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <div className="w-4 h-4 bg-yellow-300 rounded"></div>
                        <div className="w-4 h-4 bg-green-400 rounded"></div>
                        <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                      </div>
                      <span>More</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Recent Entries</h3>
                  {history.slice(0, 7).map((entry) => {
                    const avg = getAverageForDay(entry.data);
                    return (
                      <button
                        key={entry.date}
                        onClick={() => handleDayClick({ date: entry.date, data: entry.data, avg })}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-purple-50 hover:shadow-md transition-all text-left"
                      >
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getGradientForValue(avg)} flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0`}>
                          {avg.toFixed(1)}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">
                            {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {dimensions.slice(1).map(dim => (
                              <div key={dim.id} className="flex items-center gap-1 text-xs">
                                <span>{dim.emoji}</span>
                                <span className={`font-medium ${entry.data[dim.id] >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                                  {entry.data[dim.id] > 0 ? '+' : ''}{entry.data[dim.id]}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'insights' && (
          <div className="bg-white rounded-3xl shadow-xl p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Insights
            </h2>
            {history.length < 3 ? (
              <p className="text-gray-500 text-center py-8">Log at least 3 days to see insights</p>
            ) : (
              <div className="space-y-4">
                {dimensions.map((dim) => {
                  const values = history.map(h => h.data[dim.id]);
                  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
                  const trend = values.length >= 7
                    ? (values.slice(0, 3).reduce((s, v) => s + v, 0) / 3) - (values.slice(-3).reduce((s, v) => s + v, 0) / 3)
                    : 0;

                  return (
                    <div key={dim.id} className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{dim.emoji}</span>
                          <span className="font-semibold text-gray-800">{dim.label}</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${avg >= 0 ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                          Avg: {avg.toFixed(1)}
                        </div>
                      </div>
                      {Math.abs(trend) > 0.3 && (
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          {trend > 0 ? '\u{1F4C8} Improving' : '\u{1F4C9} Declining'} recently
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-around items-center shadow-lg">
        <button
          onClick={() => setView('log')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
            view === 'log'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Calendar className="w-6 h-6" />
          <span className="text-xs font-medium">Today</span>
        </button>

        <button
          onClick={() => setView('history')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
            view === 'history'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BarChart3 className="w-6 h-6" />
          <span className="text-xs font-medium">History</span>
        </button>

        <button
          onClick={() => setView('insights')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
            view === 'insights'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <TrendingUp className="w-6 h-6" />
          <span className="text-xs font-medium">Insights</span>
        </button>
      </div>

      {showDayModal && selectedDate && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center"
          onClick={closeDayModal}
        >
          <div
            className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
                  {new Date(selectedDate.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
                <div className={`inline-block mt-2 px-4 py-2 rounded-full bg-gradient-to-br ${getGradientForValue(selectedDate.avg)} text-white font-bold text-lg shadow-md`}>
                  Overall: {selectedDate.avg.toFixed(1)}
                </div>
              </div>
              <button
                onClick={closeDayModal}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {dimensions.map((dim) => {
                const value = selectedDate.data[dim.id];
                return (
                  <div key={dim.id} className="p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-purple-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{dim.emoji}</span>
                        <span className="font-semibold text-gray-800">{dim.label}</span>
                      </div>
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGradientForValue(value)} flex items-center justify-center text-white font-bold shadow-md`}>
                        {value > 0 ? '+' : ''}{value}
                      </div>
                    </div>
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute h-full bg-gradient-to-r ${getGradientForValue(value)} transition-all`}
                        style={{
                          width: `${((value + 2) / 4) * 100}%`,
                          left: 0
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>{dim.left}</span>
                      <span>{dim.right}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={closeDayModal}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl shadow-md hover:shadow-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          border: 3px solid #8b5cf6;
          transition: transform 0.15s ease;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .slider::-webkit-slider-thumb:active {
          transform: scale(1.1);
        }

        .slider::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          border: 3px solid #8b5cf6;
          transition: transform 0.15s ease;
        }

        .slider::-moz-range-thumb:hover {
          transform: scale(1.2);
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }

        @media (max-width: 640px) {
          button {
            -webkit-tap-highlight-color: transparent;
          }
        }
      `}</style>
    </div>
  );
}
