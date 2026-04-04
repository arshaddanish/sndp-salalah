# Claude AI Agent Guidelines

# Claude AI Agent Guidelines

## Project Overview

This is the SNDP Salalah web application built with Next.js, TypeScript, and Tailwind CSS.

## How to Use Claude Effectively

### Always work in modular tasks

- Break features into small, reviewable pieces
- Create a PR for each small task
- Add TODO comments for unimplemented functionality

### Code Style

- Use existing UI components (Button, Dialog, Sheet, etc.) from `@/components/ui`
- Follow the import order: react → external packages → @/components → @/lib → @/types → relative imports
- Always validate inputs using Zod schemas
- Handle loading and error states in all components

### Before Writing Code

- Read existing similar components to understand patterns
- Check `docs/DESIGN.md` for design system guidelines
- Use existing variants of Button component before creating new ones

### Pull Requests

- Always work on a feature branch
- Trigger CodeRabbit review with `@coderabbitai full review`
- Address all actionable review comments before merging

## Key Conventions

- Server actions go in `src/lib/actions/`
- UI components go in `src/components/ui/`
- Feature components go in `src/components/features/`
- Types go in `src/types/`
