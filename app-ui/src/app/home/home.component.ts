import {Component, OnInit, Renderer2, ViewEncapsulation} from '@angular/core';
import {faCheckCircle, faTimesCircle,faUserPlus, faLanguage, faChevronLeft, faBars, faPowerOff, faSyncAlt, faTimes, faMoneyBillAlt} from "@fortawesome/free-solid-svg-icons";
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
import {marker} from "./model/marker.image";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class HomeComponent implements OnInit {

  domain = 'http://b1139fea.ngrok.io';
  faBars = faBars;
  faPowerOff = faPowerOff;
  faChevronLeft =faChevronLeft;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faUserPlus = faUserPlus;
  faLanguage = faLanguage;
  faSyncAlt = faSyncAlt;
  faTimes = faTimes;
  faMoneyBillAlt = faMoneyBillAlt;
  districtList = ['Tan Phu', 'Tan Binh', 'Phu Nhuan', 'Binh Thanh'];
  stationListInfo = [];
  userLocation = [];
  selectedParkingStation = '';
  userLocationControl = new FormControl();
  parkingStationControl = new FormControl();
  allSearch = new FormControl();
  filterAllSearchList: Observable<string[]>;
  filterUserLocationList: Observable<string[]>;
  filterparkingStationList: Observable<string[]>;
  isFilterClicked = false;
  packageList = [];
  selectedPackage = {name: '', cost: '', value: 0};
  state = 'down';
  arriveTime: Date;
  leaveHomeTime: Date;
  isShowResult = false;
  isCurrentLocationChecked = false;
  qrUrl = '';
  newsObj = {billMsg: '', billCode: '', action: ''};
  socket: SocketIOClient.Socket;
  userInfo = {email: '', userId: '', status: '', stationId: 0, slotId: 0, startTime: new Date(), endTime: new Date(), lang: ''};
  isAvailable = false;
  extend = false;
  endTime = '';
  selectedLang = '';
  langList = [{name: 'Vietnamese', code: 'vn'}, {name: 'English', code: 'en'}, {name: 'Español', code: 'es'}, {name: 'Chinese', code: 'ch'}];
  list = [{opt: 'LOG_OUT', details: [], icon: this.faPowerOff}, {opt: 'LANGUAGE', details: this.langList, icon: this.faLanguage}, {opt: 'PAYMENT_LOG', details: [], icon: this.faMoneyBillAlt}];
  isTimeValid = true;
  isUserNearStation = false;
  isTimeCome = false;
  notiStatus = 'show';
  timer: any;
  isFine = false;
  isConflict = false;
  //Maps API
  userCurrentCoor = {lat: 0, lon: 0};
  startCoorList = [];
  distance = 0;
  dur = 0;
  suggestionList = ['phuong', 'cong vien', 'bệnh viện', 'tower', 'park'];
  markerImg = marker;

  constructor(private translate: TranslateService, private router: Router, private render: Renderer2, private http: HttpClient, private cookieService: CookieService, private eventBus: EventBusService) {
  }

  ngOnInit() {
    this._getCurrentLocation();
    this._getAllPackage();
    this._getAllStation();
    this.leaveHomeTime = new Date(Date.now());
    this.leaveHomeTime.setMinutes(this.leaveHomeTime.getMinutes()+2);
    this.districtList = this.districtList.map(d => this._getTranslation(d));
  }

  private _getAllPackage() {
    this.http.get<any>('/api/get-all-package').subscribe(r => {
      this.packageList = r;
    });
  }
  private _getAllStation() {
    this.http.get<any>('/api/get-all-station').subscribe(r => {
      this.stationListInfo = r;
      this._getUserInfo();
      this.filterparkingStationList = this.parkingStationControl.valueChanges.pipe(
        startWith(''),
        map(value => this._filter(value, 3))
      );
      this.filterAllSearchList = this.allSearch.valueChanges.pipe(
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
    let u = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${startPoint.lon},${startPoint.lat};${endPoint.lon},${endPoint.lat}?overview=false&geometries=polyline&steps=true`;
    this.http.get<any>(u).subscribe(r => {
      this.distance = r.routes[0].distance;
      this.dur = r.routes[0].duration;
      let temp = new Date(this.leaveHomeTime);
      if (this.dur >= 3600) {
        temp.setHours(temp.getHours()+this.dur/3600, temp.getMinutes()+(this.dur%3600)/60);
        this.arriveTime = temp;
      } else {
        temp.setMinutes(temp.getMinutes()+this.dur/60, temp.getSeconds()+this.dur%60);
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
  private _searchStation() {
    const selectedStationId = this.stationListInfo.filter(s => s.stationAddress.indexOf(this.allSearch.value) > -1)[0]._id;
    this.http.post<any>('/api/get-all-slot', {stationId: selectedStationId}).subscribe(r => {
      console.log(r.result);
    });
  }
  private _suggestUserLocation(event) {
    if (this.suggestionList.filter(sug => event.indexOf(sug) > -1).length === 0) return;
    event = event.replace(/ /g, "%20");
    let u= `https://nominatim.openstreetmap.org/search?q=${event}&format=json&polygon=1&addressdetails=1`;
    this.http.get<any>(u).subscribe(r => {
      this.userLocation = [];
      this.startCoorList = [];
      r.forEach(lo => {
        if (lo.display_name.indexOf('Ho Chi Minh City') > -1 || lo.display_name.indexOf('Thành phố Hồ Chí Minh') > -1) {
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
      this._alwaysListenToChange();
      console.log(this.userInfo);
      this.userInfo.startTime = new Date(this.userInfo.startTime);
      this.userInfo.endTime = new Date(this.userInfo.endTime);
      this._setLang(this.userInfo.lang);
      this.selectedParkingStation = this.userInfo.status != 'none' ? this.stationListInfo.filter(s => s._id === this.userInfo.stationId)[0].stationAddress : '';
      this.endTime = this.userInfo.status != 'none' ? new Date(this.userInfo.endTime).toLocaleString('en-US') : '';
    });
  }
  private _alwaysListenToChange() {
    this.socket = io.connect('http://localhost:3000');
    this.socket.on('news', (news: any) => {
      if (this.userInfo.status !== 'none' || news.userId === this.userInfo.email || news.stationId !== this.stationListInfo.filter(s => s.stationAddress.indexOf(this.selectedParkingStation) > -1)[0]._id) {
        console.log('wrong condition');
        return;
      }
      console.log(news);
      let endTime = new Date(this.arriveTime);
      endTime.setHours(endTime.getHours() + this.selectedPackage.value);
      if (this.arriveTime > new Date(news.endTime) || endTime < new Date(news.startTime)) {
        this.isShowResult = true;
      } else {
        this.isShowResult = false;
        this.qrUrl = '';
        this._showPopup();
        this.isConflict = true;
      }
    });
    this.socket.on(`${this.userInfo.email.slice(0, this.userInfo.email.indexOf('@'))}-news`, (news: any) => {
      console.log(news);
      this.qrUrl = '';
      this.isShowResult = false;
      this.newsObj = news;
      if (this.newsObj.action === 'FINE') this._getCar();
      if (this.newsObj.action!=='CHECK_EXTENDING') this._showPopup();
      if (this.newsObj.action!=='CHECK_EXTENDING') this.selectedPackage = {name: '', cost: '', value: 0};
      if (this.userInfo.status.indexOf('staked') >= 0) this._getUserInfo();
    });
    this.socket.on(`${this.userInfo.email.slice(0, this.userInfo.email.indexOf('@'))}-user-status`, (json: any) => {
      console.log(json);
      this.userInfo.status = json.status;
      this.selectedPackage = {name: '', cost: '', value: 0};
      this.qrUrl = '';
      if (this.userInfo.status.indexOf('staked') >= 0) this._getUserInfo();
    });
    this.socket.on('refund', (json: any) => {
      console.log(json);
      const hash = json.hash;
      this._refund(hash);
    });
  }
  private _updateDistBetweenCurrentToDestination() {
    if (this.userInfo.stationId === 0) return;
    const endPoint = this.stationListInfo.filter(s => s._id === this.userInfo.stationId)[0];
    let u = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${this.userCurrentCoor.lon},${this.userCurrentCoor.lat};${endPoint.lon},${endPoint.lat}?overview=false&geometries=polyline&steps=true`;
    this.http.get<any>(u).subscribe(r => {
      this.isUserNearStation = r.routes[0].distance < 5;
      const currentTime = new Date(Date.now());
      this.isTimeCome = this.userInfo.startTime.getHours() - currentTime.getHours() === 0 && this.userInfo.startTime.getMinutes() - currentTime.getMinutes() <= 0;
    });
  }
  private _getCurrentLocation() {
    navigator.geolocation.getCurrentPosition(pos => {
      this.userCurrentCoor.lat = pos.coords.latitude;
      this.userCurrentCoor.lon = pos.coords.longitude;
      this._updateDistBetweenCurrentToDestination();
    });
  }
  private _checkLate() {
    var now = new Date(Date.now());
    var duration = parseInt(((now.getTime() - this.userInfo.endTime.getTime())/(1000*60)).toString(10)); // don vi phut
    if (duration > 5) {
      let date = Date.now().toString(10);
      const d = {
        partnerCode: 'MOMO',
        accessKey: 'F8BBA842ECF85',
        requestId: 'FINE' + date,
        amount: (duration*100).toString(10),
        orderId: 'FINE' + date,
        orderInfo: `Late ${duration} minutes`,
        returnUrl: this.domain,
        notifyUrl: this.domain + '/api/punish',
        requestType: 'captureMoMoWallet',
        extraData: `${this.userInfo.email}-${duration}`,
        signature: ''
      };
      var data = `partnerCode=${d.partnerCode}&accessKey=${d.accessKey}&requestId=${d.requestId}&amount=${d.amount}&orderId=${d.orderId}&orderInfo=${d.orderInfo}&returnUrl=${d.returnUrl}&notifyUrl=${d.notifyUrl}&extraData=${d.extraData}`;
      var secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
      var signature = CryptoJS.HmacSHA256(data, secretKey);
      d.signature = signature.toString();
      this.http.post<any>('https://test-payment.momo.vn/gw_payment/transactionProcessor', JSON.stringify(d)).subscribe(r => {
        console.log('PUNISH');
        console.log(r);
        this.isFine = true;
        const prefix = 'https://test-payment.momo.vn/gw_payment/qrcode/image/receipt?key=';
        this.qrUrl = r.qrCodeUrl ? prefix + r.qrCodeUrl.slice(42) : '';
      });
    } else {
      this._getCar();
    }
  }
  private _getCar() {
    this.isFine = false;
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
    };
    this.http.post<any>('/api/save-user-pressed', lastParams).subscribe(r => {
      if (r.result.indexOf('GET_CAR') >= 0) {
        this.newsObj.action = 'GET_CAR';
        this.newsObj.billCode = r.result.indexOf('GET_CAR_FAILED') >= 0 ? '-1' : '0';
        this._showPopup();
      }
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
      requestId: 'PARK' + date,
      amount: selectedP[0].cost,
      orderId: 'PARK' + date,
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
      console.log('PARK');
      console.log(r);
      const prefix = 'https://test-payment.momo.vn/gw_payment/qrcode/image/receipt?key=';
      this.qrUrl = r.qrCodeUrl ? prefix + r.qrCodeUrl.slice(42) : '';
    });
  }
  private _checkExtend() {
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
    this.http.post<any>('/api/check-slot-extendable', params).subscribe(r => {
      this.isShowResult = true;
      this.isAvailable = r.result.indexOf('CAN_EXTEND') > -1;
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
      requestId: 'EXTEND' + date,
      amount: (Number(this.selectedPackage.cost) * 2).toString(10),
      orderId: 'EXTEND' + date,
      orderInfo: this.selectedPackage.name,
      returnUrl: this.domain,
      notifyUrl: this.domain + '/api/extending',
      requestType: 'captureMoMoWallet',
      extraData: `${params.stationId}-${params.slotId}-${params.userName}-${params.package}-${params.endTime}`,
      signature: ''
    };
    var data = `partnerCode=${d.partnerCode}&accessKey=${d.accessKey}&requestId=${d.requestId}&amount=${d.amount}&orderId=${d.orderId}&orderInfo=${d.orderInfo}&returnUrl=${d.returnUrl}&notifyUrl=${d.notifyUrl}&extraData=${d.extraData}`;
    var secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    var signature = CryptoJS.HmacSHA256(data, secretKey);
    d.signature = signature.toString();
    this.http.post<any>('https://test-payment.momo.vn/gw_payment/transactionProcessor', JSON.stringify(d)).subscribe(r => {
      console.log('EXTEND');
      console.log(r);
      const prefix = 'https://test-payment.momo.vn/gw_payment/qrcode/image/receipt?key=';
      this.qrUrl = r.qrCodeUrl ? prefix + r.qrCodeUrl.slice(42) : '';
    });
  }
  private _refund(hash: string) {
    let date = Date.now().toString(10);
    const d = {
      partnerCode: 'MOMO',
      requestId: 'REFUND'+ date,
      hash: hash,
      version: 2
    };
    this.http.post('https://test-payment.momo.vn/pay/refund', JSON.stringify(d)).subscribe(r => {
      console.log('REFUND');
      console.log(r);
    });
  }
  private filter() {
    this.toggleFilter();
    this.isTimeValid = this.leaveHomeTime > new Date(Date.now());
    this.selectedParkingStation = this.parkingStationControl.value;
    const index = this.stationListInfo.filter(s => s.stationAddress.indexOf(this.selectedParkingStation) > -1)[0]._id;
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
    // readyParkTime la endTime. Do da co bien endTime roi :(( KO HIEU LAM
    let readyParkTime = new Date(this.arriveTime);
    readyParkTime.setHours(this.arriveTime.getHours() + this.selectedPackage.value);
    const index = this.stationListInfo.filter(s => s.stationAddress.indexOf(this.selectedParkingStation) > -1)[0]._id;
    const d = {
      partnerCode: 'MOMO',
      accessKey: 'F8BBA842ECF85',
      requestId: 'BOOK' + date,
      amount: this.selectedPackage.cost,
      orderId: 'BOOK' + date,
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
      console.log('BOOK');
      console.log(r);
      const prefix = 'https://test-payment.momo.vn/gw_payment/qrcode/image/receipt?key=';
      this.qrUrl = r.qrCodeUrl ? prefix + r.qrCodeUrl.slice(42) : '';
    });
  }
  private _cancel() {
    const params = {
      stationId: this.userInfo.stationId,
      slotId: this.userInfo.slotId,
      userName: this.userInfo.email
    }
    this.http.post<any>('/api/canceling', params).subscribe(r => {
      console.log('CANCEL');
      this.newsObj.action = 'CANCEL';
      this.newsObj.billCode = r.result.indexOf('FAILED') >= 0 ? '-1' : '0';
      this._showPopup();
    });
  }
  private _showPopup() {
    this.notiStatus = 'show';
    this.timer = setTimeout(() => {
      this.notiStatus = 'hide';
    }, 4000);
  }
  private _closePopup() {
    clearTimeout(this.timer);
    this.notiStatus = 'hide';
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
    this.isConflict = false; // Reset lai bien nay khi user mo filter lai. Vi luc nay user chac chan se chon gio khac, neu chon gio cu, thi HT se bao ve la het cho.
  }
  display(stt: string) {
    // this.render.setStyle(document.body.getElementsByClassName('indicator'), 'transform', 'rotate(180deg)');
    this.state = this.state === 'down' ? 'up' : 'down';
  }
  private _setLang(lang: string) {
    this.translate.setDefaultLang(lang);
  }
  navTo(opt: string) {
    if (opt.indexOf('LANGUAGE') >= 0) return;
    if (opt.indexOf('LOG_OUT') >= 0) {
      this.cookieService.delete('token', '/', 'localhost');
      this.router.navigate(['/']);
    }
    if (opt.indexOf('PAYMENT_LOG') >= 0) {
      this.http.post<any>('/api/get-log', {userName: this.userInfo.email}).subscribe(r => {
        console.log(r.result);
      });
    }
  }
  ngOnDestroy() {
    if (this.timer) clearTimeout(this.timer);
  }
}
