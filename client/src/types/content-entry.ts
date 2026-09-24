export interface ContentEntry {
  id: number;
  content_type_id: number;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EntryListResponse {
  entries: ContentEntry[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
