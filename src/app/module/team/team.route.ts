import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { teamController } from "./team.controller";
import { teamValidation } from "./team.validation";

const router = Router();

const allRoles = [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER];

router.post(
	"/",
	auth(...allRoles),
	validateRequest(teamValidation.CreateTeamZodSchema),
	teamController.createTeam,
);
router.get("/", auth(...allRoles), teamController.getTeams);
router.get("/:id", auth(...allRoles), teamController.getTeamById);
router.patch(
	"/:id",
	auth(...allRoles),
	validateRequest(teamValidation.UpdateTeamZodSchema),
	teamController.updateTeam,
);
router.delete("/:id", auth(...allRoles), teamController.deleteTeam);

router.post(
	"/:id/members",
	auth(...allRoles),
	validateRequest(teamValidation.AddMemberZodSchema),
	teamController.addMember,
);
router.patch(
	"/:id/members/:userId",
	auth(...allRoles),
	validateRequest(teamValidation.UpdateMemberRoleZodSchema),
	teamController.updateMemberRole,
);
router.delete(
	"/:id/members/:userId",
	auth(...allRoles),
	teamController.removeMember,
);

export const TeamRoutes = router;
