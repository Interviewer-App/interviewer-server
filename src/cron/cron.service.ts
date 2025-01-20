import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';  // Adjust import path as per your project structure
import * as cron from 'node-cron';

@Injectable()
export class CronService {
  constructor(private readonly prisma: PrismaService) {
    this.scheduleInterviewStatusUpdate();
  }

  scheduleInterviewStatusUpdate() {
    cron.schedule('* * * * *', async () => {
      console.log('Running job to update interview statuses...');
      const now = new Date();

      await this.prisma.interview.updateMany({
        where: {
          endDate: {
            lte: new Date(now.getTime() - 15 * 60 * 1000),
          },
          status: {
            equals: 'ACTIVE',
          },
        },
        data: {
          status: 'ARCHIVED',
        },
      });
      console.log('Interview statuses updated successfully.');
    });
  }
}
