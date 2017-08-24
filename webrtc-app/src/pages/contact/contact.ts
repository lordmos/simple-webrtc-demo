import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { SocketService } from '../../services/socket.service';
import { SocketMessageType } from '../../services/socketMessageType.enum';
import { HomePage } from '../home/home';

@Component({
	selector: 'page-contact',
	templateUrl: 'contact.html'
})
export class ContactPage {
	me: any;
	userList: Array<any>;

	constructor(public navCtrl: NavController,
		private alertCtrl: AlertController,
		private socketService: SocketService) {
		this.userList = [];
		this.socketService.connect()
			.subscribe((event) => {
				// console.log(event)
				switch (event.type) {
					case SocketMessageType.USERLIST:
						this.userList = event.message;
						break;
					case SocketMessageType.ONLINE:
						this.userList.push(event.message);
						break;
					case SocketMessageType.OFFERING:
						this.onOffering(event.message);
						break;
					default:
						return;
				}
			});

	}

	connect(name: string) {
		if (!name) return;
		this.me = {
			name: name,
			token: new Date().getTime()
		};
		this.socketService.send(SocketMessageType.ONLINE, this.me);
	}

	onOffering(message: any) {
		this.alertCtrl.create({
			title: message.source.name + '正在呼叫',
			message: '是否接听?',
			buttons: [{
				text: '拒绝',
				role: 'cancel',
				handler: () => {
					this.socketService.send(SocketMessageType.CANCEL, message);
				}
			}, {
				text: '接听',
				handler: () => {
					this.navCtrl.push(HomePage, {
						type: SocketMessageType.CONFIRM,
						message: message
					});
				}
			}]
		}).present();
	}


	call(target: any) {
		if (target.token == this.me.token) return;
		this.navCtrl.push(HomePage, {
			type: SocketMessageType.OFFERING,
			message: {
				target: target,
				source: this.me
			}
		});
	}
}
