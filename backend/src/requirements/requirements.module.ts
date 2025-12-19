import { Module } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

import { RequirementsResolver } from './requirements.resolver';
import { RequirementsService } from './requirements.service';

@Module({
  providers: [RequirementsResolver, RequirementsService, PrismaService],
  exports: [RequirementsService],
})
export class RequirementsModule {}
