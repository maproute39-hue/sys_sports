export interface Team {
  id: string;

  name: string;
  is_active: boolean;

  external_id?: string;
  group_id?: string;
  category_id?: string;
  representative_id?: string;

image_logo?: string;

  points?: number;
  matches_played?: number;
  matches_won?: number;
  matches_lost?: number;
  percentage?: number;

 isActive: boolean;
 isFeatured: boolean;

  created?: string;
  updated?: string;
}

// export interface Team {
//   id: string;
//   collectionId?: string;
//   collectionName?: string;
//   name: string;
//   slug: string;
//   country: string;
//   region?: string;
//   city?: string;
//   shortDescription?: string;
//   fullDescription?: string;
//   mainImage?: string;
//   gallery?: string[];
//   isFeatured: boolean;
//   image_logo?: string;
//   isActive: boolean;
//   created?: string;
//   updated?: string;
// }