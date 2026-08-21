# GCW Base Specification v1

## Purpose

Build GCW Base as a unified internal platform for Temptwin that combines CRM, project management, invoicing, and key operational automations so customer acquisition, customer care, event delivery, and commercial follow-up can be managed in one system, with a particular focus on organizer-centric customer relationships.

## Product Vision

GCW Base should replace the fragmented current setup with one shared workspace that connects the full lifecycle from lead to customer to active project to invoicing and follow-up work. The product should reduce tool fragmentation, make ownership clear, and create a reliable operational data model that can later support automation and AI assistance.

## Problem Statement

Temptwin needs a system that does all of the following in a connected way:

- collect and process customer data for organizers, contacts, and sales activity,
- manage repeatable event-delivery projects, tasks, milestones, ownership, and delivery progress,
- support invoicing and operational follow-up after delivery milestones are reached.

When CRM and project execution are disconnected, context gets lost during handoff, reporting becomes inconsistent, and automation becomes difficult.

At present, key workflows are spread across a Zendooin backend, ClickUp, and `n8n`, which creates duplication, context switching, and migration pressure toward a consolidated tool.

## Goals

- Create a single source of truth for customer and project operations.
- Consolidate the current multi-tool workflow into GCW Base over time.
- Represent organizer accounts and their stakeholder roles clearly.
- Maintain one central event overview with durable event identifiers and operational key data.
- Give event operations a repeatable project-plan structure with templates and urgency visibility.
- Make the transition from sales to delivery traceable and explicit.
- Give teams a simple workflow for planning, execution, status tracking, and follow-up.
- Provide a clear foundation for future AI-driven implementation and automation.

## Assumptions

- The first version is primarily for internal Temptwin teams.
- The primary customer type is an event organizer.
- A project will often correspond to one specific Time2Win event or delivery engagement.
- Each concrete event should have its own event record and linked operational management workflow.
- The current-state tool landscape includes a Zendooin backend, ClickUp, and `n8n`.
- The product should support multiple roles with different views and permissions.
- The first release should favor operational clarity over feature breadth.
- Exact Temptwin-specific workflows still need validation in later discovery.
- The product is multilingual from the start: German (`de`) is the default language and English (`en`) is supported from the first usable release.

## Multilingual Design Foundation

The UI and product language must be designed for German and English from the beginning. Visible text, domain labels, status presentations, validation, notifications, empty states, and system messages use translation keys rather than hard-coded strings. German is the default and fallback locale; English is delivered alongside each new feature. Dates, times, numbers, and currencies use locale-aware formatting, while persisted domain codes and API values remain language-neutral and stable. Layouts must tolerate different text lengths.

## Users And Roles

- Sales: manages leads, contacts, opportunities, follow-ups, and pipeline state.
- Account Management: maintains customer relationships and coordinates handoff.
- Project Lead: creates projects, plans milestones, assigns work, and tracks status.
- Team Member: updates tasks, notes, status, blockers, and progress.
- Operations Group: receives work as a team assignment for recurring delivery areas.
- Finance or Backoffice: prepares and tracks invoices and financial follow-up.
- Management: reviews pipeline, delivery load, project health, and key metrics.
- Admin: manages configuration, permissions, templates, and system settings.

## Core Product Scope

### CRM

- organizer accounts and contacts
- leads and opportunities
- multiple contacts per organizer
- role assignments for organizer stakeholders
- pipeline stages
- activity log for calls, emails, meetings, and notes
- reminders and follow-up tasks
- customer account overview

### Project Management

- central event overview
- event records with event ids and operational metadata
- projects and project templates
- repeatable event workflow templates
- event-management plans with grouped operational sections
- milestones and tasks
- linked event-management workflow per event
- task groups for recurring delivery domains such as bib numbers, registration, and timing
- dependencies and critical-path visibility
- owners, assignees, priorities, and due dates
- assignments to internal users, internal groups, or organizer-side contacts
- project status and health tracking
- comments, notes, and attachments metadata
- cross-project views for planning and monitoring

### Invoicing

- invoice records linked to organizers and projects
- open-invoice tracking
- invoice status tracking
- reminder and dunning workflow support
- automation hooks or native logic for billing follow-up
- visibility of billable project state and follow-up actions

### Shared Layer

- unified search
- shared timeline of customer and project activity
- role-based access
- dashboards and reporting
- overdue-task and escalation views
- auditability of status and ownership changes

## Primary End-To-End Workflows

### Workflow 0: Organizer Account Setup

1. A new organizer is created as a customer account.
2. Multiple contact persons are linked to the organizer.
3. Each contact receives one or more known responsibilities or roles.
4. The team can identify who is responsible for communication, approval, operations, or follow-up.

### Workflow 1: Lead To Project

1. A lead is created and qualified.
2. The lead becomes an opportunity linked to organization and contacts.
3. The opportunity is marked won.
4. A customer account, event record, and project context are created from the same context where needed.
5. The delivery team receives the relevant commercial, event, and relationship context.

### Workflow 2: Project Delivery

1. A project lead or operations user opens or creates a concrete event record.
2. A linked event-management workflow is instantiated from a template.
3. Recurring task groups such as bib numbers, registration, and timing are created automatically.
4. Tasks are assigned to internal users, groups, or organizer-side contacts.
5. Team members track progress, blockers, organizer-side deliverables, and preparation effort where relevant.
6. Management and account owners monitor delivery health and intervene on critical items.

### Workflow 3: Critical Path Monitoring

1. Task dependencies and due dates create an operational path through the event plan.
2. The system highlights overdue tasks and tasks that block downstream work.
3. Users can see where urgent escalation is needed.

### Workflow 4: Customer Continuity

1. Customer activities and project events are visible in one place.
2. Important milestones trigger reminders, billing steps, or follow-up actions.
3. Account owners can identify risk, opportunity, and next actions quickly.

### Workflow 5: Invoice Follow-Up

1. A completed or billable delivery state results in an invoice record.
2. Open invoices are visible together with due dates and status.
3. Reminder or dunning actions are triggered manually or automatically.
4. Finance and operations can see invoice follow-up without leaving the platform.

## Functional Requirements

### Must-Have For Initial Platform

- create, read, update, and archive organizations, contacts, leads, opportunities, events, event-management plans, projects, milestones, and tasks
- link contacts and opportunities to organizations
- support multiple contacts per organizer account
- store role information for organizer-side stakeholders
- maintain an event overview with one row or record per event
- store a durable event id separate from internal technical identifiers
- store event-specific metadata such as status, location, sport, type, participant count, and backend reference
- link projects to customers and optionally to the originating opportunity
- link each event to a dedicated event-management workflow
- support grouped event-management sections such as timing, bib numbers, finance, and preparation
- instantiate projects from reusable templates
- support recurring task groups for event operations
- assign tasks to internal users, internal groups, and organizer-side contacts
- model task dependencies and show critical-path-relevant blockers
- support statuses, priorities, owners, assignees, due dates, and notes
- support task states such as open, in progress, and complete
- support optional preparation estimates and preparation-required flags on relevant tasks
- record an activity history for CRM and project events
- track invoices and open invoices linked to organizer and project context
- support reminder or dunning follow-up for overdue invoices, either natively or through automation hooks
- provide filtered list views for pipeline, projects, and tasks
- provide an overdue and urgency-oriented work overview
- provide dashboard summaries for key operational signals

### Should-Have In Early Expansion

- reminders and notifications
- saved views and basic reporting
- lightweight document or attachment references
- invoice document generation
- import tools for existing spreadsheets or exports
- migration tools or imports for current operational data

### Later-Phase Enhancements

- workflow automation
- AI-assisted drafting, summarization, and next-step suggestions
- advanced analytics and forecasting
- external integrations such as email, calendar, accounting, or support tools

## Core Data Model

- `Organization`: company or customer account, typically an organizer
- `Contact`: person associated with an organizer or other organization
- `ContactRoleAssignment`: role or responsibility of a contact, potentially tied to an organizer, project, or future event context
- `Lead`: early-stage business opportunity
- `Opportunity`: qualified sales record with stage, value, and owner
- `Event`: concrete Time2Win event with event id, operational metadata, and organizer linkage
- `EventManagementPlan`: operational task container linked to one event
- `TaskGroup`: logical section inside an event-management plan
- `Project`: delivery unit linked to an organization and optionally an opportunity, often representing one event
- `ProjectTemplate`: reusable structure for recurring event project plans
- `EventTemplate`: reusable event-level setup or defaults for recurring event types
- `Milestone`: major checkpoint within a project
- `Task`: actionable unit of work within a project or follow-up process
- `TaskTemplate`: reusable task definition for operational plans
- `TaskGroupTemplate`: reusable grouped cluster of tasks for operational plans
- `TaskDependency`: relationship showing that one task blocks or precedes another
- `Team`: internal Time2Win group that can own task work
- `Invoice`: billing record linked to an organizer and optionally a project
- `AutomationRule`: configurable trigger or integration hook for operational follow-up such as reminders
- `Activity`: logged interaction or status event
- `User`: internal actor with role and permissions

## Non-Functional Requirements

- simple and predictable UX for non-technical internal users
- full traceability of important changes
- clean permission boundaries
- exportable data model
- migration-friendly design for existing operational data
- maintainable code structure suitable for iterative AI-assisted delivery
- testable domain logic and API contracts

## Out Of Scope For v1

- public customer portal
- complex resource planning
- heavy document management
- full accounting suite beyond invoicing
- enterprise-grade workflow designer

## Success Criteria For First Usable Release

- A lead can be created, qualified, and converted into a customer-linked project.
- An organizer can be stored with multiple contacts and understandable role assignments.
- An event can be created with a durable event id and visible operational key data.
- An event-management workflow can be created from a reusable template and tracked through milestones and tasks.
- Event-management tasks can be grouped into operational areas and worked through with clear statuses and assignees.
- Overdue work and critical-path blockers are visible enough to support timely intervention.
- Users can see current pipeline and project status without leaving the platform.
- Ownership, due dates, and latest activity are visible and reliable.

## Risks And Open Questions

- Temptwin-specific delivery workflows are still not documented.
- It is not yet decided whether event-specific roles require a separate event entity in the first release.
- It is not yet specified how organizer-side assignees will interact with task updates in the first release.
- The exact scope of the Zendooin backend is not yet documented.
- ClickUp list structures, invoice fields, and current automations are not yet documented.
- It is not yet decided whether task groups are purely template-driven or may also be edited freely per event.
- It is not yet fully decided whether `Project` and `Event` remain distinct entities in MVP v1 or collapse into one operational object with multiple views.
- It is not yet decided whether `n8n` remains in the target architecture or is partially replaced.
- Permission and data visibility rules are not yet specified.
- Reporting expectations are not yet quantified.
- A more concrete first target model for events, organizers, contacts, offers, calculations, and communication was captured in a later conversation and should be merged into the next specification revision.

## Related Pages

- [phases.md](phases.md)
- [roadmap.md](roadmap.md)
- [concepts/ai-delivery-workflow.md](concepts/ai-delivery-workflow.md)
- [concepts/event-delivery-planning.md](concepts/event-delivery-planning.md)
- [concepts/event-management-task-model.md](concepts/event-management-task-model.md)
- [concepts/event-registry-and-management.md](concepts/event-registry-and-management.md)
- [concepts/organizer-account-model.md](concepts/organizer-account-model.md)
- [concepts/tool-consolidation-and-migration.md](concepts/tool-consolidation-and-migration.md)
- [sources/2026-06-15-user-product-brief.md](sources/2026-06-15-user-product-brief.md)
- [sources/2026-06-15-user-customer-model.md](sources/2026-06-15-user-customer-model.md)
- [sources/2026-06-15-user-event-operations-brief.md](sources/2026-06-15-user-event-operations-brief.md)
- [sources/2026-06-15-user-current-tooling-landscape.md](sources/2026-06-15-user-current-tooling-landscape.md)
- [sources/2026-06-15-veranstaltungen-xlsx.md](sources/2026-06-15-veranstaltungen-xlsx.md)
- [sources/2026-06-15-veranstaltungsmanagement-xlsx-traunsee-halbmarathon-2026.md](sources/2026-06-15-veranstaltungsmanagement-xlsx-traunsee-halbmarathon-2026.md)
- [sources/2026-06-30-user-target-model-v1.md](sources/2026-06-30-user-target-model-v1.md)
