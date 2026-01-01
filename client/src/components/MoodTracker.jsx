import React, { useState } from 'react';
import { Calendar, TrendingUp, BarChart3, X, AlertCircle, RefreshCw } from 'lucide-react';
import { dimensions } from '../config/moodSchema';
import { getGradientForValue } from '../config/moodUtils';
import MoodLog from './views/MoodLog';
import MoodHistory from './views/MoodHistory';
import MoodInsights from './views/MoodInsights';
import useMoods from '../hooks/useMoods';

export default function MoodTracker() {
  const { today, history, updateMood, isLoading, isSaving, error, retry } = useMoods();

  const [view, setView] = useState('log');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [sliderValues, setSliderValues] = useState({});

  const handleSliderChange = (dimensionId, value) => {
    setSliderValues(prev => ({ ...prev, [dimensionId]: parseFloat(value) }));
  };

  const handleSliderRelease = async (dimensionId) => {
    const currentValue = sliderValues[dimensionId];
    if (currentValue === undefined) return;

    const snappedValue = Math.round(currentValue);
    const updated = { ...today, [dimensionId]: snappedValue };

    setSliderValues(prev => {
      const next = { ...prev };
      delete next[dimensionId];
      return next;
    });

    await updateMood(updated);
  };

  const handleDayClick = (dayData) => {
    setSelectedDate(dayData);
    setShowDayModal(true);
  };

  const closeDayModal = () => {
    setShowDayModal(false);
    setSelectedDate(null);
  };

  const getOverallMood = () => {
    if (!today) return 0;
    const avg = Object.values(today).reduce((sum, val) => sum + val, 0) / Object.values(today).length;
    return avg;
  };

  if (isLoading || !today) {
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

      {error && (
        <div className="max-w-2xl mx-auto px-6 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Something went wrong</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={retry}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      )}

      <div className={`max-w-2xl mx-auto px-6 ${error ? 'mt-4' : '-mt-4'}`}>
        {view === 'log' && (
          <MoodLog
            today={today}
            saving={isSaving}
            sliderValues={sliderValues}
            onSliderChange={handleSliderChange}
            onSliderRelease={handleSliderRelease}
          />
        )}

        {view === 'history' && (
          <MoodHistory
            history={history}
            onDayClick={handleDayClick}
          />
        )}

        {view === 'insights' && (
          <MoodInsights history={history} />
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
