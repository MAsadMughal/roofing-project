# Roofing Software - Project Management System

A comprehensive project management system designed specifically for roofing contractors. Manage leads, estimates, proposals, jobs, invoices, and team collaboration all in one place.

## 🎯 Overview

This application streamlines the entire workflow for roofing contractors, from initial lead capture through project completion and invoicing. It provides role-based access control, real-time collaboration features, and complete project lifecycle management.

## ✨ Features

### Lead Management
- **Lead Tracking**: Capture and manage potential customers
- **Lead Assignment**: Assign leads to sales reps or estimators
- **Status Tracking**: Track lead progression from new to closed
- **Watchlist**: Monitor important leads
- **Lead History**: Complete audit trail of lead interactions

### Estimates & Proposals
- **Detailed Estimates**: Create estimates with line items, quantities, and pricing
- **Proposal Generation**: Convert estimates to professional proposals
- **Status Management**: Track estimate status (draft, sent, viewed, accepted, rejected)
- **Expiration Management**: Set validity dates for estimates

### Job Management
- **Project Tracking**: Manage jobs from scheduling to completion
- **Status Management**: Track job status (scheduled, in progress, pending payment, completed, cancelled)
- **Priority System**: Set job priorities (low, medium, high)
- **Progress Tracking**: Monitor project completion percentage (0-100%)
- **Status History**: Complete timeline of status changes
- **Project Feed**: Real-time activity feed for job updates
- **Notes & Communication**: Add notes and communicate with team members
- **Todo Management**: Create and assign tasks within jobs
- **Gantt Chart View**: Visual timeline of scheduled jobs

### Invoice Management
- **Single Invoice per Job**: One final invoice per job
- **Invoice Items**: Detailed line items with descriptions, quantities, and pricing
- **Status Tracking**: Draft, sent, paid, overdue, void
- **Tax Calculation**: Automatic tax calculation with configurable rates
- **Payment Tracking**: Record and track payments
- **Auto-Close Jobs**: Automatically closes job when invoice is marked as paid
- **Edit Restrictions**: Invoices can be edited until paid/void (read-only after)

### Team Collaboration
- **Real-time Chat**: Direct messaging between team members
- **Project Feed**: Activity feed showing all job updates (status changes, invoice creation, etc.)
- **User Tagging**: Tag team members in feed messages
- **Role-Based Access**: Different permissions for OWNER, REP, INSPECTOR, and CUSTOMER roles

### User Management
- **Multi-Role Support**: OWNER, REP (Sales Rep), INSPECTOR, CUSTOMER
- **Team Invitations**: Invite team members via email
- **Password Management**: Secure password reset functionality
- **User Profiles**: Manage user information and preferences

### Inspections
- **Inspection Scheduling**: Schedule and manage roof inspections
- **Inspection Results**: Record inspection outcomes and notes
- **Photo Attachments**: Attach photos to inspections
- **Inspector Assignment**: Assign specific inspectors to leads

## 🛠️ Tech Stack

### Frontend
- **SvelteKit 2.43+**: Modern web framework
- **Svelte 5**: Reactive UI framework
- **TypeScript**: Type-safe development
- **TailwindCSS 4**: Utility-first CSS framework
- **Lucide Icons**: Beautiful icon library
- **Bits UI**: Accessible component library

### Backend
- **SvelteKit API Routes**: Server-side API endpoints
- **Prisma ORM 6**: Database ORM and migrations
- **PostgreSQL**: Relational database
- **Session-based Authentication**: Secure user authentication

### Tools & Libraries
- **Vite**: Fast build tool and dev server
- **date-fns**: Date manipulation utilities
- **Postgres.js**: PostgreSQL client

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ (recommended: 20+)
- **pnpm** (or npm/yarn)
- **PostgreSQL** 14+ (or access to a PostgreSQL database)
- **Git**

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd roofing-software
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/roofing_software"
   SESSION_SECRET="your-session-secret-key-here"
   ```

4. **Set up the database**
   
   Run database migrations:
   ```bash
   pnpm run migrate
   # or
   npm run migrate
   ```

5. **Generate Prisma Client**
   ```bash
   pnpm prisma generate
   # or
   npx prisma generate
   ```

6. **Seed the database (optional)**
   ```bash
   pnpm run seed
   # or
   npm run seed
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/roofing_software"

# Session Secret (generate a random string)
SESSION_SECRET="your-random-secret-key-here"

# Optional: For production
NODE_ENV="production"
```

### Database Schema

The application uses Prisma for database management. The schema is defined in `prisma/schema.prisma`. Key models include:

- **User**: Team members with roles (OWNER, REP, INSPECTOR, CUSTOMER)
- **Customer**: Customer information
- **Lead**: Potential projects
- **Assignment**: Lead assignments to team members
- **Estimate**: Project estimates with line items
- **Proposal**: Proposals derived from estimates
- **Job**: Active projects
- **Invoice**: Invoices with payment tracking
- **JobFeedItem**: Activity feed for jobs
- **JobNote**: Notes on jobs
- **JobTodo**: Task management within jobs
- **JobStatusHistory**: Status change history

## 🏃 Running the Application

### Development Mode

```bash
pnpm dev
# or
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

```bash
# Build for production
pnpm build
# or
npm run build

# Preview production build
pnpm preview
# or
npm run preview
```

## 📁 Project Structure

```
roofing-software/
├── prisma/
│   └── schema.prisma          # Database schema
├── migrations/                # SQL migration files
├── seeds/                     # Database seed data
├── scripts/                   # Migration and seed scripts
├── src/
│   ├── lib/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/            # Base UI components (buttons, dialogs, etc.)
│   │   │   ├── leads/         # Lead-specific components
│   │   │   └── proposals/     # Proposal components
│   │   ├── server/            # Server utilities
│   │   │   ├── auth.ts       # Authentication helpers
│   │   │   └── prisma.ts     # Prisma client instance
│   │   └── utils.ts           # Utility functions
│   ├── routes/
│   │   ├── (protected)/      # Protected routes (require auth)
│   │   │   ├── dashboard/    # Dashboard page
│   │   │   ├── leads/        # Lead management
│   │   │   ├── estimates/    # Estimate management
│   │   │   ├── proposals/   # Proposal management
│   │   │   ├── jobs/         # Job management
│   │   │   │   └── [id]/     # Individual job details
│   │   │   └── members/      # Team member management
│   │   ├── (public)/         # Public routes
│   │   │   ├── login/        # Login page
│   │   │   ├── signup/       # Signup page
│   │   │   └── invite/       # Invitation acceptance
│   │   └── api/              # API endpoints
│   │       ├── jobs/         # Job API routes
│   │       ├── leads/         # Lead API routes
│   │       ├── invoices/     # Invoice API routes
│   │       └── auth/          # Authentication API
│   ├── app.css               # Global styles
│   └── app.html              # HTML template
├── static/                   # Static assets
├── package.json
├── vite.config.ts
├── svelte.config.js
└── tsconfig.json
```

## 🔐 User Roles & Permissions

### OWNER
- Full system access
- Can manage all leads, estimates, proposals, and jobs
- Can create and manage invoices
- Can invite team members
- Can view all projects

### REP (Sales Representative)
- Can manage assigned leads
- Can create estimates and proposals for assigned leads
- Can create and edit invoices
- Can view assigned jobs
- Can update job status and priority

### INSPECTOR
- Can perform inspections
- Can view assigned inspections
- Can add inspection notes and photos

### CUSTOMER
- Limited access
- Can view proposals and estimates
- Can view job status

## 📊 Key Features in Detail

### Job Management

Each job supports:
- **Status Tracking**: scheduled → in_progress → pending_payment → completed
- **Priority Levels**: low, medium, high
- **Progress Percentage**: 0-100% completion tracking
- **Status History**: Complete timeline of status changes with user attribution
- **Project Feed**: Real-time activity feed showing:
  - Status changes
  - Priority changes
  - Invoice creation/updates/deletion
  - Status history additions
  - Notes and messages
  - Todo creation and completion
- **Notes**: Team notes on the job
- **Todos**: Task management with assignments and due dates
- **Invoices**: One final invoice per job

### Invoice System

- **One Invoice per Job**: Only one invoice allowed per job
- **Edit Restrictions**: 
  - Can edit: draft, sent, overdue statuses
  - Cannot edit: paid, void statuses (read-only view)
- **Auto-Close Jobs**: When invoice status changes to "paid", job automatically closes
- **Payment Tracking**: Record multiple payments per invoice
- **Item Management**: Add, edit, and remove invoice items (until paid/void)
- **Tax Calculation**: Automatic tax calculation
- **Status Warning**: Warning dialog when changing status to "paid"

### Project Feed

The project feed automatically updates when:
- Job status is changed
- Job priority is changed
- Invoice is created
- Invoice is updated
- Invoice is deleted
- Status history is added
- Notes are added
- Messages are posted
- Todos are created/completed

## 🔌 API Endpoints

### Jobs
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/[id]` - Get job details
- `PUT /api/jobs/[id]` - Update job
- `PUT /api/jobs/[id]/status` - Update job status
- `PUT /api/jobs/[id]/priority` - Update job priority
- `PUT /api/jobs/[id]/progress` - Update job progress
- `POST /api/jobs/[id]/status-history` - Add status history entry
- `GET /api/jobs/[id]/feed` - Get project feed
- `POST /api/jobs/[id]/feed` - Add feed message
- `POST /api/jobs/[id]/notes` - Add note
- `POST /api/jobs/[id]/todos` - Create todo
- `PUT /api/jobs/[id]/todos` - Update todo

### Invoices
- `GET /api/jobs/[id]/invoices` - Get job invoices
- `POST /api/jobs/[id]/invoices` - Create invoice
- `PUT /api/jobs/[id]/invoices` - Update invoice
- `DELETE /api/jobs/[id]/invoices` - Delete invoice

### Leads
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `GET /api/leads/[id]` - Get lead details
- `PUT /api/leads/[id]` - Update lead

### Estimates
- `GET /api/estimates` - List estimates
- `POST /api/estimates` - Create estimate
- `GET /api/estimates/[id]` - Get estimate details
- `PUT /api/estimates/[id]` - Update estimate

## 🧪 Development

### Code Quality

```bash
# Type checking
pnpm check

# Linting
pnpm lint

# Format code
pnpm format
```

### Database Migrations

```bash
# Run migrations
pnpm run migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## 🚢 Deployment

1. **Build the application**
   ```bash
   pnpm build
   ```

2. **Set production environment variables**
   - `DATABASE_URL`: Production database URL
   - `SESSION_SECRET`: Strong random secret
   - `NODE_ENV`: Set to "production"

3. **Run database migrations**
   ```bash
   pnpm run migrate
   ```

4. **Start the application**
   - Use a process manager like PM2 or deploy to a platform like Vercel, Railway, or Render

## 📝 Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm check` - Run TypeScript type checking
- `pnpm lint` - Lint code
- `pnpm format` - Format code
- `pnpm migrate` - Run database migrations
- `pnpm seed` - Seed database with sample data

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct in `.env`
- Ensure PostgreSQL is running
- Check database user permissions

### Prisma Client Issues
- Run `pnpm prisma generate` after schema changes
- Ensure migrations are up to date

### Session Issues
- Verify `SESSION_SECRET` is set in `.env`
- Clear browser cookies if experiencing authentication issues

## 📄 License

This project is private and proprietary.

## 👥 Support

For issues and questions, please contact the development team.

---

**Built with ❤️ using SvelteKit**
