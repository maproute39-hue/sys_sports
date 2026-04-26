import { Injectable, OnDestroy, NgZone } from '@angular/core';
import PocketBase, { RecordSubscription } from 'pocketbase';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Team } from '../models/team.model';

export interface RealtimeEvent extends Omit<RecordSubscription<Team>, 'action'> {
  action: 'create' | 'update' | 'delete';
  record: Team;
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeTeamsService implements OnDestroy {
  public pb: PocketBase;
  private readonly COLLECTION = 'teams';
  private isSubscribed = false;

  private teamsSubject = new BehaviorSubject<Team[]>([]);
  public teams$: Observable<Team[]> = this.teamsSubject.asObservable();

  private eventsSubject = new Subject<RealtimeEvent>();
  public events$: Observable<RealtimeEvent> = this.eventsSubject.asObservable();

  private errorSubject = new Subject<Error>();
  public errors$: Observable<Error> = this.errorSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.loadingSubject.asObservable();

  constructor(private ngZone: NgZone) {
    this.pb = new PocketBase('https://db.buckapi.site:8030');

    this.pb.authStore.onChange((token) => {
      if (!token && this.isSubscribed) {
        this.unsubscribeAll();
      }
    });
  }

  async loadTeams(sort: string = '-created'): Promise<void> {
    this.ngZone.run(() => this.loadingSubject.next(true));

    try {
      const records = await this.pb
        .collection(this.COLLECTION)
        .getFullList<Team>({
          sort
        });

      console.log(`[RealtimeTeamsService] Cargados ${records.length} teams`);

      this.ngZone.run(() => {
        this.teamsSubject.next(records);
      });
    } catch (error) {
      this.handleError(error);
      throw error;
    } finally {
      this.ngZone.run(() => this.loadingSubject.next(false));
    }
  }

  async subscribeRealtime(): Promise<void> {
    if (this.isSubscribed) return;

    try {
      await this.pb.collection(this.COLLECTION).subscribe('*', (event: RecordSubscription<Team>) => {
        if (['create', 'update', 'delete'].includes(event.action)) {
          const mappedEvent: RealtimeEvent = {
            ...event,
            action: event.action as 'create' | 'update' | 'delete'
          };

          this.ngZone.run(() => {
            this.eventsSubject.next(mappedEvent);
            this.handleRealtimeEvent(mappedEvent);
          });
        }
      });

      this.isSubscribed = true;
      console.log('[RealtimeTeamsService] ✓ Suscripción activa');
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleRealtimeEvent(event: RealtimeEvent): void {
    const currentTeams = this.teamsSubject.value;

    switch (event.action) {
      case 'create':
        this.teamsSubject.next([event.record, ...currentTeams]);
        break;

      case 'update':
        this.teamsSubject.next(
          currentTeams.map(item =>
            item.id === event.record.id ? event.record : item
          )
        );
        break;

      case 'delete':
        this.teamsSubject.next(
          currentTeams.filter(item => item.id !== event.record.id)
        );
        break;
    }
  }

  async deleteTeam(id: string): Promise<void> {
    try {
      await this.pb.collection(this.COLLECTION).delete(id);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getTeamById(id: string): Promise<Team> {
    try {
      return await this.pb.collection(this.COLLECTION).getOne<Team>(id);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  unsubscribeAll(): void {
    try {
      this.pb.collection(this.COLLECTION).unsubscribe();
      this.isSubscribed = false;
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any): void {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[RealtimeTeamsService] Error:', err);

    this.ngZone.run(() => {
      this.errorSubject.next(err);
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
    this.teamsSubject.complete();
    this.eventsSubject.complete();
    this.errorSubject.complete();
    this.loadingSubject.complete();
  }
}