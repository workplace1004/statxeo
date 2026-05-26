import React from "react";

// Types
export interface DataGridColumn<T> {
  id?: string;
  header?: React.ReactNode;
  accessorKey?: keyof T | string;
  cell?: (row: T) => React.ReactNode;
  allowsSorting?: boolean;
  align?: "start" | "center" | "end";
  minWidth?: number;
  isRowHeader?: boolean;
}

export interface DataGridSortDescriptor {
  column?: string;
  direction?: "ascending" | "descending";
}

export interface UseKanbanReturn<T = any> {
  list: {
    items: T[];
  };
  columns: any[];
  moveItem: (itemId: any, fromColumnId: any, toColumnId: any) => void;
}

// Components
export const KPIGroup: any = ({ children, ...props }: any) => {
  return <div className="flex flex-wrap gap-4" {...props}>{children}</div>;
};
KPIGroup.Separator = () => <div className="w-px bg-border h-8 self-center" />;

export const KPI: any = ({ children, ...props }: any) => {
  return <div className="p-4 bg-content1 rounded-2xl border border-border flex flex-col gap-2" {...props}>{children}</div>;
};
KPI.Header = ({ children }: any) => <div className="flex items-center justify-between">{children}</div>;
KPI.Title = ({ children }: any) => <span className="text-sm text-muted font-medium">{children}</span>;
KPI.Content = ({ children }: any) => <div className="flex items-baseline gap-1 mt-1">{children}</div>;
KPI.Value = ({ value, style, currency, maximumFractionDigits, ...props }: any) => {
  let displayValue = value;
  if (style === "currency" && typeof value === "number") {
    displayValue = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: maximumFractionDigits !== undefined ? maximumFractionDigits : 0,
    }).format(value);
  } else if (style === "percent" && typeof value === "number") {
    displayValue = new Intl.NumberFormat("en-US", {
      style: "percent",
      maximumFractionDigits: maximumFractionDigits !== undefined ? maximumFractionDigits : 2,
    }).format(value);
  }
  return <span className="text-2xl font-bold tabular-nums text-foreground" {...props}>{displayValue}</span>;
};

export function DataGrid<T>({
  columns,
  data,
  getRowId,
  sortDescriptor,
  onSortChange,
  ...props
}: {
  columns: any[];
  data: T[];
  getRowId?: (item: T) => any;
  sortDescriptor?: any;
  onSortChange?: (descriptor: any) => void;
  [key: string]: any;
}) {
  const rowData = data || [];
  return (
    <div className="overflow-x-auto w-full border border-border rounded-2xl bg-content1" {...props}>
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-border bg-content2/30">
            {columns.map((col: any, idx: number) => (
              <th
                key={col.id || idx}
                className="p-3 text-muted text-xs font-semibold uppercase tracking-wider cursor-pointer select-none"
                onClick={() => {
                  if (col.allowsSorting && onSortChange) {
                    const isCurrent = sortDescriptor?.column === col.id;
                    const nextDir = isCurrent && sortDescriptor?.direction === "ascending" ? "descending" : "ascending";
                    onSortChange({ column: col.id, direction: nextDir });
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.allowsSorting && sortDescriptor?.column === col.id && (
                    <span>{sortDescriptor.direction === "ascending" ? " ▲" : " ▼"}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rowData.map((row: T, rIdx: number) => {
            const rowId = getRowId ? getRowId(row) : ((row as any).id || (row as any)._id || rIdx);
            return (
              <tr key={rowId} className="hover:bg-content2/20 transition-colors">
                {columns.map((col: any, cIdx: number) => (
                  <td key={col.id || cIdx} className="p-3">
                    {col.cell ? col.cell(row) : (col.accessorKey ? (row as any)[col.accessorKey] : null)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export const NumberValue = ({ value, ...props }: any) => {
  return <span className="tabular-nums" {...props}>{value}</span>;
};

export const TrendChip = ({ value, ...props }: any) => {
  return <span className="text-xs" {...props}>{value}</span>;
};

// Charts
export const BarChart: any = (props: any) => {
  return <div className="h-48 w-full bg-content2/30 rounded-xl flex items-center justify-center text-muted text-xs">Bar Chart</div>;
};
BarChart.Grid = (props: any) => null;
BarChart.XAxis = (props: any) => null;
BarChart.YAxis = (props: any) => null;
BarChart.Bar = (props: any) => null;
BarChart.Tooltip = (props: any) => null;
BarChart.TooltipContent = (props: any) => null;

export const LineChart: any = (props: any) => {
  return <div className="h-48 w-full bg-content2/30 rounded-xl flex items-center justify-center text-muted text-xs">Line Chart</div>;
};
LineChart.Grid = (props: any) => null;
LineChart.XAxis = (props: any) => null;
LineChart.YAxis = (props: any) => null;
LineChart.Line = (props: any) => null;
LineChart.Tooltip = (props: any) => null;
LineChart.TooltipContent = (props: any) => null;

export const PieChart: any = (props: any) => {
  return <div className="h-48 w-full bg-content2/30 rounded-xl flex items-center justify-center text-muted text-xs">Pie Chart</div>;
};
PieChart.Pie = (props: any) => null;
PieChart.Cell = (props: any) => null;
PieChart.Tooltip = (props: any) => null;

export const ChartTooltip: any = (props: any) => null;
ChartTooltip.Item = (props: any) => null;
ChartTooltip.Indicator = (props: any) => null;
ChartTooltip.Label = (props: any) => null;
ChartTooltip.Value = (props: any) => null;

export const Stepper: any = ({ children, ...props }: any) => {
  return <div className="flex gap-2" {...props}>{children}</div>;
};
Stepper.Step = ({ children, ...props }: any) => <div {...props}>{children}</div>;
Stepper.Indicator = ({ children, ...props }: any) => <div {...props}>{children}</div>;
Stepper.Content = ({ children, ...props }: any) => <div {...props}>{children}</div>;
Stepper.Title = ({ children, ...props }: any) => <div {...props}>{children}</div>;
Stepper.Separator = ({ children, ...props }: any) => <div {...props}>{children}</div>;

export interface KanbanColumnProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export interface KanbanCardListProps<T = any> {
  items?: T[];
  children?: (item: T) => React.ReactNode;
  dragAndDropHooks?: any;
  [key: string]: any;
}

export const Kanban = Object.assign(
  ({ children, ...props }: any) => (
    <div className="flex gap-4 overflow-x-auto" {...props}>{children}</div>
  ),
  {
    Column: ({ children, ...props }: KanbanColumnProps) => <div {...props}>{children}</div>,
    ColumnHeader: ({ children, ...props }: KanbanColumnProps) => <div {...props}>{children}</div>,
    ColumnIndicator: ({ children, ...props }: KanbanColumnProps) => <div {...props}>{children}</div>,
    ColumnTitle: ({ children, ...props }: KanbanColumnProps) => <div {...props}>{children}</div>,
    ColumnCount: ({ children, ...props }: KanbanColumnProps) => <div {...props}>{children}</div>,
    ColumnActions: ({ children, ...props }: KanbanColumnProps) => <div {...props}>{children}</div>,
    ColumnBody: ({ children, ...props }: KanbanColumnProps) => <div {...props}>{children}</div>,
    CardList: <T = any,>({ items, children, ...props }: KanbanCardListProps<T>) => {
      return (
        <div {...props}>
          {items && children && items.map((item: T, idx: number) => {
            if (typeof children === "function") {
              return children(item);
            }
            return children;
          })}
        </div>
      );
    },
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  }
);

export function useKanban<T = any>(options: {
  getColumn: (item: T) => string;
  initialItems: T[];
  setColumn: (item: T, column: string) => T;
}): UseKanbanReturn<T> {
  const [items, setItems] = React.useState<T[]>(options.initialItems);
  const moveItem = React.useCallback((itemId: any, fromColumnId: any, toColumnId: any) => {
    setItems((prev) =>
      prev.map((item: any) => {
        const id = item.id || item._id;
        if (String(id) === String(itemId)) {
          return options.setColumn(item, toColumnId);
        }
        return item;
      })
    );
  }, [options]);

  return {
    list: { items },
    columns: [],
    moveItem,
  };
}

export function useKanbanColumn<T = any>(kanban: UseKanbanReturn<T>, columnId: string) {
  return {
    dragAndDropHooks: {} as any,
    items: (kanban.list?.items || []).filter((item: any) => {
      return (
        item.stage === columnId ||
        item.status === columnId ||
        item.column === columnId
      );
    }),
    columnProps: {} as any,
  };
}

export const Segment: any = ({ children, ...props }: any) => {
  return <div {...props}>{children}</div>;
};
Segment.Item = ({ children, ...props }: any) => <div {...props}>{children}</div>;

// Layout & Shell components
export const AppLayout: any = ({ children, ...props }: any) => {
  return <div className="flex min-h-screen" {...props}>{children}</div>;
};
AppLayout.MenuToggle = (props: any) => null;

export const Navbar: any = ({ children, ...props }: any) => {
  return <nav className="w-full h-16 border-b border-border flex items-center px-4 bg-content1" {...props}>{children}</nav>;
};
Navbar.Header = ({ children, ...props }: any) => <div className="flex items-center justify-between w-full" {...props}>{children}</div>;
Navbar.Spacer = (props: any) => <div className="flex-1" {...props} />;

export const Sidebar: any = ({ children, ...props }: any) => {
  return <aside className="w-64 border-r border-border bg-content1 flex flex-col" {...props}>{children}</aside>;
};
Sidebar.Mobile = ({ children, ...props }: any) => <div {...props}>{children}</div>;
Sidebar.Header = ({ children, ...props }: any) => <div className="p-4 border-b border-border" {...props}>{children}</div>;
Sidebar.Content = ({ children, ...props }: any) => <div className="flex-1 overflow-y-auto p-4" {...props}>{children}</div>;
Sidebar.Group = ({ children, ...props }: any) => <div className="space-y-1" {...props}>{children}</div>;
Sidebar.Menu = ({ children, ...props }: any) => <ul className="space-y-1" {...props}>{children}</ul>;
Sidebar.Footer = ({ children, ...props }: any) => <div className="p-4 border-t border-border mt-auto" {...props}>{children}</div>;
Sidebar.MenuItem = ({ children, ...props }: any) => <li className="flex items-center gap-2 p-2 hover:bg-content2 rounded-xl cursor-pointer" {...props}>{children}</li>;
Sidebar.MenuIcon = ({ children, ...props }: any) => <span className="text-muted" {...props}>{children}</span>;
Sidebar.MenuLabel = ({ children, ...props }: any) => <span className="text-foreground text-sm font-medium" {...props}>{children}</span>;
Sidebar.MenuChip = ({ children, ...props }: any) => <span className="ml-auto" {...props}>{children}</span>;
Sidebar.Trigger = (props: any) => null;
