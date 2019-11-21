import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import { Observable } from 'rxjs';
import {AuthService} from "./auth.service";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot
              , state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (!this.authService.isLoggedIn()) {
      console.log('navigated');
      this.router.navigate(['landing/login']);
      // this.router.navigate(['/home/booking']);
      return true;
    }
    return true;
    // else {
    //   if (this.router.url.indexOf('/landing') == -1)
    //     this.router.navigate(['/landing/login']);
    //   return false;
    // }
  }
}
