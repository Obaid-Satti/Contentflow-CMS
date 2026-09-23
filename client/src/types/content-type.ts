export type FieldType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'email'
  | 'enumeration'
  | 'media';

export interface ContentTypeField {
  name: string;
  type: FieldType;
  required: boolean;
  unique?: boolean;
  options?: string[];
}

export interface ContentType {
  id: number;
  name: string;
  api_id: string;
  fields: ContentTypeField[];
  created_at: string;
  updated_at: string;
}
