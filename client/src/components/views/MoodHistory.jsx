import React, { useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  subWeeks,
  eachDayOfInterval,
  format,
  isToday,
  isFuture
} from 'date-fns';
import { dimensions } from '../../config/moodSchema';
import { getGradientForValue, getAverageForDay } from '../../config/moodUtils';

export default function MoodHistory({ history, onDayClick }) {
  const historyMap = useMemo(() => {
    const map = {};
    history.forEach(entry => {
      map[entry.date] = entry.data;
    });
    return map;
  }, [history]);

  const calendarGrid = useMemo(() => {
    const today = new Date();
    const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 0 });
    const startOf12WeeksAgo = startOfWeek(subWeeks(today, 11), { weekStartsOn: 0 });

    const allDays = eachDayOfInterval({
      start: startOf12WeeksAgo,
      end: endOfCurrentWeek
    });

    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) {
      const week = allDays.slice(i, i + 7).map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const data = historyMap[dateStr];
        return {
          date: dateStr,
          data,
          avg: getAverageForDay(data),
          isToday: isToday(date),
          isFuture: isFuture(date)
        };
      });
      weeks.push(week);
    }

    return weeks;
  }, [historyMap]);

  const handleDayClick = (dayData) => {
    if (!dayData.data) return;
    onDayClick(dayData);
  };

  return (
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
                {calendarGrid.map((week, weekIdx) => (
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
  );
}
