import type { ActionCategory, ActionDefinition } from '@/lib/dev/actions-registry';

type ActionDetailsPanelProps = {
  category: ActionCategory;
  action: ActionDefinition;
};

export function ActionDetailsPanel({ category, action }: Readonly<ActionDetailsPanelProps>) {
  return (
    <section className="border-border bg-surface rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-text-secondary text-xs font-semibold tracking-wide uppercase">
            Selected Action
          </p>
          <h2 className="text-text-primary mt-1 text-base font-semibold">{action.title}</h2>
          <p className="text-text-secondary mt-1 text-sm">{action.description}</p>
        </div>
        <span className="bg-accent-subtle text-accent rounded-full px-2.5 py-0.5 text-xs font-medium">
          {category.title}
        </span>
      </div>

      <div className="border-border mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-text-secondary text-xs font-semibold tracking-wide uppercase">
            Payload Contract
          </p>
          <p className="text-text-secondary text-sm">
            Submit a JSON object that satisfies this action&apos;s validator.
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-text-secondary text-xs font-semibold tracking-wide uppercase">
            Execution Mode
          </p>
          <p className="text-text-secondary text-sm">
            Runs the real server action directly and returns the raw response shape.
          </p>
        </div>
      </div>
    </section>
  );
}
