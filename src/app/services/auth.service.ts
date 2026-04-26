import PocketBase, { RecordModel } from 'pocketbase';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

export interface User extends RecordModel {
  username: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  avatar?: string;
  type?: string;
  status?: boolean;
  verified: boolean;
  emailVisibility: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private pb = new PocketBase('https://db.buckapi.site:8030');

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private router: Router) {
    this.pb.authStore.loadFromCookie(document.cookie);

    if (this.pb.authStore.isValid && this.pb.authStore.model) {
      this.currentUserSubject.next(this.pb.authStore.model as User);
    } else {
      this.currentUserSubject.next(null);
    }
  }

  async login(identity: string, password: string): Promise<User> {
    try {
      const authData = await this.pb.collection('users').authWithPassword(
        identity,
        password
      );

      document.cookie = this.pb.authStore.exportToCookie({
        httpOnly: false,
        sameSite: 'Lax',
        secure: location.protocol === 'https:',
        path: '/',
      });

      const user = authData.record as User;
      this.currentUserSubject.next(user);

      return user;
    } catch (error: any) {
      console.error('Error en login:', error);

      const rawMessage = error?.response?.message || '';

      if (rawMessage.toLowerCase().includes('failed to authenticate')) {
        throw new Error('Correo/usuario o contraseña incorrectos.');
      }

      throw new Error(rawMessage || 'Error al iniciar sesión');
    }
  }

  logout(): void {
    this.pb.authStore.clear();
    document.cookie = 'pb_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.pb.authStore.isValid;
  }

  getToken(): string | null {
    return this.pb.authStore.token;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): string | null {
    return this.currentUserSubject.value?.id || null;
  }

  redirectToDashboard(user: User): void {
    if (user.role === 'admin') {
      this.router.navigate(['/teams']);
    } else {
      this.router.navigate(['/teams']);
    }
  }
}