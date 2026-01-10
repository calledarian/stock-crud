# Yahoo Finance Earnings Enrichment Service

This service enriches existing earnings data with historical closing prices and the specific trading dates from Yahoo Finance. It automatically handles market closures (weekends and holidays) by looking back to the most recent active trading session (e.g., the Friday prior).

## Getting Started

### 1. Prerequisites

Ensure you have Python 3.8+ installed and a `data.db` file containing an `earnings` table.

### 2. Setup Database

Copy your existing database from the backend directory to the current project folder:

```bash
cp ../backend/data.db ./

```

### 3. Install Dependencies

Install the required libraries using pip:

```bash
pip install pandas yfinance

```

### 4. Run the Service

Execute the enrichment script:

```bash
python main.py

```

---

##  New Features & Logic

###  Smart Date Tracking

The service now tracks both the **Price** and the **Actual Date** used for the enrichment. This ensures transparency if a lookback period (like 45 days) lands on a weekend.

| Interval | Price Column | Date Column | Weekend Logic |
| --- | --- | --- | --- |
| **45 Days** | `closePrior45d` | `datePrior45d` | If Day 45 = Sunday, uses Day 47 (Friday) |
| **30 Days** | `closePrior30d` | `datePrior30d` | Searches back up to 7 days for a valid Close |
| **14 Days** | `closePrior14d` | `datePrior14d` | Automatically skips bank holidays |
| **1 Day** | `closePrior1d` | `datePrior1d` | Always captures the previous trading session |

### Automatic Schema Updates

You no longer need to manually modify your SQLite table. On execution, the script:

1. Scans your `earnings` table.
2. Identifies missing columns.
3. Automatically performs `ALTER TABLE` to add the 8 new enrichment columns (4 Price, 4 Date).

---

## Output

After running, the service updates `data.db` directly and generates a backup:

* **`data.db`**: Updated with enriched columns.
* **`data_enriched.csv`**: A spreadsheet export for quick manual verification.

## Example Query

To verify the results in your database:

```sql
SELECT stockName, earningsDate, datePrior45d, closePrior45d 
FROM earnings 
WHERE closePrior45d IS NOT NULL 
LIMIT 10;

```

---
