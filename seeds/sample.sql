-- Customers
insert into customers (first_name, last_name, email, phone, address_line1, city, state, postal_code)
values
('John', 'Doe', 'john.doe@example.com', '+1234567890', '123 Main St', 'Springfield', 'IL', '62701'),
('Emma', 'Brown', 'emma.brown@example.com', '+1234567891', '456 Oak Ave', 'Springfield', 'IL', '62702'),
('Mike', 'Taylor', 'mike.taylor@example.com', '+1234567892', '789 Pine Rd', 'Springfield', 'IL', '62703')
on conflict do nothing;

-- Leads
insert into leads (customer_id, title, description, status, source)
values
((select id from customers where email = 'john.doe@example.com'), 'Roof Inspection', 'Initial inspection requested.', 'new', 'Website'),
((select id from customers where email = 'emma.brown@example.com'), 'Shingle Repair', 'Missing shingles after storm.', 'contacted', 'Outreach'),
((select id from customers where email = 'mike.taylor@example.com'), 'Full Re-roof', 'Aging roof needs replacement.', 'qualified', 'Google Forms')
on conflict do nothing;

-- Jobs
insert into jobs (customer_id, lead_id, title, description, status, scheduled_date)
values
((select id from customers where email = 'john.doe@example.com'), (select id from leads where title = 'Roof Inspection' limit 1), 'Roof Inspection', 'Schedule inspection', 'scheduled', current_date + 1),
((select id from customers where email = 'emma.brown@example.com'), (select id from leads where title = 'Shingle Repair' limit 1), 'Shingle Repair', 'Repair missing shingles', 'in_progress', current_date),
((select id from customers where email = 'mike.taylor@example.com'), (select id from leads where title = 'Full Re-roof' limit 1), 'Full Re-roof', 'Complete replacement', 'completed', current_date - 3)
on conflict do nothing;

-- Estimates
insert into estimates (customer_id, job_id, status, valid_until, total_amount)
values
((select id from customers where email = 'john.doe@example.com'), (select id from jobs where title = 'Roof Inspection' limit 1), 'draft', current_date + 14, 250.00),
((select id from customers where email = 'emma.brown@example.com'), (select id from jobs where title = 'Shingle Repair' limit 1), 'sent', current_date + 14, 1200.00),
((select id from customers where email = 'mike.taylor@example.com'), (select id from jobs where title = 'Full Re-roof' limit 1), 'accepted', current_date + 14, 9800.00)
on conflict do nothing;

-- Estimate Items
insert into estimate_items (estimate_id, name, description, quantity, unit_price, total)
values
((select id from estimates where customer_id = (select id from customers where email = 'john.doe@example.com') limit 1), 'Inspection Fee', 'Standard roof inspection', 1, 250.00, 250.00),
((select id from estimates where customer_id = (select id from customers where email = 'emma.brown@example.com') limit 1), 'Shingle Pack', 'Architectural shingles', 3, 300.00, 900.00),
((select id from estimates where customer_id = (select id from customers where email = 'emma.brown@example.com') limit 1), 'Labor', 'Repair labor', 1, 300.00, 300.00),
((select id from estimates where customer_id = (select id from customers where email = 'mike.taylor@example.com') limit 1), 'Materials', 'Full re-roof materials', 1, 6000.00, 6000.00),
((select id from estimates where customer_id = (select id from customers where email = 'mike.taylor@example.com') limit 1), 'Labor', 'Full re-roof labor', 1, 3800.00, 3800.00)
on conflict do nothing;

-- Proposals (one per estimate)
insert into proposals (estimate_id, content, status)
values
((select id from estimates where customer_id = (select id from customers where email = 'john.doe@example.com') limit 1), 'Proposal for inspection', 'draft'),
((select id from estimates where customer_id = (select id from customers where email = 'emma.brown@example.com') limit 1), 'Proposal for shingle repair', 'sent'),
((select id from estimates where customer_id = (select id from customers where email = 'mike.taylor@example.com') limit 1), 'Proposal for full re-roof', 'signed')
on conflict do nothing;

-- Invoices
insert into invoices (customer_id, job_id, estimate_id, status, due_date, total_amount)
values
((select id from customers where email = 'mike.taylor@example.com'), (select id from jobs where title = 'Full Re-roof' limit 1), (select id from estimates where customer_id = (select id from customers where email = 'mike.taylor@example.com') limit 1), 'sent', current_date + 10, 9800.00)
on conflict do nothing;

-- Payments
insert into payments (invoice_id, amount, method, paid_at)
values
((select id from invoices where customer_id = (select id from customers where email = 'mike.taylor@example.com') limit 1), 5000.00, 'card', current_timestamp)
on conflict do nothing;


