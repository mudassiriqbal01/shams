# UAT Sign-off Checklist

## 1. Access Control (RBAC/RLS)
- [ ] **Department Isolation**: User A (Dept 1) cannot see data of Dept 2.
- [ ] **Role Permissions**: "Viewer" role cannot edit or delete rows.
- [ ] **Admin Access**: Admin can manage users and modules.

## 2. Data Migration
- [ ] **Import Success**: CRM, HR, Finance templates import successfully.
- [ ] **Duplicate Detection**: Importing the same file twice triggers "Duplicate" handling (Skip/Update).
- [ ] **Resume-on-Failure**: Interrupting an import and restarting it resumes correctly.
- [ ] **Data Integrity**: Imported values match the CSV source.

## 3. Performance
- [ ] **Grid Scroll**: Scrolling through 50k records feels smooth (API < 100ms).
- [ ] **Dashboard**: Widgets load within 2 seconds.

## 4. Audit Logging
- [ ] **Create Action**: Creating a row creates an audit log entry.
- [ ] **Import Action**: Importing a file creates an audit log entry.
- [ ] **Update Action**: Editing a cell logs the old and new values.

## 5. Sign-off
**Department Head:** ____________________
**Date:** ____________________
**Status:** [ ] Approved  [ ] Conditional Approval  [ ] Rejected
