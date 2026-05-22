#!/usr/bin/env python3
"""Data Processor — simulates ETL pipeline with progress output."""
import sys
import time
import random

RECORDS = 1000

print(f"[data_processor] Starting ETL pipeline")
print(f"[data_processor] Target: {RECORDS} records")

# Extract
print("\n--- EXTRACT ---")
extracted = random.randint(900, RECORDS)
print(f"Connecting to data source...")
time.sleep(0.5)
print(f"Extracted {extracted} records")

# Transform
print("\n--- TRANSFORM ---")
batch_size = 100
transformed = 0
for batch_start in range(0, extracted, batch_size):
    batch_end = min(batch_start + batch_size, extracted)
    count = batch_end - batch_start
    time.sleep(0.2)
    transformed += count
    pct = int(transformed / extracted * 100)
    print(f"Transformed batch {batch_start}-{batch_end} | {pct}% complete")

# Validate
errors = random.randint(0, 5)
print(f"\n--- VALIDATE ---")
print(f"Validation errors: {errors}")
if errors > 3:
    print("ERROR: Too many validation errors", file=sys.stderr)
    sys.exit(1)

# Load
print("\n--- LOAD ---")
time.sleep(0.3)
loaded = transformed - errors
print(f"Loaded {loaded} records successfully")

print(f"\n[data_processor] Pipeline complete: {loaded}/{extracted} records processed")
sys.exit(0)
