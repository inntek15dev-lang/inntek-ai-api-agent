/**
 * RBAC Middleware to authorize roles based on permissions.
 * @param {Array} allowedRoles - List of roles that can access the resource.
 */
const authorize = (allowedRoles = []) => {
  if (typeof allowedRoles === 'string') {
    allowedRoles = [allowedRoles];
  }

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Sin permisos: Rol no identificado.' });
    }

    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: `Permiso denegado para el rol: ${req.user.role}` });
    }

    next();
  };
};

/**
 * Granular Permission Checker (based on the Blueprint requirements).
 * @param {string} permission - e.g., 'write:colaboradores'
 */
const checkPermission = (requiredPermission) => {
  const ROLE_PERMISSIONS = {
    'SuperAdmin': ['all:all'],
    'Admin': ['read:all', 'write:colaboradores', 'write:asignaciones'],
    'User': ['read:own_profile', 'read:assigned_courses']
  };

  return (req, res, next) => {
    const userRole = req.user.role;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    if (userPermissions.includes('all:all')) {
      return next();
    }

    if (userPermissions.includes(requiredPermission)) {
      return next();
    }

    return res.status(403).json({ message: `Permiso insuficiente: requiere ${requiredPermission}` });
  };
};

module.exports = {
  authorize,
  checkPermission
};
