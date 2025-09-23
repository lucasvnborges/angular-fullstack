export interface NotificationMessage {
  mensagemId: string;
  conteudoMensagem: string;
  timestamp: string;
}

export interface StatusUpdate {
  mensagemId: string;
  status: NotificationStatus;
  timestamp: string;
}

export interface NotificationResponse {
  mensagemId: string;
  status: NotificationStatus;
  message: string;
}

export interface StatusResponse {
  mensagemId: string;
  status: NotificationStatus | 'NOT_FOUND';
}

export type NotificationStatus = 
  | 'AGUARDANDO_PROCESSAMENTO'
  | 'PROCESSADO_SUCESSO' 
  | 'FALHA_PROCESSAMENTO';

export interface NotificationRequest {
  mensagemId: string;
  conteudoMensagem: string;
}
