import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConsumerService } from '../kafka/consumer/consumer.service';

@Injectable()
export class InterviewSessionCreateConsumer implements OnModuleInit {
  constructor(private readonly _consumer: ConsumerService) {}
  async onModuleInit() {
    await this._consumer.consumer(
      'interview-session-create-client',
      { topics: ['new-interview-session'] },
      {
        eachMessage: async ({ topic, partition, message }) => {
          console.log({
            topic,
            partition,
            message: message.value.toString(),
          });
        },
      },
    );
  }
}
