import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchesService, MatchRecord } from '../../services/matches.service';
import { CategoriesService } from '../../services/categories.service';
import { Category } from '../../models/category.model';

export interface TeamStats {
  teamId: string;
  name: string;
  image_logo?: string;
  played: number;
  won: number;
  lost: number;
  setsFor: number;
  setsAgainst: number;
  points: number;
    pointsFor: number;
  pointsAgainst: number;
}



@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.html',
  styleUrl: './results.css',
})
export class Results implements OnInit {
  matches: MatchRecord[] = [];
  categories: Category[] = [];

  standings: TeamStats[] = [];
  isLoading = false;
  activeCategoryId = '';
standingsByCategory: {
  categoryId: string;
  teams: TeamStats[];
}[] = [];

  constructor(
      private categoriesService: CategoriesService,

    private matchesService: MatchesService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}
getCategoryName(categoryId: string): string {
  const category = this.categories.find(c => c.category_id === categoryId);
  return category ? category.name : 'Sin nombre';
}
  async ngOnInit(): Promise<void> {
      await this.categoriesService.loadCategories();
  this.categories = this.categoriesService.getCurrentCategories();

    await this.loadResults();
  }

  async loadResults(): Promise<void> {
    this.isLoading = true;

    try {
      const matches = await this.matchesService.pb.collection('matches').getFullList<MatchRecord>({
        filter: `status="finished" && is_active=true`,
        sort: 'category_id,group_id,round,match_number'
      });

      this.ngZone.run(() => {
        this.matches = matches;
        this.standingsByCategory = this.generateStandingsByCategory(matches);
this.activeCategoryId = this.standingsByCategory[0]?.categoryId || '';
this.standings = this.getActiveStandings();
        this.isLoading = false;
        this.cdr.detectChanges();
      });

    } catch (error) {
      console.error('Error cargando resultados:', error);
      this.isLoading = false;
    }
  }
  generateStandingsByCategory(matches: MatchRecord[]): { categoryId: string; teams: TeamStats[] }[] {
  const categoryMap = new Map<string, MatchRecord[]>();

  matches.forEach(match => {
    if (!categoryMap.has(match.category_id)) {
      categoryMap.set(match.category_id, []);
    }

    categoryMap.get(match.category_id)?.push(match);
  });

  return Array.from(categoryMap.entries()).map(([categoryId, categoryMatches]) => ({
    categoryId,
    teams: this.generateStandings(categoryMatches)
  }));
}

setActiveCategory(categoryId: string): void {
  this.activeCategoryId = categoryId;
  this.standings = this.getActiveStandings();
}

getActiveStandings(): TeamStats[] {
  return this.standingsByCategory.find(item => item.categoryId === this.activeCategoryId)?.teams || [];
}
getTeamLogo(team: TeamStats): string {
  if (!team.image_logo) {
    return 'assets/images/placeholder-team.jpg';
  }

  return `${this.matchesService.pb.baseUrl}/api/files/teams/${team.teamId}/${team.image_logo}`;
}
  generateStandings(matches: MatchRecord[]): TeamStats[] {
    const table: Record<string, TeamStats> = {};

const initTeam = (teamId: string, name: string, logo?: string) => {
  if (!table[teamId]) {
    table[teamId] = {
      teamId,
      name,
      image_logo: logo || '',
      played: 0,
      won: 0,
      lost: 0,
      setsFor: 0,
      setsAgainst: 0,
      points: 0,
        pointsFor: 0,
  pointsAgainst: 0
    };
  }
};

    matches
      .filter(match => match.sets && match.sets.length > 0)
      .forEach(match => {
       initTeam(match.home_team_id, match.home_team_name, match.home_image_logo);
initTeam(match.away_team_id, match.away_team_name, match.away_image_logo);

        let homeSetsWon = 0;
        let awaySetsWon = 0;

   match.sets.forEach((set: any) => {

  // 🔥 ACUMULADO DE PUNTOS
  table[match.home_team_id].pointsFor += set.home_points;
  table[match.home_team_id].pointsAgainst += set.away_points;

  table[match.away_team_id].pointsFor += set.away_points;
  table[match.away_team_id].pointsAgainst += set.home_points;

  if (set.home_points > set.away_points) homeSetsWon++;
  if (set.away_points > set.home_points) awaySetsWon++;
});

        table[match.home_team_id].played++;
        table[match.away_team_id].played++;

        table[match.home_team_id].setsFor += homeSetsWon;
        table[match.home_team_id].setsAgainst += awaySetsWon;

        table[match.away_team_id].setsFor += awaySetsWon;
        table[match.away_team_id].setsAgainst += homeSetsWon;

        if (homeSetsWon > awaySetsWon) {
          table[match.home_team_id].won++;
          table[match.away_team_id].lost++;

          table[match.home_team_id].points += homeSetsWon === 2 && awaySetsWon === 0 ? 3 : 2;
          table[match.away_team_id].points += awaySetsWon === 1 ? 1 : 0;
        }

        if (awaySetsWon > homeSetsWon) {
          table[match.away_team_id].won++;
          table[match.home_team_id].lost++;

          table[match.away_team_id].points += awaySetsWon === 2 && homeSetsWon === 0 ? 3 : 2;
          table[match.home_team_id].points += homeSetsWon === 1 ? 1 : 0;
        }
      });

    // return Object.values(table).sort((a, b) => {
    //   if (b.points !== a.points) return b.points - a.points;

    //   const diffB = b.setsFor - b.setsAgainst;
    //   const diffA = a.setsFor - a.setsAgainst;

    //   if (diffB !== diffA) return diffB - diffA;

    //   return b.setsFor - a.setsFor;
    // });
    return Object.values(table).sort((a, b) => {
  if (b.points !== a.points) return b.points - a.points;

  const diffB = b.setsFor - b.setsAgainst;
  const diffA = a.setsFor - a.setsAgainst;

  if (diffB !== diffA) return diffB - diffA;

  // 🔥 NUEVO desempate
  const pfDiffB = b.pointsFor - b.pointsAgainst;
  const pfDiffA = a.pointsFor - a.pointsAgainst;

  if (pfDiffB !== pfDiffA) return pfDiffB - pfDiffA;

  return b.pointsFor - a.pointsFor;
});
  }
}