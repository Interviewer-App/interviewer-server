import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class InterviewSessionGateway implements OnGatewayConnection,OnGatewayDisconnect{
  @WebSocketServer() server: Server;

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected:${client.id}`);
    this.server.emit('user-joined', {message:'user join the interview session'})
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected:${client.id}`);
    this.server.emit('user-left', {message:'user left the interview session'})
  }

  // notify<T>(event: string, data: T): void {
  //   this.server.emit(event, data);
  // }

  @SubscribeMessage('joinSession')
  handleJoinSession(@MessageBody() message: string) {
    // return `Joined session ${sessionId}`;
    this.server.emit('message', message)
  }

  notifySessionUpdate(sessionId: string, updateData: any) {
    this.server.to(sessionId).emit('sessionUpdate', updateData);
  }
}