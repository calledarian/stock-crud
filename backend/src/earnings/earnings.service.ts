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

    sheet.columns = [
      { header: 'Earnings Date', key: 'earningsDate', width: 15 },
      { header: 'Close Price', key: 'closePrice', width: 14 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.getColumn('earningsDate').numFmt = 'yyyy-mm-dd';
    sheet.getColumn('closePrice').numFmt = '$#,##0.00';

    const grouped = records.reduce((acc, r) => {
      acc[r.stockName] ??= [];
      acc[r.stockName].push(r);
      return acc;
    }, {} as Record<string, typeof records>);

    let rowIndex = 2;

    Object.entries(grouped).forEach(([stock, rows]) => {
      // Stock header row
      sheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
      sheet.getCell(`A${rowIndex}`).value = stock;
      sheet.getCell(`A${rowIndex}`).font = { bold: true };
      rowIndex++;

      // Sort dates inside stock
      rows
        .sort(
          (a, b) =>
            new Date(a.earningsDate).getTime() -
            new Date(b.earningsDate).getTime(),
        )
        .forEach((r) => {
          sheet.addRow({
            earningsDate: new Date(r.earningsDate),
            closePrice: r.closePrice,
          });
          rowIndex++;
        });

      rowIndex++; // blank line between stocks
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

}
