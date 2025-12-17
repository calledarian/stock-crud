import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Earnings } from './earnings.entity';
import * as ExcelJS from 'exceljs';

@Injectable()
export class EarningsService {
  constructor(
    @InjectRepository(Earnings)
    private repo: Repository<Earnings>,
  ) { }

  create(data) {
    return this.repo.save(data);
  }

  findAll() {
    return this.repo.find({
      order: { earningsDate: 'ASC' },
    });
  }

  update(id: number, data) {
    return this.repo.update(id, data);
  }

  delete(id: number) {
    return this.repo.delete(id);
  }

  /* =======================
     EXPORT TO EXCEL
  ======================= */
  async exportToExcel(): Promise<Buffer> {
    const records = await this.findAll();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Earnings');

    // Columns
    sheet.columns = [
      { header: 'Stock', key: 'stockName', width: 12 },
      { header: 'Earnings Date', key: 'earningsDate', width: 15 },
      { header: 'Close Price', key: 'closePrice', width: 14 },
    ];

    // Rows
    records.forEach((r) => {
      sheet.addRow({
        stockName: r.stockName,
        earningsDate: r.earningsDate,
        closePrice: r.closePrice,
      });
    });

    // Styling (optional but nice)
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
