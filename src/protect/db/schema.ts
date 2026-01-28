import { integer, pgTable, customType } from 'drizzle-orm/pg-core'

const encrypted = <TData>(name: string) =>
  customType<{ data: TData; driverData: string }>({
    dataType() {
      return 'eql_v2_encrypted'
    },
    toDriver(value: TData): string {
      // Convert to PostgreSQL composite type string format: (field1,field2,...)
      const jsonStr = JSON.stringify(value)
      // Escape quotes by doubling them for PostgreSQL
      const escaped = jsonStr.replace(/"/g, '""')
      // Wrap in outer parentheses and quotes
      return `("${escaped}")`
    },
    fromDriver(value: string): TData {
      // Parse PostgreSQL composite type string format: (field1,field2,...)
      const parseComposite = (str: string) => {
        if (!str || str === '') return null

        // Remove outer parentheses
        const trimmed = str.trim()

        if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
          let inner = trimmed.slice(1, -1)

          // PostgreSQL escapes quotes by doubling them, so we need to unescape
          // Replace "" with " for proper JSON parsing
          inner = inner.replace(/""/g, '"')

          // Check if the inner value is a JSON-encoded string (starts and ends with quotes)
          if (inner.startsWith('"') && inner.endsWith('"')) {
            // Manually strip the outer quotes instead of using JSON.parse
            // This avoids issues with special characters (like backticks) in the JSON content
            const stripped = inner.slice(1, -1)

            // Now parse the stripped content as JSON
            return JSON.parse(stripped)
          }

          // Parse as JSON for objects/arrays
          if (inner.startsWith('{') || inner.startsWith('[')) {
            return JSON.parse(inner)
          }

          // Otherwise return the inner content
          return inner
        }

        // If not a composite format, try parsing as JSON
        return JSON.parse(str)
      }

      return parseComposite(value) as TData
    },
  })(name)

export const usersTable = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  encrypted_email: encrypted('encrypted_email'),
  encrypted_dob: encrypted('encrypted_dob'),
  encrypted_salary: encrypted('encrypted_salary'),
  encrypted_jsonb: encrypted('encrypted_jsonb'),
})

export const jsonUsersTable = pgTable('json_users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  encrypted_metadata: encrypted('encrypted_metadata'),
})
