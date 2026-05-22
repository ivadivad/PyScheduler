#!/usr/bin/env python3
"""Hello World — minimal example script for the scheduler."""
import sys
import time

print("Hello from Python Scheduler!")
print(f"Python version: {sys.version}")
print("Starting task...")

for i in range(1, 6):
    time.sleep(0.5)
    print(f"Step {i}/5 completed")

print("Task finished successfully!")
sys.exit(0)
