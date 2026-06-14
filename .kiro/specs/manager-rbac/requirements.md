# Requirements Document

## Introduction

This feature formalizes and tightens the role-based access control (RBAC) model of the KPI Monitor application. It redefines the MANAGER role as a "department-scoped admin": a manager holds full administrative authority over their own department's KPIs and submissions, but holds none of the global/governance powers reserved for administrators.

The feature also codifies two governance guardrails: separation of duties (a reviewer cannot decide on an entry they themselves submitted) and audit logging of KPI weight changes. Finally, it requires that access control be enforced at the backend (Supabase Row-Level Security and API route authorization), not by user-interface menu gating alone, and that the visible navigation stay consistent with the backend permission set.

The system already partially implements this model: RLS scopes managers to their department for `kpis` and `kpi_entries`, `api_keys` is admin-only via RLS, the sidebar gates menu items by role, and `auth-context` exposes `isAdmin` / `isManager` / `isStaff`. This specification defines the complete target behavior so the existing implementation can be audited and corrected where it diverges.

## Glossary

- **System**: The KPI Monitor application, including its Next.js frontend, API routes, and Supabase backend (PostgreSQL, Auth, RLS).
- **Access_Control_Layer**: The combined enforcement of Supabase Row-Level Security policies and Next.js API route authorization checks that determine whether an action is permitted.
- **RLS**: Supabase PostgreSQL Row-Level Security, the database-level policy mechanism that authorizes row reads and writes based on the requesting user.
- **UI_Navigation**: The application sidebar (`src/components/layout/sidebar.tsx`) that renders menu items based on the current user's role.
- **Admin**: A user whose `profiles.role` equals `admin`. Holds global governance authority across all departments.
- **Manager**: A user whose `profiles.role` equals `manager`. Holds department-scoped administrative authority limited to records where `department_id` equals the manager's own `profiles.department_id`.
- **Staff**: A user whose `profiles.role` equals `staff`. Can submit their own KPI entries and view their own KPIs.
- **Own_Department**: The department identified by the requesting user's `profiles.department_id`.
- **KPI**: A row in the `kpis` table, including its `target_value` and `weight` fields.
- **KPI_Weight**: The `kpis.weight` numeric field representing a KPI's relative contribution.
- **Entry**: A row in the `kpi_entries` table representing a staff submission, including `status`, `score` (0–100), `review_notes`, `reviewed_by`, and `submitted_by`.
- **Review_Decision**: An approve, reject, or revert-to-pending action on an Entry, including the assigned work `score` and `review_notes`.
- **Department_Member**: A row in the `profiles` table whose `department_id` equals a given department.
- **Activity_Log**: The `activity_log` audit table that records user-initiated changes for administrator review.
- **Self_Submitted_Entry**: An Entry whose `submitted_by` equals the user attempting to make a Review_Decision on it.

## Requirements

### Requirement 1: Role-Based Permission Model

**User Story:** As an organization owner, I want each role to have a clearly defined set of permissions, so that access to KPI data and governance functions is predictable and auditable.

#### Acceptance Criteria

1. THE System SHALL recognize exactly three roles: `admin`, `manager`, and `staff`, as defined by the `profiles.role` field.
2. THE Access_Control_Layer SHALL grant Admin full authority over all resources across all departments.
3. THE Access_Control_Layer SHALL grant Manager full administrative authority over KPIs and Entries that belong to the Manager's Own_Department, and SHALL deny Manager authority over records outside the Manager's Own_Department.
4. THE Access_Control_Layer SHALL grant Staff authority limited to creating and viewing their own Entries and viewing their own KPIs.
5. IF a user's role is not one of `admin`, `manager`, or `staff`, THEN THE Access_Control_Layer SHALL deny all KPI and Entry management actions for that user.

### Requirement 2: Manager Department-Scoped KPI Management

**User Story:** As a manager, I want to manage the KPIs of my own department, so that I can define and adjust the metrics my team is measured against.

#### Acceptance Criteria

1. WHERE a KPI's `department_id` equals the Manager's Own_Department, THE Access_Control_Layer SHALL permit the Manager to create that KPI.
2. WHERE a KPI's `department_id` equals the Manager's Own_Department, THE Access_Control_Layer SHALL permit the Manager to edit that KPI's fields, including `target_value` and `weight`.
3. WHERE a KPI's `department_id` equals the Manager's Own_Department, THE Access_Control_Layer SHALL permit the Manager to deactivate that KPI by setting `is_active` to `false`.
4. IF a Manager attempts to create, edit, or deactivate a KPI whose `department_id` does not equal the Manager's Own_Department, THEN THE Access_Control_Layer SHALL deny the action.

### Requirement 3: Manager Department-Scoped Submission Review

**User Story:** As a manager, I want to review my department's KPI submissions, so that I can validate my team's reported performance.

#### Acceptance Criteria

1. WHERE an Entry's KPI belongs to the Manager's Own_Department, THE Access_Control_Layer SHALL permit the Manager to approve that Entry, assigning a work `score` between 0 and 100 inclusive and optional `review_notes`.
2. WHERE an Entry's KPI belongs to the Manager's Own_Department, THE Access_Control_Layer SHALL permit the Manager to reject that Entry with `review_notes`.
3. WHERE an Entry's KPI belongs to the Manager's Own_Department, THE Access_Control_Layer SHALL permit the Manager to revise a previous Review_Decision, including changing the `score`, changing the `review_notes`, and reverting the Entry to `pending` status.
4. IF a Manager attempts a Review_Decision on an Entry whose KPI does not belong to the Manager's Own_Department, THEN THE Access_Control_Layer SHALL deny the action.
5. WHEN a Manager records a Review_Decision other than revert-to-pending, THE System SHALL set the Entry's `reviewed_by` to the Manager's user identifier and `reviewed_at` to the time of the decision.

### Requirement 4: Manager Department-Scoped Read Access for Team and Analytics

**User Story:** As a manager, I want to view my department's team roster and analytics, so that I can understand my team's composition and performance without being able to alter user records.

#### Acceptance Criteria

1. WHERE a Department_Member belongs to the Manager's Own_Department, THE Access_Control_Layer SHALL permit the Manager to view that Department_Member's profile.
2. THE Access_Control_Layer SHALL deny the Manager any action that creates, edits, or deletes a Department_Member's profile.
3. WHEN a Manager views Analytics, THE System SHALL restrict the analytics data to KPIs and Entries belonging to the Manager's Own_Department.
4. IF a Manager attempts to view a Department_Member's profile outside the Manager's Own_Department, THEN THE Access_Control_Layer SHALL deny the read.

### Requirement 5: Manager and Staff Self-Submission

**User Story:** As a manager or staff member, I want to submit my own KPI entries and view my own KPIs, so that I am measured on the same basis as the team.

#### Acceptance Criteria

1. THE Access_Control_Layer SHALL permit a Manager to create Entries where `submitted_by` equals the Manager's user identifier.
2. THE Access_Control_Layer SHALL permit a Staff user to create Entries where `submitted_by` equals the Staff user's identifier.
3. THE Access_Control_Layer SHALL permit a Manager and a Staff user to view Entries where `submitted_by` equals that user's identifier.
4. THE Access_Control_Layer SHALL permit a Manager and a Staff user to view their own KPI progress through the My KPIs view.

### Requirement 6: Admin-Only Governance Functions

**User Story:** As an organization owner, I want governance functions restricted to administrators, so that department managers cannot alter organization-wide structure, users, or integrations.

#### Acceptance Criteria

1. THE Access_Control_Layer SHALL permit only Admin to create, edit, or delete users and Department_Members.
2. THE Access_Control_Layer SHALL permit only Admin to create, edit, or delete departments.
3. THE Access_Control_Layer SHALL permit only Admin to create, edit, deactivate, or delete API keys and external/AI integration configuration.
4. THE Access_Control_Layer SHALL permit only Admin to access the System page and global Settings.
5. IF a Manager or Staff user attempts any action listed in this requirement, THEN THE Access_Control_Layer SHALL deny the action.
6. IF a Manager or Staff user is viewing an admin-only page WHEN their session role check runs and resolves to a non-admin role, THEN THE System SHALL immediately deny access and redirect the user away from the admin-only page.

### Requirement 7: Separation of Duties for Entry Review

**User Story:** As an organization owner, I want to prevent a reviewer from approving their own submissions, so that no single person can both report and validate their own performance.

#### Acceptance Criteria

1. IF a Manager attempts to record a Review_Decision on a Self_Submitted_Entry, THEN THE Access_Control_Layer SHALL deny the action.
2. WHERE an Entry is a Self_Submitted_Entry for a Manager, THE Access_Control_Layer SHALL permit only an Admin to record a Review_Decision on that Entry.
3. WHEN a Manager views a Self_Submitted_Entry that is `pending`, THE UI_Navigation SHALL present the approve and reject controls in a disabled or hidden state for that Manager.
4. THE Access_Control_Layer SHALL enforce the separation-of-duties restriction consistently across the user interface, API route authorization, and RLS layers, such that a Self_Submitted_Entry review denied at one layer is denied at every layer.

### Requirement 8: Audit Logging of KPI Weight Changes

**User Story:** As an administrator, I want every change to a KPI's weight recorded in the audit trail, so that I can review who adjusted scoring influence and when.

#### Acceptance Criteria

1. WHEN a user changes a KPI's `weight` to a value different from its previous value, THE System SHALL insert a record into the Activity_Log.
2. WHEN the System records a KPI_Weight change in the Activity_Log, THE System SHALL include the acting user's identifier, the affected KPI identifier, the previous weight value, and the new weight value.
3. WHILE a KPI edit changes fields other than `weight` and leaves `weight` unchanged, THE System SHALL NOT create a KPI_Weight-change Activity_Log record for that edit.
4. THE Access_Control_Layer SHALL permit only Admin to read Activity_Log records that pertain to KPI_Weight changes.

### Requirement 9: Navigation Consistency with Backend Permissions

**User Story:** As a user, I want the menu to show only the sections I am allowed to use, so that the interface reflects my actual permissions.

#### Acceptance Criteria

1. WHEN the UI_Navigation renders for a Manager, THE UI_Navigation SHALL display the My KPIs, Submit Entry, KPI Metrics, Submissions, Team, and Analytics sections and SHALL hide Departments, System, and Settings.
2. WHEN the UI_Navigation renders for an Admin, THE UI_Navigation SHALL display all governance sections, including Departments, System, and Settings.
3. WHEN the UI_Navigation renders for a Staff user, THE UI_Navigation SHALL display only sections permitted to Staff and SHALL hide KPI management, Submissions review, Departments, System, and Settings.
4. THE set of UI_Navigation sections shown to a role SHALL correspond to the actions that the Access_Control_Layer permits for that role.

### Requirement 10: Backend Enforcement of Access Control

**User Story:** As a security owner, I want access control enforced at the database and API layers, so that hiding a menu item is never the only barrier protecting a restricted action.

#### Acceptance Criteria

1. THE Access_Control_Layer SHALL enforce every role and department-scoping rule defined in this document at the backend through RLS policies or API route authorization checks.
2. IF a request attempts a restricted action through a direct API or database call without using the user interface, THEN THE Access_Control_Layer SHALL deny the action based on the requesting user's role and department.
3. WHERE the UI_Navigation hides or disables a control, THE Access_Control_Layer SHALL still deny the corresponding action at the backend if the request is issued by an unauthorized user.
4. WHEN an unauthorized request is denied, THE System SHALL return an authorization error and SHALL roll back any partial changes made before the authorization failure was detected, leaving stored data unmodified.
