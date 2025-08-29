# Quiz System

## Overview

This is a real-time ABCD quiz system built with React and Express. The application allows administrators to create and manage quiz sessions while students can join and participate in live quizzes. It features real-time updates, live statistics, and a clean, responsive interface designed for educational environments.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Main frontend framework with type safety
- **Wouter**: Lightweight client-side routing
- **TanStack Query**: Server state management and caching
- **shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **Vite**: Build tool and development server

### Backend Architecture
- **Express.js**: Web server framework with TypeScript
- **WebSocket**: Real-time communication for live quiz updates
- **Session-based Architecture**: Express sessions with PostgreSQL storage
- **RESTful API**: Standard HTTP endpoints for CRUD operations
- **Middleware Pattern**: Authentication, logging, and error handling

### Data Storage
- **PostgreSQL**: Primary database using Neon serverless
- **Drizzle ORM**: Type-safe database queries and migrations
- **Session Storage**: PostgreSQL-backed session store for authentication

### Authentication & Authorization
- **Replit Auth (OpenID Connect)**: Admin authentication system
- **Student Login**: Simple name-based identification without passwords
- **Session Management**: Secure session handling with httpOnly cookies

### Real-time Features
- **WebSocket Communication**: Live quiz updates and answer submissions
- **Automatic Reconnection**: Resilient WebSocket connections with exponential backoff
- **Live Statistics**: Real-time answer distribution and participation tracking

### Key Design Patterns
- **Repository Pattern**: Database operations abstracted through storage interface
- **Component Composition**: Reusable UI components with consistent props
- **Hook-based State**: Custom React hooks for WebSocket and authentication
- **Error Boundaries**: Graceful error handling and user feedback

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL database connection
- **Replit Authentication**: OpenID Connect provider for admin access
- **WebSocket Protocol**: Real-time bidirectional communication
- **shadcn/ui Component System**: Pre-built accessible UI components
- **Radix UI Primitives**: Low-level accessible component building blocks
- **Tailwind CSS Framework**: Utility-first styling system