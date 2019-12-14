import {Component, OnInit, Renderer2, ViewEncapsulation} from '@angular/core';
import {faChevronDown, faSearch, faCheckCircle} from "@fortawesome/free-solid-svg-icons";
import {TranslateService} from "@ngx-translate/core";
import {FormControl} from "@angular/forms";
import {Observable} from "rxjs";
import {map, startWith} from "rxjs/operators";
import * as CryptoJS from "crypto-js";
import {HttpClient} from "@angular/common/http";
import * as io from 'socket.io-client';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class HomeComponent implements OnInit {

  faChevronDown = faChevronDown;
  faSearch = faSearch;
  faCheckCircle = faCheckCircle;
  districtList = ['Tan Phu', 'Tan Binh', 'Phu Nhuan', 'Binh Thanh'];
  parkingStationList = ['10 Ho Dac Di, P.Tay Thanh, Q.Tan Phu', '22/44 CMT8, P.2, Q.Tan Binh',
    '49a Phan Dang Luu, P.7, Q.Phu Nhuan', '96 Le Quang Dinh, P.14, Q.Binh Thanh'];
  userLocation = ['60/22 Dong Den, P.14, Q.Tan Binh', '199 Truong Dinh, P.5, Q.3',
    '70 Hoang Van Thu, P.10, Q.Phu Nhuan', '67 Ly Thuong Kiet, P.3, Q.Tan Binh'];
  selectedParkingStation = 'not_choose';
  selectedUserLocation = 'not_choose';
  userLocationControl = new FormControl();
  parkingStationControl = new FormControl();
  allSearch = new FormControl();
  filterAllSearchList: Observable<string[]>;
  filterUserLocationList: Observable<string[]>;
  filterparkingStationList: Observable<string[]>;
  isFilterClicked = false;
  packageList = [{name: '1 hour', cost: '5000', value: 1}, {name: '3 hour', cost: '20000', value: 3}, {name: '1 day', cost: '50000', value: 24}];
  selectedPackage = {name: '', cost: '', value: 0};
  height = '';
  state = 'down';
  arriveTime = new Date(Date.now());
  leaveHomeTime = new Date(Date.now());
  isShowResult = false;
  isCurrentLocationChecked = false;
  qrUrl= '';
  isStake = false;
  socket: SocketIOClient.Socket;

  constructor(private translate: TranslateService, private render: Renderer2, private http: HttpClient) {
    this._alwaysListenToChange();
  }

  ngOnInit() {
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

  private _alwaysListenToChange() {
    this.socket = io.connect('http://localhost:3000');
    this.socket.on('news', (news: any) => {
      this.qrUrl = '';
      this.isStake = true;
    });
  }

  filter() {
    this.toggleFilter();
    this.isShowResult = true;
    this.selectedParkingStation = this.parkingStationControl.value;
    console.log(this.selectedParkingStation);
    const index = this.parkingStationList.indexOf(this.selectedParkingStation);
    this.selectedUserLocation = this.isCurrentLocationChecked ? '14 Tran Van On, P.Tay Thanh, Q.Tan Phu' : this.userLocationControl.value;
    console.log(this.selectedUserLocation);
    const params = {
      stationId: index,
      stationAddress: this.selectedParkingStation,
      package: this.selectedPackage,
      startTime: this.arriveTime,
      endTime: this.arriveTime.setHours(this.arriveTime.getHours() + this.selectedPackage.value)
    };
  }

  private _book() {
    let date = Date.now().toString(10);
    const d = {
      partnerCode: 'MOMO',
      accessKey: 'F8BBA842ECF85',
      requestId: 'UIT' + date,
      amount: this.selectedPackage.cost,
      orderId: 'UIT' + date,
      orderInfo: this.selectedPackage.name,
      returnUrl: 'http://24ebfd58.ngrok.io',
      notifyUrl: 'http://24ebfd58.ngrok.io/api/receive-notify',
      requestType: 'captureMoMoWallet',
      extraData: 'from uit.smartparking@gmail.com',
      signature: ''
    }
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
    if (opt === 1) { return this.districtList.filter(d => d.toLowerCase().indexOf(filterValue) > -1); }
    else if (opt === 2) { return this.userLocation.filter(d => d.toLowerCase().indexOf(filterValue) > -1); }
    else { return this.parkingStationList.filter(d => d.toLowerCase().indexOf(filterValue) > -1);}
  }

  private _getTranslation(value: string): string {
    let wordTranslated = 'not_ready';
    this.translate.get(`DISTRICT.${value}`).subscribe(word => {
      wordTranslated = word;
    });
    return wordTranslated;
  }

  private _checkValidTime(): boolean {
    console.log('Ten ten')
    if (this.arriveTime < this.leaveHomeTime) {
      return true;
    }
    return false;
  }

  toggleFilter() {
    this.isFilterClicked = !this.isFilterClicked;
  }

  display(stt: string) {
    // this.render.setStyle(document.body.getElementsByClassName('indicator'), 'transform', 'rotate(180deg)');
    this.state = this.state === 'down' ? 'up' : 'down';
  }

}
