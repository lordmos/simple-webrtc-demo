import { Component } from '@angular/core';
import { SocketService } from '../../services/socket.service';
import { SocketMessageType } from '../../services/socketMessageType.enum';
import * as SimplePeer from 'simple-peer';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	title = 'to Simple WebRTC Demo';
	me: any;
	userList: Array<any>;
	myVideo: any;
	otherVideo: any;
	name: string;
	localStream: any;

	peer: any;
	myPeerId: string;

	constructor(private socketService: SocketService) {
		this.userList = [];
		this.myVideo = undefined;
		this.otherVideo = undefined;
		this.peer = undefined;
		this.myPeerId = "";
		// A->source B->target
		// A offering B
		// B confirm A with a stream
		// A calling B with a stream
		// DONE	
		this.socketService.connect()
			.subscribe((event) => {
				console.log(event)
				switch (event.type) {
					case SocketMessageType.USERLIST:
						this.userList = event.message;
						break;
					case SocketMessageType.ONLINE:
						this.userList.push(event.message);
						break;
					case SocketMessageType.OFFLINE:
						break;
					case SocketMessageType.OFFERING:
						this.onOffering(event.message);
						break;
					case SocketMessageType.CALLING:
						this.onConnecting(event.message);
						break;
					case SocketMessageType.CANCEL:
						this.onCancel(event.message);
						break;
					case SocketMessageType.CONFIRM:
						this.onConfirm(event.message);
						break;
					default:
						return;
				}
			});

	}

	ngOnInit() {
		this.myVideo = document.getElementById("meVideo");
		this.otherVideo = document.getElementById("targetVideo");
		navigator.mediaDevices.getUserMedia({
			audio: true,
			video: true
		}).then((stream) => {
			this.myVideo.srcObject = stream;
			console.log(stream)
			this.localStream = stream;
		}).catch(function (e) {
			alert('getUserMedia() error: ' + e.name);
		});
	}
	// init offer peer when confirm
	initOfferPeer(message: any) {
		this.peer = new SimplePeer({
			initiator: true,
			stream: this.localStream
		});

		this.peer.on('signal', (data) => {
			if (!this.myPeerId) {
				this.myPeerId = JSON.stringify(data);
				message.target["peerId"] = JSON.stringify(data);
				// ATTENTION !!!
				// BLACK MAGIC : IF DELETE THIS TIMEOUT , P2P CONNECTION WILL NOT BE CONSTRUCT SUCCESSFUL
				setTimeout(() => {
					this.socketService.send(SocketMessageType.CONFIRM, message);
				}, 500);
				// MUST NOT DELETE !!!
			}
		});

		this.peer.on('connect', () => {
			console.log("source signal connected")
			this.peer.send("hi")
		})

		this.peer.on('stream', (stream) => {
			this.otherVideo.src = window.URL.createObjectURL(stream)
			this.otherVideo.play()
			console.log("source stream connected")
		})

		this.peer.on('data', (data) => {
			console.log("data")
		});

		this.peer.on('error', (err) => {
			console.log(err)
			this.hangup();
		});

		this.peer.on('close', () => {
			this.hangup();
		});
	}

	// init receive peer when calling
	initReceivePeer(message: any) {
		this.peer = new SimplePeer({
			initiator: false,
			stream: this.localStream
		});

		this.peer.on('signal', (data) => {
			if (!this.myPeerId) {
				this.myPeerId = JSON.stringify(data);
				message.source["peerId"] = this.myPeerId;
				this.socketService.send(SocketMessageType.CALLING, message);
			}
		});

		this.peer.on('connect', () => {
			console.log("target signal connected")
			this.peer.send("hi")
		})

		this.peer.on('stream', (stream) => {
			console.log(stream)
			// this.otherVideo.srcObject = stream;

			this.otherVideo.src = window.URL.createObjectURL(stream)
			this.otherVideo.play()
			console.log("target stream connected")
		})

		this.peer.on('data', (data) => {
			console.log("data")
		});

		this.peer.on('error', (err) => {
			console.log(err)
			this.hangup();
		});

		this.peer.on('close', () => {
			this.hangup();
		});

		this.peer.signal(message.target["peerId"]);
	}

	connect(name: string) {
		if (!name) return;
		this.me = {
			name: name,
			token: new Date().getTime()
		};
		this.socketService.send(SocketMessageType.ONLINE, this.me);
		this.title = this.me.name;
	}

	call(target: any) {
		this.socketService.send(SocketMessageType.OFFERING, {
			target: target,
			source: this.me
		})
	}

	onOffering(message: any) {
		var result = confirm(message.source.name + '正在呼叫');
		if (result) {
			this.initOfferPeer(message);
		} else {
			this.socketService.send(SocketMessageType.CANCEL, message);
		}
		console.log("on offering")
	}

	// call target with a stream
	onConfirm(message: any) {
		this.initReceivePeer(message);
		console.log("on confirm")
	}


	// get source stream
	onConnecting(message: any) {
		this.peer.signal(message.source["peerId"]);
		console.log("on connecting")
	}

	onCancel(message: any) {
		alert("对方已挂断");
		this.hangup();
		this.socketService.send(SocketMessageType.CANCEL, message)
		// TODO cancel connection
	}

	hangup() {
		this.myPeerId = "";
		this.peer.destroy();
	}


}
