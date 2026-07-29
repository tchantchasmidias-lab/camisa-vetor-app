export interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  content: string; // HTML content
  coverImage?: string;
  seoMetadata: {
    title: string;
    description: string;
    keywords: string[];
  };
  status: 'draft' | 'published';
  createdAt: number;
  updatedAt: number;
}
