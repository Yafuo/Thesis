import { Component, OnInit } from '@angular/core';
import {faBars, faArrowLeft} from "@fortawesome/free-solid-svg-icons";
import {faGithub} from "@fortawesome/free-brands-svg-icons";
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  list = ['Sign In', 'Exit'];
  url = ['/landing/login', '#'];
  faBars = faBars;
  faArrowLeft = faArrowLeft;
  faGithub = faGithub;
  user = new User('', '', '');
  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
  }

  signup() {
    const params = {
      email: this.user.email,
      password: this.user.password
    };
    this.http.post('/signup', params).subscribe(r => {
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
