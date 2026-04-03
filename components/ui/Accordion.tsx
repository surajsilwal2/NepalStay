'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpenIds?: string[];
  onChange?: (openIds: string[]) => void;
  className?: string;
}

/**
 * Accordion Component
 * Collapsible items with smooth animations
 *
 * Usage:
 * <Accordion
 *   items={[
 *     { id: 'item1', title: 'Section 1', content: <div>Content 1</div> },
 *     { id: 'item2', title: 'Section 2', content: <div>Content 2</div> },
 *   ]}
 *   allowMultiple
 * />
 */
export function Accordion({
  items,
  allowMultiple = false,
  defaultOpenIds = [],
  onChange,
  className = '',
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpenIds);

  const handleToggle = (itemId: string) => {
    let newOpenItems: string[];

    if (allowMultiple) {
      // Toggle item in list
      newOpenItems = openItems.includes(itemId)
        ? openItems.filter((id) => id !== itemId)
        : [...openItems, itemId];
    } else {
      // Only allow one open item
      newOpenItems = openItems.includes(itemId) ? [] : [itemId];
    }

    setOpenItems(newOpenItems);
    onChange?.(newOpenItems);
  };

  return (
    <div className={`divide-y divide-gray-200 border border-gray-200 rounded-lg ${className}`}>
      {items.map((item) => {
        const isOpen = openItems.includes(item.id);

        return (
          <div key={item.id}>
            {/* Header */}
            <button
              onClick={() => handleToggle(item.id)}
              disabled={item.disabled}
              className={`w-full px-6 py-4 text-left font-medium transition ${
                item.disabled
                  ? 'opacity-50 cursor-not-allowed bg-gray-50'
                  : 'hover:bg-gray-50 active:bg-gray-100'
              } flex items-center justify-between`}
            >
              <span className="text-gray-900">{item.title}</span>
              <ChevronDown
                size={20}
                className={`text-gray-600 transition ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Content */}
            {isOpen && (
              <div className="px-6 py-4 bg-gray-50 text-gray-700">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
