export interface Article {
  id: string;
  source_article_id?: string;
  source_url: string;
  canonical_url?: string;
  original_title: string;
  original_content: string;
  hindi_title?: string;
  hindi_content?: string;
  category?: string;
  image_url?: string;
  published_at: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  processing_status: string;
  processing_error?: string;
}

export type RootStackParamList = {
  Home: undefined;
  ArticleDetail: { article: Article };
  Saved: undefined;
  Settings: undefined;
};
