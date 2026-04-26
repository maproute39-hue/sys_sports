import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { RealtimeDestinationsService } from '../../services/destinations-realtime.service';
import { Destination } from '../../models/destination.model';

@Component({
  selector: 'app-destinos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './destinos.html',
  styleUrl: './destinos.css',
})
export class Destinos implements OnInit, OnDestroy {
  destinations: Destination[] = [];
  isLoading = false;
  private subscriptions = new Subscription();

  constructor(
    private destinationsService: RealtimeDestinationsService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.subscriptions.add(
      this.destinationsService.isLoading$.subscribe(loading => {
        this.ngZone.run(() => {
          this.isLoading = loading;
          this.cdr.detectChanges();
        });
      })
    );

    this.subscriptions.add(
      this.destinationsService.destinations$.subscribe(destinations => {
        this.ngZone.run(() => {
          this.destinations = destinations;
          this.cdr.detectChanges();
        });
      })
    );

    this.subscriptions.add(
      this.destinationsService.events$.subscribe(event => {
        this.ngZone.run(() => {
          console.log('Evento en tiempo real:', event.action, event.record?.name);
          this.cdr.detectChanges();
        });
      })
    );

    this.subscriptions.add(
      this.destinationsService.errors$.subscribe(error => {
        this.ngZone.run(() => {
          console.error('Error en el servicio de destinos:', error);
          this.cdr.detectChanges();
        });
      })
    );

    try {
      await this.destinationsService.loadDestinations();
      await this.destinationsService.subscribeRealtime();

      this.ngZone.run(() => {
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error Cargando equipos:', error);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  getMainImageUrl(destination: Destination): string {
    if (destination.mainImage) {
      return this.destinationsService.pb.files.getUrl(destination as any, destination.mainImage);
    }
    return 'assets/images/placeholder-destination.jpg';
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatusText(destination: Destination): string {
    if (destination.isFeatured) return 'Destacado';
    if (destination.isActive) return 'Activo';
    return 'Inactivo';
  }

  getStatusClass(destination: Destination): string {
    if (destination.isFeatured) return 'bg-warning text-dark';
    if (destination.isActive) return 'bg-success';
    return 'bg-secondary';
  }

  trackByDestinationId(index: number, destination: Destination): string {
    return destination.id;
  }

  editDestination(destination: Destination): void {
    this.router.navigate(['/editar-destino', destination.id]);
  }

  async deleteDestination(destination: Destination): Promise<void> {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar el destino "${destination.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await this.destinationsService.deleteDestination(destination.id);
        await Swal.fire({
          title: '¡Eliminado!',
          text: `El destino "${destination.name}" ha sido eliminado correctamente.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error al eliminar destino:', error);
        await Swal.fire({
          title: 'Error',
          text: 'Ocurrió un error al eliminar el destino. Inténtalo de nuevo.',
          icon: 'error'
        });
      }
    }
  }
}