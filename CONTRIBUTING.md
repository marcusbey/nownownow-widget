# Contributing Guidelines

## Protected Files

The following core files are protected to maintain stability and prevent unintended modifications:

- `src/main.tsx` - Core panel implementation
- `src/components/SpinningButton.tsx` - Button component
- `src/components/RotatingButton.css` - Animation styles

These files require special review and cannot be automatically merged. Any changes to these files must:

1. Be reviewed by a core maintainer
2. Include thorough testing
3. Document potential impacts
4. Maintain existing functionality

## Making Changes

When modifying protected files:

1. Create a separate branch
2. Document all changes thoroughly
3. Include test cases
4. Request review from core maintainers
5. Ensure no regression in functionality

## Animation Guidelines

The panel animation system follows these principles:

1. Smooth transitions using `cubic-bezier(0.4, 0.0, 0.2, 1)`
2. Consistent 0.4s duration
3. Hardware-accelerated transforms
4. Proper cleanup on unmount
5. Framework-agnostic implementation

## Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## Code Style

Follow the established patterns:
- TypeScript for all code
- Functional components
- Clean, documented code
- Proper error handling
- Performance considerations
