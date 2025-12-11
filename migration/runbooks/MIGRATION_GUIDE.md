# Data Migration Runbook

## Overview
This document outlines the procedures for migrating data into the Data Engine for CRM, HR, and Finance modules.

## Pre-requisites
1. **Department Setup**: Ensure target department exists.
2. **Module Setup**: Create modules with appropriate columns matching the data structure.
   - **CRM**: Text (Name, Email, Company, Status), Phone (Phone), Date (LastContactDate).
   - **HR**: Text (EmployeeID, FirstName, LastName, Department, Role), Date (StartDate), Number (Salary).
   - **Finance**: Text (TransactionID, Category, Description), Date (Date), Number (Amount), Select (Type).

## Data Preparation
1. Export data from legacy systems.
2. Cleanse data (remove invalid characters, standardize dates to ISO 8601).
3. Map legacy columns to the provided CSV templates in `migration/templates/`.

## Import Process
1. **Upload**: Use the Import Tool to upload the prepared CSV file.
2. **Mapping**: 
   - Verify auto-mapped columns.
   - Manually map any unmatched columns.
3. **Configuration**:
   - **Duplicate Detection**: Select unique columns (e.g., Email for CRM, EmployeeID for HR, TransactionID for Finance).
   - **Handling Strategy**: Choose 'SKIP' to ignore duplicates or 'UPDATE' to refresh existing records.
4. **Validation**:
   - Review the sample preview.
   - Click "Confirm Import".

## Execution & Monitoring
1. Click "Execute Import".
2. Monitor the progress bar.
3. If the import is interrupted, the system supports **Resume-on-Failure**. Simply restart the import job, and it will pick up from the last processed batch.

## Post-Migration Validation
1. **Data Integrity**: Verify total record counts match the source.
2. **Audit Logs**: Check `AuditLog` for any warnings or errors.
3. **Spot Checks**: Randomly verify 5-10 records for accuracy.

## Rollback
If significant errors occur (>10% failure rate), the system may auto-rollback the current batch. For manual rollback, delete the imported records or use the "Rollback" feature (if enabled).
