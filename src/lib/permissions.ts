export type Permission =
  | 'admin'
  | 'orders'
  | 'kitchen'
  | 'bar'
  | 'reception'
  | 'reception_display'
  | 'housekeeping'
  | 'experiences'
  | 'cashier'
  | 'rooms'
  | 'rooms:view'
  | 'rooms:edit'
  | 'rooms:manage'
  | 'documents'
  | 'documents:view'
  | 'documents:edit'
  | 'hr'
  | 'reports'
  | 'inventory'
  | 'payroll';

export type PermissionLevel = 'off' | 'view' | 'edit' | 'manage';

/** Check if employee has any access (view or edit or manage) to a section */
export const hasAccess = (permissions: string[], section: string): boolean => {
  if (permissions.includes('admin')) return true;
  if (permissions.includes(section)) return true;
  if (permissions.includes(`${section}:view`)) return true;
  if (permissions.includes(`${section}:edit`)) return true;
  if (permissions.includes(`${section}:manage`)) return true;
  return false;
};

/** Check if employee can edit (not just view) a section */
export const canEdit = (permissions: string[], section: string): boolean => {
  if (permissions.includes('admin')) return true;
  if (permissions.includes(section)) return true;
  if (permissions.includes(`${section}:edit`)) return true;
  if (permissions.includes(`${section}:manage`)) return true;
  return false;
};

/** Check if employee can manage (highest level) a section */
export const canManage = (permissions: string[], section: string): boolean => {
  if (permissions.includes('admin')) return true;
  if (permissions.includes(`${section}:manage`)) return true;
  return false;
};

/** Get current permission level for a section */
export const getPermissionLevel = (permissions: string[], section: string): PermissionLevel => {
  if (permissions.includes(`${section}:manage`)) return 'manage';
  if (permissions.includes(`${section}:edit`) || permissions.includes(section)) return 'edit';
  if (permissions.includes(`${section}:view`)) return 'view';
  return 'off';
};

/** Check if employee can view sensitive documents */
export const canViewDocuments = (permissions: string[]): boolean => {
  if (permissions.includes('admin')) return true;
  if (permissions.includes('documents')) return true;
  if (permissions.includes('documents:view')) return true;
  if (permissions.includes('documents:edit')) return true;
  return false;
};
