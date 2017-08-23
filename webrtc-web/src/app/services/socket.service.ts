import { Injectable } from '@angular/core';
import { Subject, Observable, Observer } from 'rxjs';
import * as SocketIO from 'socket.io-client';

import { SocketMessageType } from './socketMessageType.enum';

@Injectable()
export class SocketService {

	private socket: any;
	private socketSubject: Subject<any>;

	constructor() {
		this.socket = undefined;
		this.socketSubject = new Subject<any>();
	}

	connect(): Observable<any> {
		if (!this.socket) {
			this.socket = SocketIO('http://localhost:3000');
		}
		this.socket.on(SocketMessageType[SocketMessageType.USERLIST], (msg) => this.subcribe(SocketMessageType.USERLIST, msg))
		this.socket.on(SocketMessageType[SocketMessageType.ONLINE], (msg) => this.subcribe(SocketMessageType.ONLINE, msg))
		this.socket.on(SocketMessageType[SocketMessageType.OFFLINE], (msg) => this.subcribe(SocketMessageType.OFFLINE, msg))
		this.socket.on(SocketMessageType[SocketMessageType.OFFERING], (msg) => this.subcribe(SocketMessageType.OFFERING, msg))
		this.socket.on(SocketMessageType[SocketMessageType.CALLING], (msg) => this.subcribe(SocketMessageType.CALLING, msg))
		return this.socketSubject;
	}

	send(messageType: SocketMessageType, message: any): void {
		if (this.socket) {
			this.socket.emit(SocketMessageType[messageType], message);
		}
	}

	subcribe(messageType: SocketMessageType, message: any): void {
		this.socketSubject.next({
			type: messageType,
			message: message
		});
	}

	call(target: any) {
		// TODO
	}

}
