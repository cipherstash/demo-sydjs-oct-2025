# CipherStash Demo Repository

This repository contains three types of demos showcasing CipherStash's encryption solutions:

1. **DynamoDB with CipherStash Protect** - Application-level encryption for DynamoDB
2. **PostgreSQL with CipherStash Proxy** - Transparent encryption via JSONB proxy configuration
3. **PostgreSQL with CipherStash Protect** - Direct database encryption with Drizzle ORM

---

## Prerequisites

Before running demos, ensure you have:

- [ ] **Docker** and Docker Compose installed
- [ ] **flox** installed ([installation guide](https://flox.dev/docs))
- [ ] CipherStash account credentials (for production proxy features)

> **Note**: Node.js (v24) and pnpm (v10.14.0) are automatically installed and managed by the flox environment - no manual installation needed!

---

## Initial Setup

### 1. Activate Flox Environment

```bash
flox activate
```

This will automatically:
- Install Node.js v24.7.0
- Install pnpm v10.14.0
- Run `pnpm install --frozen-lockfile` to install all dependencies
- Set up environment variables and helpful aliases

> **Tip**: The `load-env` alias is available to load environment variables from 1Password (requires 1Password CLI authentication).

### 2. Environment Configuration

**Option A: Using 1Password CLI (Recommended for teams)**

If you have 1Password CLI set up and a `.env.tpl` template file:

```bash
op signin  # Authenticate with 1Password CLI
load-env   # Load environment variables from 1Password
```

**Option B: Manual .env file**

Create a `.env` file in the project root with your CipherStash credentials:

```env
# CipherStash Credentials
CS_...
```

### 3. Start Infrastructure

Start the required services (DynamoDB Local, PostgreSQL, and CipherStash Proxy):

```bash
docker compose up -d
```

This starts:
- **DynamoDB Local** on port `8000`
- **PostgreSQL** on port `5432` (credentials: `postgres`/`password`)
- **CipherStash Proxy** on port `6432` (PostgreSQL proxy) and `9930` (Prometheus metrics)

Verify services are running:
```bash
docker compose ps
```

---

## Demo 1: DynamoDB with CipherStash Protect

**Use Case**: Show customers how to encrypt DynamoDB data at the application level with searchable encryption.

### Available Scripts

#### Setup DynamoDB Table
```bash
pnpm run dynamo:setup-table
```
Creates the `users` table in DynamoDB Local with the required schema.

#### Insert and Encrypt User Data
```bash
pnpm run dynamo:example
```
**What it demonstrates:**
- Encrypts user data (name, email) using CipherStash Protect
- Shows both raw encrypted data and DynamoDB-formatted encrypted data
- Stores encrypted data in DynamoDB
- Retrieves and decrypts the data to verify functionality

**Expected Output:**
- Encrypted user data structure
- Confirmation of successful storage
- Decrypted user data showing original values

#### Search Encrypted Data
```bash
pnpm run dynamo:search-user user@example.com
```
**What it demonstrates:**
- Creates searchable HMAC tokens from plaintext email
- Queries DynamoDB using encrypted search terms
- Decrypts and displays matching results

**Key Talking Points:**
- Encryption happens client-side before data reaches DynamoDB
- Search works on encrypted data using cryptographic HMACs
- Zero plaintext exposure in database
- Compatible with existing AWS SDK operations

---

## Demo 2: PostgreSQL with CipherStash Proxy (JSONB)

**Use Case**: Show transparent encryption for PostgreSQL JSONB columns without changing application code.

### Available Scripts

#### Setup Proxy Configuration
```bash
pnpm run postgres:proxy:setup-proxy-config
```
**What it does:**
- Uploads encryption configuration to CipherStash Proxy
- Configures which JSONB fields to encrypt (email, dateOfBirth, salary)
- Sets up searchable encryption indexes

**Important**: Run this before inserting any data when demonstrating proxy capabilities.

#### Insert Encrypted User Data
```bash
pnpm run postgres:proxy:insert-user
```
**What it demonstrates:**
- Application sends plaintext data to proxy
- Proxy transparently encrypts before writing to PostgreSQL
- JSONB column contains encrypted data in database

#### Query Encrypted Data
```bash
pnpm run postgres:proxy:query
```
**What it demonstrates:**
- Application queries through proxy (port 6432)
- Proxy transparently decrypts data
- Application receives plaintext results
- Zero code changes required in application

**Key Talking Points:**
- Drop-in replacement - just change connection port (5432 → 6432)
- No application code changes needed
- Encryption/decryption handled by proxy
- Compatible with any PostgreSQL client library
- Works with JSONB data structures

---

## Demo 3: PostgreSQL with CipherStash Protect (Direct)

**Use Case**: Show direct encryption in PostgreSQL applications using Drizzle ORM for more control.

### Available Scripts

#### Setup Proxy Encryption Configuration
```bash
pnpm run postgres:protect:proxy-encrypt-config
```
**What it does:**
- Configures CipherStash Proxy for the Protect schema
- Required if using Protect with Proxy together

#### Insert Encrypted User Data
```bash
pnpm run postgres:protect:insert
```
**What it demonstrates:**
- Encrypts data client-side using CipherStash Protect SDK
- Stores encrypted values in dedicated columns (`encrypted_email`, `encrypted_dob`, `encrypted_salary`)
- Works with Drizzle ORM for type-safe queries

#### Query All Users
```bash
pnpm run postgres:protect:query
```
**What it demonstrates:**
- Retrieves encrypted data from PostgreSQL
- Bulk decrypts multiple records efficiently
- Returns plaintext data to application

#### Search by Email
```bash
pnpm run postgres:protect:search user@example.com
```
**What it demonstrates:**
- Generates encrypted search terms from plaintext email
- Queries PostgreSQL using encrypted equality search
- Works with Drizzle ORM's query builder
- Returns matching encrypted records

**Key Talking Points:**
- More control over encryption than proxy approach
- Type-safe with Drizzle ORM
- Supports complex queries with encrypted search terms
- Encryption happens in application code
- Dedicated encrypted columns in schema

---

## Troubleshooting

### Docker Containers Not Starting
```bash
# Check container logs
docker compose logs dynamo
docker compose logs postgres
docker compose logs proxy

# Restart all services
docker compose down
docker compose up -d
```

### DynamoDB Connection Errors
- Ensure DynamoDB Local is running on port 8000
- Check `docker compose ps` shows `cipherstash-demo-dynamodb` as running

### PostgreSQL Connection Errors
- Verify PostgreSQL is healthy: `docker compose ps`
- Test direct connection: `psql -h localhost -p 5432 -U postgres -d postgres`
- Test proxy connection: `psql -h localhost -p 6432 -U postgres -d postgres`
- Password is `password`

### CipherStash Proxy Issues
- Verify `.env` file contains valid credentials
- Check proxy logs: `docker compose logs proxy`
- Ensure all the `CS_` environment variables are set correctly

### Missing Dependencies
```bash
# Exit and re-activate flox environment
exit  # Exit current flox shell
flox activate  # Re-activate to reinstall dependencies

# Or manually clean and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## Cleaning Up

### Reset All Data
```bash
# Stop and remove all containers, volumes
docker compose down -v

# Remove node_modules
rm -rf node_modules

# Fresh start
pnpm install
docker compose up -d
```

### Rebuild Docker Containers
```bash
docker compose down
docker compose pull  # Get latest CipherStash Proxy
docker compose up -d
```

---

## Additional Resources

- [CipherStash Documentation](https://docs.cipherstash.com)
- [CipherStash Protect SDK](https://cipherstash.com/docs/protect/sdk/js)
- [CipherStash Proxy Documentation](https://cipherstash.com/docs/devops/proxy)

