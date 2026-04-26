import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService, User } from '../../services/auth.service';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  currentUser$!: Observable<User | null>;
  userDisplayName$!: Observable<string>;
  avatarUrl$!: Observable<string>;

  constructor(public authService: AuthService,
    public sharedService: SharedService
  ) {
    this.currentUser$ = this.authService.currentUser$;

    this.userDisplayName$ = this.currentUser$.pipe(
      map((user: User | null) =>
        user?.name?.trim() ||
        user?.username?.trim() ||
        user?.email?.trim() ||
        'Usuario'
      )
    );

    this.avatarUrl$ = this.currentUser$.pipe(
      map((user: User | null) => {
        if (!user?.avatar) {
          return 'assets/images/avatar/avatar2.webp';
        }

        return `https://db.buckapi.site:8015/api/files/users/${user.id}/${user.avatar}`;
      })
    );
  }

  logout(event?: Event): void {
    event?.preventDefault();
    this.authService.logout();
  }
}