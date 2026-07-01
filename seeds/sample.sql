-- Customers
insert into customers (first_name, last_name, email, phone, address_line1, city, state, postal_code)
values
('John', 'Doe', 'john.doe@example.com', '+1234567890', '123 Main St', 'Springfield', 'IL', '62701'),
('Emma', 'Brown', 'emma.brown@example.com', '+1234567891', '456 Oak Ave', 'Springfield', 'IL', '62702'),
('Mike', 'Taylor', 'mike.taylor@example.com', '+1234567892', '789 Pine Rd', 'Springfield', 'IL', '62703'),
('Sarah', 'Johnson', 'sarah.johnson@example.com', '+1234567893', '12 Maple St', 'Springfield', 'IL', '62704'),
('Robert', 'King', 'robert.king@example.com', '+1234567894', '34 Birch Blvd', 'Springfield', 'IL', '62705'),
('Olivia', 'Green', 'olivia.green@example.com', '+1234567895', '56 Cedar Ct', 'Springfield', 'IL', '62706'),
('William', 'Harris', 'william.harris@example.com', '+1234567896', '78 Walnut Way', 'Springfield', 'IL', '62707'),
('Sophia', 'Martinez', 'sophia.martinez@example.com', '+1234567897', '90 Chestnut Dr', 'Springfield', 'IL', '62708'),
('Daniel', 'Lee', 'daniel.lee@example.com', '+1234567898', '246 Spruce Ln', 'Springfield', 'IL', '62709'),
('Ava', 'Walker', 'ava.walker@example.com', '+1234567899', '135 Elm Pl', 'Springfield', 'IL', '62710')
on conflict do nothing;

-- Leads
insert into leads (customer_id, title, description, status, source)
values
((select id from customers where email = 'john.doe@example.com'), 'Roof Inspection', 'Initial inspection requested.', 'new', 'Website'),
((select id from customers where email = 'emma.brown@example.com'), 'Shingle Repair', 'Missing shingles after storm.', 'contacted', 'Outreach'),
((select id from customers where email = 'mike.taylor@example.com'), 'Full Re-roof', 'Aging roof needs replacement.', 'qualified', 'Google Forms'),
((select id from customers where email = 'sarah.johnson@example.com'), 'Skylight Leak', 'Leak around skylight.', 'new', 'Referral'),
((select id from customers where email = 'robert.king@example.com'), 'Gutter Replacement', 'Old gutters need replacement.', 'qualified', 'Facebook'),
((select id from customers where email = 'olivia.green@example.com'), 'Attic Ventilation', 'Poor ventilation causing moisture.', 'lost', 'Website'),
((select id from customers where email = 'william.harris@example.com'), 'Metal Roof Install', 'Wants metal roofing.', 'contacted', 'Walk-in'),
((select id from customers where email = 'sophia.martinez@example.com'), 'Flat Roof Repair', 'Commercial flat roof ponding.', 'qualified', 'Google Ads'),
((select id from customers where email = 'daniel.lee@example.com'), 'Storm Damage', 'Wind damage across roof.', 'converted', 'Insurance'),
((select id from customers where email = 'ava.walker@example.com'), 'Soffit/Fascia Repair', 'Rotten soffit boards.', 'new', 'Email')
on conflict do nothing;

-- Assignments
insert into assignments (lead_id, assigned_to_id, owner_id, role, status)
values
((select id from leads where title = 'Roof Inspection' limit 1), (select id from users where role = 'REP' limit 1), (select id from users where role = 'OWNER' limit 1), 'Sales Rep', 'assigned'),
((select id from leads where title = 'Shingle Repair' limit 1), (select id from users where role = 'REP' limit 1), (select id from users where role = 'OWNER' limit 1), 'Sales Rep', 'assigned'),
((select id from leads where title = 'Full Re-roof' limit 1), (select id from users where role = 'REP' limit 1), (select id from users where role = 'OWNER' limit 1), 'Sales Rep', 'assigned'),
((select id from leads where title = 'Skylight Leak' limit 1), (select id from users where role = 'REP' limit 1), (select id from users where role = 'OWNER' limit 1), 'Sales Rep', 'assigned'),
((select id from leads where title = 'Gutter Replacement' limit 1), (select id from users where role = 'REP' limit 1), (select id from users where role = 'OWNER' limit 1), 'Sales Rep', 'assigned'),
((select id from leads where title = 'Attic Ventilation' limit 1), (select id from users where role = 'REP' limit 1), (select id from users where role = 'OWNER' limit 1), 'Sales Rep', 'assigned'),
((select id from leads where title = 'Metal Roof Install' limit 1), (select id from users where role = 'REP' limit 1), (select id from users where role = 'OWNER' limit 1), 'Sales Rep', 'assigned'),
((select id from leads where title = 'Flat Roof Repair' limit 1), (select id from users where role = 'REP' limit 1), (select id from users where role = 'OWNER' limit 1), 'Sales Rep', 'assigned'),
((select id from leads where title = 'Storm Damage' limit 1), (select id from users where role = 'REP' limit 1), (select id from users where role = 'OWNER' limit 1), 'Sales Rep', 'assigned'),
((select id from leads where title = 'Soffit/Fascia Repair' limit 1), (select id from users where role = 'REP' limit 1), (select id from users where role = 'OWNER' limit 1), 'Sales Rep', 'assigned')
on conflict do nothing;

-- Jobs (with progress field)
insert into jobs (customer_id, lead_id, title, description, status, progress, scheduled_date, start_date, end_date, crew_details)
values
((select id from customers where email = 'john.doe@example.com'), (select id from leads where title = 'Roof Inspection' limit 1), 'Roof Inspection', 'Schedule inspection', 'scheduled', 0, current_date + 1, null, null, 'Crew A - 2 members'),
((select id from customers where email = 'emma.brown@example.com'), (select id from leads where title = 'Shingle Repair' limit 1), 'Shingle Repair', 'Repair missing shingles', 'in_progress', 45, current_date, current_date - 2, null, 'Crew B - 3 members'),
((select id from customers where email = 'mike.taylor@example.com'), (select id from leads where title = 'Full Re-roof' limit 1), 'Full Re-roof', 'Complete replacement', 'completed', 100, current_date - 3, current_date - 10, current_date - 3, 'Crew C - 5 members'),
((select id from customers where email = 'sarah.johnson@example.com'), (select id from leads where title = 'Skylight Leak' limit 1), 'Skylight Leak Repair', 'Reseal skylight curb', 'scheduled', 0, current_date + 2, null, null, 'Crew A - 2 members'),
((select id from customers where email = 'robert.king@example.com'), (select id from leads where title = 'Gutter Replacement' limit 1), 'Gutter Replacement', 'Aluminum K-style gutters', 'scheduled', 0, current_date + 5, null, null, 'Crew B - 3 members'),
((select id from customers where email = 'sophia.martinez@example.com'), (select id from leads where title = 'Flat Roof Repair' limit 1), 'Flat Roof Repair', 'TPO patching and drains', 'in_progress', 75, current_date + 1, current_date - 5, null, 'Crew D - 4 members'),
((select id from customers where email = 'daniel.lee@example.com'), (select id from leads where title = 'Storm Damage' limit 1), 'Storm Damage Repair', 'Shingle replacement under insurance', 'pending_payment', 90, current_date + 3, current_date - 7, current_date - 1, 'Crew C - 5 members'),
((select id from customers where email = 'william.harris@example.com'), (select id from leads where title = 'Metal Roof Install' limit 1), 'Metal Roof Install', 'Standing seam roof', 'cancelled', 0, current_date - 1, null, null, null)
on conflict do nothing;

-- Estimates
insert into estimates (customer_id, job_id, status, valid_until, total_amount)
values
((select id from customers where email = 'john.doe@example.com'), (select id from jobs where title = 'Roof Inspection' limit 1), 'draft', current_date + 14, 250.00),
((select id from customers where email = 'emma.brown@example.com'), (select id from jobs where title = 'Shingle Repair' limit 1), 'sent', current_date + 14, 1200.00),
((select id from customers where email = 'mike.taylor@example.com'), (select id from jobs where title = 'Full Re-roof' limit 1), 'accepted', current_date + 14, 9800.00),
((select id from customers where email = 'sarah.johnson@example.com'), (select id from jobs where title = 'Skylight Leak Repair' limit 1), 'draft', current_date + 10, 450.00),
((select id from customers where email = 'robert.king@example.com'), (select id from jobs where title = 'Gutter Replacement' limit 1), 'sent', current_date + 15, 2100.00),
((select id from customers where email = 'sophia.martinez@example.com'), (select id from jobs where title = 'Flat Roof Repair' limit 1), 'sent', current_date + 20, 5200.00),
((select id from customers where email = 'daniel.lee@example.com'), (select id from jobs where title = 'Storm Damage Repair' limit 1), 'accepted', current_date + 30, 6800.00)
on conflict do nothing;

-- Estimate Items
insert into estimate_items (estimate_id, name, description, quantity, unit_price, total)
values
((select id from estimates where customer_id = (select id from customers where email = 'john.doe@example.com') limit 1), 'Inspection Fee', 'Standard roof inspection', 1, 250.00, 250.00),
((select id from estimates where customer_id = (select id from customers where email = 'emma.brown@example.com') limit 1), 'Shingle Pack', 'Architectural shingles', 3, 300.00, 900.00),
((select id from estimates where customer_id = (select id from customers where email = 'emma.brown@example.com') limit 1), 'Labor', 'Repair labor', 1, 300.00, 300.00),
((select id from estimates where customer_id = (select id from customers where email = 'mike.taylor@example.com') limit 1), 'Materials', 'Full re-roof materials', 1, 6000.00, 6000.00),
((select id from estimates where customer_id = (select id from customers where email = 'mike.taylor@example.com') limit 1), 'Labor', 'Full re-roof labor', 1, 3800.00, 3800.00),
((select id from estimates where customer_id = (select id from customers where email = 'sarah.johnson@example.com') limit 1), 'Sealant', 'Polyurethane sealant', 2, 45.00, 90.00),
((select id from estimates where customer_id = (select id from customers where email = 'sarah.johnson@example.com') limit 1), 'Labor', 'Leak diagnostics & repair', 1, 360.00, 360.00),
((select id from estimates where customer_id = (select id from customers where email = 'robert.king@example.com') limit 1), 'Gutters', '5" K-style aluminum', 120, 10.00, 1200.00),
((select id from estimates where customer_id = (select id from customers where email = 'robert.king@example.com') limit 1), 'Downspouts', 'Matching downspouts', 6, 100.00, 600.00),
((select id from estimates where customer_id = (select id from customers where email = 'robert.king@example.com') limit 1), 'Labor', 'Install crew', 1, 300.00, 300.00),
((select id from estimates where customer_id = (select id from customers where email = 'sophia.martinez@example.com') limit 1), 'TPO Membrane', '60 mil TPO patch', 1, 3500.00, 3500.00),
((select id from estimates where customer_id = (select id from customers where email = 'sophia.martinez@example.com') limit 1), 'Drains', 'Install new roof drains', 2, 600.00, 1200.00),
((select id from estimates where customer_id = (select id from customers where email = 'sophia.martinez@example.com') limit 1), 'Labor', 'Commercial crew', 1, 500.00, 500.00),
((select id from estimates where customer_id = (select id from customers where email = 'daniel.lee@example.com') limit 1), 'Shingles', 'Insurance-grade shingles', 1, 4200.00, 4200.00),
((select id from estimates where customer_id = (select id from customers where email = 'daniel.lee@example.com') limit 1), 'Labor', 'Tear-off and install', 1, 2600.00, 2600.00)
on conflict do nothing;

-- Proposals (one per estimate)
insert into proposals (assignment_id, estimate_id, content, status)
values
(
	(select id from assignments where lead_id = (select id from leads where customer_id = (select id from customers where email = 'john.doe@example.com') limit 1) limit 1),
	(select id from estimates where customer_id = (select id from customers where email = 'john.doe@example.com') limit 1),
	'Proposal for inspection',
	'draft'
),
(
	(select id from assignments where lead_id = (select id from leads where customer_id = (select id from customers where email = 'emma.brown@example.com') limit 1) limit 1),
	(select id from estimates where customer_id = (select id from customers where email = 'emma.brown@example.com') limit 1),
	'Proposal for shingle repair',
	'sent'
),
(
	(select id from assignments where lead_id = (select id from leads where customer_id = (select id from customers where email = 'mike.taylor@example.com') limit 1) limit 1),
	(select id from estimates where customer_id = (select id from customers where email = 'mike.taylor@example.com') limit 1),
	'Proposal for full re-roof',
	'signed'
),
(
	(select id from assignments where lead_id = (select id from leads where customer_id = (select id from customers where email = 'sarah.johnson@example.com') limit 1) limit 1),
	(select id from estimates where customer_id = (select id from customers where email = 'sarah.johnson@example.com') limit 1),
	'Proposal for skylight leak repair',
	'draft'
),
(
	(select id from assignments where lead_id = (select id from leads where customer_id = (select id from customers where email = 'robert.king@example.com') limit 1) limit 1),
	(select id from estimates where customer_id = (select id from customers where email = 'robert.king@example.com') limit 1),
	'Proposal for gutter replacement',
	'sent'
),
(
	(select id from assignments where lead_id = (select id from leads where customer_id = (select id from customers where email = 'sophia.martinez@example.com') limit 1) limit 1),
	(select id from estimates where customer_id = (select id from customers where email = 'sophia.martinez@example.com') limit 1),
	'Proposal for flat roof repairs',
	'sent'
),
(
	(select id from assignments where lead_id = (select id from leads where customer_id = (select id from customers where email = 'daniel.lee@example.com') limit 1) limit 1),
	(select id from estimates where customer_id = (select id from customers where email = 'daniel.lee@example.com') limit 1),
	'Proposal for storm damage repair',
	'signed'
)
on conflict do nothing;

-- Invoices (with subtotal, tax_rate, tax_amount, invoice_number, created_by_id)
-- Note: created_by_id will be set to null if no users exist, or to the first user with matching role
insert into invoices (customer_id, job_id, estimate_id, status, invoice_number, due_date, subtotal, tax_rate, tax_amount, total_amount, created_by_id)
select 
	(select id from customers where email = 'mike.taylor@example.com'),
	(select id from jobs where title = 'Full Re-roof' limit 1),
	(select id from estimates where customer_id = (select id from customers where email = 'mike.taylor@example.com') limit 1),
	'sent', 'INV-2024-001', current_date + 10, 9800.00, 8.5, 833.00, 10633.00,
	(select id from users where role = 'OWNER' limit 1)
where not exists (select 1 from invoices where invoice_number = 'INV-2024-001');

insert into invoices (customer_id, job_id, estimate_id, status, invoice_number, due_date, subtotal, tax_rate, tax_amount, total_amount, created_by_id)
select 
	(select id from customers where email = 'robert.king@example.com'),
	(select id from jobs where title = 'Gutter Replacement' limit 1),
	(select id from estimates where customer_id = (select id from customers where email = 'robert.king@example.com') limit 1),
	'sent', 'INV-2024-002', current_date + 20, 2100.00, 8.5, 178.50, 2278.50,
	(select id from users where role = 'REP' limit 1)
where not exists (select 1 from invoices where invoice_number = 'INV-2024-002');

insert into invoices (customer_id, job_id, estimate_id, status, invoice_number, due_date, subtotal, tax_rate, tax_amount, total_amount, created_by_id)
select 
	(select id from customers where email = 'daniel.lee@example.com'),
	(select id from jobs where title = 'Storm Damage Repair' limit 1),
	(select id from estimates where customer_id = (select id from customers where email = 'daniel.lee@example.com') limit 1),
	'paid', 'INV-2024-003', current_date + 25, 6800.00, 8.5, 578.00, 7378.00,
	(select id from users where role = 'OWNER' limit 1)
where not exists (select 1 from invoices where invoice_number = 'INV-2024-003');

insert into invoices (customer_id, job_id, estimate_id, status, invoice_number, due_date, subtotal, tax_rate, tax_amount, total_amount, created_by_id)
select 
	(select id from customers where email = 'emma.brown@example.com'),
	(select id from jobs where title = 'Shingle Repair' limit 1),
	(select id from estimates where customer_id = (select id from customers where email = 'emma.brown@example.com') limit 1),
	'draft', 'INV-2024-004', current_date + 15, 1200.00, 8.5, 102.00, 1302.00,
	(select id from users where role = 'REP' limit 1)
where not exists (select 1 from invoices where invoice_number = 'INV-2024-004');

-- Invoice Items
insert into invoice_items (invoice_id, name, description, quantity, unit_price, total)
values
((select id from invoices where invoice_number = 'INV-2024-001' limit 1), 'Materials', 'Full re-roof materials', 1, 6000.00, 6000.00),
((select id from invoices where invoice_number = 'INV-2024-001' limit 1), 'Labor', 'Full re-roof labor', 1, 3800.00, 3800.00),
((select id from invoices where invoice_number = 'INV-2024-002' limit 1), 'Gutters', '5" K-style aluminum', 120, 10.00, 1200.00),
((select id from invoices where invoice_number = 'INV-2024-002' limit 1), 'Downspouts', 'Matching downspouts', 6, 100.00, 600.00),
((select id from invoices where invoice_number = 'INV-2024-002' limit 1), 'Labor', 'Install crew', 1, 300.00, 300.00),
((select id from invoices where invoice_number = 'INV-2024-003' limit 1), 'Shingles', 'Insurance-grade shingles', 1, 4200.00, 4200.00),
((select id from invoices where invoice_number = 'INV-2024-003' limit 1), 'Labor', 'Tear-off and install', 1, 2600.00, 2600.00),
((select id from invoices where invoice_number = 'INV-2024-004' limit 1), 'Shingle Pack', 'Architectural shingles', 3, 300.00, 900.00),
((select id from invoices where invoice_number = 'INV-2024-004' limit 1), 'Labor', 'Repair labor', 1, 300.00, 300.00)
on conflict do nothing;

-- Payments
insert into payments (invoice_id, amount, method, paid_at)
values
((select id from invoices where invoice_number = 'INV-2024-001' limit 1), 5000.00, 'card', current_timestamp - interval '2 days'),
((select id from invoices where invoice_number = 'INV-2024-003' limit 1), 7378.00, 'ach', current_timestamp - interval '1 day'),
((select id from invoices where invoice_number = 'INV-2024-002' limit 1), 500.00, 'cash', current_timestamp - interval '3 days')
on conflict do nothing;

-- Job Status History (for jobs with progress)
-- Only insert if users exist and table exists
insert into job_status_history (job_id, status, description, added_by_id)
select 
	(select id from jobs where title = 'Shingle Repair' limit 1),
	'Job Started',
	'Crew arrived on site and began inspection',
	(select id from users where role = 'REP' limit 1)
where exists (select 1 from jobs where title = 'Shingle Repair')
	and exists (select 1 from users where role = 'REP')
	and not exists (select 1 from job_status_history where job_id = (select id from jobs where title = 'Shingle Repair' limit 1) and status = 'Job Started');

insert into job_status_history (job_id, status, description, added_by_id)
select 
	(select id from jobs where title = 'Shingle Repair' limit 1),
	'Materials Ordered',
	'Architectural shingles ordered from supplier',
	(select id from users where role = 'OWNER' limit 1)
where exists (select 1 from jobs where title = 'Shingle Repair')
	and exists (select 1 from users where role = 'OWNER');

insert into job_status_history (job_id, status, description, added_by_id)
select 
	(select id from jobs where title = 'Full Re-roof' limit 1),
	'Job Started',
	'Demolition crew arrived',
	(select id from users where role = 'OWNER' limit 1)
where exists (select 1 from jobs where title = 'Full Re-roof')
	and exists (select 1 from users where role = 'OWNER');

insert into job_status_history (job_id, status, description, added_by_id)
select 
	(select id from jobs where title = 'Full Re-roof' limit 1),
	'Materials Delivered',
	'All materials delivered to site',
	(select id from users where role = 'REP' limit 1)
where exists (select 1 from jobs where title = 'Full Re-roof')
	and exists (select 1 from users where role = 'REP');

insert into job_status_history (job_id, status, description, added_by_id)
select 
	(select id from jobs where title = 'Full Re-roof' limit 1),
	'Roofing Complete',
	'All shingles installed and sealed',
	(select id from users where role = 'OWNER' limit 1)
where exists (select 1 from jobs where title = 'Full Re-roof')
	and exists (select 1 from users where role = 'OWNER');

insert into job_status_history (job_id, status, description, added_by_id)
select 
	(select id from jobs where title = 'Full Re-roof' limit 1),
	'Job Completed',
	'Final inspection passed, job complete',
	(select id from users where role = 'OWNER' limit 1)
where exists (select 1 from jobs where title = 'Full Re-roof')
	and exists (select 1 from users where role = 'OWNER');

insert into job_status_history (job_id, status, description, added_by_id)
select 
	(select id from jobs where title = 'Flat Roof Repair' limit 1),
	'Job Started',
	'TPO patching began',
	(select id from users where role = 'REP' limit 1)
where exists (select 1 from jobs where title = 'Flat Roof Repair')
	and exists (select 1 from users where role = 'REP');

insert into job_status_history (job_id, status, description, added_by_id)
select 
	(select id from jobs where title = 'Flat Roof Repair' limit 1),
	'Materials Delivered',
	'TPO membrane and drains delivered',
	(select id from users where role = 'OWNER' limit 1)
where exists (select 1 from jobs where title = 'Flat Roof Repair')
	and exists (select 1 from users where role = 'OWNER');

insert into job_status_history (job_id, status, description, added_by_id)
select 
	(select id from jobs where title = 'Storm Damage Repair' limit 1),
	'Job Started',
	'Insurance claim approved, work began',
	(select id from users where role = 'OWNER' limit 1)
where exists (select 1 from jobs where title = 'Storm Damage Repair')
	and exists (select 1 from users where role = 'OWNER');

insert into job_status_history (job_id, status, description, added_by_id)
select 
	(select id from jobs where title = 'Storm Damage Repair' limit 1),
	'Materials Delivered',
	'Shingles delivered',
	(select id from users where role = 'REP' limit 1)
where exists (select 1 from jobs where title = 'Storm Damage Repair')
	and exists (select 1 from users where role = 'REP');

insert into job_status_history (job_id, status, description, added_by_id)
select 
	(select id from jobs where title = 'Storm Damage Repair' limit 1),
	'Roofing Complete',
	'All damaged areas replaced',
	(select id from users where role = 'OWNER' limit 1)
where exists (select 1 from jobs where title = 'Storm Damage Repair')
	and exists (select 1 from users where role = 'OWNER');

insert into job_status_history (job_id, status, description, added_by_id)
select 
	(select id from jobs where title = 'Storm Damage Repair' limit 1),
	'Job Completed',
	'Final inspection complete',
	(select id from users where role = 'OWNER' limit 1)
where exists (select 1 from jobs where title = 'Storm Damage Repair')
	and exists (select 1 from users where role = 'OWNER');

-- Job Notes (only if table exists and users exist)
insert into job_notes (job_id, content, created_by_id)
select 
	(select id from jobs where title = 'Shingle Repair' limit 1),
	'Customer prefers architectural shingles to match existing roof',
	(select id from users where role = 'REP' limit 1)
where exists (select 1 from jobs where title = 'Shingle Repair')
	and exists (select 1 from users where role = 'REP');

insert into job_notes (job_id, content, created_by_id)
select 
	(select id from jobs where title = 'Shingle Repair' limit 1),
	'Site inspection completed, 3 bundles needed',
	(select id from users where role = 'OWNER' limit 1)
where exists (select 1 from jobs where title = 'Shingle Repair')
	and exists (select 1 from users where role = 'OWNER');

insert into job_notes (job_id, content, created_by_id)
select 
	(select id from jobs where title = 'Full Re-roof' limit 1),
	'Customer requested premium shingles',
	(select id from users where role = 'REP' limit 1)
where exists (select 1 from jobs where title = 'Full Re-roof')
	and exists (select 1 from users where role = 'REP');

insert into job_notes (job_id, content, created_by_id)
select 
	(select id from jobs where title = 'Full Re-roof' limit 1),
	'Weather delay - rescheduled for next week',
	(select id from users where role = 'OWNER' limit 1)
where exists (select 1 from jobs where title = 'Full Re-roof')
	and exists (select 1 from users where role = 'OWNER');

insert into job_notes (job_id, content, created_by_id)
select 
	(select id from jobs where title = 'Flat Roof Repair' limit 1),
	'Commercial property, need access during business hours',
	(select id from users where role = 'REP' limit 1)
where exists (select 1 from jobs where title = 'Flat Roof Repair')
	and exists (select 1 from users where role = 'REP');

insert into job_notes (job_id, content, created_by_id)
select 
	(select id from jobs where title = 'Storm Damage Repair' limit 1),
	'Insurance adjuster approved full replacement',
	(select id from users where role = 'OWNER' limit 1)
where exists (select 1 from jobs where title = 'Storm Damage Repair')
	and exists (select 1 from users where role = 'OWNER');

insert into job_notes (job_id, content, created_by_id)
select 
	(select id from jobs where title = 'Storm Damage Repair' limit 1),
	'Customer very satisfied with progress',
	(select id from users where role = 'REP' limit 1)
where exists (select 1 from jobs where title = 'Storm Damage Repair')
	and exists (select 1 from users where role = 'REP');

-- Job Feed Items (only if table exists and users exist)
insert into job_feed_items (job_id, type, content, created_by_id, tagged_user_ids)
select 
	(select id from jobs where title = 'Shingle Repair' limit 1),
	'message',
	'Crew will arrive at 8 AM tomorrow',
	(select id from users where role = 'REP' limit 1),
	ARRAY[]::bigint[]
where exists (select 1 from jobs where title = 'Shingle Repair')
	and exists (select 1 from users where role = 'REP');

insert into job_feed_items (job_id, type, content, created_by_id, tagged_user_ids)
select 
	(select id from jobs where title = 'Shingle Repair' limit 1),
	'message',
	'Materials have been ordered and will arrive Friday',
	(select id from users where role = 'OWNER' limit 1),
	ARRAY[]::bigint[]
where exists (select 1 from jobs where title = 'Shingle Repair')
	and exists (select 1 from users where role = 'OWNER');

insert into job_feed_items (job_id, type, content, created_by_id, tagged_user_ids)
select 
	(select id from jobs where title = 'Full Re-roof' limit 1),
	'message',
	'Great progress today! Roof is 75% complete',
	(select id from users where role = 'OWNER' limit 1),
	ARRAY[]::bigint[]
where exists (select 1 from jobs where title = 'Full Re-roof')
	and exists (select 1 from users where role = 'OWNER');

insert into job_feed_items (job_id, type, content, created_by_id, tagged_user_ids)
select 
	(select id from jobs where title = 'Flat Roof Repair' limit 1),
	'message',
	'Need to coordinate with building manager for access',
	(select id from users where role = 'REP' limit 1),
	ARRAY[]::bigint[]
where exists (select 1 from jobs where title = 'Flat Roof Repair')
	and exists (select 1 from users where role = 'REP');

insert into job_feed_items (job_id, type, content, created_by_id, tagged_user_ids)
select 
	(select id from jobs where title = 'Storm Damage Repair' limit 1),
	'message',
	'Final inspection scheduled for Friday',
	(select id from users where role = 'OWNER' limit 1),
	ARRAY[]::bigint[]
where exists (select 1 from jobs where title = 'Storm Damage Repair')
	and exists (select 1 from users where role = 'OWNER');

-- Job Todos (only if table exists and users exist)
insert into job_todos (job_id, title, description, assigned_to_ids, completed, due_date, created_by_id)
select 
	(select id from jobs where title = 'Shingle Repair' limit 1),
	'Order Materials',
	'Order 3 bundles of architectural shingles',
	ARRAY[(select id from users where role = 'REP' limit 1)]::bigint[],
	true,
	current_date - 2,
	(select id from users where role = 'OWNER' limit 1)
where exists (select 1 from jobs where title = 'Shingle Repair')
	and exists (select 1 from users where role = 'REP')
	and exists (select 1 from users where role = 'OWNER');

insert into job_todos (job_id, title, description, assigned_to_ids, completed, due_date, created_by_id)
select 
	(select id from jobs where title = 'Shingle Repair' limit 1),
	'Schedule Inspection',
	'Schedule final inspection with customer',
	ARRAY[(select id from users where role = 'REP' limit 1)]::bigint[],
	false,
	current_date + 3,
	(select id from users where role = 'OWNER' limit 1)
where exists (select 1 from jobs where title = 'Shingle Repair')
	and exists (select 1 from users where role = 'REP')
	and exists (select 1 from users where role = 'OWNER');

insert into job_todos (job_id, title, description, assigned_to_ids, completed, due_date, created_by_id)
select 
	(select id from jobs where title = 'Full Re-roof' limit 1),
	'Clean Up Site',
	'Remove all debris and old materials',
	ARRAY[(select id from users where role = 'OWNER' limit 1)]::bigint[],
	true,
	current_date - 4,
	(select id from users where role = 'REP' limit 1)
where exists (select 1 from jobs where title = 'Full Re-roof')
	and exists (select 1 from users where role = 'OWNER')
	and exists (select 1 from users where role = 'REP');

insert into job_todos (job_id, title, description, assigned_to_ids, completed, due_date, created_by_id)
select 
	(select id from jobs where title = 'Flat Roof Repair' limit 1),
	'Coordinate Access',
	'Get building manager approval for access',
	ARRAY[(select id from users where role = 'REP' limit 1)]::bigint[],
	false,
	current_date + 1,
	(select id from users where role = 'OWNER' limit 1)
where exists (select 1 from jobs where title = 'Flat Roof Repair')
	and exists (select 1 from users where role = 'REP')
	and exists (select 1 from users where role = 'OWNER');

insert into job_todos (job_id, title, description, assigned_to_ids, completed, due_date, created_by_id)
select 
	(select id from jobs where title = 'Storm Damage Repair' limit 1),
	'Submit Final Invoice',
	'Submit final invoice to insurance',
	ARRAY[(select id from users where role = 'OWNER' limit 1), (select id from users where role = 'REP' limit 1)]::bigint[],
	false,
	current_date + 2,
	(select id from users where role = 'OWNER' limit 1)
where exists (select 1 from jobs where title = 'Storm Damage Repair')
	and exists (select 1 from users where role = 'OWNER')
	and exists (select 1 from users where role = 'REP');


