import sqlite3
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
from typing import Optional, Tuple
import time

class EarningsEnrichment:
    def __init__(self, db_path: str = 'data.db'):
        self.db_path = db_path
        self.conn = None
        # The specific intervals we want to track
        self.intervals = [45, 30, 14, 1]
        
    def connect(self):
        """Connect to SQLite database"""
        self.conn = sqlite3.connect(self.db_path)
        print(f"✓ Connected to {self.db_path}")
        
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            print("✓ Database connection closed")
    
    def add_columns_if_missing(self):
        """
        Dynamically adds Price AND Date columns for all intervals to the database
        """
        cursor = self.conn.cursor()
        cursor.execute("PRAGMA table_info(earnings)")
        existing_columns = [col[1] for col in cursor.fetchall()]
        
        # We need both a Price (REAL) and a Date (TEXT) column for each interval
        needed_columns = []
        for days in self.intervals:
            needed_columns.append((f'closePrior{days}d', 'REAL'))
            needed_columns.append((f'datePrior{days}d', 'TEXT'))
        
        # Create them if they don't exist
        for col_name, col_type in needed_columns:
            if col_name not in existing_columns:
                cursor.execute(f"ALTER TABLE earnings ADD COLUMN {col_name} {col_type}")
                print(f"✓ Added column: {col_name}")
        
        self.conn.commit()
    
    def get_prior_trading_data(
        self,
        target_date: datetime,
        historical_data: pd.DataFrame
    ) -> Tuple[Optional[float], str]:
        """
        ALWAYS returns a date.
        Price may be None.
        """
        target_date_obj = target_date.date()

        resolved_date = target_date_obj

        for i in range(7):
            check_date = target_date_obj - timedelta(days=i)

            matching_rows = historical_data[
                historical_data.index.date == check_date
            ]

            if not matching_rows.empty:
                price = round(matching_rows['Close'].iloc[0], 2)
                return price, check_date.strftime('%Y-%m-%d')

        return None, resolved_date.strftime('%Y-%m-%d')

    def fetch_historical_prices(self, stock_name: str, 
                               earliest_date: str) -> pd.DataFrame:
        """
        Fetch historical stock prices from Yahoo Finance
        """
        try:
            # Add .AX suffix for Australian stocks if not present
            ticker_symbol = stock_name if '.' in stock_name else f"{stock_name}.AX"
            
            # Buffer of 65 days to safely cover the 45-day lookback + weekends
            start_date = (datetime.strptime(earliest_date, '%Y-%m-%d') - 
                         timedelta(days=65)).strftime('%Y-%m-%d')
            end_date = datetime.now().strftime('%Y-%m-%d')
            
            ticker = yf.Ticker(ticker_symbol)
            hist = ticker.history(start=start_date, end=end_date)
            
            return hist
        except Exception as e:
            print(f"  ✗ Error fetching {stock_name}: {e}")
            return pd.DataFrame()
    
    def enrich_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Main logic to process stocks and find historical prices/dates
        """
        unique_stocks = df['stockName'].unique()
        print(f"\n📊 Processing {len(unique_stocks)} unique stocks...")
        
        for stock in unique_stocks:
            print(f"  🔍 Processing {stock}...")
            
            stock_mask = df['stockName'] == stock
            
            # Optimization: Fetch history once per stock based on earliest needed date
            try:
                earliest_earnings = df.loc[stock_mask, 'earningsDate'].min()
                hist_data = self.fetch_historical_prices(stock, earliest_earnings)
            except Exception as e:
                print(f"    Skipping {stock} due to error: {e}")
                continue
            
            if hist_data.empty:
                continue
            
            # Iterate through the specific rows for this stock
            for idx, row in df[stock_mask].iterrows():
                try:
                    earnings_dt = datetime.strptime(row['earningsDate'], '%Y-%m-%d')
                except ValueError:
                    continue
                
                # Loop through all intervals (45, 30, 14, 1)
                for days in self.intervals:
                    # Calculate the theoretical target date
                    target_dt = earnings_dt - timedelta(days=days)
                    
                    # Get the ACTUAL price and date (handling weekends)
                    price, actual_date = self.get_prior_trading_data(target_dt, hist_data)
                    
                    # Update the DataFrame
                    df.at[idx, f'closePrior{days}d'] = price
                    df.at[idx, f'datePrior{days}d'] = actual_date
            
            # Rate limiting
            time.sleep(0.5)
            
        return df
    
    def update_database(self, df: pd.DataFrame):
        """
        Updates the SQLite database with the new Price and Date columns
        """
        cursor = self.conn.cursor()
        
        # Prepare the dynamic update query
        # We need to set 8 columns: 4 prices + 4 dates
        set_clauses = []
        for days in self.intervals:
            set_clauses.append(f"closePrior{days}d = ?")
            set_clauses.append(f"datePrior{days}d = ?")
        
        query_str = f"""
            UPDATE earnings 
            SET {', '.join(set_clauses)}
            WHERE id = ?
        """
        
        print("\n💾 Saving to database...")
        for _, row in df.iterrows():
            # Build the values list in the exact order of the set_clauses
            params = []
            for days in self.intervals:
                params.append(row[f'closePrior{days}d'])
                params.append(row[f'datePrior{days}d'])
            
            # Add the ID for the WHERE clause
            params.append(row['id'])
            
            cursor.execute(query_str, tuple(params))
        
        self.conn.commit()
        print(f"✓ Updated {len(df)} records")

    def run(self, output_csv: str = 'data_enriched.csv'):
        """
        Main execution flow
        """
        print("=" * 60)
        print("📈 EARNINGS DATA ENRICHMENT (Prices & Dates)")
        print("=" * 60)

        self.connect()
        self.add_columns_if_missing()
        
        df = pd.read_sql_query("SELECT * FROM earnings", self.conn)
        
        if df.empty:
            print("⚠ No data found in database")
            self.close()
            return

        # Enrich the dataframe
        enriched_df = self.enrich_data(df)
        
        # Save back to database
        self.update_database(enriched_df)
        
        # Save CSV backup
        enriched_df.to_csv(output_csv, index=False)
        print(f"✓ CSV backup saved to {output_csv}")
        
        # Display verification
        print("\n" + "="*60)
        print("👀 DATA VERIFICATION (First 5 rows)")
        print("="*60)
        # Select a few key columns to display
        display_cols = ['stockName', 'earningsDate', 'datePrior45d', 'closePrior45d', 'datePrior1d', 'closePrior1d']
        print(enriched_df[display_cols].head().to_string())
        
        self.close()
        print("\n✅ Process Complete!")

if __name__ == "__main__":
    enricher = EarningsEnrichment()
    enricher.run()