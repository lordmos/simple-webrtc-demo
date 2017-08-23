import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../services/socket.service';

import { AppComponent } from './pages/app/app.component';


@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		FormsModule,
		BrowserModule
	],
	providers: [SocketService],
	bootstrap: [AppComponent]
})
export class AppModule { }
