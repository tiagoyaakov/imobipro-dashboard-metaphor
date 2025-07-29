# WhatsApp Module Migration Instructions

## Current Status
The automatic migration process encountered authentication and access control issues with the Supabase CLI. The migration needs to be applied manually through the Supabase dashboard.

## Issue Identified
- Project reference mismatch in configuration files
- Access control restrictions preventing CLI operations
- The migration file `migrations/add_whatsapp_module.sql` is ready but needs manual execution

## Manual Migration Steps

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Navigate to your project: `yjbhxbinpknarctyzevm`

### Step 2: Open SQL Editor
1. In the left sidebar, click on "SQL Editor"
2. Click "New query" to create a new SQL query

### Step 3: Execute Migration SQL
Copy and paste the entire contents of `migrations/add_whatsapp_module.sql` into the SQL editor and execute it.

The migration will create:

#### Enums:
- `WhatsAppStatus`: ('CONNECTED', 'DISCONNECTED', 'CONNECTING', 'ERROR', 'QR_CODE_PENDING')
- `ConnectionAction`: ('CONNECT', 'DISCONNECT', 'QR_GENERATED', 'ERROR', 'RECONNECT')
- `MessageType`: ('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT', 'LOCATION', 'STICKER', 'CONTACT')

#### Tables:
- `WhatsAppInstance`: Stores WhatsApp connection instances
- `WhatsAppConnectionLog`: Logs connection events and actions
- `WhatsAppMessage`: Stores WhatsApp messages
- `WhatsAppConfig`: Configuration settings per company

#### Features:
- Proper indexes for performance optimization
- Foreign key constraints linking to existing User, Chat, Contact, and Company tables
- Row Level Security (RLS) policies for data protection
- Auto-updating timestamps with triggers

### Step 4: Verify Migration Success
After executing the migration, run these verification queries in the SQL editor:

```sql
-- Check if enums were created
SELECT enumlabel FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
WHERE pg_type.typname = 'WhatsAppStatus';

-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'WhatsApp%';

-- Verify RLS is enabled
SELECT schemaname, relname, relrowsecurity 
FROM pg_stat_user_tables 
WHERE relname LIKE 'WhatsApp%';
```

### Step 5: Test Connection from Application
Once the migration is complete, the "Falha ao buscar instância do agente" error should be resolved.

## Configuration Updates Applied
The following environment variables were corrected in `.env`:
- `VITE_SUPABASE_URL`: Updated to match API key project reference
- `SUPABASE_PROJECT_ID`: Updated to correct project ID
- `DATABASE_URL`: Updated to use correct project database

## Next Steps After Migration
1. Test the Connections module functionality
2. Verify WhatsApp instance creation works
3. Test QR code generation and connection flow
4. Confirm message logging is working

## Troubleshooting
If tables still don't exist after migration:
1. Check if you have the necessary permissions in the Supabase project
2. Verify you're connected to the correct project (`yjbhxbinpknarctyzevm`)
3. Check the SQL editor for any error messages during execution
4. Ensure all foreign key references (User, Chat, Contact, Company tables) exist

## Files Modified
- `.env`: Fixed project references and database URL
- `migrations/add_whatsapp_module.sql`: Migration ready for execution