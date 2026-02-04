const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Optional: Add custom rules here (e.g., enforcing a specific scope)
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting
        'refactor', // Code restructuring
        'perf',     // Performance
        'test',     // Adding tests
        'build',    // Build system changes
        'ci',       // CI/CD changes
        'chore',    // Maintenance
        'revert',   // Revert a previous commit
      ],
    ],
  },
};

export default config;