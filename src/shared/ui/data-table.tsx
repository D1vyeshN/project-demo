import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  pageSize?: number;
  emptyMessage?: string;
  emptyColSpan?: number;
  showPagination?: boolean;
  maxHeight?: string;
  scrollable?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  pageSize = 5,
  emptyMessage = 'No items found.',
  emptyColSpan,
  showPagination = true,
  maxHeight = '400px',
  scrollable = true,
}: DataTableProps<T>) {
  const [page, setPage] = React.useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pageItems = data.slice(startIdx, startIdx + pageSize);
  const startNum = data.length > 0 ? startIdx + 1 : 0;
  const endNum = data.length > 0 ? Math.min(startIdx + pageSize, data.length) : 0;

  const colSpan = emptyColSpan ?? columns.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          className={cn(
            'overflow-y-auto',
            scrollable && maxHeight && `max-h-[${maxHeight}]`,
            !scrollable && 'h-full'
          )}
        >
          <Table className="border border-gray-200">
            <TableHeader>
              <TableRow className="!bg-blue-200/10">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(col.headerClassName)}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={colSpan}
                    className="h-24 text-center text-gray-500"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((row, idx) => (
                  <TableRow key={String((row as any).id ?? (row as any).refNo ?? idx)}>
                    {columns.map((col) => {
                      const cellValue = col.render
                        ? col.render(row as any, idx)
                        : ((row as unknown as Record<string, unknown>)[
                            col.key
                          ] as React.ReactNode);
                      return (
                        <TableCell
                          key={col.key}
                          className={cn(col.cellClassName)}
                        >
                          {cellValue}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {showPagination && data.length > 0 && (
        <div className="">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>
              Showing {startNum} to {endNum} of {data.length} items
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'h-8 w-8 rounded-md border text-sm font-medium transition',
                    p === safePage
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}