# Contributing to FoodFlow

We love your input! We want to make contributing to FoodFlow as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Setup Development Environment

1. Fork the repository
2. Clone your fork locally:
   ```bash
   git clone https://github.com/yourusername/foodflow.git
   cd foodflow
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/original/foodflow.git
   ```

4. Install dependencies:
   ```bash
   pnpm install
   ```

5. Create your feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

6. Start development server:
   ```bash
   pnpm dev
   ```

### Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Use semantic component names
- Keep components focused and reusable
- Add comments for complex logic

### Commit Messages

Write clear, descriptive commit messages:

```
fix: correct typo in settings page
feat: add dark mode toggle to navbar
docs: update README with contributing guidelines
style: format code with prettier
refactor: simplify donation form logic
test: add unit tests for KPI card
```

### Pull Request Process

1. Update documentation and README if needed
2. Add tests for new functionality
3. Ensure all tests pass: `pnpm test`
4. Build project successfully: `pnpm build`
5. Push your branch to GitHub
6. Create a Pull Request with:
   - Clear title and description
   - Reference to related issues
   - Screenshots for UI changes
   - Breaking changes clearly noted

### Component Guidelines

#### Creating New Components

```typescript
// components/my-component.tsx
'use client'

import { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface MyComponentProps extends ComponentProps<'div'> {
  // Add your props
  label: string
}

export function MyComponent({ label, className, ...props }: MyComponentProps) {
  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      {label}
    </div>
  )
}
```

#### Component Best Practices
- Use `'use client'` only when necessary
- Export named components
- Include proper TypeScript types
- Use semantic HTML
- Add aria-labels for accessibility
- Keep components focused
- Write stories in Storybook format

### Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Building

```bash
# Build the project
pnpm build

# Check for errors
pnpm lint
```

## Reporting Bugs

When reporting bugs, include:

- **Title**: Brief, descriptive summary
- **Description**: Detailed explanation of the issue
- **Steps to Reproduce**: Clear steps to reproduce the problem
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots/Videos**: Visual evidence if applicable
- **Environment**: 
  - OS and browser
  - Node version
  - Browser version

### Bug Report Template

```markdown
## Description
Brief description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS, Windows, Linux]
- Browser: [e.g., Chrome, Firefox]
- Node: [e.g., 18.0.0]
- Version: [e.g., 1.0.0]

## Additional Context
Any other context about the bug
```

## Feature Requests

We appreciate feature suggestions! Please include:

- **Description**: Clear description of the feature
- **Motivation**: Why this feature would be useful
- **Examples**: Any relevant examples or references
- **Acceptance Criteria**: How to verify the feature works

### Feature Request Template

```markdown
## Description
What is the feature?

## Motivation
Why do we need this feature?

## Examples
Any relevant examples or references

## Acceptance Criteria
- [ ] Feature works as expected
- [ ] Tests pass
- [ ] Documentation updated
```

## Code Review Process

When you submit a pull request:

1. At least one maintainer will review your code
2. Changes may be requested for:
   - Code style consistency
   - Test coverage
   - Documentation clarity
   - Performance concerns
   - Security implications

3. Once approved, your PR will be merged

## Coding Standards

### TypeScript
- Strict mode enabled
- Proper type annotations
- Avoid `any` type
- Use interfaces over types for objects

### React/Components
- Use functional components
- Prefer composition over inheritance
- Memoize expensive components when needed
- Follow React hooks rules

### Styling
- Use Tailwind CSS classes
- Follow the design system
- Responsive design first
- Dark mode support required

### Performance
- Optimize re-renders
- Use React.memo for expensive components
- Lazy load when appropriate
- Code split routes

## Documentation

All new features should include:

- Code comments for complex logic
- JSDoc for exported functions
- README updates
- API documentation
- Usage examples

### Documentation Format

```typescript
/**
 * Creates a donation listing for a food item
 * @param item The food item to donate
 * @param options Configuration options
 * @returns The created listing
 */
export function createDonation(
  item: FoodItem,
  options?: CreateOptions
): Listing
```

## Community

- Join our Discord: [Discord Link]
- Read our Code of Conduct
- Follow the community guidelines
- Be respectful and inclusive

## Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Happy coding! Thank you for contributing to FoodFlow! 🎉
