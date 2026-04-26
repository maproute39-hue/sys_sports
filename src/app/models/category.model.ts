export interface Category {
  id: string;              // ID interno de PocketBase
  category_id: string;     // UUID externo (tu sistema original)

  name: string;
  description: string;

  created: string;         // PocketBase usa "created"
  updated: string;         // PocketBase usa "updated"
}