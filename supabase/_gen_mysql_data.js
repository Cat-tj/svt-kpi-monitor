const fs = require('fs');
const d = require('./db_dump.json');

function v(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') return "'" + JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  return "'" + String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

function genInsert(table, rows, columns) {
  if (!rows || rows.length === 0) return `-- ${table}: no data\n\n`;
  let sql = `-- ${table} (${rows.length} rows)\n`;
  sql += `INSERT INTO \`${table}\` (${columns.map(c => '`'+c+'`').join(', ')}) VALUES\n`;
  const lines = rows.map(row => {
    const vals = columns.map(col => v(row[col]));
    return `  (${vals.join(', ')})`;
  });
  sql += lines.join(',\n') + ';\n\n';
  return sql;
}

let output = '';
output += '-- =============================================================================\n';
output += '-- PT CHIEF LEVEL INDONESIA - KPI Monitor: MySQL DATA DUMP\n';
output += '-- Run mysql_schema.sql FIRST, then this file.\n';
output += '-- Generated: ' + new Date().toISOString() + '\n';
output += '-- =============================================================================\n\n';
output += 'SET NAMES utf8mb4;\n\n';

// Departments
output += genInsert('departments', d.departments, ['id', 'name', 'description', 'created_at', 'updated_at']);

// Profiles
output += genInsert('profiles', d.profiles, ['id', 'full_name', 'email', 'role', 'department_id', 'avatar_url', 'is_active', 'created_at', 'updated_at']);

// KPIs
output += genInsert('kpis', d.kpis, ['id', 'name', 'description', 'department_id', 'type', 'timeframe', 'target_value', 'weight', 'unit', 'start_date', 'due_date', 'assigned_to', 'is_active', 'created_by', 'created_at', 'updated_at']);

// KPI Entries
output += genInsert('kpi_entries', d.kpi_entries, ['id', 'kpi_id', 'sub_kpi_id', 'submitted_by', 'period_start', 'period_end', 'actual_value', 'notes', 'status', 'reviewed_by', 'reviewed_at', 'review_notes', 'score', 'created_at', 'updated_at']);

fs.writeFileSync(__dirname + '/mysql_data.sql', output);
console.log('Done: supabase/mysql_data.sql');
