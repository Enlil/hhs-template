import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExampleQueryDto } from './dto/example-query.dto';
import { ExampleService, type ExampleResponse } from './example.service';

@ApiTags('example')
@Controller('example')
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  @Get()
  getExample(@Query() query: ExampleQueryDto): ExampleResponse {
    return this.exampleService.getExample(query.name);
  }
}
