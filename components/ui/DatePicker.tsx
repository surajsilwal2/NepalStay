'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parse, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  required?: boolean;
  className?: string;
}

/**
 * DatePicker Component with Month Navigation
 * Uses date-fns for date manipulation and formatting
 *
 * Usage:
 * const [date, setDate] = useState<Date | null>(null);
 * <DatePicker
 *   value={date}
 *   onChange={setDate}
 *   label="Select Date"
 * />
 */
export function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select a date',
  error,
  disabled = false,
  minDate,
  maxDate,
  required = false,
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(value || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad days from previous month
  const startingDayOfWeek = monthStart.getDay();
  const previousMonthDays = Array.from({ length: startingDayOfWeek }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (startingDayOfWeek - i));
    return date;
  });

  const calendarDays = [...previousMonthDays, ...daysInMonth];

  const isDateDisabled = (date: Date) => {
    const dateWithoutTime = new Date(date);
    dateWithoutTime.setHours(0, 0, 0, 0);

    if (minDate) {
      const minWithoutTime = new Date(minDate);
      minWithoutTime.setHours(0, 0, 0, 0);
      if (dateWithoutTime < minWithoutTime) return true;
    }

    if (maxDate) {
      const maxWithoutTime = new Date(maxDate);
      maxWithoutTime.setHours(0, 0, 0, 0);
      if (dateWithoutTime > maxWithoutTime) return true;
    }

    return false;
  };

  const handleSelectDate = (date: Date) => {
    if (!isDateDisabled(date)) {
      onChange(date);
      setIsOpen(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const formattedValue = value ? format(value, 'MMM dd, yyyy') : placeholder;

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2 text-left bg-white border rounded-md shadow-sm transition ${
          error
            ? 'border-red-500'
            : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'hover:border-gray-400'}`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>{formattedValue}</span>
      </button>

      {/* Error Message */}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      {/* Calendar Popup */}
      {isOpen && (
        <div className="absolute z-10 mt-1 p-4 bg-white border border-gray-300 rounded-md shadow-lg w-72">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePreviousMonth}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <h3 className="text-sm font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, i) => {
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const isSelected = value && format(date, 'yyyy-MM-dd') === format(value, 'yyyy-MM-dd');
              const isDisabledDate = isDateDisabled(date);

              return (
                <button
                  key={i}
                  onClick={() => handleSelectDate(date)}
                  disabled={isDisabledDate || !isCurrentMonth}
                  className={`p-2 text-sm rounded transition ${
                    isSelected
                      ? 'bg-blue-600 text-white font-medium'
                      : isCurrentMonth
                        ? 'text-gray-900 hover:bg-blue-50'
                        : 'text-gray-300'
                  } ${
                    isDisabledDate ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {format(date, 'd')}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <button
            onClick={() => {
              handleSelectDate(new Date());
            }}
            className="mt-4 w-full px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition"
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}
