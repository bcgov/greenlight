export class Alert {
  type: AlertType;
  message: string;
}

export enum AlertType {
  Success = 'success',
  Error = 'danger',
  Info = 'info',
  Warning = 'warning'
}
