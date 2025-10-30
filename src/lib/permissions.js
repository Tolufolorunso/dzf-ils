// Role-based permissions system
// This allows admins to easily manage what roles can do what actions

const PERMISSIONS = {
  // Patron management permissions
  PATRON_VIEW_ALL: ['admin', 'asst_admin', 'ict'], // Can view inactive patrons
  PATRON_ACTIVATE: ['admin', 'asst_admin', 'ict'], // Can reactivate patrons
  PATRON_DEACTIVATE: ['admin', 'asst_admin', 'ict'], // Can deactivate patrons
  PATRON_DELETE: ['admin'], // Can permanently delete patrons
  PATRON_EDIT: ['admin', 'asst_admin', 'ict', 'librarian'], // Can edit patron info

  // System permissions
  USER_MANAGEMENT: ['admin'], // Can manage users
  SYSTEM_SETTINGS: ['admin'], // Can change system settings

  // Library operations
  BOOK_CHECKOUT: ['admin', 'asst_admin', 'ict', 'librarian'], // Can checkout books
  BOOK_CHECKIN: ['admin', 'asst_admin', 'ict', 'librarian'], // Can checkin books
  ATTENDANCE_MARK: ['admin', 'asst_admin', 'ict', 'librarian'], // Can mark attendance

  // Analytics and reports
  ANALYTICS_VIEW: ['admin', 'asst_admin', 'ict', 'librarian'], // Can view analytics
  REPORTS_GENERATE: ['admin', 'asst_admin', 'ict'], // Can generate reports
};

/**
 * Check if a user role has permission for a specific action
 * @param {string} userRole - The user's role
 * @param {string} permission - The permission to check
 * @returns {boolean} - Whether the user has permission
 */
export function hasPermission(userRole, permission) {
  if (!userRole || !permission) return false;

  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;

  return allowedRoles.includes(userRole);
}

/**
 * Check if a user role can perform patron status changes
 * @param {string} userRole - The user's role
 * @param {string} action - 'activate' or 'deactivate'
 * @returns {boolean} - Whether the user can perform the action
 */
export function canManagePatronStatus(userRole, action) {
  if (action === 'activate') {
    return hasPermission(userRole, 'PATRON_ACTIVATE');
  } else if (action === 'deactivate') {
    return hasPermission(userRole, 'PATRON_DEACTIVATE');
  }
  return false;
}

/**
 * Get all permissions for a role
 * @param {string} userRole - The user's role
 * @returns {string[]} - Array of permissions the role has
 */
export function getRolePermissions(userRole) {
  if (!userRole) return [];

  return Object.keys(PERMISSIONS).filter((permission) =>
    hasPermission(userRole, permission)
  );
}

/**
 * Admin function to update permissions (for future use)
 * This would typically be called from an admin interface
 * @param {string} permission - The permission to update
 * @param {string[]} roles - Array of roles that should have this permission
 */
export function updatePermission(permission, roles) {
  if (PERMISSIONS[permission]) {
    PERMISSIONS[permission] = roles;
    return true;
  }
  return false;
}

export { PERMISSIONS };
