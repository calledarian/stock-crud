import { Injectable, OnModuleInit } from '@nestjs/common';
import { Database } from 'sqlite3';
import { EarningsService } from './earnings.service';
import { CreateEarningsDto } from './dto/earning.dto';
import * as path from 'path';

@Injectable()
export class EarningsBootstrapService implements OnModuleInit {
  constructor(private readonly earningsService: EarningsService) {}

  async onModuleInit() {
    console.log('EarningsBootstrapService: reading data_enriched.db...');

    const dbPath = path.resolve(__dirname, '../../data_enriched.db');
    const db = new Database(dbPath);

    // Fetch all SQLite records
    const rows: any[] = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM earnings', (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    console.log(`Found ${rows.length} earnings records in SQLite.`);

    for (const row of rows) {
      // Convert dates safely and keep as strings to match DB format
      const earningsDate = row.earningsDate; // keep as-is
      const dto: CreateEarningsDto = {
        stockName: row.stockName,
        earningsDate,
        closePrice: row.closePrice,
        createdAt: row.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        closePrior45d: row.closePrior45d ?? null,
        closePrior30d: row.closePrior30d ?? null,
        closePrior14d: row.closePrior14d ?? null,
        closePrior1d: row.closePrior1d ?? null,
        datePrior45d: row.datePrior45d ?? null,
        datePrior30d: row.datePrior30d ?? null,
        datePrior14d: row.datePrior14d ?? null,
        datePrior1d: row.datePrior1d ?? null,
      };

      console.log('Processing:', dto.stockName, dto.earningsDate, {
        closePrior45d: dto.closePrior45d,
        datePrior45d: dto.datePrior45d,
        closePrior30d: dto.closePrior30d,
        datePrior30d: dto.datePrior30d,
        closePrior14d: dto.closePrior14d,
        datePrior14d: dto.datePrior14d,
        closePrior1d: dto.closePrior1d,
        datePrior1d: dto.datePrior1d,
      });

      const exists = await this.earningsService.exists(dto.stockName, earningsDate);

      if (!exists) {
        console.log(`Creating new record for ${dto.stockName} on ${earningsDate}`);
        await this.earningsService.create(dto);
      } else {
        console.log(`Updating existing record for ${dto.stockName} on ${earningsDate}`);
        await this.earningsService.updateByStockAndDate(dto.stockName, earningsDate, dto);
      }
    }

    console.log('Earnings import completed.');
    db.close();
  }
}
