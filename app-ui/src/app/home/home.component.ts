import {Component, OnInit, Renderer2, ViewEncapsulation} from '@angular/core';
import {faCheckCircle, faTimesCircle,faUserPlus, faLanguage, faChevronLeft, faBars, faPowerOff} from "@fortawesome/free-solid-svg-icons";
import {TranslateService} from "@ngx-translate/core";
import {FormControl} from "@angular/forms";
import {Observable} from "rxjs";
import {map, startWith} from "rxjs/operators";
import * as CryptoJS from "crypto-js";
import {HttpClient} from "@angular/common/http";
import * as io from 'socket.io-client';
import {CookieService} from "ngx-cookie-service";
import {EventBusService} from "../common/service/event-bus.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class HomeComponent implements OnInit {

  domain = 'http://461292c9.ngrok.io';
  faBars = faBars;
  faPowerOff = faPowerOff;
  faChevronLeft =faChevronLeft;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faUserPlus = faUserPlus;
  faLanguage = faLanguage;
  districtList = ['Tan Phu', 'Tan Binh', 'Phu Nhuan', 'Binh Thanh'];
  parkingStationList = ['10 Ho Dac Di, P.Tay Thanh, Q.Tan Phu', '22/44 CMT8, P.2, Q.Tan Binh',
    '49a Phan Dang Luu, P.7, Q.Phu Nhuan', '96 Le Quang Dinh, P.14, Q.Binh Thanh'];
  userLocation = ['60/22 Dong Den, P.14, Q.Tan Binh', '199 Truong Dinh, P.5, Q.3',
    '70 Hoang Van Thu, P.10, Q.Phu Nhuan', '67 Ly Thuong Kiet, P.3, Q.Tan Binh'];
  selectedParkingStation = '';
  selectedUserLocation = '';
  userLocationControl = new FormControl();
  parkingStationControl = new FormControl();
  allSearch = new FormControl();
  filterAllSearchList: Observable<string[]>;
  filterUserLocationList: Observable<string[]>;
  filterparkingStationList: Observable<string[]>;
  isFilterClicked = false;
  packageList = [{name: '1 hour', cost: '5000', value: 1}, {name: '3 hour', cost: '20000', value: 3}, {
    name: '1 day',
    cost: '50000',
    value: 24
  }];
  selectedPackage = {name: '', cost: '', value: 0};
  height = '';
  state = 'down';
  arriveTime: Date;
  leaveHomeTime = new Date(Date.now());
  isShowResult = false;
  isCurrentLocationChecked = false;
  qrUrl = '';
  newsObj = {billMsg: '', billCode: ''};
  socket: SocketIOClient.Socket;
  userInfo = {email: '', userId: '', status: '', stationId: 0, slotId: 0, package: 0, endTime: new Date(), lang: ''};
  isAvailable = false;
  extend = false;
  endTime = '';
  selectedLang = '';
  langList = [{name: 'Vietnamese', code: 'vn'}, {name: 'English', code: 'en'}, {name: 'Español', code: 'es'}, {name: 'Chinese', code: 'ch'}];
  list = [{opt: 'Log out', details: []}, {opt: 'Language', details: this.langList}];
  navBarList = [this.faPowerOff, this.faLanguage];
  isTimeValid = true;

  constructor(private translate: TranslateService, private router: Router, private render: Renderer2, private http: HttpClient, private cookieService: CookieService, private eventBus: EventBusService) {
    this._alwaysListenToChange();
    translate.setDefaultLang('vn');
  }

  ngOnInit() {
    this.arriveTime = new Date(Date.now());
    this.arriveTime.setMinutes(this.arriveTime.getMinutes() + 2);
    this._getUserInfo();
    this.districtList = this.districtList.map(d => this._getTranslation(d));
    this.filterAllSearchList = this.allSearch.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, 1))
    );
    this.filterUserLocationList = this.userLocationControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, 2))
    );
    this.filterparkingStationList = this.parkingStationControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, 3))
    );
  }

  private _setLang(lang: string) {
    this.translate.setDefaultLang(lang);
  }

  navTo(i: number) {
    if (i + 1 === this.list.length) return;
    this.cookieService.delete('token', '/', 'localhost');
    this.router.navigate(['/']);
  }

  private _getUserInfo() {
    this.http.get<any>('/api/get-user-info').subscribe(r => {
      this.userInfo = r.result;
      this._setLang(this.userInfo.lang);
      console.log(this.userInfo);
      this.selectedParkingStation = this.userInfo.status != 'none' ? this.parkingStationList[this.userInfo.stationId-1] : '';
      this.endTime = this.userInfo.status != 'none' ? new Date(this.userInfo.endTime).toLocaleString('en-US') : '';
    });
  }

  private _alwaysListenToChange() {
    this.socket = io.connect('http://localhost:3000');
    this.socket.on('news', (news: any) => {
      console.log(news);
      this.qrUrl = '';
      this.newsObj = news;
      this.selectedPackage = {name: '', cost: '', value: 0};
    });
    this.socket.on('user-status', (json: any) => {
      console.log(json);
      this.userInfo.status = json.status;
      this.selectedPackage = {name: '', cost: '', value: 0};
      if (this.userInfo.status === 'staked') this._getUserInfo();
    });
  }

  toggleExtend() {
    this.extend = !this.extend;
  }

  private _park() {
    let date = Date.now().toString(10);
    const params = {
      stationId: this.userInfo.stationId,
      slotId: this.userInfo.slotId,
      userName: this.userInfo.email
    };
    const selectedP = this.packageList.filter(p => p.value === Number(this.userInfo.status.slice(6)));
    const d = {
      partnerCode: 'MOMO',
      accessKey: 'F8BBA842ECF85',
      requestId: 'UIT' + date,
      amount: selectedP[0].cost,
      orderId: 'UIT' + date,
      orderInfo: selectedP[0].name,
      returnUrl: this.domain,
      notifyUrl: this.domain +'/api/save-user-pressed',
      requestType: 'captureMoMoWallet',
      extraData: `${params.stationId}-${params.slotId}-${params.userName}`,
      signature: ''
    };
    var data = `partnerCode=${d.partnerCode}&accessKey=${d.accessKey}&requestId=${d.requestId}&amount=${d.amount}&orderId=${d.orderId}&orderInfo=${d.orderInfo}&returnUrl=${d.returnUrl}&notifyUrl=${d.notifyUrl}&extraData=${d.extraData}`;
    var secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    var signature = CryptoJS.HmacSHA256(data, secretKey);
    d.signature = signature.toString();
    this.http.post<any>('https://test-payment.momo.vn/gw_payment/transactionProcessor', JSON.stringify(d)).subscribe(r => {
      console.log(r);
      const prefix = 'https://test-payment.momo.vn/gw_payment/qrcode/image/receipt?key=';
      this.qrUrl = prefix + r.qrCodeUrl.slice(42);
    });
    // this.http.post('/api/save-user-pressed', params).subscribe(r => {
    //   console.log(r);
    // });
  }

  private _cancel() {
    const params = {
      stationId: this.userInfo.stationId,
      slotId: this.userInfo.slotId,
      userName: this.userInfo.email
    }
    this.http.post('/api/canceling', params).subscribe(r => {
      console.log(r);
    });
  }

  private _extend() {
    this.extend = false;
    const index = this.parkingStationList.indexOf(this.selectedParkingStation) + 1;
    var date = Date.now().toString(10);
    const params = {
      stationId: index,
      userName: this.userInfo.email,
      package: this.selectedPackage.value,
      endTime: this.endTime,
      slotId: this.userInfo.slotId
    };
    const d = {
      partnerCode: 'MOMO',
      accessKey: 'F8BBA842ECF85',
      requestId: 'UIT' + date,
      amount: (Number(this.selectedPackage.cost) * 2).toString(10),
      orderId: 'UIT' + date,
      orderInfo: this.selectedPackage.name,
      returnUrl: this.domain,
      notifyUrl: this.domain + '/api/extending',
      requestType: 'captureMoMoWallet',
      extraData: `${params.stationId}-${params.slotId}-${params.userName}-${this.selectedPackage.value}-${this.endTime}`,
      signature: ''
    };
    var data = `partnerCode=${d.partnerCode}&accessKey=${d.accessKey}&requestId=${d.requestId}&amount=${d.amount}&orderId=${d.orderId}&orderInfo=${d.orderInfo}&returnUrl=${d.returnUrl}&notifyUrl=${d.notifyUrl}&extraData=${d.extraData}`;
    var secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    var signature = CryptoJS.HmacSHA256(data, secretKey);
    d.signature = signature.toString();
    this.http.post<any>('https://test-payment.momo.vn/gw_payment/transactionProcessor', JSON.stringify(d)).subscribe(r => {
      console.log(r);
      const prefix = 'https://test-payment.momo.vn/gw_payment/qrcode/image/receipt?key=';
      this.qrUrl = prefix + r.qrCodeUrl.slice(42);
    });
    // this.http.post('/api/extending', params).subscribe(r => {
    //
    // });
  }

  filter() {
    this.toggleFilter();
    this.selectedParkingStation = this.parkingStationControl.value;
    const index = this.parkingStationList.indexOf(this.selectedParkingStation) + 1;
    this.selectedUserLocation = this.isCurrentLocationChecked ? '14 Tran Van On, P.Tay Thanh, Q.Tan Phu' : this.userLocationControl.value;
    const readyParkTime = new Date(this.arriveTime);
    this.isTimeValid = this.arriveTime > new Date(Date.now());
    readyParkTime.setHours(this.arriveTime.getHours() + this.selectedPackage.value);
    const params = {
      stationId: index,
      startTime: new Date(this.arriveTime).toLocaleString('en-US'),
      endTime: new Date(readyParkTime).toLocaleString('en-US'),
      email: this.userInfo.email,
      userId: this.userInfo.userId
    };
    console.log(params);
    this.http.post<any>('/api/get-available-slot', params).subscribe(r => {
      this.isShowResult = true;
      this.isAvailable = r.result.indexOf('SLOT_NOT_AVAILABLE') < 0;
    });
  }

  private _book() {
    let date = Date.now().toString(10);
    const startTime = new Date(this.arriveTime).toLocaleString('en-US');
    let readyParkTime = new Date(this.arriveTime);
    readyParkTime.setHours(this.arriveTime.getHours() + this.selectedPackage.value);
    const index = this.parkingStationList.indexOf(this.selectedParkingStation) + 1;
    const d = {
      partnerCode: 'MOMO',
      accessKey: 'F8BBA842ECF85',
      requestId: 'UIT' + date,
      amount: this.selectedPackage.cost,
      orderId: 'UIT' + date,
      orderInfo: this.selectedPackage.name,
      returnUrl: this.domain,
      notifyUrl: this.domain + '/api/booking',
      requestType: 'captureMoMoWallet',
      extraData: `${index}-${this.userInfo.userId}-${this.userInfo.email}-${startTime}-${this.selectedPackage.value}-${new Date(readyParkTime).toLocaleString('en-US')}`,
      signature: ''
    };
    var data = `partnerCode=${d.partnerCode}&accessKey=${d.accessKey}&requestId=${d.requestId}&amount=${d.amount}&orderId=${d.orderId}&orderInfo=${d.orderInfo}&returnUrl=${d.returnUrl}&notifyUrl=${d.notifyUrl}&extraData=${d.extraData}`;
    var secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    var signature = CryptoJS.HmacSHA256(data, secretKey);
    d.signature = signature.toString();
    this.http.post<any>('https://test-payment.momo.vn/gw_payment/transactionProcessor', JSON.stringify(d)).subscribe(r => {
      console.log(r);
      const prefix = 'https://test-payment.momo.vn/gw_payment/qrcode/image/receipt?key=';
      this.qrUrl = prefix + r.qrCodeUrl.slice(42);
    });
  }

  onSelect(p) {
    this.selectedPackage = p;
  }

  private _filter(value: string, opt: number): string[] {
    const filterValue = value.toLowerCase();
    if (opt === 1) {
      return this.districtList.filter(d => d.toLowerCase().indexOf(filterValue) > -1);
    } else if (opt === 2) {
      return this.userLocation.filter(d => d.toLowerCase().indexOf(filterValue) > -1);
    } else {
      return this.parkingStationList.filter(d => d.toLowerCase().indexOf(filterValue) > -1);
    }
  }

  private _getTranslation(value: string): string {
    let wordTranslated = 'not_ready';
    this.translate.get(`DISTRICT.${value}`).subscribe(word => {
      wordTranslated = word;
    });
    return wordTranslated;
  }

  toggleFilter() {
    this.isFilterClicked = !this.isFilterClicked;
  }

  display(stt: string) {
    // this.render.setStyle(document.body.getElementsByClassName('indicator'), 'transform', 'rotate(180deg)');
    this.state = this.state === 'down' ? 'up' : 'down';
  }

}
