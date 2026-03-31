export type ValidationIssue = {
  path: PropertyKey[];
  message: string;
};

export function mapZodIssues(issues: ValidationIssue[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path
      .map((segment) =>
        typeof segment === 'symbol' ? (segment.description ?? '') : String(segment),
      )
      .join('.');
    if (key.length > 0 && !result[key]) {
      result[key] = issue.message;
    }
  }
  return result;
}
