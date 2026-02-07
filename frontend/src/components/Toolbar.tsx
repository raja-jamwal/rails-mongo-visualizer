import { useRef } from "react";
import type { SavedGraph } from "../types";

interface ToolbarProps {
  onExport: () => SavedGraph;
  onImport: (saved: SavedGraph) => void;
  onClear: () => void;
  hasGraph: boolean;
}

export function Toolbar({ onExport, onImport, onClear, hasGraph }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = onExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `model-graph-${data.root?.model || "empty"}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as SavedGraph;
        if (data.version !== 1) {
          alert("Unsupported file version");
          return;
        }
        onImport(data);
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const btnStyle = (enabled: boolean): React.CSSProperties => ({
    padding: "5px 12px",
    background: enabled ? "#fff" : "#f1f5f9",
    color: enabled ? "#334155" : "#94A3B8",
    border: "1px solid #CBD5E1",
    borderRadius: 5,
    fontSize: 12,
    cursor: enabled ? "pointer" : "not-allowed",
    display: "flex",
    alignItems: "center",
    gap: 4,
  });

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <button
        onClick={handleExport}
        disabled={!hasGraph}
        style={btnStyle(hasGraph)}
        title="Save graph as JSON"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        Save
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        style={btnStyle(true)}
        title="Load graph from JSON"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        Load
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: "none" }}
      />

      {hasGraph && (
        <button
          onClick={onClear}
          style={btnStyle(true)}
          title="Clear the graph"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          Clear
        </button>
      )}
    </div>
  );
}
