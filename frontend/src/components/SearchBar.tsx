import { useEffect, useState } from "react";
import { fetchModels } from "../api";

interface SearchBarProps {
  onSearch: (model: string, id: string) => void;
  loading: boolean;
}

export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState("");
  const [id, setId] = useState("");
  const [filtered, setFiltered] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchModels().then(setModels).catch(() => {});
  }, []);

  useEffect(() => {
    if (model.length > 0) {
      const lower = model.toLowerCase();
      setFiltered(
        models.filter((m) => m.toLowerCase().includes(lower)).slice(0, 10)
      );
    } else {
      setFiltered([]);
    }
  }, [model, models]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (model && id) {
      onSearch(model, id);
      setShowDropdown(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        position: "relative",
      }}
    >
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Model name..."
          value={model}
          onChange={(e) => {
            setModel(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          style={{
            padding: "6px 10px",
            border: "1px solid #CBD5E1",
            borderRadius: 6,
            fontSize: 13,
            width: 200,
            background: "#fff",
          }}
        />
        {showDropdown && filtered.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#fff",
              border: "1px solid #CBD5E1",
              borderRadius: 6,
              marginTop: 2,
              maxHeight: 200,
              overflowY: "auto",
              zIndex: 100,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            {filtered.map((m) => (
              <div
                key={m}
                onMouseDown={() => {
                  setModel(m);
                  setShowDropdown(false);
                }}
                style={{
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontSize: 12,
                  borderBottom: "1px solid #f1f5f9",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "#fff";
                }}
              >
                {m}
              </div>
            ))}
          </div>
        )}
      </div>

      <input
        type="text"
        placeholder="Record ID..."
        value={id}
        onChange={(e) => setId(e.target.value)}
        style={{
          padding: "6px 10px",
          border: "1px solid #CBD5E1",
          borderRadius: 6,
          fontSize: 13,
          width: 200,
          background: "#fff",
          fontFamily: "monospace",
        }}
      />

      <button
        type="submit"
        disabled={loading || !model || !id}
        style={{
          padding: "6px 16px",
          background: loading ? "#94A3B8" : "#4F46E5",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Loading..." : "Explore"}
      </button>
    </form>
  );
}
