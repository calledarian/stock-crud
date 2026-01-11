import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Earnings } from './earnings.entity';
import * as ExcelJS from 'exceljs';
import { CreateEarningsDto, UpdateEarningsDto } from './dto/earning.dto';
import { join } from 'path';
import { tmpdir } from 'os';
import * as sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';

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

    // ========================================
    // DATA SHEET ONLY
    // ========================================
    const sheet = workbook.addWorksheet('Earnings Data');

    // Column order: STOCK -> 45d -> 30d -> 14d -> 1d -> Earnings Day
    sheet.columns = [
      { header: 'STOCK', key: 'stockName', width: 12 },
      { header: '45 Days Prior Date', key: 'datePrior45d', width: 18 },
      { header: '45 Days Prior Price', key: 'closePrior45d', width: 18 },
      { header: '30 Days Prior Date', key: 'datePrior30d', width: 18 },
      { header: '30 Days Prior Price', key: 'closePrior30d', width: 18 },
      { header: '14 Days Prior Date', key: 'datePrior14d', width: 18 },
      { header: '14 Days Prior Price', key: 'closePrior14d', width: 18 },
      { header: '1 Day Prior Date', key: 'datePrior1d', width: 18 },
      { header: '1 Day Prior Price', key: 'closePrior1d', width: 18 },
      { header: 'Earnings Day Date', key: 'earningsDate', width: 18 },
      { header: 'Earnings Day Price', key: 'closePrice', width: 18 },
    ];

    // Format Headers
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { horizontal: 'center' };

    // Apply specific Date and Currency formatting to columns by Letter
    // B=45dDate, D=30dDate, F=14dDate, H=1dDate, J=EarnDate
    // C=45dPrice, E=30dPrice, G=14dPrice, I=1dPrice, K=EarnPrice
    const dateCols = ['B', 'D', 'F', 'H', 'J'];
    const priceCols = ['C', 'E', 'G', 'I', 'K'];

    dateCols.forEach(col => { sheet.getColumn(col).numFmt = 'dd/mm/yyyy'; });
    priceCols.forEach(col => { sheet.getColumn(col).numFmt = '$#,##0.00'; });

    // Populate Data
    records.sort((a, b) => a.stockName.localeCompare(b.stockName) ||
      new Date(a.earningsDate).getTime() - new Date(b.earningsDate).getTime()
    ).forEach((r) => {
      const row = sheet.addRow({
        stockName: r.stockName,
        datePrior45d: r.datePrior45d ? new Date(r.datePrior45d) : null,
        closePrior45d: r.closePrior45d,
        datePrior30d: r.datePrior30d ? new Date(r.datePrior30d) : null,
        closePrior30d: r.closePrior30d,
        datePrior14d: r.datePrior14d ? new Date(r.datePrior14d) : null,
        closePrior14d: r.closePrior14d,
        datePrior1d: r.datePrior1d ? new Date(r.datePrior1d) : null,
        closePrior1d: r.closePrior1d,
        earningsDate: new Date(r.earningsDate),
        closePrice: r.closePrice,
      });

      priceCols.slice(0, 4).forEach((colLetter, index) => {
        const val = [r.closePrior45d, r.closePrior30d, r.closePrior14d, r.closePrior1d][index];
        if (val == null) {
          row.getCell(colLetter).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' }
          };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportToSqlite(): Promise<Buffer> {
    const records = await this.findAll();
    const tempFilePath = join(tmpdir(), `export-${Date.now()}.db`);
    const db = new sqlite3.Database(tempFilePath);
    try {
      await new Promise<void>((resolve, reject) => {
        db.serialize(() => {
          db.run(`
            CREATE TABLE earnings (
              id INTEGER PRIMARY KEY,
              stockName TEXT,
              earningsDate TEXT,
              closePrice REAL,
              datePrior45d TEXT, closePrior45d REAL,
              datePrior30d TEXT, closePrior30d REAL,
              datePrior14d TEXT, closePrior14d REAL,
              datePrior1d TEXT, closePrior1d REAL,
              createdAt TEXT,
              updatedAt TEXT
            )
          `);

          const stmt = db.prepare(
            `INSERT INTO earnings (
              stockName, earningsDate, closePrice, 
              datePrior45d, closePrior45d, 
              datePrior30d, closePrior30d, 
              datePrior14d, closePrior14d, 
              datePrior1d, closePrior1d, 
              createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          );

          for (const r of records) {
            stmt.run(
              r.stockName, r.earningsDate, r.closePrice,
              r.datePrior45d ?? null, r.closePrior45d ?? null,
              r.datePrior30d ?? null, r.closePrior30d ?? null,
              r.datePrior14d ?? null, r.closePrior14d ?? null,
              r.datePrior1d ?? null, r.closePrior1d ?? null,
              r.createdAt?.toISOString(),
              r.updatedAt?.toISOString()
            );
          }
          stmt.finalize((err) => (err ? reject(err) : resolve()));
        });
      });

      await new Promise<void>((resolve, reject) => db.close((err) => (err ? reject(err) : resolve())));
      const buffer = await fs.readFile(tempFilePath);
      await fs.unlink(tempFilePath).catch(() => { });
      return buffer;
    } catch (error) {
      await fs.unlink(tempFilePath).catch(() => { });
      throw new InternalServerErrorException('Failed to generate database file');
    }
  }

  async exists(stockName: string, earningsDate: string): Promise<boolean> {
    const record = await this.repo.findOne({
      where: { stockName, earningsDate },
    });
    return !!record;
  }
  async updateByStockAndDate(stockName: string, earningsDate: string, dto: CreateEarningsDto) {
    const updated = await this.repo.update(
      { stockName, earningsDate },
      {
        closePrice: dto.closePrice ?? null,
        closePrior45d: dto.closePrior45d ?? undefined,
        datePrior45d: dto.datePrior45d ?? undefined,
        closePrior30d: dto.closePrior30d ?? undefined,
        datePrior30d: dto.datePrior30d ?? undefined,
        closePrior14d: dto.closePrior14d ?? undefined,
        datePrior14d: dto.datePrior14d ?? undefined,
        closePrior1d: dto.closePrior1d ?? undefined,
        datePrior1d: dto.datePrior1d ?? undefined,
        updatedAt: new Date(),
      }
    );
    if (updated.affected === 0) {
      console.warn(`No record updated for ${stockName} on ${earningsDate}`);
    } else {
      console.log(`Updated record for ${stockName} on ${earningsDate}`);
    }
    return updated;
  }

}
