import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  imports: [RouterModule, CommonModule, FormsModule, HttpClientModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected title = 'Fullstack App - RabbitMQ Test';
  message = '';
  messages: any[] = [];
  queueInfo: any = {};
  loading = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadQueueInfo();
  }

  async sendMessage() {
    if (!this.message.trim()) return;
    
    this.loading = true;
    try {
      const response = await this.http.post('/api/messages', { 
        message: this.message 
      }).toPromise();
      
      console.log('Message sent:', response);
      this.message = '';
      this.loadQueueInfo();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadQueueInfo() {
    try {
      this.queueInfo = await this.http.get('/api/messages/queue-info').toPromise();
    } catch (error) {
      console.error('Error loading queue info:', error);
    }
  }
}
