import { useEffect, useMemo, useState } from "react";
import { fetchModels } from "../api";

interface ModelListProps {
  onModelClick: (model: string) => void;
  activeModel?: string;
}

export function ModelList({ onModelClick, activeModel }: ModelListProps) {
  const [models, setModels] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModels()
      .then(setModels)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return models;
    const lower = search.toLowerCase();
    return models.filter((m) => m.toLowerCase().includes(lower));
  }, [models, search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "8px 10px", borderBottom: "1px solid #e2e8f0" }}>
        <input
          type="text"
          placeholder="Search models..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "6px 8px",
            border: "1px solid #CBD5E1",
            borderRadius: 5,
            fontSize: 12,
            background: "#f8fafc",
            outline: "none",
          }}
        />
        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>
          {filtered.length} model{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: 12, color: "#94A3B8", fontSize: 12 }}>
            Loading models...
          </div>
        ) : (
          filtered.map((model) => (
            <div
              key={model}
              onClick={() => onModelClick(model)}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                cursor: "pointer",
                borderBottom: "1px solid #f1f5f9",
                background: model === activeModel ? "#EEF2FF" : "transparent",
                color: model === activeModel ? "#4F46E5" : "#334155",
                fontWeight: model === activeModel ? 600 : 400,
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => {
                if (model !== activeModel)
                  (e.currentTarget as HTMLDivElement).style.background = "#f8fafc";
              }}
              onMouseLeave={(e) => {
                if (model !== activeModel)
                  (e.currentTarget as HTMLDivElement).style.background = "transparent";
              }}
            >
              {model}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
