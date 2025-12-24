import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { EarningsService } from './earnings.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('earnings')
export class EarningsController {
  constructor(private service: EarningsService) {}
  @UseGuards(AuthGuard)
  @Post()
  create(@Body() body) {
    return this.service.create(body);
  }
  @UseGuards(AuthGuard)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @UseGuards(AuthGuard)
  @Get('export/excel')
  async exportExcel(@Res() res: Response) {
    const buffer = await this.service.exportToExcel();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=earnings.xlsx',
    );

    res.send(buffer);
  }
  @UseGuards(AuthGuard, RolesGuard)
  @Put(':id')
  update(@Param('id') id, @Body() body) {
    return this.service.update(+id, body);
  }
  @UseGuards(AuthGuard, RolesGuard)
  @Delete(':id')
  remove(@Param('id') id) {
    return this.service.delete(+id);
  }
  @UseGuards(AuthGuard)
  @Get('stock/:name')
  findByStock(@Param('name') name: string) {
    return this.service.findByStockName(name);
  }

}
