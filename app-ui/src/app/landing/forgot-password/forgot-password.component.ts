import { Component, OnInit } from '@angular/core';
import {NgxSpinnerService} from "ngx-spinner";
import {faBars, faArrowLeft} from "@fortawesome/free-solid-svg-icons";
import {faGithub} from "@fortawesome/free-brands-svg-icons";
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {

  list = ['Sign Up', 'Exit'];
  url = ['/landing/signup', '/landing/login'];
  faBars = faBars;
  faArrowLeft = faArrowLeft;
  faGithub = faGithub;
  mail= '';
  constructor(private http: HttpClient, private spinner: NgxSpinnerService, private router: Router) { }

  ngOnInit() {
    this.spinner.show();

    setTimeout(() => {
      this.spinner.hide();
    }, 600);
  }

  sendMail() {

  }

  navTo(i: number) {
    this.router.navigate([this.url[i]]);
  }

}
