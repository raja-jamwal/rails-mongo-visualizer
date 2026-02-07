import { useCallback, useEffect, useState } from "react";
import { fetchRecords } from "../api";
import type { RecordsResponse } from "../types";

interface TableViewProps {
  model: string;
  onRecordClick?: (model: string, id: string) => void;
}

function cellValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

export function TableView({ model, onRecordClick }: TableViewProps) {
  const [data, setData] = useState<RecordsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    (p: number) => {
      setLoading(true);
      setError(null);
      fetchRecords(model, p, perPage)
        .then((res) => {
          setData(res);
          setPage(p);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    },
    [model, perPage]
  );

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  if (error) {
    return (
      <div style={{ padding: 24, color: "#EF4444", fontSize: 13 }}>
        Error loading {model}: {error}
      </div>
    );
  }

  if (!data && loading) {
    return (
      <div style={{ padding: 24, color: "#94A3B8", fontSize: 13 }}>
        Loading {model} records...
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Pagination header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          borderBottom: "1px solid #e2e8f0",
          background: "#f8fafc",
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 12, color: "#64748B" }}>
          <strong>{data.total.toLocaleString()}</strong> records
          {" · "}
          Page {data.page} of {data.total_pages}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => loadPage(page - 1)}
            disabled={page <= 1 || loading}
            style={paginationBtn(page > 1 && !loading)}
          >
            Prev
          </button>
          {/* Page number buttons */}
          {pageNumbers(page, data.total_pages).map((p) =>
            p === "..." ? (
              <span key={`dots-${p}`} style={{ padding: "4px 2px", color: "#94A3B8", fontSize: 12 }}>
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => loadPage(p as number)}
                disabled={loading}
                style={{
                  ...paginationBtn(!loading),
                  background: p === page ? "#4F46E5" : "#fff",
                  color: p === page ? "#fff" : "#334155",
                  fontWeight: p === page ? 600 : 400,
                }}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => loadPage(page + 1)}
            disabled={page >= data.total_pages || loading}
            style={paginationBtn(page < data.total_pages && !loading)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
            fontFamily: "monospace",
          }}
        >
          <thead>
            <tr>
              {data.columns.map((col) => (
                <th
                  key={col}
                  style={{
                    position: "sticky",
                    top: 0,
                    background: "#f1f5f9",
                    padding: "8px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e2e8f0",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: 11,
                    whiteSpace: "nowrap",
                    zIndex: 1,
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => {
              const id = String(row["_id"] || row["id"] || "");
              return (
                <tr
                  key={i}
                  style={{
                    cursor: onRecordClick ? "pointer" : "default",
                    transition: "background 0.1s",
                  }}
                  onClick={() => id && onRecordClick?.(model, id)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                  }}
                >
                  {data.columns.map((col) => (
                    <td
                      key={col}
                      style={{
                        padding: "6px 12px",
                        borderBottom: "1px solid #f1f5f9",
                        maxWidth: 300,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: col === "_id" ? "#4F46E5" : "#334155",
                      }}
                      title={cellValue(row[col])}
                    >
                      {cellValue(row[col])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && (
          <div style={{ padding: 16, textAlign: "center", color: "#94A3B8", fontSize: 12 }}>
            Loading...
          </div>
        )}
      </div>
    </div>
  );
}

function paginationBtn(enabled: boolean): React.CSSProperties {
  return {
    padding: "4px 10px",
    border: "1px solid #CBD5E1",
    borderRadius: 4,
    background: enabled ? "#fff" : "#f1f5f9",
    color: enabled ? "#334155" : "#94A3B8",
    cursor: enabled ? "pointer" : "not-allowed",
    fontSize: 12,
  };
}

function pageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | string)[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
