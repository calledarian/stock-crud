import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
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

  /* =======================
     EXPORT (MUST BE ABOVE :id)
  ======================= */
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

  @Put(':id')
  update(@Param('id') id, @Body() body) {
    return this.service.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id) {
    return this.service.delete(+id);
  }
}
