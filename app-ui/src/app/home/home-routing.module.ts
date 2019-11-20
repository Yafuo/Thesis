import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeModule} from "./home.module";
import {HomeComponent} from "./home.component";
import {AuthGuard} from "../auth.guard";

const routes: Routes = [
  {
    path: 'booking',
    component: HomeComponent,
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: 'booking',
    pathMatch: 'full',
    canActivate: [AuthGuard]
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }
