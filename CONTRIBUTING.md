# Contributing to Native Update

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Setting Up Development Environment

1. Get the source code (contact aoneahsan@gmail.com for access):

```bash
# After receiving access, clone and enter the directory
cd native-update
```

2. Install dependencies:

```bash
npm install
```

3. Build the plugin:

```bash
npm run build
```

4. Run tests:

```bash
npm test
```

## Project Structure

```
capacitor-native-update/
├── src/                    # TypeScript source
│   ├── definitions.ts      # Plugin interfaces
│   ├── index.ts           # Main entry point
│   ├── web.ts             # Web implementation
│   └── modules/           # Core modules
├── android/               # Android implementation
│   └── src/main/java/     # Kotlin source files
├── ios/                   # iOS implementation
│   └── Plugin/            # Swift source files
├── example/               # Example application
└── docs/                  # Documentation
```

## Code Style

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

### Android (Kotlin)

- Follow [Kotlin coding conventions](https://kotlinlang.org/docs/coding-conventions.html)
- Use meaningful variable and function names
- Add KDoc comments for public APIs

### iOS (Swift)

- Follow [Swift API Design Guidelines](https://swift.org/documentation/api-design-guidelines/)
- Use meaningful variable and function names
- Add documentation comments for public APIs

## Testing

### Unit Tests

- Write unit tests for all new functionality
- Maintain test coverage above 80%
- Use descriptive test names

### Integration Tests

- Test plugin functionality on all platforms
- Test error scenarios
- Test security features

### Manual Testing

- Test on real devices when possible
- Test on minimum supported OS versions
- Test update scenarios thoroughly

## Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Examples:

```
feat: Add delta update support for live updates

- Implement binary diff algorithm
- Add compression support
- Update documentation

Fixes #123
```

## Pull Request Process

1. Update the README.md with details of changes to the interface
2. Update the CHANGELOG.md with your changes
3. Update the API.md if you've changed the public API
4. The PR will be merged once you have the sign-off of at least one maintainer

## Reporting Bugs

### Security Vulnerabilities

Please email aoneahsan@gmail.com instead of using the issue tracker.

### Bug Reports

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Feature Requests

We love feature requests! But please consider:

- Is this feature within the scope of the project?
- Would this feature benefit most users?
- Can this be implemented as a separate plugin?

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Code of Conduct

### Our Pledge

We pledge to make participation in our project and our community a harassment-free experience for everyone.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at aoneahsan@gmail.com.

## Recognition

Contributors who submit accepted PRs will be added to the contributors list in the README.

Thank you for contributing to Capacitor Native Update! 🎉
