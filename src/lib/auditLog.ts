import { supabase } from '@/integrations/supabase/client';
import { getStaffSession } from '@/lib/session';

export const logAudit = async (
  action: 'created' | 'updated' | 'deleted',
  tableName: string,
  recordId: string,
  details: string = ''
) => {
  const session = getStaffSession();
  const employeeId = session?.employeeId ?? null;
  const employeeName = session?.name ?? 'Unknown';

  await (supabase.from('audit_log' as any) as any).insert({
    employee_id: employeeId,
    employee_name: employeeName,
    action,
    table_name: tableName,
    record_id: recordId,
    details,
  });
};
