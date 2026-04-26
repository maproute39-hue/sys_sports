export interface Destination {
  id: string;
  collectionId?: string;
  collectionName?: string;
  name: string;
  slug: string;
  country: string;
  region?: string;
  city?: string;
  shortDescription?: string;
  fullDescription?: string;
  mainImage?: string;
  gallery?: string[];
  isFeatured: boolean;
  isActive: boolean;
  created?: string;
  updated?: string;
}