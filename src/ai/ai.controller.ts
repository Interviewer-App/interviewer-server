import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';


@ApiBearerAuth()
@ApiTags('AI')
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) {}
    
}
