import { Injectable, OnDestroy, NgZone } from '@angular/core';
import PocketBase, { RecordSubscription } from 'pocketbase';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Destination } from '../models/destination.model';

export interface RealtimeEvent extends Omit<RecordSubscription<Destination>, 'action'> {
  action: 'create' | 'update' | 'delete';
  record: Destination;
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeDestinationsService implements OnDestroy {
  public pb: PocketBase;
  private readonly COLLECTION = 'destinations';
  private isSubscribed = false;

  private destinationsSubject = new BehaviorSubject<Destination[]>([]);
  public destinations$: Observable<Destination[]> = this.destinationsSubject.asObservable();

  private eventsSubject = new Subject<RealtimeEvent>();
  public events$: Observable<RealtimeEvent> = this.eventsSubject.asObservable();

  private errorSubject = new Subject<Error>();
  public errors$: Observable<Error> = this.errorSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.loadingSubject.asObservable();

  constructor(private ngZone: NgZone) {
    this.pb = new PocketBase('https://db.buckapi.site:8015');

    this.pb.authStore.onChange((token) => {
      if (!token && this.isSubscribed) {
        this.unsubscribeAll();
      }
    });
  }

  async loadDestinations(sort: string = '-created'): Promise<void> {
    this.ngZone.run(() => this.loadingSubject.next(true));

    try {
      const records = await this.pb
        .collection(this.COLLECTION)
        .getFullList<Destination>({
          sort
        });

      console.log(`[RealtimeDestinationsService] Cargados ${records.length} destinos`);

      this.ngZone.run(() => {
        this.destinationsSubject.next(records);
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
      await this.pb.collection(this.COLLECTION).subscribe('*', (event: RecordSubscription<Destination>) => {
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
      console.log('[RealtimeDestinationsService] ✓ Suscripción activa');
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleRealtimeEvent(event: RealtimeEvent): void {
    const currentDestinations = this.destinationsSubject.value;

    switch (event.action) {
      case 'create':
        this.destinationsSubject.next([event.record, ...currentDestinations]);
        break;

      case 'update':
        this.destinationsSubject.next(
          currentDestinations.map(item =>
            item.id === event.record.id ? event.record : item
          )
        );
        break;

      case 'delete':
        this.destinationsSubject.next(
          currentDestinations.filter(item => item.id !== event.record.id)
        );
        break;
    }
  }

  async deleteDestination(id: string): Promise<void> {
    try {
      await this.pb.collection(this.COLLECTION).delete(id);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getDestinationById(id: string): Promise<Destination> {
    try {
      return await this.pb.collection(this.COLLECTION).getOne<Destination>(id);
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
    console.error('[RealtimeDestinationsService] Error:', err);

    this.ngZone.run(() => {
      this.errorSubject.next(err);
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
    this.destinationsSubject.complete();
    this.eventsSubject.complete();
    this.errorSubject.complete();
    this.loadingSubject.complete();
  }
}