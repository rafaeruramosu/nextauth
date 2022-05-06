type User = {
  permissions: string[];
  roles: string[];
}

type ValidateUserPermissions = {
  user: User;
  permissions?: string[];
  roles?: string[];
}

export function validateUserPermissions({ 
  user, 
  permissions, 
  roles 
}: ValidateUserPermissions) {
  if(permissions?.length > 0) {
    const hasAllPermissions = permissions.every(permission => { // 'every' will only return true if all the conditions you put within the function are satisfied
      return user.permissions.includes(permission); 
    });

    if(!hasAllPermissions) {
      return false;
    }
  }

  if(roles?.length > 0) {
    const hasAllRoles = roles.some(role => { // 'some' returns true if at least one condition is satisfied
      return user.roles.includes(role); 
    });

    if(!hasAllRoles) {
      return false;
    }
  }

  return true;
}