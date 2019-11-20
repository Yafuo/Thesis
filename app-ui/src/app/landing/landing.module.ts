import {NgModule} from "@angular/core";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {RouterModule} from "@angular/router";
import {TopPanelComponent} from "../common/top-panel/top-panel.component";
import {SignupComponent} from "./signup/signup.component";
import {LandingRoutingModule} from "./landing-routing.module";
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatListModule} from "@angular/material/list";
import {CommonModule} from "@angular/common";
import {LoginComponent} from "./login.component";
import {FormsModule} from "@angular/forms";
import {HttpClientModule} from "@angular/common/http";
import {NgxSpinnerModule} from "ngx-spinner";

@NgModule({
  declarations: [
    TopPanelComponent,
    LoginComponent,
    SignupComponent
  ],
  imports: [
    LandingRoutingModule,
    FontAwesomeModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    NgxSpinnerModule
  ],
  providers: []
})
export class LandingModule {

}
