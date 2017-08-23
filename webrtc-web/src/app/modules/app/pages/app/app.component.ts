import { Component } from '@angular/core';
import { SocketService } from '../../../../services/socket.service';
import { SocketMessageType } from '../../../../services/socketMessageType.enum';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	title = 'to Simple WebRTC Demo';
	me: any;

	userList: Array<any>;

	constructor(private socketService: SocketService) {
		this.userList = [];
		this.socketService.connect()
			.subscribe((event) => {
				console.log(event)
				switch (event.type) {
					case SocketMessageType.USERLIST:
						this.userList = event.message;
						break;
					case SocketMessageType.ONLINE:
						this.userList.push(event.message);
						// TODO
						break;
					case SocketMessageType.OFFLINE:
						break;
					case SocketMessageType.OFFERING:
						break;
					case SocketMessageType.CALLING:
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
		this.title = this.me.name;
	}

}
