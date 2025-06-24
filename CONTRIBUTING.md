# Contributing to Waqf Scraper

We love your input! We want to make contributing to Waqf Scraper as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

### Issues

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/yourusername/waqf-scraper-react/issues/new/choose); it's that easy!

## Testing

The repository includes several test scripts that you can use to validate your changes:

- `create-test-pdfs.js`: Creates test PDF files using PDFKit
- `verify-pdf-files.js`: Validates PDF files to ensure they open correctly
- `test-downloads.html`: Test page for verifying file downloads

### Running Tests

```bash
# Generate test PDFs
node create-test-pdfs.js

# Verify PDF files
node verify-pdf-files.js

# Test the application
npm test
```

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

### JavaScript Styleguide

* Use 2 spaces for indentation
* Prefer ES6 features
* Use semicolons
* Use async/await over promises
* Components should be in PascalCase
* Functions should be in camelCase

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
