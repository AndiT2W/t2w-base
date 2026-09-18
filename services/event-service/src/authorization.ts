import { SetMetadata } from "@nestjs/common";
import type { UserRole } from "@prisma/client";

export const ALLOW_ORGANIZER = "allow-organizer";
export const REQUIRED_ROLES = "required-roles";
export const REQUIRE_FINANCE = "require-finance";

export const AllowOrganizer = () => SetMetadata(ALLOW_ORGANIZER, true);
export const Roles = (...roles: UserRole[]) => SetMetadata(REQUIRED_ROLES, roles);
export const FinanceAccess = () => SetMetadata(REQUIRE_FINANCE, true);
