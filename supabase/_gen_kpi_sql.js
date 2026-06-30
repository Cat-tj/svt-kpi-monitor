const d = require('./db_dump.json');
let sql = '-- KPI Data Dump (28 rows)\n';
sql += '-- Generated from Supabase project ftsfxxjyukbelgjtvmdo\n\n';
sql += 'INSERT INTO kpis (id, name, description, department_id, type, timeframe, target_value, weight, unit, start_date, due_date, assigned_to, is_active, created_by, created_at, updated_at) VALUES\n';

function v(val) {
  if (val === null || val === undefined) return 'NULL';
  return "'" + String(val).replace(/'/g, "''") + "'";
}
function n(val) {
  if (val === null || val === undefined) return 'NULL';
  return val;
}

const rows = d.kpis.map((k) => {
  return `  (${v(k.id)}, ${v(k.name)}, ${v(k.description)}, ${v(k.department_id)}, ${v(k.type)}, ${v(k.timeframe)}, ${n(k.target_value)}, ${n(k.weight)}, ${v(k.unit)}, ${k.start_date ? v(k.start_date) : 'NULL'}, ${k.due_date ? v(k.due_date) : 'NULL'}, ${k.assigned_to ? v(k.assigned_to) : 'NULL'}, ${k.is_active}, ${k.created_by ? v(k.created_by) : 'NULL'}, ${v(k.created_at)}, ${v(k.updated_at)})`;
});

sql += rows.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n';
require('fs').writeFileSync(__dirname + '/kpis_dump.sql', sql);
console.log('Done: supabase/kpis_dump.sql (' + d.kpis.length + ' rows)');
