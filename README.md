# Project Management SaaS — Backend

Express 5 + Prisma 7 (PostgreSQL) + Redis + Cloudinary + bKash.

## Setup

```bash
npm install
npx prisma migrate dev   # applies pending migrations and regenerates the client
npm run dev
```

Required env vars are listed in `src/app/config/index.ts`.

## Permissions

- **Platform roles** (`User.role`): `OWNER` / `ADMIN` can access everything. `MANAGER` and above can create organizations.
- **Organization owner**: manages the organization, its teams and member roles.
- **Team roles** (`TeamMember.role`): `LEAD` manages projects, sprints and members; `MEMBER` works on tasks, comments and attachments.

## API (`/api/v1`)

| Resource | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/refresh-token`, `POST /auth/google`, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| User | `PATCH /user/profile-image` (multipart `profileImage`) |
| Booking | `POST /booking/project-booking`, `POST /booking/pay-booking`, `POST /booking/cancel-booking`, `GET /booking/my-bookings`, `GET /booking/project-booking/payment/callback` (bKash) |
| Organizations | `POST /organizations`, `GET /organizations`, `GET/PATCH/DELETE /organizations/:id` |
| Teams | `POST /teams`, `GET /teams?organizationId=`, `GET/PATCH/DELETE /teams/:id`, `POST /teams/:id/members` (`{ email, role? }`), `PATCH/DELETE /teams/:id/members/:userId` |
| Projects | `POST /projects`, `GET /projects?teamId=&organizationId=&searchTerm=&page=&limit=&sortBy=&sortOrder=`, `GET/PATCH/DELETE /projects/:id` |
| Sprints | `POST /sprints`, `GET /sprints?projectId=`, `GET/PATCH/DELETE /sprints/:id` |
| Tasks | `POST /tasks`, `GET /tasks?projectId=&sprintId=(id\|backlog)&status=&priority=&assigneeId=&searchTerm=&page=&limit=`, `GET /tasks/my-tasks`, `GET/PATCH/DELETE /tasks/:id`, `PATCH /tasks/:id/status` |
| Comments | `POST /comments`, `GET /comments/task/:taskId`, `PATCH/DELETE /comments/:id` |
| Attachments | `POST /attachments/task/:taskId` (multipart `file`, max 10 MB), `GET /attachments/task/:taskId`, `DELETE /attachments/:id` |
| Activities | `GET /activities/me`, `GET /activities/task/:taskId`, `GET /activities/project/:projectId` |

Task, comment and attachment changes are recorded automatically in the activity log.
