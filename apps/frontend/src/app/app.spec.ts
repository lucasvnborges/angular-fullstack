import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title using signal', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Sistema de Notificações - RabbitMQ'
    );
    expect(component.title()).toBe('Sistema de Notificações - RabbitMQ');
  });

  it('should have notification input field with proper attributes', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('input[type="text"]');
    
    expect(input).toBeTruthy();
    expect(input?.getAttribute('placeholder')).toContain('Digite o conteúdo da notificação');
    expect(input?.getAttribute('aria-label')).toBe('Conteúdo da notificação');
    expect(input?.getAttribute('autocomplete')).toBe('off');
  });

  it('should have send notification button with proper accessibility', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button');
    
    expect(button).toBeTruthy();
    expect(button?.textContent?.trim()).toContain('Enviar Notificação');
    expect(button?.getAttribute('aria-label')).toBe('Enviar notificação');
  });

  it('should update message signal when input changes', () => {
    fixture.detectChanges();
    const testMessage = 'Test notification message';
    
    component.onMessageInput(testMessage);
    expect(component.message()).toBe(testMessage);
  });

  it('should disable button when loading', () => {
    component.loading.set(true);
    fixture.detectChanges();
    
    const button = fixture.nativeElement.querySelector('button');
    expect(button?.disabled).toBeTruthy();
    expect(button?.textContent).toContain('Enviando...');
  });

  it('should disable button when message is empty', () => {
    component.message.set('');
    fixture.detectChanges();
    
    const button = fixture.nativeElement.querySelector('button');
    expect(button?.disabled).toBeTruthy();
  });

  it('should show no notifications message when list is empty', () => {
    fixture.detectChanges();
    
    const noNotifications = fixture.nativeElement.querySelector('.no-notifications');
    expect(noNotifications).toBeTruthy();
    expect(noNotifications?.textContent).toContain('Nenhuma notificação enviada ainda');
  });

  it('should show notification count when notifications exist', () => {
    const mockNotification = {
      mensagemId: 'test-id',
      conteudoMensagem: 'Test message',
      status: 'AGUARDANDO_PROCESSAMENTO' as const,
      timestamp: new Date(),
      isProcessing: true
    };

    component.notifications.set([mockNotification]);
    fixture.detectChanges();
    
    const notificationCount = fixture.nativeElement.querySelector('.notification-count');
    expect(notificationCount).toBeTruthy();
    expect(notificationCount?.textContent).toContain('1 notificação');
  });

  it('should handle Enter key press', () => {
    jest.spyOn(component, 'sendNotification');
    component.message.set('Test message');
    
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    component.onKeydown(event);
    
    expect(component.sendNotification).toHaveBeenCalled();
  });

  it('should not handle Enter key with Shift', () => {
    jest.spyOn(component, 'sendNotification');
    
    const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
    component.onKeydown(event);
    
    expect(component.sendNotification).not.toHaveBeenCalled();
  });

  it('should track notifications by message ID', () => {
    const mockNotification = {
      mensagemId: 'test-id-123',
      conteudoMensagem: 'Test message',
      status: 'PROCESSADO_SUCESSO' as const,
      timestamp: new Date(),
      isProcessing: false
    };

    const result = component.trackByMessageId(0, mockNotification);
    expect(result).toBe('test-id-123');
  });

  it('should return correct status colors', () => {
    expect(component.getStatusColor('AGUARDANDO_PROCESSAMENTO')).toBe('#ffc107');
    expect(component.getStatusColor('PROCESSADO_SUCESSO')).toBe('#28a745');
    expect(component.getStatusColor('FALHA_PROCESSAMENTO')).toBe('#dc3545');
    expect(component.getStatusColor('NOT_FOUND')).toBe('#6c757d');
  });

  it('should return correct status texts', () => {
    expect(component.getStatusText('AGUARDANDO_PROCESSAMENTO')).toBe('Aguardando Processamento');
    expect(component.getStatusText('PROCESSADO_SUCESSO')).toBe('Processado com Sucesso');
    expect(component.getStatusText('FALHA_PROCESSAMENTO')).toBe('Falha no Processamento');
    expect(component.getStatusText('NOT_FOUND')).toBe('Não Encontrado');
  });

  it('should have computed signals working correctly', () => {
    expect(component.hasNotifications()).toBeFalsy();
    expect(component.pendingNotifications()).toEqual([]);

    const mockNotifications = [
      {
        mensagemId: 'test-1',
        conteudoMensagem: 'Test 1',
        status: 'AGUARDANDO_PROCESSAMENTO' as const,
        timestamp: new Date(),
        isProcessing: true
      },
      {
        mensagemId: 'test-2',
        conteudoMensagem: 'Test 2',
        status: 'PROCESSADO_SUCESSO' as const,
        timestamp: new Date(),
        isProcessing: false
      }
    ];

    component.notifications.set(mockNotifications);
    
    expect(component.hasNotifications()).toBeTruthy();
    expect(component.pendingNotifications()).toHaveLength(1);
    expect(component.pendingNotifications()[0].mensagemId).toBe('test-1');
  });
});
