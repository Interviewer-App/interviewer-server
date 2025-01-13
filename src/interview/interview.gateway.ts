import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody, ConnectedSocket
} from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class InterviewGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;


  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('publishInterview')
  async handlePublishInterviews(
    @MessageBody() data: { interviewId: string, companyId: string },
    @ConnectedSocket() client: Socket
  ) {

    console.log(`Received publishInterview event from client ${client.id} with data:`, data);

    client.broadcast.emit('published', data);

  }
}