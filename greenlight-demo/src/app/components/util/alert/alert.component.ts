import { Component, OnInit } from '@angular/core';
import { Alert, AlertType } from 'src/app/models/alert';
import { AlertService } from 'src/app/services/alert.service';

@Component({
  selector: 'alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss']
})
export class AlertComponent implements OnInit {
  alerts: Alert[] = [];

  constructor(private alertService: AlertService) {}

  ngOnInit() {
    this.alertService.getAlert().subscribe((alert: Alert) => {
      if (!alert) {
        // clear alerts when an empty alert is received
        this.alerts = [];
        return;
      }

      // add alert to array
      this.alerts.push(alert);
    });
  }

  close(alert: Alert) {
    this.alerts = this.alerts.filter(x => x !== alert);
  }
}
