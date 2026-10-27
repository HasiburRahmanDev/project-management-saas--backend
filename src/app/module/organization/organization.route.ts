import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { organizationController } from "./organization.controller";
import { organizationValidation } from "./organization.validation";

const router = Router();

const allRoles = [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER];

router.post(
	"/",
	auth(Role.OWNER, Role.ADMIN, Role.MANAGER),
	validateRequest(organizationValidation.CreateOrganizationZodSchema),
	organizationController.createOrganization,
);
router.get("/", auth(...allRoles), organizationController.getMyOrganizations);
router.get(
	"/:id",
	auth(...allRoles),
	organizationController.getOrganizationById,
);
router.patch(
	"/:id",
	auth(...allRoles),
	validateRequest(organizationValidation.UpdateOrganizationZodSchema),
	organizationController.updateOrganization,
);
router.delete(
	"/:id",
	auth(...allRoles),
	organizationController.deleteOrganization,
);

export const OrganizationRoutes = router;
