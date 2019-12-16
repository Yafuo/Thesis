import {EventEmitter, Injectable} from '@angular/core';
import {Subject} from "rxjs";

@Injectable()
export class EventBusService {

  private events: Map<String, EventEmitter<any>> = new Map<String, EventEmitter<any>>();

  constructor() {
  }

  pushChange<T>(name: string, value: T): void {
    if (!this.events.has(name)) {
      this.events.set(name, new EventEmitter<T>());
    }
    this.events.get(name).next(value);
  }

  listenChange<T>(name: string): Subject<T> {
    if (!this.events.has(name)) {
      this.events.set(name, new EventEmitter<T>());
    }
    return this.events.get(name);
  }
}
