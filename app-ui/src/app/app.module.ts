import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {AuthGuard} from "./auth.guard";
import {AuthService} from "./auth.service";
import {CookieService} from "ngx-cookie-service";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FontAwesomeModule,
    BrowserAnimationsModule
  ],
  providers: [AuthGuard, AuthService, CookieService],
  bootstrap: [AppComponent]
})
export class AppModule { }
