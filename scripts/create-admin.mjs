/**
 * Create/update the initial admin user.
 *
 * Usage:
 *   node scripts/create-admin.mjs --username admin --password "pilih-satu" --name "Pentadbir ICT" [--role admin]
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env (or env vars).
 * Passwords are hashed with bcryptjs client-side before insert.
 */
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import fs from 'node:fs'
import path from 'node:path'

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const m = argv[i].match(/^--([^=]+)=(.*)$/)
    if (m) {
      args[m[1]] = m[2]
    } else if (argv[i] === '--username' || argv[i] === '--password' || argv[i] === '--name' || argv[i] === '--role') {
      args[argv[i].slice(2)] = argv[++i]
    }
  }
  return args
}

function loadEnv() {
  const root = path.resolve(import.meta.dirname, '..')
  const envFile = path.join(root, '.env')
  const parsed = {}
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) parsed[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return parsed
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const env = loadEnv()

  const url = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY required (set in .env).')
    process.exit(1)
  }
  const username = args.username || 'admin'
  const password = args.password || ''
  const fullName = args.name || 'Pentadbir Sistem'
  const role = args.role || 'admin'
  if (!password || password.length < 6) {
    console.error('--password required and must be at least 6 characters.')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  const passwordHash = await bcrypt.hash(password, 10)

  const { data: existing } = await supabase
    .from('pinjam_users')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('pinjam_users')
      .update({ password_hash: passwordHash, full_name: fullName, role, is_active: true })
      .eq('id', existing.id)
    if (error) throw error
    console.log(`Updated user "${username}".`)
  } else {
    const { error } = await supabase.from('pinjam_users').insert({
      username,
      password_hash: passwordHash,
      full_name: fullName,
      role,
    })
    if (error) throw error
    console.log(`Created user "${username}" (role: ${role}).`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

