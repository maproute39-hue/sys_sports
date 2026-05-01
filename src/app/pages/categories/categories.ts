import { Component, OnDestroy, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { GroupsService, Group } from '../../services/groups.service';
import { CategoriesService } from '../../services/categories.service';
import { RealtimeTeamsService } from '../../services/teams-realtime.service';

import { Category } from '../../models/category.model';
import { Team } from '../../models/team.model';
import Swal from 'sweetalert2';
import { MatchesService, MatchRecord } from '../../services/matches.service';
export interface GeneratedMatch {
  categoryId: string;
  groupId: string;
  round: number;
  homeTeam: Team;
  awayTeam: Team;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit, OnDestroy {
  pointsFor: number = 0;
pointsAgainst: number = 0;
  showByStandings = false;
buildStandingsTableHtml(standings: any[], groupName: string): string {
  return `
  <style>
    .table-standings {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .table-standings th {
      background: #f8f9fa;
      padding: 8px;
      text-align: center;
      font-weight: 600;
    }

    .table-standings td {
      padding: 8px;
      text-align: center;
      border-bottom: 1px solid #eee;
    }

    .team-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      text-align: left;
    }

    .team-cell img {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      object-fit: cover;
    }

    .badge-pos {
      background: #6c5ce7;
      color: #fff;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 12px;
    }

    .badge-points {
      background: #6c5ce7;
      color: #fff;
      padding: 4px 10px;
      border-radius: 6px;
    }
  </style>

  <table class="table-standings">
    <thead>
      <tr>
        <th>#</th>
        <th style="text-align:left">Equipo</th>
        <th>PJ</th>
        <th>PG</th>
        <th>PP</th>
        <th>SG</th>
        <th>SP</th>
             <th>PF</th>
<th>PC</th>
        <th>DIF</th>
   
        <th>PTS</th>
        
      </tr>
    </thead>

    <tbody>
      ${standings.map((team, i) => `
        <tr>
          <td>
            <span class="badge-pos">${i + 1}</span>
          </td>

          <td>
            <div class="team-cell">
              <img src="${this.getDisplayTeamImageUrl(team)}" />
              ${team.name}
            </div>
          </td>

          <td>${team.played}</td>
          <td style="color:green">${team.won}</td>
          <td style="color:red">${team.lost}</td>
          <td>${team.setsFor}</td>
          <td>${team.setsAgainst}</td>
          <td>${team.pointsFor}</td>
          <td>${team.pointsAgainst}</td>
          <td>
            ${(team.setsFor - team.setsAgainst)}
          </td>

          <td>
            <span class="badge-points">
              ${team.points}
            </span>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  `;
}
toggleStandingsView(): void {
  this.showByStandings = !this.showByStandings;
}
  allMatches: MatchRecord[] = [];
  savedMatches: MatchRecord[] = []; 
  showCategories = true;
isSavingMatches = false;
  toggleCategories() {
    this.showCategories = !this.showCategories;
  }
  categories: Category[] = [];
  teams: Team[] = [];
  groups: Group[] = [];
  selectedCategory: Category | null = null;
  activeRound = 1;
async loadAllMatches(): Promise<void> {
  try {
    this.allMatches = await this.matchesService.pb
      .collection('matches')
      .getFullList<MatchRecord>({
        filter: 'is_active=true',
        sort: 'category_id,round,match_number'
      });

    this.cdr.detectChanges();
  } catch (error) {
    console.error('Error cargando todos los partidos:', error);
  }
}
getTeamsForDisplay(group: Group): any[] {
  if (this.showByStandings) {
    const standings = this.getStandingsByGroup(group);

    if (standings.length > 0) {
      return standings;
    }
  }

  return this.getTeamsByGroup(group);
}
getDisplayTeamImageUrl(team: any): string {
  if (!team) {
    return 'assets/images/placeholder-team.jpg';
  }

  // Vista normal: Team original de PocketBase
  if (team.collectionId && team.id && team.image_logo) {
    return this.realtimeTeamsService.pb.files.getUrl(team as any, team.image_logo);
  }

  // Vista por tabla: objeto calculado TeamStats
  if (team.teamId && team.image_logo) {
    return `${this.realtimeTeamsService.pb.baseUrl}/api/files/teams/${team.teamId}/${team.image_logo}`;
  }

  return 'assets/images/placeholder-team.jpg';
}
getCategoriesWithoutMatches(): Category[] {
  return this.categories.filter(category => {
    return !this.allMatches.some(match =>
      match.category_id === category.category_id
    );
  });
}
async deleteAllMatches(): Promise<void> {
  try {
    const matches = await this.matchesService.pb
      .collection('matches')
      .getFullList();

    const total = matches.length;

    if (total === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin partidos',
        text: 'No hay partidos guardados para eliminar.'
      });
      return;
    }

    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Borrar todos los partidos',
      html: `
        Se eliminarán <strong>${total}</strong> registros de partidos.<br>
        Esta acción no se puede deshacer.
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar todo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    });

    if (!confirm.isConfirmed) return;

    let deletedCount = 0;

    Swal.fire({
      title: 'Eliminando partidos...',
      html: `
        <p id="delete-progress-text">Eliminando 0 de ${total} registros...</p>
        <div style="width:100%; background:#e9ecef; border-radius:10px; overflow:hidden;">
          <div id="delete-progress-bar" style="width:0%; height:16px; background:#dc3545; transition:width .2s;"></div>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const updateDeleteProgress = (current: number, totalItems: number) => {
      const percent = Math.round((current / totalItems) * 100);

      const text = document.getElementById('delete-progress-text');
      const bar = document.getElementById('delete-progress-bar');

      if (text) {
        text.innerText = `Eliminando ${current} de ${totalItems} registros...`;
      }

      if (bar) {
        bar.style.width = `${percent}%`;
      }
    };

    for (const match of matches) {
      await this.matchesService.pb.collection('matches').delete(match.id);
      deletedCount++;
      updateDeleteProgress(deletedCount, total);
    }

    this.savedMatches = [];
    this.generatedMatches = [];
    this.activeRound = 1;

    await this.loadAllMatches();

    Swal.fire({
      icon: 'success',
      title: 'Partidos eliminados',
      text: `Se eliminaron correctamente ${deletedCount} registros.`,
      confirmButtonColor: '#198754'
    });

  } catch (error) {
    console.error('Error eliminando partidos:', error);

    Swal.fire({
      icon: 'error',
      title: 'Error al eliminar',
      text: 'No se pudieron eliminar todos los partidos.'
    });
  }
}
hasMatches(category: Category): boolean {
  return this.allMatches.some(match =>
    match.category_id === category.category_id
  );
}
getCategoriesWithMatches(): Category[] {
  return this.categories.filter(category =>
    this.allMatches.some(match =>
      match.category_id === category.category_id
    )
  );
}
  setActiveRound(round: number): void {
    this.activeRound = round;
  }

  isLoading = false;
  searchTerm = '';

  private subscriptions = new Subscription();

constructor(
  private groupsService: GroupsService,
  private categoriesService: CategoriesService,
  private realtimeTeamsService: RealtimeTeamsService,
  private matchesService: MatchesService,
  private ngZone: NgZone,
  private cdr: ChangeDetectorRef
) { }


  async ngOnInit(): Promise<void> {
this.subscriptions.add(
  this.matchesService.matches$.subscribe(matches => {
    this.ngZone.run(() => {
      this.savedMatches = matches;

      // 🔥 CONTROL AUTOMÁTICO DE UI
      if (this.selectedCategory) {
        this.showCategories = matches.length === 0;
      }

      this.cdr.detectChanges();
    });
  })
);
    this.subscriptions.add(
      this.categoriesService.isLoading$.subscribe(loading => {
        this.ngZone.run(() => {
          this.isLoading = loading;
          this.cdr.detectChanges();
        });
      })
    );

    this.subscriptions.add(
      this.categoriesService.categories$.subscribe(categories => {
        this.ngZone.run(() => {
          this.categories = categories;
          this.cdr.detectChanges();
        });
      })
    );

    this.subscriptions.add(
      this.realtimeTeamsService.teams$.subscribe(teams => {
        this.ngZone.run(() => {
          this.teams = teams;
          this.cdr.detectChanges();
        });
      })
    );

    await this.categoriesService.loadCategories();
    await this.categoriesService.subscribeRealtime();

    await this.realtimeTeamsService.loadTeams();
    await this.realtimeTeamsService.subscribeRealtime();
    this.groups = await this.groupsService.getGroups();
    await this.loadAllMatches();
  }
  generatedMatches: GeneratedMatch[] = [];
  getGeneratedRounds(): { round: number; matches: GeneratedMatch[] }[] {
    const roundsMap = new Map<number, GeneratedMatch[]>();

    for (const match of this.generatedMatches) {
      if (!roundsMap.has(match.round)) {
        roundsMap.set(match.round, []);
      }

      roundsMap.get(match.round)?.push(match);
    }

    return Array.from(roundsMap.entries())
      .map(([round, matches]) => ({ round, matches }))
      .sort((a, b) => a.round - b.round);
  }
  generateRoundRobinMatches(teams: Team[], groupId: string, categoryId: string): GeneratedMatch[] {
    const cleanTeams = [...teams];

    if (cleanTeams.length < 2) return [];

    // Si son impares, se agrega descanso
    const hasBye = cleanTeams.length % 2 !== 0;
    const teamsWithBye: (Team | null)[] = hasBye ? [...cleanTeams, null] : cleanTeams;

    const totalTeams = teamsWithBye.length;
    const totalRounds = totalTeams - 1;
    const matchesPerRound = totalTeams / 2;

    const matches: GeneratedMatch[] = [];

    for (let round = 0; round < totalRounds; round++) {
      for (let match = 0; match < matchesPerRound; match++) {
        const home = teamsWithBye[match];
        const away = teamsWithBye[totalTeams - 1 - match];

        if (home && away) {
          matches.push({
            categoryId,
            groupId,
            round: round + 1,
            homeTeam: home,
            awayTeam: away,
          });
        }
      }

      // Rotación Round Robin: el primero queda fijo
      const fixed = teamsWithBye[0];
      const rotated = [
        fixed,
        teamsWithBye[totalTeams - 1],
        ...teamsWithBye.slice(1, totalTeams - 1),
      ];

      teamsWithBye.splice(0, teamsWithBye.length, ...rotated);
    }

    return matches;
  }
  async onMatchesAction(): Promise<void> {
  if (!this.selectedCategory) return;

  // 👉 Si NO hay partidos → generar
  if (this.savedMatches.length === 0) {
    this.generateMatchesForSelectedCategory();
    return;
  }

  // 👉 Si YA hay partidos → confirmar reset
  const confirm = await Swal.fire({
    icon: 'warning',
    title: 'Resetear partidos',
    text: 'Se eliminarán todos los partidos de esta categoría. ¿Deseas continuar?',
    showCancelButton: true,
    confirmButtonText: 'Sí, resetear',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc3545'
  });

  if (!confirm.isConfirmed) return;

  const pb = this.realtimeTeamsService.pb;
  const categoryId = this.selectedCategory.category_id;

  try {
    const matches = await pb.collection('matches').getFullList({
      filter: `category_id="${categoryId}" && match_type="group"`
    });

    for (const match of matches) {
      await pb.collection('matches').delete(match.id);
    }

    Swal.fire({
      icon: 'success',
      title: 'Partidos eliminados',
      text: 'Ahora puedes generar nuevos partidos.'
    });

  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron eliminar los partidos.'
    });
  }
}
async openMatchResultModal(match: MatchRecord): Promise<void> {
  const homeImage = this.getSavedMatchImageUrl(match, 'home');
  const awayImage = this.getSavedMatchImageUrl(match, 'away');

  const getSetValue = (
    index: number,
    side: 'home_points' | 'away_points'
  ): string => {
    return match.sets?.[index]?.[side] ?? '';
  };

const result = await Swal.fire({
  title: 'Registrar resultado',
  width: 760,
  showCancelButton: true,
  confirmButtonText: 'Guardar resultado',
  cancelButtonText: 'Cancelar',
  confirmButtonColor: '#198754',

  customClass: {
    popup: 'swal-rounded',
    confirmButton: 'swal-btn-rounded',
    cancelButton: 'swal-btn-rounded'
  },

  buttonsStyling: false, // 👈 IMPORTANTE (desactiva estilos default)
    didOpen: () => {
      const inputs = document.querySelectorAll('.score-input');

      inputs.forEach((input: any) => {
        input.addEventListener('input', () => {
          input.value = input.value.replace(/[^0-9]/g, '');
        });
      });
    },

   html: `
<style>
  .score-table {
    display: grid;
    grid-template-columns: 80px 1fr 1fr;
    gap: 10px;
    align-items: center;
    margin-top: 20px;
  }

  .score-head {
    font-size: 12px;
    font-weight: 700;
    text-align: center;
    color: #6c757d;
  }

  .set-label {
    font-size: 13px;
    font-weight: 600;
    text-align: left;
  }

  .score-input {
    width: 100%;
    height: 50px;
    text-align: center;
    font-size: 22px;
    font-weight: bold;
    border-radius: 10px;
    border: 2px solid #dee2e6;
    outline: none;
  }

  .score-input:focus {
    border-color: #198754;
    box-shadow: 0 0 0 2px rgba(25,135,84,.15);
  }

  .teams-header {
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:20px;
    gap:20px;
  }

  .team-box {
    text-align:center;
    flex:1;
  }

  .team-box img {
    width:60px;
    height:60px;
    border-radius:50%;
    object-fit:cover;
    margin-bottom:6px;
  }
</style>

<div class="teams-header">
  <div class="team-box">
    <img src="${homeImage}">
    <div>${match.home_team_name}</div>
  </div>

  <strong>VS</strong>

  <div class="team-box">
    <img src="${awayImage}">
    <div>${match.away_team_name}</div>
  </div>
</div>

<div class="score-table">

  <div></div>
  <div class="score-head">${match.home_team_name}</div>
  <div class="score-head">${match.away_team_name}</div>

  <div class="set-label">Set 1</div>
  <input id="home_set_1" type="number" class="score-input" value="${getSetValue(0, 'home_points')}">
  <input id="away_set_1" type="number" class="score-input" value="${getSetValue(0, 'away_points')}">

  <div class="set-label">Set 2</div>
  <input id="home_set_2" type="number" class="score-input" value="${getSetValue(1, 'home_points')}">
  <input id="away_set_2" type="number" class="score-input" value="${getSetValue(1, 'away_points')}">

  <div class="set-label">Set 3</div>
  <input id="home_set_3" type="number" class="score-input" value="${getSetValue(2, 'home_points')}">
  <input id="away_set_3" type="number" class="score-input" value="${getSetValue(2, 'away_points')}">

</div>
`,

    preConfirm: () => {
      const getValue = (id: string): number | null => {
        const input = document.getElementById(id) as HTMLInputElement | null;
        if (!input || input.value === '') return null;
        return Number(input.value);
      };

      return {
        set1: {
          home: getValue('home_set_1'),
          away: getValue('away_set_1')
        },
        set2: {
          home: getValue('home_set_2'),
          away: getValue('away_set_2')
        },
        set3: {
          home: getValue('home_set_3'),
          away: getValue('away_set_3')
        }
      };
    }
  });

  if (!result.isConfirmed || !result.value) return;

  const setsRaw = result.value;

  const sets = [
    {
      set_number: 1,
      home_points: setsRaw.set1.home,
      away_points: setsRaw.set1.away
    },
    {
      set_number: 2,
      home_points: setsRaw.set2.home,
      away_points: setsRaw.set2.away
    },
    {
      set_number: 3,
      home_points: setsRaw.set3.home,
      away_points: setsRaw.set3.away
    }
  ].filter(set =>
    set.home_points !== null &&
    set.away_points !== null
  );

  let homeSetsWon = 0;
  let awaySetsWon = 0;

  const completedSets = sets.map(set => {
    const homeWon = set.home_points > set.away_points;

    if (homeWon) {
      homeSetsWon++;
    } else {
      awaySetsWon++;
    }

    return {
      ...set,
      winner_team_id: homeWon ? match.home_team_id : match.away_team_id
    };
  });

  const winnerTeamId =
    homeSetsWon > awaySetsWon ? match.home_team_id : match.away_team_id;

  const loserTeamId =
    homeSetsWon > awaySetsWon ? match.away_team_id : match.home_team_id;

  await this.matchesService.pb.collection('matches').update(match.id, {
    sets: completedSets,
    home_sets_won: homeSetsWon,
    away_sets_won: awaySetsWon,
    winner_team_id: winnerTeamId,
    loser_team_id: loserTeamId,
    status: 'finished'
  });

  Swal.fire({
    icon: 'success',
    title: 'Resultado guardado',
    text: 'El resultado del partido fue actualizado correctamente.',
    confirmButtonColor: '#198754'
  });
}
getMatchScore(match: MatchRecord): string {
  if (!match.sets || !match.sets.length) return '';

  return match.sets
    .map((set: any) => `${set.home_points}-${set.away_points}`)
    .join(' | ');
}
getSavedMatchImageUrl(match: MatchRecord, side: 'home' | 'away'): string {
  const teamId = side === 'home' ? match.home_team_id : match.away_team_id;
  const fileName = side === 'home' ? match.home_image_logo : match.away_image_logo;

  if (!teamId || !fileName) {
    return 'assets/images/placeholder-team.jpg';
  }

  return `${this.realtimeTeamsService.pb.baseUrl}/api/files/teams/${teamId}/${fileName}`;
}
async openGroupStandingsModal(group: Group): Promise<void> {
  const standings = this.getStandingsByGroup(group);

  if (!standings.length) {
    Swal.fire({
      icon: 'info',
      title: 'Sin resultados',
      text: 'Este grupo aún no tiene resultados registrados.'
    });
    return;
  }

  const html = this.buildStandingsTableHtml(standings, group.name);

  await Swal.fire({
    title: `Tabla - ${group.name}`,
    width: 900,
    html,
    showCloseButton: true,
    showConfirmButton: false,
    customClass: {
      popup: 'swal-rounded'
    }
  });
}
getStandingsByGroup(group: Group): any[] {
  if (!this.selectedCategory) return [];

  const matches = this.savedMatches.filter(match =>
    match.group_id === group.id_group &&
    match.status === 'finished' &&
    match.sets?.length
  );

  const table: any = {};

  const initTeam = (id: string, name: string, logo?: string) => {
    if (!table[id]) {
table[id] = {
  teamId: id,
  name,
  image_logo: logo,
  played: 0,
  won: 0,
  lost: 0,
  setsFor: 0,
  setsAgainst: 0,
  points: 0,
  pointsFor: 0,        // ✅ NUEVO
  pointsAgainst: 0     // ✅ NUEVO
};
    }
  };

  matches.forEach(match => {
    initTeam(match.home_team_id, match.home_team_name, match.home_image_logo);
    initTeam(match.away_team_id, match.away_team_name, match.away_image_logo);

    let homeSets = 0;
    let awaySets = 0;

    match.sets.forEach((set: any) => {
      table[match.home_team_id].pointsFor += set.home_points;
table[match.home_team_id].pointsAgainst += set.away_points;

table[match.away_team_id].pointsFor += set.away_points;
table[match.away_team_id].pointsAgainst += set.home_points;
      if (set.home_points > set.away_points) homeSets++;
      else awaySets++;
    });

    table[match.home_team_id].played++;
    table[match.away_team_id].played++;

    table[match.home_team_id].setsFor += homeSets;
    table[match.home_team_id].setsAgainst += awaySets;

    table[match.away_team_id].setsFor += awaySets;
    table[match.away_team_id].setsAgainst += homeSets;

    // ganador
    if (homeSets > awaySets) {
      table[match.home_team_id].won++;
      table[match.away_team_id].lost++;

      table[match.home_team_id].points += homeSets === 2 ? 3 : 2;
      table[match.away_team_id].points += awaySets === 1 ? 1 : 0;
    } else {
      table[match.away_team_id].won++;
      table[match.home_team_id].lost++;

      table[match.away_team_id].points += awaySets === 2 ? 3 : 2;
      table[match.home_team_id].points += homeSets === 1 ? 1 : 0;
    }
  });

return Object.values(table).sort((a: any, b: any) => {
  if (b.points !== a.points) return b.points - a.points;

  const diffA = a.setsFor - a.setsAgainst;
  const diffB = b.setsFor - b.setsAgainst;

  if (diffB !== diffA) return diffB - diffA;

  // 🔥 nuevo desempate
  const pfDiffA = a.pointsFor - a.pointsAgainst;
  const pfDiffB = b.pointsFor - b.pointsAgainst;

  if (pfDiffB !== pfDiffA) return pfDiffB - pfDiffA;

  return b.pointsFor - a.pointsFor;
});
  // return Object.values(table).sort((a: any, b: any) => {
  //   if (b.points !== a.points) return b.points - a.points;

  //   const diffA = a.setsFor - a.setsAgainst;
  //   const diffB = b.setsFor - b.setsAgainst;

  //   if (diffB !== diffA) return diffB - diffA;

  //   return b.setsFor - a.setsFor;
  // });
}
  generateMatchesForSelectedCategory(): void {
    if (!this.selectedCategory) return;

    const categoryId = this.selectedCategory.category_id;
    const groups = this.getGroupsBySelectedCategory();

    const allMatches: GeneratedMatch[] = [];

    for (const group of groups) {
      const teams = this.getTeamsByGroup(group);

      if (teams.length < 2) continue;

      const groupMatches = this.generateRoundRobinMatches(
        teams,
        group.id_group!,
        categoryId
      );

      allMatches.push(...groupMatches);
    }

    this.generatedMatches = allMatches;
    this.activeRound = 1;
    this.showCategories = false;
  }
async saveGeneratedMatches(): Promise<void> {
  if (!this.selectedCategory) return;

  const totalMatches = this.generatedMatches.length;

  if (!totalMatches) {
    Swal.fire({
      icon: 'warning',
      title: 'Sin partidos',
      text: 'Primero debes generar los partidos.'
    });
    return;
  }

  const confirm = await Swal.fire({
    icon: 'question',
    title: 'Guardar partidos',
    html: `
      <p>Se guardarán <strong>${totalMatches}</strong> partidos en la base de datos.</p>
      <p class="mb-0">Si ya existen partidos de esta categoría, serán reemplazados.</p>
    `,
    showCancelButton: true,
    confirmButtonText: 'Sí, guardar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#198754',
    cancelButtonColor: '#6c757d'
  });

  if (!confirm.isConfirmed) return;

  this.isSavingMatches = true;

  const pb = this.realtimeTeamsService.pb;
  const categoryId = this.selectedCategory.category_id;

  let savedCount = 0;

  try {
    Swal.fire({
      title: 'Guardando partidos...',
      html: `
        <p id="progress-text">Preparando guardado...</p>
        <div style="width:100%; background:#e9ecef; border-radius:8px; overflow:hidden;">
          <div id="progress-bar" style="width:0%; height:14px; background:#198754; transition:width .2s;"></div>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const updateProgress = (current: number, total: number) => {
      const percent = Math.round((current / total) * 100);

      const progressText = document.getElementById('progress-text');
      const progressBar = document.getElementById('progress-bar');

      if (progressText) {
        progressText.innerText = `Guardando ${current} de ${total} partidos...`;
      }

      if (progressBar) {
        progressBar.style.width = `${percent}%`;
      }
    };

    // Eliminar partidos anteriores
    const existingMatches = await pb.collection('matches').getFullList({
      filter: `category_id="${categoryId}" && match_type="group"`
    });

    for (const oldMatch of existingMatches) {
      await pb.collection('matches').delete(oldMatch.id);
    }

    updateProgress(0, totalMatches);

    // Guardar partidos uno por uno
    for (let i = 0; i < totalMatches; i++) {
      const match = this.generatedMatches[i];

      const data = {
        category_id: match.categoryId,
        group_id: match.groupId,
        round: match.round,
        match_number: i + 1,

        home_team_id: match.homeTeam.id,
        away_team_id: match.awayTeam.id,

        home_team_name: match.homeTeam.name,
        away_team_name: match.awayTeam.name,

        status: 'scheduled',
        match_type: 'group',

        sets_mode: 3,
        home_sets_won: 0,
        away_sets_won: 0,
        sets: [],
        home_image_logo: match.homeTeam.image_logo,
        away_image_logo: match.awayTeam.image_logo,

        home_points_table: 0,
        away_points_table: 0,

        scheduled_at: '',
        court: '',
        notes: '',
        is_active: true
      };

      await pb.collection('matches').create(data);

      savedCount++;
      updateProgress(savedCount, totalMatches);
    }

    await Swal.fire({
      icon: 'success',
      title: 'Partidos guardados',
      text: `Se guardaron correctamente ${savedCount} de ${totalMatches} partidos.`,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#198754'
    });

  } catch (error) {
    console.error('Error guardando partidos:', error);

    Swal.fire({
      icon: 'error',
      title: 'Error al guardar',
      text: `Se guardaron ${savedCount} de ${totalMatches} partidos antes del error.`,
      confirmButtonText: 'Aceptar'
    });

  } finally {
    this.isSavingMatches = false;
    this.cdr.detectChanges();
  }
}
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.categoriesService.unsubscribeRealtime();
    this.realtimeTeamsService.unsubscribeAll();
    this.matchesService.unsubscribeRealtime();
  }

  get filteredCategories(): Category[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) return this.categories;

    return this.categories.filter(category =>
      category.name?.toLowerCase().includes(term) ||
      category.description?.toLowerCase().includes(term) ||
      category.category_id?.toLowerCase().includes(term)
    );
  }

  getTeamsCountByCategory(category: Category): number {
    return this.teams.filter(team => team.category_id === category.category_id).length;
  }
  getCurrentMatches(): MatchRecord[] {
  return this.matchesService.getCurrentMatches();
}
async selectCategory(category: Category): Promise<void> {
  this.selectedCategory = category;
  this.resetMatches();

  await this.matchesService.loadMatchesByCategory(category.category_id);
  await this.matchesService.subscribeRealtime(category.category_id);

  // 🔥 Evaluar si hay partidos guardados
  const matches = this.matchesService.getCurrentMatches(); // 👈 necesitas esto

  this.showCategories = matches.length === 0;
}
getSavedRounds(): { round: number; matches: MatchRecord[] }[] {
  const roundsMap = new Map<number, MatchRecord[]>();

  for (const match of this.savedMatches) {
    if (!roundsMap.has(match.round)) {
      roundsMap.set(match.round, []);
    }

    roundsMap.get(match.round)?.push(match);
  }

  return Array.from(roundsMap.entries())
    .map(([round, matches]) => ({ round, matches }))
    .sort((a, b) => a.round - b.round);
}
resetMatches(): void {
  this.generatedMatches = [];
  this.activeRound = 1;
}
async clearSelectedCategory(): Promise<void> {
  this.selectedCategory = null;
  this.savedMatches = [];
  this.resetMatches();
  await this.matchesService.unsubscribeRealtime();
  this.matchesService.clearMatches();
}
  getGroupsBySelectedCategory(): Group[] {
    if (!this.selectedCategory) return [];

    const groupIdsInCategory = new Set(
      this.teams
        .filter(team => team.category_id === this.selectedCategory?.category_id)
        .map(team => team.group_id)
        .filter(groupId => groupId && groupId !== 'N/A')
    );

    return this.groups.filter(group =>
      group.id_group && groupIdsInCategory.has(group.id_group)
    );
  }
  getMainImageUrl(team: Team): string {
    if (team.image_logo) {
      return this.realtimeTeamsService.pb.files.getUrl(team as any, team.image_logo);
    }
    return 'assets/images/placeholder-team.jpg';
  }

  getTeamsByGroup(group: Group): Team[] {
    if (!this.selectedCategory) return [];

    return this.teams.filter(team =>
      team.group_id === group.id_group &&
      team.category_id === this.selectedCategory?.category_id
    );
  }
  trackByCategoryId(index: number, category: Category): string {
    return category.id;
  }
}