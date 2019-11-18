import { Component, OnInit } from '@angular/core';
import {faBars, faArrowLeft} from "@fortawesome/free-solid-svg-icons";
import {HttpClient} from "@angular/common/http";
import {faGithub} from "@fortawesome/free-brands-svg-icons";
@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  list = ['Sign In', 'Exit'];
  faBars = faBars;
  faArrowLeft = faArrowLeft;
  faGithub = faGithub;
  user = new User('', '', '');
  constructor(private http: HttpClient) { }

  ngOnInit() {
  }

  signup(email: string, password: string, confirm: string) {

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
