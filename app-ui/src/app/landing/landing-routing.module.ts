import {RouterModule, Routes} from "@angular/router";
import {NgModule} from "@angular/core";
import {SignupComponent} from "./signup/signup.component";
import {LoginComponent} from "./login.component";
import {ForgotPasswordComponent} from "./forgot-password/forgot-password.component";

const routes: Routes = [
  // {
  //
  //   path: '',
  //   component: SignupComponent,
  //   children: [
  //
  //   ]
  // },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignupComponent
  },
  {
    path:'password_reset',
    component: ForgotPasswordComponent
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)]
})
export class LandingRoutingModule {

}
