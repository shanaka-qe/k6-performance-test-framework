# 🤝 Contributing Guide

Thank you for your interest in contributing to the k6 Performance Testing Framework! This guide will help you get started.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Contribution Workflow](#contribution-workflow)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

---

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, background, or identity.

### Expected Behavior

- Be respectful and considerate
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect differing viewpoints
- Accept responsibility for mistakes

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling or inflammatory remarks
- Personal attacks
- Publishing others' private information

---

## 🎯 How to Contribute

### Types of Contributions

We welcome various types of contributions:

1. **Bug Reports** 🐛
   - Found an issue? Let us know!
   - Include reproduction steps
   - Provide environment details

2. **Feature Requests** ✨
   - Suggest new features or enhancements
   - Explain the use case
   - Discuss implementation approach

3. **Code Contributions** 💻
   - New test scenarios
   - Library enhancements
   - Bug fixes
   - Performance optimizations

4. **Documentation** 📚
   - Improve existing docs
   - Add examples
   - Fix typos
   - Translate content

5. **Test Data** 📦
   - Add realistic test data
   - Create payload templates
   - Share production traffic patterns

---

## 🛠️ Development Setup

### Prerequisites

```bash
# Install required tools
- Node.js 18+
- k6 0.48.0+
- Git
- Code editor (VS Code recommended)
```

### Initial Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/k6-performance-test-framework.git
cd k6-performance-test-framework

# 3. Add upstream remote
git remote add upstream https://github.com/original-org/k6-performance-test-framework.git

# 4. Install dependencies
npm install

# 5. Verify setup
npm run lint
npm run type-check
k6 run scripts/smoke/api_smoke.ts
```

### Development Tools

#### VS Code Extensions (Recommended)

- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **EditorConfig**: Consistent editor settings
- **GitLens**: Enhanced Git integration

#### Configuration Files

All tools are pre-configured:

- `.eslintrc.cjs` - Linting rules
- `.prettierrc` - Code formatting
- `tsconfig.json` - TypeScript configuration
- `.editorconfig` - Editor settings

---

## 🔄 Contribution Workflow

### 1. Create an Issue (Optional but Recommended)

Before starting work, create an issue to discuss:

- What you plan to implement
- Why it's needed
- How you'll approach it

This helps avoid duplicate work and ensures alignment.

### 2. Create a Branch

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### Branch Naming Conventions

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/modifications
- `chore/` - Build/tooling changes

Examples:

- `feature/add-graphql-scenario`
- `fix/token-refresh-logic`
- `docs/update-runbook`

### 3. Make Your Changes

```bash
# Make changes to code
vi lib/httpClient.ts

# Format code
npm run format

# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Type check
npm run type-check
```

### 4. Test Your Changes

```bash
# Run affected tests locally
k6 run scripts/smoke/api_smoke.ts

# Run all test types
npm run test:smoke
npm run test:load

# Verify Docker setup if modified
npm run docker:up
npm run docker:test
npm run docker:down
```

### 5. Commit Your Changes

Follow conventional commit format:

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat(load-test): add product search scenario

Added new search scenario with filters and pagination.
Includes realistic think times and error handling.

Closes #123"
```

#### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `perf` - Performance improvement
- `test` - Tests
- `chore` - Maintenance

**Examples**:

```
feat(metrics): add custom checkout duration metric
fix(auth): handle token expiration gracefully
docs(runbook): update Docker commands
test(load): add edge case coverage
refactor(httpClient): simplify retry logic
```

### 6. Push to Your Fork

```bash
# Push branch to your fork
git push origin feature/your-feature-name
```

### 7. Open a Pull Request

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Fill in the PR template
4. Link related issues
5. Submit the PR

---

## 📝 Pull Request Guidelines

### PR Title

Use the same format as commit messages:

```
feat(load-test): add product search scenario
fix(auth): handle expired tokens
docs(readme): update quick start guide
```

### PR Description

Include:

1. **What**: Brief description of changes
2. **Why**: Reason for the change
3. **How**: Implementation approach
4. **Testing**: How you tested it
5. **Screenshots**: If UI/visual changes
6. **Checklist**: Complete the checklist

#### PR Template

```markdown
## Description

Brief description of what this PR does.

## Related Issues

Closes #123
Related to #456

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

How have you tested this?

- [ ] Ran locally
- [ ] Verified in Docker
- [ ] Added new tests
- [ ] Updated existing tests

## Checklist

- [ ] Code follows conventions
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No secrets committed
```

### PR Review Process

1. **Automated Checks**: CI/CD runs automatically
   - Linting
   - Type checking
   - Smoke tests

2. **Code Review**: Maintainers review
   - Code quality
   - Test coverage
   - Documentation
   - Adherence to conventions

3. **Feedback**: Address review comments

   ```bash
   # Make requested changes
   git add .
   git commit -m "fix: address review feedback"
   git push
   ```

4. **Approval & Merge**: Once approved, PR is merged

---

## 🧪 Testing Guidelines

### Writing Tests

#### Test Structure

```typescript
/**
 * Test Name
 * Brief description
 */

import { Options } from 'k6/options';
import { loadConfig, getEnvironment } from '../../lib/env';

const config = loadConfig(getEnvironment());

export const options: Options = {
  // Test configuration
};

export function setup() {
  // Setup logic
  return { config };
}

export default function (data: any) {
  // Test logic
}

export function teardown(data: any) {
  // Cleanup logic
}
```

#### Best Practices

1. **Use Realistic Scenarios**

   ```typescript
   // Good: Realistic user flow
   executeLogin();
   browseProducts();
   if (Math.random() < 0.2) {
     checkout();
   }

   // Bad: Unrealistic pattern
   for (let i = 0; i < 100; i++) {
     checkout();
   }
   ```

2. **Include Think Time**

   ```typescript
   // Good: Simulate user behavior
   viewProduct();
   thinkTime(5, 0.4); // User reads
   addToCart();

   // Bad: No think time
   viewProduct();
   addToCart();
   ```

3. **Handle Errors Gracefully**

   ```typescript
   // Good: Check for errors
   const response = httpClient.get('/api/users');
   if (response.status !== 200) {
     console.error('API call failed');
     return;
   }

   // Bad: Assume success
   const data = response.json();
   ```

### Running Tests

```bash
# Before submitting PR, run:

# 1. Lint
npm run lint

# 2. Type check
npm run type-check

# 3. Format
npm run format

# 4. Run smoke test
npm run test:smoke

# 5. Test Docker setup (if modified)
npm run docker:up
npm run docker:test
npm run docker:down
```

---

## 📚 Documentation

### When to Update Docs

Update documentation when:

- Adding new features
- Changing existing behavior
- Adding new test types
- Modifying configuration
- Adding new utilities

### Documentation Locations

- `README.md` - Overview and quick start
- `docs/test-strategy.md` - Test approach and SLAs
- `docs/runbook.md` - Operational procedures
- `docs/conventions.md` - Code standards
- `docs/modeling-and-scenarios.md` - Traffic patterns
- Code comments - Inline documentation

### Documentation Standards

1. **Clear and Concise**
   - Use simple language
   - Provide examples
   - Include code snippets

2. **Well-Structured**
   - Use headers for organization
   - Include table of contents
   - Add cross-references

3. **Up-to-Date**
   - Keep in sync with code
   - Review regularly
   - Update examples

---

## 🎁 Recognition

### Contributors

All contributors are recognized in:

- GitHub contributors page
- Release notes
- README acknowledgments

### Hall of Fame

Outstanding contributors may be:

- Listed as maintainers
- Given reviewer privileges
- Featured in blog posts

---

## 💬 Communication

### Where to Ask Questions

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: General questions, ideas
- **Slack**: #performance-testing (if available)
- **Email**: performance-team@example.com

### Response Times

- **Issues**: Within 2 business days
- **PRs**: Within 3 business days
- **Questions**: Within 1 business day

---

## 🚀 Getting Help

### I'm Stuck!

1. Check existing documentation
2. Search closed issues
3. Ask in Discussions
4. Reach out to maintainers

### First-Time Contributors

We're here to help! Don't hesitate to:

- Ask questions
- Request clarification
- Ask for code reviews
- Share feedback

Look for issues labeled:

- `good first issue`
- `help wanted`
- `beginner friendly`

---

## 🎓 Learning Resources

### k6 Documentation

- [k6 Docs](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [k6 Community](https://community.k6.io/)

### Performance Testing

- [Performance Testing Guidance](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Load Testing Best Practices](https://k6.io/docs/testing-guides/automated-performance-testing/)

### TypeScript

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

---

## 📋 Checklist for Contributors

### Before Starting

- [ ] Read this contributing guide
- [ ] Set up development environment
- [ ] Run existing tests successfully
- [ ] Check for related issues/PRs

### During Development

- [ ] Follow code conventions
- [ ] Write clear commit messages
- [ ] Test changes locally
- [ ] Update documentation
- [ ] Add/update tests if needed

### Before Submitting PR

- [ ] Lint passes (`npm run lint`)
- [ ] Type check passes (`npm run type-check`)
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No secrets committed
- [ ] PR description complete
- [ ] Related issues linked

### After Submitting PR

- [ ] Respond to review feedback
- [ ] Address requested changes
- [ ] Keep PR updated with main
- [ ] Be patient and respectful

---

## 🙏 Thank You!

Every contribution, no matter how small, makes a difference. Thank you for helping improve the k6 Performance Testing Framework!

---

**Questions?** Open an issue or reach out to the maintainers.

**Document Owner**: Performance Engineering Team  
**Last Updated**: 2025-01-18
