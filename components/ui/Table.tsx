'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface ColumnDef<T> {
  key: keyof T;
  header: string;
  accessor?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  width?: string;
}

export interface TableAction<T> {
  label: string;
  onClick: (item: T) => void;
  variant?: 'default' | 'danger';
  disabled?: (item: T) => boolean;
}

interface AdvancedTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  rowActions?: TableAction<T>[];
  keyExtractor: (item: T, index: number) => string | number;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
}

/**
 * Advanced Table Component
 * Generic table with sorting support and row actions
 *
 * Usage:
 * <AdvancedTable
 *   data={hotels}
 *   columns={[
 *     { key: 'name', header: 'Name', sortable: true },
 *     { key: 'status', header: 'Status' },
 *   ]}
 *   keyExtractor={(item) => item.id}
 *   rowActions={[
 *     { label: 'Edit', onClick: (item) => handleEdit(item) },
 *     { label: 'Delete', onClick: (item) => handleDelete(item), variant: 'danger' },
 *   ]}
 * />
 */
export function AdvancedTable<T>({
  data,
  columns,
  onSort,
  rowActions = [],
  keyExtractor,
  className = '',
  striped = true,
  hoverable = true,
}: AdvancedTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (columnKey: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';

    if (sortConfig?.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key: columnKey, direction });
    onSort?.(columnKey, direction);
  };

  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-200 ${className}`}>
      <table className="w-full text-left text-sm">
        {/* Header */}
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`px-6 py-3 font-medium text-gray-900 ${column.className || ''} ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                }`}
                onClick={() => column.sortable && handleSort(column.key)}
                style={column.width ? { width: column.width } : {}}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {column.sortable && sortConfig?.key === column.key && (
                    <span>
                      {sortConfig.direction === 'asc' ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
            {rowActions.length > 0 && (
              <th className="px-6 py-3 font-medium text-gray-900">Actions</th>
            )}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (rowActions.length > 0 ? 1 : 0)}
                className="px-6 py-8 text-center text-gray-500"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((item, index) => {
              const isEven = index % 2 === 0;
              return (
                <tr
                  key={keyExtractor(item, index)}
                  className={`border-b border-gray-200 transition ${
                    striped && isEven ? 'bg-gray-50' : ''
                  } ${hoverable ? 'hover:bg-blue-50' : ''}`}
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className={`px-6 py-4 ${column.className || ''}`}>
                      {column.accessor
                        ? column.accessor(item)
                        : String(item[column.key] || '-')}
                    </td>
                  ))}
                  {rowActions.length > 0 && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {rowActions.map((action, i) => (
                          <button
                            key={i}
                            onClick={() => action.onClick(item)}
                            disabled={action.disabled?.(item)}
                            className={`px-3 py-1 text-xs rounded transition ${
                              action.variant === 'danger'
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-blue-600 hover:bg-blue-50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
