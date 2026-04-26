import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { RealtimeTeamsService } from '../../services/teams-realtime.service';
import { Team } from '../../models/team.model';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './teams.html',
  styleUrl: './teams.css',
})
export class Teams implements OnInit, OnDestroy {
  teams: Team[] = [];
  isLoading = false;
  searchForm!: FormGroup;

  // Propiedades de paginación
  currentPage = 1;
  pageSize = 50;

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private teamsService: RealtimeTeamsService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}
getCardStyle(index: number) {
  const rotations = [-6, -3, 3, 6];
  return {
    transform: `rotate(${rotations[index % rotations.length]}deg)`
  };
}
  async ngOnInit(): Promise<void> {
this.searchForm = this.fb.group({
  searchTerm: ['']
});
    this.subscriptions.add(
      this.teamsService.isLoading$.subscribe(loading => {
        this.ngZone.run(() => {
          this.isLoading = loading;
          this.cdr.detectChanges();
        });
      })
    );

    this.subscriptions.add(
      this.teamsService.teams$.subscribe(teams => {
        this.ngZone.run(() => {
          this.teams = teams;
          this.cdr.detectChanges();
        });
      })
    );

    this.subscriptions.add(
      this.teamsService.events$.subscribe(event => {
        this.ngZone.run(() => {
          console.log('Evento en tiempo real:', event.action, event.record?.name);
          this.cdr.detectChanges();
        });
      })
    );

    this.subscriptions.add(
      this.teamsService.errors$.subscribe(error => {
        this.ngZone.run(() => {
          console.error('Error en el servicio de teams:', error);
          this.cdr.detectChanges();
        });
      })
    );

    try {
      await this.teamsService.loadTeams();
      await this.teamsService.subscribeRealtime();

      this.ngZone.run(() => {
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error cargando teams:', error);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  getMainImageUrl(team: Team): string {
    if (team.image_logo) {
      return this.teamsService.pb.files.getUrl(team as any, team.image_logo);
    }
    return 'assets/images/placeholder-team.jpg';
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
get filteredTeams(): Team[] {
  const searchTerm = this.searchForm
    ?.get('searchTerm')
    ?.value
    ?.trim()
    .toLowerCase();

  if (!searchTerm) return this.teams;

  return this.teams.filter(team =>
    team.name?.toLowerCase().includes(searchTerm) ||
    team.created?.toLowerCase().includes(searchTerm)
  );
}

get totalPages(): number {
  return Math.ceil(this.filteredTeams.length / this.pageSize);
}

get paginatedTeams(): Team[] {
  const startIndex = (this.currentPage - 1) * this.pageSize;
  const endIndex = startIndex + this.pageSize;
  return this.filteredTeams.slice(startIndex, endIndex);
}
  getStatusText(team: Team): string {
    if (team.isFeatured) return 'Destacado';
    if (team.isActive) return 'Activo';
    return 'Inactivo';
  }

  getStatusClass(team: Team): string {
    if (team.isFeatured) return 'bg-warning text-dark';
    if (team.isActive) return 'bg-success';
    return 'bg-secondary';
  }

  trackByTeamId(index: number, team: Team): string {
    return team.id;
  }

  // Métodos de paginación
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cdr.detectChanges();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.cdr.detectChanges();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.detectChanges();
    }
  }

  editTeam(team: Team): void {
    this.router.navigate(['/editar-destino', team.id]);
  }

  async deleteTeam(team: Team): Promise<void> {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar el destino "${team.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await this.teamsService.deleteTeam(team.id);
        await Swal.fire({
          title: '¡Eliminado!',
          text: `El destino "${team.name}" ha sido eliminado correctamente.`,
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