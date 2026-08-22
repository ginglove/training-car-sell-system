export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  SALE: "SALE",
  CUSTOMER: "CUSTOMER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Quản trị viên",
  MANAGER: "Cửa hàng trưởng",
  SALE: "Nhân viên kinh doanh",
  CUSTOMER: "Khách hàng",
};

export const ROUTE_ROLES: Record<string, Role[]> = {
  "/portal/dashboard": ["ADMIN", "MANAGER", "SALE"],
  "/portal/crm": ["ADMIN", "MANAGER", "SALE"],
  "/portal/discounts": ["ADMIN", "MANAGER", "SALE"],
  "/portal/inventory": ["ADMIN", "MANAGER"],
  "/portal/inventory/transfers": ["ADMIN", "MANAGER"],
  "/portal/users": ["ADMIN"],
  "/portal/config": ["ADMIN"],
  "/portal/audit-logs": ["ADMIN"],
  "/profile": ["ADMIN", "MANAGER", "SALE", "CUSTOMER"],
  "/orders": ["CUSTOMER", "SALE"],
  "/checkout": ["CUSTOMER", "SALE"],
  "/test-drive": ["CUSTOMER", "SALE"],
};
