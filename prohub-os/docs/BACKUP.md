# Backups & restore

## What to back up
1. **PostgreSQL database.** All business data lives here: CRM, finance ledger, tasks, knowledge, audit log.
2. **`ENCRYPTION_KEY`.** Store it in a password manager. Without it, the integration credentials saved in the dashboard cannot be decrypted. You can still re-enter them.
3. **Environment configuration.** Keep a copy of every value in `.env`. Never commit it to git.

## Automated backups
- **Supabase:** daily backups are included on paid plans. Turn on Point-in-Time Recovery for production.
- **Self-managed:** schedule `scripts/backup.sh`. It writes a compressed `pg_dump` and keeps the 30 most recent files.
  ```cron
  0 2 * * *  cd /srv/prohub-os && DATABASE_URL=... ./scripts/backup.sh /var/backups/prohub
  ```
  Copy the backup directory off the server, for example to S3 or Google Drive, with `rclone`.

## Restore
```bash
createdb prohub_restore
pg_restore --no-owner --dbname "postgres://…/prohub_restore" backups/prohub-YYYYMMDDTHHMMSSZ.dump
# point DATABASE_URL at the restored DB, then:
npm run db:migrate   # brings an older dump up to the current schema
```
Test a restore every quarter.

## Data retention
The activity log and agent run transcripts grow over time. To archive, export rows older than 12 months (for example `COPY (SELECT … WHERE created_at < now() - interval '12 months') TO …`) before deleting them. Treat deleting finance records or the audit trail as a Level-3 decision.
