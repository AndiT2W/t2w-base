# Roadmap

This roadmap is organized for AI-assisted delivery. Each phase should be implemented as a sequence of small, testable vertical slices.

## Wave 1: Define The Product

### Scope

- validate Temptwin workflows
- finalize MVP boundaries
- confirm roles, permissions, and reporting needs
- define the organizer, contact, and stakeholder-role model
- define the event template, dependency, and assignment-target model
- define the event overview and event-management linkage model
- define the grouped task-section model for one event-management plan
- document current Zendooin, ClickUp, and `n8n` usage

### AI Work Packages

- turn interviews or notes into structured requirement pages
- produce a permission matrix draft
- produce a customer and contact data model draft
- produce a task-template and dependency model draft
- produce an event master-data and event-management model draft
- produce a task-group and event-management section model draft
- produce a tool inventory and migration-gap document
- generate the initial epic backlog

### Target Outcome

- a signed-off specification and prioritized MVP backlog

## Wave 2: Build The Shared Core

### Scope

- choose architecture and initial stack
- implement auth, users, shared layout, navigation, and core entities
- create the domain relationships that connect CRM and projects
- create the event registry and event-management base entities
- create the base entities for teams, templates, and task dependencies
- design migration and automation boundaries with current systems

### AI Work Packages

- scaffold application structure
- generate entity models, basic CRUD flows, and test coverage
- generate shared UI shells and foundational documentation
- generate permission and assignment primitives
- generate migration adapters or import primitives where needed

### Target Outcome

- a stable internal platform foundation ready for feature slices

## Wave 3: Ship CRM MVP

### Scope

- organizer accounts, contacts, stakeholder roles, leads, opportunities
- pipeline views, activities, follow-ups, and summaries

### AI Work Packages

- build CRUD flows for CRM entities
- build organizer-contact-role relationship flows
- build pipeline and detail screens
- create sample seed data and acceptance tests

### Target Outcome

- sales can manage core CRM work in the application

## Wave 4: Ship Project Management MVP

### Scope

- event overview, event records, and event-management linkage
- projects, milestones, tasks, ownership, and status
- recurring event templates, dependencies, and escalation visibility
- grouped event-management sections and assignee workflows
- project overviews and execution tracking

### AI Work Packages

- build event list, event detail, and event-management linking flows
- generate project and task modules
- build grouped task-section views and section-based templates
- build template instantiation and dependency flows
- build planning and tracking screens
- add status, filters, critical-path signals, and project summary views

### Target Outcome

- delivery teams can run customer events and their linked operational workflows in the application

## Wave 5: Connect Sales And Delivery

### Scope

- opportunity-to-project conversion
- shared activity history
- handoff checklist and ownership flow

### AI Work Packages

- generate conversion actions and orchestration logic
- build linked record views and timeline aggregation
- create integration tests for the handoff path

### Target Outcome

- customer context survives the transition from sales to project delivery

## Wave 6: Billing And Operational Leverage

### Scope

- invoicing, dashboards, reminders, reporting, imports, exports, and first integrations

### AI Work Packages

- build invoice records, statuses, and organizer/project linking
- build open-invoice views and reminder/dunning flows
- build reporting endpoints and summary components
- generate automation rules and scheduled jobs
- create import/export flows with validation

### Target Outcome

- teams save manual effort and gain management visibility

## Wave 7: AI Features

### Scope

- summarization, drafting, recommendations, and guided next actions

### AI Work Packages

- implement prompt flows on top of stable data
- add review UX and audit logging
- measure accuracy and user value

### Target Outcome

- AI improves throughput without becoming the system of record

## Sequencing Guidance

- Do not start Wave 7 before Waves 2 to 5 are stable.
- Prefer completing one usable slice per workflow before broadening scope.
- Keep each AI-generated implementation task bounded to one feature, one verification path, and one documentation update.
