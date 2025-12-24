import { Injectable, OnModuleInit } from '@nestjs/common';
import { Database } from 'sqlite3';
import { EarningsService } from './earnings.service';
import { CreateEarningsDto } from './dto/earning.dto';
import * as path from 'path';

@Injectable()
export class EarningsBootstrapService implements OnModuleInit {
    constructor(private readonly earningsService: EarningsService) { }

    async onModuleInit() {
        console.log('EarningsBootstrapService: reading data.db...');

        const dbPath = path.resolve(__dirname, '../../data.db');
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
            };

            const exists = await this.earningsService.exists(dto.stockName, dto.earningsDate);
            if (!exists) {
                await this.earningsService.create(dto);
                console.log(`Inserted: ${dto.stockName} | ${dto.earningsDate} | ${dto.closePrice}`);
            } else {
                console.log(`Skipped (duplicate): ${dto.stockName} | ${dto.earningsDate}`);
            }
        }

        console.log('Earnings import completed.');
        db.close();
    }
}
