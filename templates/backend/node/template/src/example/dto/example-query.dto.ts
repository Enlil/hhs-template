import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ExampleQueryDto {
  @ApiPropertyOptional({ description: 'Optional name to personalize the message.', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;
}
