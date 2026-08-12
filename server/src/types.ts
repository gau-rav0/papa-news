export type SourceArticle = {
  sourceArticleId: string;
  sourceUrl: string;
  canonicalUrl: string;
  originalTitle: string;
  originalContent: string;
  category: string | null;
  imageUrl: string | null;
  publishedAt: Date;
};

export type StoredArticle = {
  id: string;
  source_article_id: string | null;
  source_url: string;
  original_title: string;
  original_content: string;
};


