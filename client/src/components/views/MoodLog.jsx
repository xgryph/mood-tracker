import React from 'react';
import { dimensions } from '../../config/moodSchema';
import { getGradientForValue } from '../../config/moodUtils';

export default function MoodLog({
  today,
  saving,
  sliderValues,
  onSliderChange,
  onSliderRelease
}) {
  const getDisplayValue = (dimensionId) => {
    if (sliderValues[dimensionId] !== undefined) {
      return sliderValues[dimensionId];
    }
    return today[dimensionId];
  };

  return (
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
                onChange={(e) => onSliderChange(dim.id, e.target.value)}
                onMouseUp={() => onSliderRelease(dim.id)}
                onTouchEnd={() => onSliderRelease(dim.id)}
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
  );
}
