"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { SearchField } from "@heroui/react"

import { PortalEmptyState, PortalLoadingState, PortalSurfaceCard } from "@/components/portal/portal-primitives"
import { cn } from "@/lib/utils"

export type PortalTableColumn<T> = {
  key: string
  label: string
  render: (row: T) => React.ReactNode
  sortValue?: (row: T) => string | number | null | undefined
  sortable?: boolean
  rowHeader?: boolean
  className?: string
  headerClassName?: string
}

type PortalDataTableProps<T> = {
  title: React.ReactNode
  description?: React.ReactNode
  rows: T[]
  columns: PortalTableColumn<T>[]
  getRowId: (row: T) => string
  loading?: boolean
  loadingLabel?: string
  error?: string | null
  searchPlaceholder?: string
  searchValue?: string
  onSearchValueChange?: (value: string) => void
  searchMatcher?: (row: T, query: string) => boolean
  actions?: React.ReactNode
  emptyTitle: string
  emptyDescription: string
  filteredEmptyTitle?: string
  filteredEmptyDescription?: string
  pageSize?: number
}

function normalizeSortableValue(value: string | number | null | undefined) {
  if (typeof value === "number") return value
  return String(value ?? "").toLowerCase()
}

export function PortalDataTable<T>({
  title,
  description,
  rows,
  columns,
  getRowId,
  loading,
  loadingLabel = "Loading table...",
  error,
  searchPlaceholder,
  searchValue,
  onSearchValueChange,
  searchMatcher,
  actions,
  emptyTitle,
  emptyDescription,
  filteredEmptyTitle = "No matching results",
  filteredEmptyDescription = "Try a different search term.",
  pageSize = 8,
}: PortalDataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState("")
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)

  const activeSearch = searchValue ?? internalSearch
  const setActiveSearch = onSearchValueChange ?? setInternalSearch

  const filteredRows = useMemo(() => {
    const normalizedQuery = activeSearch.trim().toLowerCase()

    if (!normalizedQuery || !searchMatcher) {
      return rows
    }

    return rows.filter((row) => searchMatcher(row, normalizedQuery))
  }, [activeSearch, rows, searchMatcher])

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows

    const column = columns.find((candidate) => candidate.key === sortKey)
    if (!column?.sortValue) return filteredRows

    return [...filteredRows].sort((left, right) => {
      const leftValue = normalizeSortableValue(column.sortValue?.(left))
      const rightValue = normalizeSortableValue(column.sortValue?.(right))

      if (leftValue < rightValue) return sortDirection === "asc" ? -1 : 1
      if (leftValue > rightValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }, [columns, filteredRows, sortDirection, sortKey])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))

  useEffect(() => {
    setPage(1)
  }, [activeSearch, sortDirection, sortKey, pageSize])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedRows.slice(start, start + pageSize)
  }, [page, pageSize, sortedRows])

  const emptyState = rows.length === 0
  const filteredOut = rows.length > 0 && sortedRows.length === 0

  const toggleSort = (columnKey: string) => {
    if (sortKey !== columnKey) {
      setSortKey(columnKey)
      setSortDirection("asc")
      return
    }

    setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
  }

  return (
    <PortalSurfaceCard title={title} description={description}>
      <div className="space-y-4">
        {searchPlaceholder || actions ? (
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {searchPlaceholder ? (
              <SearchField.Root aria-label={searchPlaceholder} className="w-full lg:max-w-sm" value={activeSearch} onChange={setActiveSearch}>
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder={searchPlaceholder} />
                  <SearchField.ClearButton aria-label="Clear search" />
                </SearchField.Group>
              </SearchField.Root>
            ) : <div />}
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
        ) : null}

        {loading ? <PortalLoadingState label={loadingLabel} /> : null}
        {!loading && error ? <div className="text-sm text-rose-700 dark:text-rose-300">{error}</div> : null}

        {!loading && !error && emptyState ? (
          <PortalEmptyState title={emptyTitle} description={emptyDescription} />
        ) : null}

        {!loading && !error && filteredOut ? (
          <PortalEmptyState title={filteredEmptyTitle} description={filteredEmptyDescription} />
        ) : null}

        {!loading && !error && pagedRows.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/5">
              <table aria-label={typeof title === "string" ? title : "data table"} className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/10">
                    {columns.map((column, index) => (
                      <th key={column.key} scope="col" className={cn("min-w-[120px] px-4 py-3 text-left align-middle", column.headerClassName)}>
                        {column.sortable ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(column.key)}
                            className="inline-flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          >
                            <span>{column.label}</span>
                            {sortKey === column.key ? (
                              sortDirection === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
                            ) : (
                              <ChevronsUpDown className="size-3.5 opacity-70" />
                            )}
                          </button>
                        ) : (
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{column.label}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row) => (
                    <tr key={getRowId(row)} className="border-b border-slate-200/60 last:border-b-0 dark:border-white/10">
                      {columns.map((column, index) => {
                        const CellTag = (column.rowHeader ?? index === 0) ? "th" : "td"

                        return (
                          <CellTag
                            key={`${getRowId(row)}-${column.key}`}
                            {...((column.rowHeader ?? index === 0) ? { scope: "row" } : {})}
                            className={cn("px-4 py-3 align-middle text-slate-700 dark:text-slate-200", column.className)}
                          >
                            {column.render(row)}
                          </CellTag>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between dark:text-slate-300">
                <p>
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 px-3 py-2 font-medium transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 px-3 py-2 font-medium transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </PortalSurfaceCard>
  )
}