import type {
  InstanceResponse,
  ExpandRelationResponse,
  RecordsResponse,
} from "./types";

function apiBase(): string {
  return (
    window.__RAILS_MODELS_VIZ__?.apiBase || "/rails_models_viz/api"
  );
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchModels(): Promise<string[]> {
  const data = await fetchJson<{ models: string[] }>(
    `${apiBase()}/models`
  );
  return data.models;
}

export async function fetchRecords(
  modelName: string,
  page = 1,
  perPage = 25
): Promise<RecordsResponse> {
  return fetchJson<RecordsResponse>(
    `${apiBase()}/models/${encodeURIComponent(modelName)}/records?page=${page}&per_page=${perPage}`
  );
}

export async function fetchInstance(
  modelName: string,
  id: string
): Promise<InstanceResponse> {
  return fetchJson<InstanceResponse>(
    `${apiBase()}/models/${encodeURIComponent(modelName)}/${encodeURIComponent(id)}`
  );
}

export async function expandRelation(
  modelName: string,
  id: string,
  relationName: string,
  page = 1,
  perPage = 5
): Promise<ExpandRelationResponse> {
  return fetchJson<ExpandRelationResponse>(
    `${apiBase()}/models/${encodeURIComponent(modelName)}/${encodeURIComponent(id)}/relations/${encodeURIComponent(relationName)}?page=${page}&per_page=${perPage}`
  );
}

export async function callLlm(input: string): Promise<string> {
  const res = await fetch(`${apiBase()}/llm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data.response;
}
