import {Component, OnInit, Renderer2, ViewEncapsulation} from '@angular/core';
import {faCheckCircle, faTimesCircle,faUserPlus, faLanguage, faChevronLeft, faBars, faPowerOff, faSyncAlt} from "@fortawesome/free-solid-svg-icons";
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
import {getDistance} from "ol/sphere";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class HomeComponent implements OnInit {

  domain = 'http://ba732ea8.ngrok.io';
  faBars = faBars;
  faPowerOff = faPowerOff;
  faChevronLeft =faChevronLeft;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faUserPlus = faUserPlus;
  faLanguage = faLanguage;
  faSyncAlt = faSyncAlt;
  districtList = ['Tan Phu', 'Tan Binh', 'Phu Nhuan', 'Binh Thanh'];
  stationListInfo = [];
  userLocation = [];
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
  state = 'down';
  arriveTime: Date;
  leaveHomeTime = new Date(Date.now());
  isShowResult = false;
  isCurrentLocationChecked = false;
  qrUrl = '';
  newsObj = {billMsg: '', billCode: ''};
  socket: SocketIOClient.Socket;
  userInfo = {email: '', userId: '', status: '', stationId: 0, slotId: 0, endTime: new Date(), lang: ''};
  isAvailable = false;
  extend = false;
  endTime = '';
  selectedLang = '';
  langList = [{name: 'Vietnamese', code: 'vn'}, {name: 'English', code: 'en'}, {name: 'Español', code: 'es'}, {name: 'Chinese', code: 'ch'}];
  list = [{opt: 'Log out', details: [], icon: this.faPowerOff}, {opt: 'Language', details: this.langList, icon: this.faLanguage}];
  isTimeValid = true;
  isUserNearStation = false;
  //Maps API
  userCurrentCoor = {lat: 0, lon: 0};
  startCoorList = [];
  distance = 0;
  geoReverseService = 'https://nominatim.openstreetmap.org/reverse?key=iTzWSiYpGxDvhATNtSrqx5gDcnMOkntL&format=json&addressdetails=1&lat={lat}&lon={lon}';

  constructor(private translate: TranslateService, private router: Router, private render: Renderer2, private http: HttpClient, private cookieService: CookieService, private eventBus: EventBusService) {
    this._alwaysListenToChange();
  }

  ngOnInit() {
    this._getAllStation();
    this._getUserInfo();
    this._getCurrentLocation();
    this.districtList = this.districtList.map(d => this._getTranslation(d));
    this.filterAllSearchList = this.allSearch.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, 1))
    );
  }

  private _getAllStation() {
    this.http.get<any>('/api/get-all-station').subscribe(r => {
      this.stationListInfo = r;
      console.log(this.stationListInfo);
      this.filterparkingStationList = this.parkingStationControl.valueChanges.pipe(
        startWith(''),
        map(value => this._filter(value, 3))
      );
    });
  }

  private _calArriveTime() {
    if ((!this.userLocationControl.value && !this.isCurrentLocationChecked) || !this.parkingStationControl.value) return;
    const index = this.userLocation.indexOf(this.userLocationControl.value);
    const startPoint = this.isCurrentLocationChecked ? this.userCurrentCoor : this.startCoorList[index];
    const endPoint = this.stationListInfo.filter(s => s.stationAddress.indexOf(this.parkingStationControl.value) > -1)[0];
    console.log(endPoint);
    let u = `https://routing.openstreetmap.de/routed-bike/route/v1/driving/${startPoint.lon},${startPoint.lat};${endPoint.lon},${endPoint.lat}?overview=false&geometries=polyline&steps=true`;
    console.log(u);
    this.http.get<any>(u).subscribe(r => {
      console.log(r);
      this.distance = r.routes[0].distance;
      const dur = r.routes[0].duration;
      let temp = new Date(this.leaveHomeTime);
      if (dur >= 3600) {
        temp.setHours(temp.getHours()+dur/3600, temp.getMinutes()+dur%3600);
        this.arriveTime = temp;
      } else {
        temp.setMinutes(temp.getMinutes()+dur/60, temp.getSeconds()+dur%60);
        this.arriveTime = temp;
      }
    });
  }

  private _filter(value: string, opt: number): string[] {
    const filterValue = value.toLowerCase();
    if (opt === 1) {
      return this.districtList.filter(d => d.toLowerCase().indexOf(filterValue) > -1);
    } else if (opt === 2) {
      return this.userLocation.filter(d => d.toLowerCase().indexOf(filterValue) > -1);
    } else {
      return this.stationListInfo.filter(d => d.stationAddress.toLowerCase().indexOf(filterValue) > -1);
    }
  }

  private _suggestUserLocation(event) {
    // event = event + 'thanh pho ho chi minh';
    if (event.indexOf('phuong') < 0) return;
    let u= `https://nominatim.openstreetmap.org/search?q=${event}&format=json&polygon=1&addressdetails=1`;
    this.http.get<any>(u).subscribe(r => {
      console.log(r);
      this.userLocation = [];
      r.forEach(lo => {
        if (lo.display_name.indexOf('Ho Chi Minh City') > -1) {
          this.startCoorList.push({lat: lo.lat, lon: lo.lon});
          this.userLocation.push(lo.display_name);
        }
      });
      this.filterUserLocationList = this.userLocationControl.valueChanges.pipe(
        startWith(''),
        map(value => this._filter(value, 2))
      );
    });
  }

  private _getUserInfo() {
    this.http.get<any>('/api/get-user-info').subscribe(r => {
      this.userInfo = r.result;
      this._setLang(this.userInfo.lang);
      console.log(this.userInfo);
      this.selectedParkingStation = this.userInfo.status != 'none' ? this.stationListInfo.filter(s => s._id === this.userInfo.stationId)[0].stationAddress : '';
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
      if (this.userInfo.status.indexOf('staked') > -1) this._getUserInfo();
    });
    this.socket.on('user-status', (json: any) => {
      console.log(json);
      this.userInfo.status = json.status;
      this.selectedPackage = {name: '', cost: '', value: 0};
      this.qrUrl = '';
      if (this.userInfo.status.indexOf('staked') > -1) this._getUserInfo();
    });
  }

  private _updateDistBetweenCurrentToDestination() {
    const endPoint = this.stationListInfo.filter(s => s._id === this.userInfo.stationId)[0];
    this._getCurrentLocation();
    let u = `https://routing.openstreetmap.de/routed-bike/route/v1/driving/${this.userCurrentCoor.lon},${this.userCurrentCoor.lat};${endPoint.lon},${endPoint.lat}?overview=false&geometries=polyline&steps=true`;
    this.http.get<any>(u).subscribe(r => {
      this.isUserNearStation = r.routes[0].distance < 2400;
    });
  }

  private _getCurrentLocation() {
    navigator.geolocation.getCurrentPosition(pos => {
      this.userCurrentCoor.lat = pos.coords.latitude;
      this.userCurrentCoor.lon = pos.coords.longitude;
    });
  }

  private _getCar() {
    const params = {
      stationId: this.userInfo.stationId,
      slotId: this.userInfo.slotId,
      userName: this.userInfo.email,
    };
    const errorCode = '0';
    const extraData = `${params.stationId}-${params.slotId}-${params.userName}-G`;
    const lastParams = {
      errorCode: errorCode,
      extraData: extraData
    }
    this.http.post('/api/save-user-pressed', lastParams).subscribe(r => {
      console.log(r);
    });
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
      extraData: `${params.stationId}-${params.slotId}-${params.userName}-P`,
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

  private _extend() {
    this.extend = false;
    const index = this.stationListInfo.filter(s => s.stationAddress.indexOf(this.selectedParkingStation) > -1)[0]._id;
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
  }

  private filter() {
    this.toggleFilter();
    this.isTimeValid = this.leaveHomeTime > new Date(Date.now());
    this.selectedParkingStation = this.parkingStationControl.value;
    const index = this.stationListInfo.filter(s => s.stationAddress.indexOf(this.selectedParkingStation) > -1)[0]._id;
    this.selectedUserLocation = this.isCurrentLocationChecked ? '14 Tran Van On, P.Tay Thanh, Q.Tan Phu' : this.userLocationControl.value;
    let readyParkTime = new Date(this.arriveTime);
    readyParkTime.setHours(this.arriveTime.getHours() + this.selectedPackage.value);
    const params = {
      stationId: index,
      startTime: new Date(this.arriveTime).toLocaleString('en-US'),
      endTime: new Date(readyParkTime).toLocaleString('en-US'),
      email: this.userInfo.email,
      userId: this.userInfo.userId
    };
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
    const index = this.stationListInfo.filter(s => s.stationAddress.indexOf(this.selectedParkingStation) > -1)[0]._id;
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

  onSelect(p) {
    this.selectedPackage = p;
  }

  toggleExtend() {
    this.extend = !this.extend;
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

  private _setLang(lang: string) {
    this.translate.setDefaultLang(lang);
  }

  navTo(i: number) {
    if (i + 1 === this.list.length) return;
    this.cookieService.delete('token', '/', 'localhost');
    this.router.navigate(['/']);
  }

}
