import { Injectable, OnModuleInit } from '@nestjs/common';
import { Database } from 'sqlite3';
import { EarningsService } from './earnings.service';
import { CreateEarningsDto } from './dto/earning.dto';
import * as path from 'path';

@Injectable()
export class EarningsBootstrapService implements OnModuleInit {
    constructor(private readonly earningsService: EarningsService) { }

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
            const dto: CreateEarningsDto = {
                stockName: row.stockName,
                earningsDate: new Date(row.earningsDate).toISOString(),
                closePrice: row.closePrice,
                createdAt: row.createdAt ?? new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: row.userId ?? '',
                closePrior45d: row.closePrior45d ?? null,
                closePrior30d: row.closePrior30d ?? null,
                closePrior14d: row.closePrior14d ?? null,
                closePrior1d: row.closePrior1d ?? null,
            };

            const exists = await this.earningsService.exists(dto.stockName, dto.earningsDate);

            if (!exists) {
                await this.earningsService.create(dto);
            } else {
                // Update all fields for existing row
                await this.earningsService.updateByStockAndDate(dto.stockName, dto.earningsDate, dto);
            }
        }

        console.log('Earnings import completed.');
        db.close();
    }
}
