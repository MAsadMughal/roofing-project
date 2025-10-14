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

-- Jobs
insert into jobs (customer_id, lead_id, title, description, status, scheduled_date)
values
((select id from customers where email = 'john.doe@example.com'), (select id from leads where title = 'Roof Inspection' limit 1), 'Roof Inspection', 'Schedule inspection', 'scheduled', current_date + 1),
((select id from customers where email = 'emma.brown@example.com'), (select id from leads where title = 'Shingle Repair' limit 1), 'Shingle Repair', 'Repair missing shingles', 'in_progress', current_date),
((select id from customers where email = 'mike.taylor@example.com'), (select id from leads where title = 'Full Re-roof' limit 1), 'Full Re-roof', 'Complete replacement', 'completed', current_date - 3),
((select id from customers where email = 'sarah.johnson@example.com'), (select id from leads where title = 'Skylight Leak' limit 1), 'Skylight Leak Repair', 'Reseal skylight curb', 'scheduled', current_date + 2),
((select id from customers where email = 'robert.king@example.com'), (select id from leads where title = 'Gutter Replacement' limit 1), 'Gutter Replacement', 'Aluminum K-style gutters', 'scheduled', current_date + 5),
((select id from customers where email = 'sophia.martinez@example.com'), (select id from leads where title = 'Flat Roof Repair' limit 1), 'Flat Roof Repair', 'TPO patching and drains', 'in_progress', current_date + 1),
((select id from customers where email = 'daniel.lee@example.com'), (select id from leads where title = 'Storm Damage' limit 1), 'Storm Damage Repair', 'Shingle replacement under insurance', 'scheduled', current_date + 3),
((select id from customers where email = 'william.harris@example.com'), (select id from leads where title = 'Metal Roof Install' limit 1), 'Metal Roof Install', 'Standing seam roof', 'cancelled', current_date - 1)
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
insert into proposals (estimate_id, content, status)
values
((select id from estimates where customer_id = (select id from customers where email = 'john.doe@example.com') limit 1), 'Proposal for inspection', 'draft'),
((select id from estimates where customer_id = (select id from customers where email = 'emma.brown@example.com') limit 1), 'Proposal for shingle repair', 'sent'),
((select id from estimates where customer_id = (select id from customers where email = 'mike.taylor@example.com') limit 1), 'Proposal for full re-roof', 'signed'),
((select id from estimates where customer_id = (select id from customers where email = 'sarah.johnson@example.com') limit 1), 'Proposal for skylight leak repair', 'draft'),
((select id from estimates where customer_id = (select id from customers where email = 'robert.king@example.com') limit 1), 'Proposal for gutter replacement', 'sent'),
((select id from estimates where customer_id = (select id from customers where email = 'sophia.martinez@example.com') limit 1), 'Proposal for flat roof repairs', 'sent'),
((select id from estimates where customer_id = (select id from customers where email = 'daniel.lee@example.com') limit 1), 'Proposal for storm damage repair', 'signed')
on conflict do nothing;

-- Invoices
insert into invoices (customer_id, job_id, estimate_id, status, due_date, total_amount)
values
((select id from customers where email = 'mike.taylor@example.com'), (select id from jobs where title = 'Full Re-roof' limit 1), (select id from estimates where customer_id = (select id from customers where email = 'mike.taylor@example.com') limit 1), 'sent', current_date + 10, 9800.00),
((select id from customers where email = 'robert.king@example.com'), (select id from jobs where title = 'Gutter Replacement' limit 1), (select id from estimates where customer_id = (select id from customers where email = 'robert.king@example.com') limit 1), 'sent', current_date + 20, 2100.00),
((select id from customers where email = 'daniel.lee@example.com'), (select id from jobs where title = 'Storm Damage Repair' limit 1), (select id from estimates where customer_id = (select id from customers where email = 'daniel.lee@example.com') limit 1), 'paid', current_date + 25, 6800.00)
on conflict do nothing;

-- Payments
insert into payments (invoice_id, amount, method, paid_at)
values
((select id from invoices where customer_id = (select id from customers where email = 'mike.taylor@example.com') limit 1), 5000.00, 'card', current_timestamp),
((select id from invoices where customer_id = (select id from customers where email = 'daniel.lee@example.com') limit 1), 6800.00, 'ach', current_timestamp),
((select id from invoices where customer_id = (select id from customers where email = 'robert.king@example.com') limit 1), 500.00, 'cash', current_timestamp)
on conflict do nothing;


