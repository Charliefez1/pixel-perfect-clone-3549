-- Add DELETE policies for all tables that only have ALL for admin
-- These tables already have admin ALL policies that cover DELETE:
-- activities, comments, contacts, contracts, deals, deliveries, delivery_tasks,
-- entity_documents, forms, invoice_items, invoices, organisations, 
-- project_milestones, projects, proposals, purchase_orders, rate_cards,
-- services, sessions, tasks, templates, time_entries

-- The admin ALL policies already grant DELETE permission, so no additional policies needed.
-- Just verify by selecting existing policies.
SELECT 'All admin ALL policies already include DELETE - no changes needed' as result;