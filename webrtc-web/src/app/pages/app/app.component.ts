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
	otherPeer: any;

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
		this.initPeer();
	}

	initPeer() {
		navigator.mediaDevices.getUserMedia({
			audio: true,
			video: true
		}).then((stream) => {
			this.myVideo.srcObject = stream;
			this.localStream = stream;
			this.peer = new SimplePeer({
				initiator: true,
				trickle: false,
				reconnectTimer: 60000,
				stream: stream
			});

			this.peer.on('signal', (data) => {
				this.myPeerId = JSON.stringify(data);
				// this.peer.stream(data)
			});

			this.peer.on('stream', (stream) => {
				this.otherVideo.src = window.URL.createObjectURL(stream);
				// this.otherVideo.play();
				console.log(stream)
				// this.otherVideo.srcObject = stream;
			});

			this.peer.on('data', (data) => {
				console.log(data)
			})
		}).catch(function (e) {
			alert('getUserMedia() error: ' + e.name);
		});
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
			// TODO confirm with a stream
			message.target["stream"] = this.myPeerId;
			this.socketService.send(SocketMessageType.CONFIRM, message);
		} else {
			this.socketService.send(SocketMessageType.CANCEL, message);
		}
		console.log("on offering")
	}

	// call target with a stream
	onConfirm(message: any) {
		message.source["stream"] = this.myPeerId;
		this.socketService.send(SocketMessageType.CALLING, message);
		// TODO get target stream and play
		this.peer.signal(message.target["stream"]);
		console.log("on confirm")
	}


	// get source stream
	onConnecting(message: any) {
		// TODO get source stream and play
		this.peer.signal(message.source["stream"]);
		console.log("on connecting")
	}

	onCancel(message: any) {
		alert("对方已挂断");
		this.peer.destroy();
		this.initPeer();
		// this.socketService.send(SocketMessageType.cancel, message)
		// TODO cancel connection
	}


}
