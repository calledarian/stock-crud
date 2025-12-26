import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Earnings } from './earnings.entity';
import * as ExcelJS from 'exceljs';
import { CreateEarningsDto, UpdateEarningsDto } from './dto/earning.dto';

@Injectable()
export class EarningsService {
  constructor(
    @InjectRepository(Earnings)
    private repo: Repository<Earnings>,
  ) { }

  create(data: CreateEarningsDto) {
    return this.repo.save(data);
  }

  findAll() {
    return this.repo.find({
      order: { createdAt: 'DESC' },
    });
  }
  async stockCount(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('earnings')
      .select('COUNT(DISTINCT earnings.stockName)', 'count')
      .getRawOne();

    return Number(result.count);
  }

  async findByStockName(stockName: string) {
    return this.repo.find({
      where: { stockName: Like(`%${stockName}%`) },
    });
  }

  async update(id: number, data: UpdateEarningsDto) {
    const result = await this.repo.update(id, data);

    if (result.affected === 0) {
      throw new NotFoundException('Record not found');
    }

    return { message: 'Record updated successfully' };
  }

  async delete(id: number) {
    const result = await this.repo.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Record not found');
    }

    return { message: 'Record deleted successfully' };
  }


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

    const grouped = records.reduce<Record<string, Earnings[]>>(
      (acc, r) => {
        acc[r.stockName] ??= [];
        acc[r.stockName].push(r);
        return acc;
      },
      {},
    );

    let rowIndex = 2;

    Object.entries(grouped).forEach(([stock, rows]) => {
      sheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
      sheet.getCell(`A${rowIndex}`).value = stock;
      sheet.getCell(`A${rowIndex}`).font = { bold: true };
      rowIndex++;
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

      rowIndex++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exists(stockName: string, earningsDate: string): Promise<boolean> {
    const record = await this.repo.findOne({
      where: { stockName, earningsDate },
    });
    return !!record;
  }
}
