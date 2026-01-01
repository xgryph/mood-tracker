import React from 'react';
import { dimensions } from '../../config/moodSchema';

export default function MoodInsights({ history }) {
  return (
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
  );
}
