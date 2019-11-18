import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {faBars, faArrowLeft} from "@fortawesome/free-solid-svg-icons";
import {faGithub} from "@fortawesome/free-brands-svg-icons";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  list = ['Sign Up', 'Exit'];
  faBars = faBars;
  faArrowLeft = faArrowLeft;
  faGithub = faGithub;
  constructor(private http: HttpClient) { }

  ngOnInit() {
  }

  signin(email: string, password: string) {

  }

}
