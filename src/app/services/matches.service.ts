import { Injectable, NgZone, OnDestroy } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject, Observable } from 'rxjs';

export interface MatchRecord {
  id: string;
  category_id: string;
  group_id: string;
  round: number;
  match_number: number;

  home_team_id: string;
  away_team_id: string;

  home_team_name: string;
  away_team_name: string;

  status: string;
  match_type: string;

  sets_mode: number;
  home_sets_won: number;
  away_sets_won: number;
  sets: any[];
  home_image_logo?: string;
away_image_logo?: string;

  home_points_table: number;
  away_points_table: number;

  scheduled_at?: string;
  court?: string;
  notes?: string;
  is_active: boolean;

  created?: string;
  updated?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MatchesService implements OnDestroy {
  public pb = new PocketBase('https://db.buckapi.site:8030');

  private matchesSubject = new BehaviorSubject<MatchRecord[]>([]);
  public matches$: Observable<MatchRecord[]> = this.matchesSubject.asObservable();

  private currentCategoryId: string | null = null;
  private isSubscribed = false;

  constructor(private ngZone: NgZone) {}

  async loadMatchesByCategory(categoryId: string): Promise<void> {
    this.currentCategoryId = categoryId;

    const records = await this.pb.collection('matches').getFullList<MatchRecord>({
      filter: `category_id="${categoryId}" && is_active=true`,
      sort: 'round,match_number'
    });

    this.ngZone.run(() => {
      this.matchesSubject.next(records);
    });
  }
getCurrentMatches(): MatchRecord[] {
  return this.matchesSubject.getValue();
}
  async subscribeRealtime(categoryId: string): Promise<void> {
    this.currentCategoryId = categoryId;

    if (this.isSubscribed) {
      await this.unsubscribeRealtime();
    }

    await this.pb.collection('matches').subscribe('*', async (event) => {
      const record = event.record as unknown as MatchRecord;

      if (record.category_id !== this.currentCategoryId) return;

      const current = this.matchesSubject.value;
      let updated = [...current];

      if (event.action === 'create') {
        const exists = updated.some(match => match.id === record.id);
        if (!exists) {
          updated.push(record);
        }
      }

      if (event.action === 'update') {
        updated = updated.map(match =>
          match.id === record.id ? record : match
        );
      }

      if (event.action === 'delete') {
        updated = updated.filter(match => match.id !== record.id);
      }

      updated.sort((a, b) => {
        if (a.round !== b.round) return a.round - b.round;
        return a.match_number - b.match_number;
      });

      this.ngZone.run(() => {
        this.matchesSubject.next(updated);
      });
    });

    this.isSubscribed = true;
  }

  async unsubscribeRealtime(): Promise<void> {
    await this.pb.collection('matches').unsubscribe('*');
    this.isSubscribed = false;
  }

  clearMatches(): void {
    this.matchesSubject.next([]);
    this.currentCategoryId = null;
  }

  ngOnDestroy(): void {
    this.unsubscribeRealtime();
  }
}