import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { SocketService } from '../../services/socket.service';
import { SocketMessageType } from '../../services/socketMessageType.enum';
import * as SimplePeer from 'simple-peer';

@Component({
	selector: 'page-home',
	templateUrl: 'home.html'
})
export class HomePage {

	myVideo: any;
	otherVideo: any;
	localStream: any;

	peer: any;
	myPeerId: string;
	title: string;

	type: any;
	message: any;

	enterConnnection = false;
	enterConfirm = false;


	constructor(public navCtrl: NavController,
		private navParams: NavParams,
		private socketService: SocketService) {
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
				console.log(JSON.stringify(event))
				switch (event.type) {
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

		this.type = navParams.get('type');
		this.message = navParams.get('message');

	}

	ngOnInit() {
		this.myVideo = document.getElementById("meVideo");
		this.otherVideo = document.getElementById("targetVideo");
		// work on not main thread
		navigator.mediaDevices.getUserMedia({
			audio: true,
			video: true
		}).then((stream) => {
			this.myVideo.src = window.URL.createObjectURL(stream)
			console.log(stream)
			this.localStream = stream;


			if (this.type == SocketMessageType.OFFERING) {
				this.call(this.message);
				this.title = "正在呼叫" + this.message.target.name;
			}
			if (this.type == SocketMessageType.CONFIRM) {
				this.onOffering(this.message);
				this.title = "正在接通" + this.message.source.name;
			}

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
				console.log(this.myPeerId)
				// ATTENTION !!!
				// BLACK MAGIC : IF DELETE THIS TIMEOUT , P2P CONNECTION WILL NOT BE CONSTRUCT SUCCESSFUL
				setTimeout(() => {
					console.log("send CONFIRM")
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
				console.log(this.myPeerId)
				message.source["peerId"] = this.myPeerId;
				console.log("send CALLING")
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

	call(message: any) {
		this.socketService.send(SocketMessageType.OFFERING, message);
	}

	onOffering(message: any) {
		this.initOfferPeer(message);
		console.log("on offering")
	}

	// call target with a stream
	onConfirm(message: any) {
		if (this.enterConfirm) return;
		this.enterConfirm = true;
		this.initReceivePeer(message);
		console.log("on confirm")
	}


	// get source stream
	onConnecting(message: any) {
		if (this.enterConnnection) return;
		this.enterConnnection = true;
		this.peer.signal(message.source["peerId"]);
		console.log("on connecting")
	}

	onCancel(message: any) {
		alert("对方已挂断");
		this.socketService.send(SocketMessageType.CANCEL, message)
		this.hangup();
		// TODO cancel connection
	}

	hangup() {
		this.myPeerId = "";
		this.peer.destroy();
		this.enterConfirm = false;
		this.enterConnnection = false;
		// this.navCtrl.pop();
	}

}
