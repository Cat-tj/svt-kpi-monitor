const fs = require('fs');
const d = require('./db_dump.json');

function v(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') return "'" + JSON.stringify(val).replace(/'/g, "''") + "'";
  return "'" + String(val).replace(/'/g, "''") + "'";
}

function genInsert(table, rows, columns) {
  if (!rows || rows.length === 0) return `-- ${table}: no data\n\n`;
  let sql = `-- ${table} (${rows.length} rows)\n`;
  sql += `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n`;
  const lines = rows.map(row => {
    const vals = columns.map(col => v(row[col]));
    return `  (${vals.join(', ')})`;
  });
  sql += lines.join(',\n') + '\nON CONFLICT DO NOTHING;\n\n';
  return sql;
}

let output = '';
output += '-- =============================================================================\n';
output += '-- PT CHIEF LEVEL INDONESIA - KPI Monitor: FULL DATA DUMP\n';
output += '-- Generated: ' + new Date().toISOString() + '\n';
output += '-- Run setup_all.sql FIRST to create tables, then run this file to seed data.\n';
output += '-- =============================================================================\n\n';

// Departments
output += genInsert('departments', d.departments, ['id', 'name', 'description', 'created_at', 'updated_at']);

// Profiles (skip - requires auth.users to exist first)
output += '-- NOTE: profiles depend on auth.users. Insert users via Supabase Auth first,\n';
output += '-- then profiles will be auto-created by trigger. Below is for reference only.\n';
output += '-- ' + d.profiles.length + ' profiles in database.\n\n';

// KPIs
output += genInsert('kpis', d.kpis, ['id', 'name', 'description', 'department_id', 'type', 'timeframe', 'target_value', 'weight', 'unit', 'start_date', 'due_date', 'assigned_to', 'is_active', 'created_by', 'created_at', 'updated_at']);

// KPI Entries
output += genInsert('kpi_entries', d.kpi_entries, ['id', 'kpi_id', 'sub_kpi_id', 'submitted_by', 'period_start', 'period_end', 'actual_value', 'notes', 'status', 'reviewed_by', 'reviewed_at', 'review_notes', 'score', 'created_at', 'updated_at']);

fs.writeFileSync(__dirname + '/full_data_dump.sql', output);
console.log('Done: supabase/full_data_dump.sql');
console.log('Tables:', Object.keys(d).map(k => k + '(' + d[k].length + ')').join(', '));
