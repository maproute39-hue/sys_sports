import { Injectable, NgZone } from '@angular/core';
import PocketBase, { RecordModel } from 'pocketbase';
import { BehaviorSubject } from 'rxjs';
import { Category } from '../models/category.model';
import { RealtimeTeamsService } from './teams-realtime.service'; 
import { Team } from '../models/team.model';
@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  public pb = new PocketBase('https://db.buckapi.site:8030');

  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  categories$ = this.categoriesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<any>(null);
  errors$ = this.errorSubject.asObservable();

  constructor(private ngZone: NgZone
    
  ) {}

  async loadCategories(): Promise<Category[]> {
    this.loadingSubject.next(true);

    try {
      const records = await this.pb.collection('categories').getFullList<RecordModel>({
        sort: 'name'
      });

      const categories = records.map(record => this.mapCategory(record));

      this.ngZone.run(() => {
        this.categoriesSubject.next(categories);
        this.loadingSubject.next(false);
      });

      return categories;
    } catch (error) {
      this.ngZone.run(() => {
        this.errorSubject.next(error);
        this.loadingSubject.next(false);
      });

      console.error('Error cargando categorías:', error);
      return [];
    }
  }

  async getCategoryById(id: string): Promise<Category | null> {
    try {
      const record = await this.pb.collection('categories').getOne<RecordModel>(id);
      return this.mapCategory(record);
    } catch (error) {
      console.error('Error obteniendo categoría:', error);
      return null;
    }
  }

  async createCategory(data: Partial<Category>): Promise<Category | null> {
    try {
      const record = await this.pb.collection('categories').create<RecordModel>({
        category_id: data.category_id,
        name: data.name,
        description: data.description
      });

      await this.loadCategories();

      return this.mapCategory(record);
    } catch (error) {
      console.error('Error creando categoría:', error);
      this.errorSubject.next(error);
      return null;
    }
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category | null> {
    try {
      const record = await this.pb.collection('categories').update<RecordModel>(id, {
        category_id: data.category_id,
        name: data.name,
        description: data.description
      });

      await this.loadCategories();

      return this.mapCategory(record);
    } catch (error) {
      console.error('Error actualizando categoría:', error);
      this.errorSubject.next(error);
      return null;
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      await this.pb.collection('categories').delete(id);
      await this.loadCategories();
      return true;
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      this.errorSubject.next(error);
      return false;
    }
  }

  async subscribeRealtime(): Promise<void> {
    await this.pb.collection('categories').subscribe('*', async event => {
      console.log('Realtime categories:', event.action, event.record);

      await this.loadCategories();
    });
  }

  async unsubscribeRealtime(): Promise<void> {
    await this.pb.collection('categories').unsubscribe('*');
  }

  private mapCategory(record: RecordModel): Category {
    return {
      id: record.id,
      category_id: record['category_id'],
      name: record['name'],
      description: record['description'],
      created: record['created'],
      updated: record['updated']
    };
  }

  getCurrentCategories(): Category[] {
    return this.categoriesSubject.getValue();
  }
}