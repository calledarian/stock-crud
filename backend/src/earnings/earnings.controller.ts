import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { EarningsService } from './earnings.service';

@Controller('earnings')
export class EarningsController {
  constructor(private service: EarningsService) {}

  @Post()
  create(@Body() body) {
    return this.service.create(body);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Put(':id')
  update(@Param('id') id, @Body() body) {
    return this.service.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id) {
    return this.service.delete(+id);
  }
}
