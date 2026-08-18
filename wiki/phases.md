# Delivery Phases

## Phase 0: Product Discovery And Specification

### Objective

Turn the current high-level idea into validated requirements, user roles, workflows, and priorities.

### Outputs

- refined product specification
- role model and permission matrix
- organizer and contact role model
- event registry and event-management linkage model
- event project template and assignment model
- grouped event-management task model
- current-system inventory and migration map
- confirmed process map for CRM and project delivery
- prioritized MVP backlog

### Exit Criteria

- top workflows are validated with Temptwin stakeholders
- MVP scope is agreed
- current ClickUp, Zendooin, and `n8n` usage is documented at a useful level
- unknowns that block implementation are reduced to an acceptable level

## Phase 1: Platform Foundation

### Objective

Create the technical and domain foundation that both CRM and project management will use.

### Outputs

- base application architecture
- authentication and authorization
- core domain entities and relationships
- event and event-management base entities
- navigation, shared layout, audit model, and search baseline

### Exit Criteria

- users can sign in and access role-appropriate views
- core records can be created and related consistently
- the application has a stable structure for further slices

## Phase 2: CRM Core

### Objective

Deliver the minimum CRM workflows needed to manage leads, contacts, organizations, and opportunities.

### Outputs

- organization and contact management
- pipeline and opportunity management
- activity logging and follow-up tracking
- dashboard for sales visibility

### Exit Criteria

- sales can manage active pipeline in the system
- opportunities are linked to customer context
- follow-up ownership is visible and actionable

## Phase 3: Project Management Core

### Objective

Deliver the minimum project execution workflows needed to plan and track customer work.

### Outputs

- event overview and event detail management
- project creation and project templates
- recurring task groups for event operations
- grouped task sections with status and assignee handling
- milestones, tasks, assignments, and status tracking
- dependency tracking and critical-path visibility
- project dashboards and list views
- project notes and activity timeline

### Exit Criteria

- teams can view and manage a central list of active events
- project leads can run active projects in the platform
- team members can update work state directly
- overdue and blocking work is visible enough to drive intervention
- management can review project progress centrally

## Phase 4: CRM-To-Project Handoff

### Objective

Connect sales success to delivery kickoff with minimal context loss.

### Outputs

- opportunity-to-project conversion flow
- carryover of customer context into project setup
- handoff checklist and ownership transition
- linked reporting across sales and delivery

### Exit Criteria

- won opportunities can create project records with relevant context
- handoff is traceable and repeatable
- both sales and delivery can inspect shared history

## Phase 5: Billing, Automation, Reporting, And Integrations

### Objective

Increase operational leverage after the core workflows are stable.

### Outputs

- invoice records and billing status tracking
- reminder and dunning workflows
- reminders and notification rules
- saved views and reporting improvements
- data import or export tooling
- first external integrations where needed

### Exit Criteria

- important recurring work is partially automated
- open invoices and reminder flows are visible and operable in GCW Base
- management reporting is useful without manual assembly
- data can move into and out of the system safely

## Phase 6: AI Layer

### Objective

Add AI capabilities only after the underlying process and data model are reliable.

### Outputs

- AI summaries for records and timelines
- AI suggestions for next actions
- AI-assisted drafting for notes or project setup
- controlled prompt and audit strategy

### Exit Criteria

- AI features save real user time
- outputs are reviewable and bounded
- the team trusts the underlying data quality
