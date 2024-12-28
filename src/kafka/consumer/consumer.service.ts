import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { Consumer, ConsumerRunConfig, ConsumerSubscribeTopics, Kafka } from 'kafkajs';

@Injectable()
export class ConsumerService implements OnApplicationShutdown{
  async onApplicationShutdown(signal?: string) {
    for(const consumer of this.consumers){
      await  consumer.disconnect();
    }
  }


  private readonly kafka = new Kafka({
    brokers: ['localhost:9092'],
  });

  private readonly consumers: Consumer[] = [];

  async consumer(
    groupId: string,
    topic: ConsumerSubscribeTopics,
    config: ConsumerRunConfig,
  ) {
    const consumer: Consumer = this.kafka.consumer({ groupId: groupId });
    await consumer.connect().catch((e) => console.log(e));
    await consumer.subscribe(topic);
    await consumer.run(config);
    this.consumers.push(consumer);
  }

}
