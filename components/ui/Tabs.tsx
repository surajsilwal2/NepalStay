'use client';

import React, { useState } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  defaultTabId?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'pills';
}

/**
 * Tabs Component
 * Manages multiple tab panels with active state
 *
 * Usage:
 * <Tabs
 *   items={[
 *     { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
 *     { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
 *   ]}
 *   defaultTabId="tab1"
 * />
 */
export function Tabs({
  items,
  defaultTabId,
  onChange,
  className = '',
  variant = 'default',
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTabId || items[0]?.id || '');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeItem = items.find((item) => item.id === activeTab);

  return (
    <div className={className}>
      {/* Tab List */}
      <div
        className={`flex gap-2 border-b border-gray-200 ${
          variant === 'pills' ? 'gap-3 bg-gray-100 p-1 rounded-lg border-0' : ''
        }`}
      >
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            disabled={item.disabled}
            className={`px-4 py-2 text-sm font-medium transition relative ${
              variant === 'pills'
                ? `rounded-md ${
                    activeTab === item.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-700 hover:text-gray-900'
                  }`
                : `${
                    activeTab === item.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-700 hover:text-gray-900 border-b-2 border-transparent'
                  }`
            } ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeItem && <div>{activeItem.content}</div>}
      </div>
    </div>
  );
}
