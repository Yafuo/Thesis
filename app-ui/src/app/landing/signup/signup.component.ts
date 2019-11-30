import { Component, OnInit } from '@angular/core';
import {faBars, faArrowLeft, faChevronLeft,faSignInAlt,faPowerOff} from "@fortawesome/free-solid-svg-icons";
import {faGithub} from "@fortawesome/free-brands-svg-icons";
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {NgxSpinnerService} from "ngx-spinner";
import {CookieService} from "ngx-cookie-service";
@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  list = ['Sign in', 'Exit'];
  url = ['/landing/login', '#'];
  faBars = faBars;
  faArrowLeft = faArrowLeft;
  faGithub = faGithub;
  faChevronLeft = faChevronLeft;
  faSignInAlt = faSignInAlt;
  faPowerOff = faPowerOff;
  navBarList = [this.faSignInAlt, this.faPowerOff];
  user = new User('', '', '');
  constructor(private http: HttpClient, private router: Router, private spinner: NgxSpinnerService, private cookieService: CookieService) { }

  ngOnInit() {
    if (this.cookieService.check('token')) {
      this.router.navigate(['/home']);
    } else {
      this.spinner.show();

      setTimeout(() => {
        this.spinner.hide();
      }, 600);
    }
  }

  signup() {
    const params = {
      email: this.user.email,
      password: this.user.password
    };
    this.http.post('/api/signup', params).subscribe(r => {
      console.log(r);
    }, err => {
      console.log(err);
    });
  }

  navTo(i) {
    this.router.navigate([this.url[i]]);
  }

}
export class User {
  email: string;
  password: string;
  confirm: string;
  constructor(email: string, password: string, confirm: string) {
    this.email = email;
    this.password = password;
    this.confirm = confirm;
  }
}
