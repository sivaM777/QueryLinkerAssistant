# QueryLinker - AI-Powered ITSM Platform

## Overview

QueryLinker is a comprehensive IT Service Management (ITSM) platform that leverages AI to streamline IT operations through intelligent search, automated workflows, and analytics. The platform provides a unified interface for managing multiple external systems like Jira, Confluence, GitHub, and ServiceNow, with real-time synchronization and smart search capabilities across all connected sources.

## User Preferences

Preferred communication style: Simple, everyday language.
User prefers hamburger menu navigation functionality available in all versions (mobile and desktop).

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite for build tooling
- **UI Components**: Radix UI components with shadcn/ui styling system for accessibility and consistent design
- **Styling**: Tailwind CSS with CSS custom properties for theming (light/dark mode support)
- **State Management**: TanStack Query (React Query) for server state management and API caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas
- **Charts**: Recharts for data visualization and analytics dashboards

### Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript throughout the stack
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Real-time Communication**: WebSocket server using the 'ws' library for live updates and notifications
- **Build System**: ESBuild for server-side bundling, separate from Vite client build

### Data Storage
- **Primary Database**: PostgreSQL via Neon serverless platform
- **Connection Pool**: Neon serverless connection pooling for efficient database access
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple
- **Schema Management**: Drizzle Kit for database migrations and schema evolution

### Authentication & Authorization
- **Primary Auth**: Replit-based OpenID Connect (OIDC) authentication system
- **Session Management**: Server-side sessions with PostgreSQL storage and configurable TTL
- **Role-based Access**: User roles and permissions system integrated with the authentication flow
- **Security**: Passport.js strategy for OIDC implementation with automatic token refresh

### External Service Integrations
- **Supported Systems**: Jira Cloud, Confluence, GitHub, ServiceNow Knowledge Base
- **Integration Pattern**: RESTful API connections with OAuth 2.0 authentication where supported
- **Sync Strategy**: Configurable sync intervals with real-time webhook support for immediate updates
- **Data Processing**: Intelligent content indexing and search ranking using ML algorithms

### Real-time Features
- **WebSocket Server**: Bidirectional communication for live dashboard updates
- **Notification System**: Real-time alerts for SLA breaches, system sync completion, and user actions
- **Live Metrics**: Dynamic dashboard updates without page refresh
- **System Status**: Real-time monitoring of external system connectivity

### Search & AI Components
- **Multi-source Search**: Unified search across all connected external systems
- **AI-powered Ranking**: Machine learning algorithms for relevance scoring and result prioritization
- **Contextual Suggestions**: Smart recommendations based on user behavior and system patterns
- **Caching Strategy**: Solution caching with Time-To-Live (TTL) for performance optimization

### SLA Management System
- **Target Tracking**: Configurable SLA targets with automated compliance monitoring
- **Breach Detection**: Real-time alerting system for SLA violations
- **Escalation Workflows**: Automated escalation policies with multiple notification channels
- **Reporting**: Comprehensive SLA analytics with exportable reports

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless platform for primary data storage
- **Authentication**: Replit OIDC service for user authentication and authorization
- **Session Storage**: PostgreSQL-backed session management

### External System APIs
- **Jira Cloud API**: Issue tracking and project management integration
- **Confluence API**: Knowledge base and documentation sync
- **GitHub API**: Repository and issue management
- **ServiceNow API**: Knowledge base and incident management

### Development & Build Tools
- **Vite**: Frontend build tool and development server with HMR
- **TypeScript**: Type safety across frontend and backend
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Server-side code bundling for production

### UI & Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library for enhanced user interactions

### Monitoring & Analytics
- **Real-time Metrics**: Live dashboard with WebSocket updates
- **Export Capabilities**: PDF and CSV report generation
- **Chart Visualization**: Recharts for analytics and reporting dashboards