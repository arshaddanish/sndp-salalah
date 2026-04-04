'use client';

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';

import { ActionRequestEditor } from '@/components/features/dev/action-request-editor';
import { ActionResponsePanel } from '@/components/features/dev/action-response-panel';
import {
  type ActionRunHistoryItem,
  ActionsHistory,
} from '@/components/features/dev/actions-history';
import { ActionsSidebar } from '@/components/features/dev/actions-sidebar';
import { ActionsThemeToggle } from '@/components/features/dev/actions-theme-toggle';
import { useActionsTheme } from '@/hooks/use-actions-theme';
import { ACTION_CATEGORIES, type ActionDefinition } from '@/lib/dev/actions-registry';
import { cn } from '@/lib/utils';

const FAVORITES_STORAGE_KEY = 'sndp-dev-actions-favorites';
const HISTORY_STORAGE_KEY = 'sndp-dev-actions-history';
const MAX_HISTORY_ITEMS = 20;

type ResponseStatus = 'idle' | 'success' | 'error';

type ResponseState = {
  output: string;
  status: ResponseStatus;
  executedAt: string | null;
  durationMs: number | null;
};

function isFailedActionResult(result: unknown): result is { success: false } {
  return (
    typeof result === 'object' && result !== null && 'success' in result && result.success === false
  );
}

function buildExecutionResult(options: {
  action: ActionDefinition;
  categoryTitle: string;
  currentInput: string;
  output: string;
  executedAt: string;
  durationMs: number;
  success: boolean;
}): { responseState: ResponseState; historyItem: ActionRunHistoryItem } {
  return {
    responseState: {
      output: options.output,
      status: options.success ? 'success' : 'error',
      executedAt: options.executedAt,
      durationMs: options.durationMs,
    },
    historyItem: {
      id: `${options.action.id}-${Date.now()}`,
      actionId: options.action.id,
      actionTitle: options.action.title,
      categoryTitle: options.categoryTitle,
      success: options.success,
      timestampIso: options.executedAt,
      durationMs: options.durationMs,
      payload: options.currentInput,
    },
  };
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function copyTextWithNotice(
  text: string,
  successMessage: string,
  setClipboardNotice: Dispatch<SetStateAction<string>>,
) {
  if (!text) {
    return;
  }

  const copied = await writeClipboard(text);
  setClipboardNotice(copied ? successMessage : 'Clipboard access failed.');
}

function formatActionInput(options: {
  activeActionId: string;
  currentInput: string;
  setRequestInputByAction: Dispatch<SetStateAction<Record<string, string>>>;
  setEditorError: Dispatch<SetStateAction<string | null>>;
}) {
  if (!options.activeActionId) {
    return;
  }

  try {
    const parsed = JSON.parse(options.currentInput) as Record<string, unknown>;
    const formatted = JSON.stringify(parsed, null, 2);
    options.setRequestInputByAction((current) => ({
      ...current,
      [options.activeActionId]: formatted,
    }));
    options.setEditorError(null);
  } catch {
    options.setEditorError('Unable to format JSON because the payload is invalid.');
  }
}

function resetActionInput(options: {
  activeAction: ActionDefinition | undefined;
  setRequestInputByAction: Dispatch<SetStateAction<Record<string, string>>>;
  setEditorError: Dispatch<SetStateAction<string | null>>;
}) {
  if (!options.activeAction) {
    return;
  }

  options.setRequestInputByAction((current) => ({
    ...current,
    [options.activeAction.id]: options.activeAction.defaultInput,
  }));
  options.setEditorError(null);
}

function replayHistorySelection(options: {
  historyItem: ActionRunHistoryItem;
  actionCategoryByActionId: Record<string, string>;
  setActiveAction: (categoryId: string, actionId: string) => void;
  setRequestInputByAction: Dispatch<SetStateAction<Record<string, string>>>;
  setEditorError: Dispatch<SetStateAction<string | null>>;
}) {
  const categoryId = options.actionCategoryByActionId[options.historyItem.actionId];
  if (!categoryId) {
    return;
  }

  options.setActiveAction(categoryId, options.historyItem.actionId);
  options.setRequestInputByAction((current) => ({
    ...current,
    [options.historyItem.actionId]: options.historyItem.payload,
  }));
  options.setEditorError(null);
}

function triggerActionRun(options: {
  activeAction: ActionDefinition | undefined;
  currentInput: string;
  activeCategoryTitle: string;
  setEditorError: Dispatch<SetStateAction<string | null>>;
  setResponseState: Dispatch<SetStateAction<ResponseState>>;
  setHistoryItems: Dispatch<SetStateAction<ActionRunHistoryItem[]>>;
  startTransition: (callback: () => void) => void;
}) {
  if (!options.activeAction) {
    return;
  }

  options.setEditorError(null);

  const parseResult = parseAndValidatePayload(options.activeAction, options.currentInput);
  if (parseResult.error) {
    options.setEditorError(parseResult.error);
    return;
  }

  options.startTransition(() => {
    void (async () => {
      const result = await executeActionAndBuildHistory({
        action: options.activeAction,
        payload: parseResult.payload,
        currentInput: options.currentInput,
        categoryTitle: options.activeCategoryTitle,
      });

      options.setResponseState(result.responseState);
      options.setHistoryItems((current) =>
        [result.historyItem, ...current].slice(0, MAX_HISTORY_ITEMS),
      );
    })();
  });
}

function getDefaultInputByActionId(): Record<string, string> {
  return ACTION_CATEGORIES.reduce<Record<string, string>>((accumulator, category) => {
    category.actions.forEach((action) => {
      accumulator[action.id] = action.defaultInput;
    });
    return accumulator;
  }, {});
}

function buildActionCategoryByActionId(): Record<string, string> {
  return ACTION_CATEGORIES.reduce<Record<string, string>>((accumulator, category) => {
    category.actions.forEach((action) => {
      accumulator[action.id] = category.id;
    });
    return accumulator;
  }, {});
}

function createActionsKeyboardHandler(options: {
  runAction: () => void;
  formatInput: () => void;
  focusEditor: () => void;
}) {
  return (event: KeyboardEvent) => {
    const isMeta = event.ctrlKey || event.metaKey;
    if (!isMeta) {
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      options.runAction();
      return;
    }

    if (event.shiftKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      options.formatInput();
      return;
    }

    if (event.shiftKey && event.key.toLowerCase() === 'e') {
      event.preventDefault();
      options.focusEditor();
    }
  };
}

async function executeActionAndBuildHistory(options: {
  action: ActionDefinition;
  payload: Record<string, unknown>;
  currentInput: string;
  categoryTitle: string;
}): Promise<{ responseState: ResponseState; historyItem: ActionRunHistoryItem }> {
  const executionStart = performance.now();
  const executedAt = new Date().toISOString();

  try {
    const result = await options.action.onRun(options.payload);
    const durationMs = Math.round(performance.now() - executionStart);
    return buildExecutionResult({
      action: options.action,
      categoryTitle: options.categoryTitle,
      currentInput: options.currentInput,
      output: JSON.stringify(result, null, 2),
      executedAt,
      durationMs,
      success: !isFailedActionResult(result),
    });
  } catch (error) {
    const durationMs = Math.round(performance.now() - executionStart);
    const message = error instanceof Error ? error.message : 'Unexpected action failure.';
    return buildExecutionResult({
      action: options.action,
      categoryTitle: options.categoryTitle,
      currentInput: options.currentInput,
      output: JSON.stringify({ success: false, error: message }, null, 2),
      executedAt,
      durationMs,
      success: false,
    });
  }
}

function parseAndValidatePayload(
  action: ActionDefinition,
  input: string,
): { payload: Record<string, unknown>; error: null } | { payload: null; error: string } {
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(input) as Record<string, unknown>;
  } catch {
    return {
      payload: null,
      error: 'Invalid JSON. Please fix the payload and run again.',
    };
  }

  const validationError = action.validate(payload);
  if (validationError) {
    return {
      payload: null,
      error: validationError,
    };
  }

  return {
    payload,
    error: null,
  };
}

function useTransientClipboardNotice(
  clipboardNotice: string,
  setClipboardNotice: Dispatch<SetStateAction<string>>,
) {
  useEffect(() => {
    if (!clipboardNotice) {
      return;
    }

    const timeout = globalThis.setTimeout(() => setClipboardNotice(''), 2000);
    return () => globalThis.clearTimeout(timeout);
  }, [clipboardNotice, setClipboardNotice]);
}

function usePersistedActionsState() {
  const [favoriteActionIds, setFavoriteActionIds] = useState<string[]>([]);
  const [historyItems, setHistoryItems] = useState<ActionRunHistoryItem[]>([]);

  useEffect(() => {
    try {
      const savedFavorites = globalThis.localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (savedFavorites) {
        const parsed = JSON.parse(savedFavorites) as string[];
        setFavoriteActionIds(parsed);
      }
    } catch {
      setFavoriteActionIds([]);
    }

    try {
      const savedHistory = globalThis.localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory) as ActionRunHistoryItem[];
        setHistoryItems(parsed);
      }
    } catch {
      setHistoryItems([]);
    }
  }, []);

  useEffect(() => {
    globalThis.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteActionIds));
  }, [favoriteActionIds]);

  useEffect(() => {
    globalThis.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyItems));
  }, [historyItems]);

  return {
    favoriteActionIds,
    setFavoriteActionIds,
    historyItems,
    setHistoryItems,
  };
}

type ActionsPlaygroundViewProps = {
  isDark: boolean;
  toggleTheme: () => void;
  clipboardNotice: string;
  activeCategoryId: string;
  activeActionId: string;
  activeAction: ActionDefinition | undefined;
  currentInput: string;
  editorError: string | null;
  isPending: boolean;
  editorRef: React.RefObject<HTMLTextAreaElement | null>;
  recentActionIds: string[];
  favoriteActionIds: string[];
  responseState: ResponseState;
  historyItems: ActionRunHistoryItem[];
  onSelectCategory: (categoryId: string) => void;
  onSelectAction: (categoryId: string, actionId: string) => void;
  onToggleFavorite: (actionId: string) => void;
  onChangeInput: (nextValue: string) => void;
  onRunAction: () => void;
  onFormatInput: () => void;
  onResetInput: () => void;
  onCopyInput: () => void;
  onCopyOutput: () => void;
  onSelectHistory: (item: ActionRunHistoryItem) => void;
  onClearHistory: () => void;
};

function ActionsPlaygroundView({
  // NOSONAR
  isDark,
  toggleTheme,
  clipboardNotice,
  activeCategoryId,
  activeActionId,
  activeAction,
  currentInput,
  editorError,
  isPending,
  editorRef,
  recentActionIds,
  favoriteActionIds,
  responseState,
  historyItems,
  onSelectCategory,
  onSelectAction,
  onToggleFavorite,
  onChangeInput,
  onRunAction,
  onFormatInput,
  onResetInput,
  onCopyInput,
  onCopyOutput,
  onSelectHistory,
  onClearHistory,
}: Readonly<ActionsPlaygroundViewProps>) {
  return (
    <div
      className={cn(
        'space-y-3 p-3 sm:p-4',
        isDark
          ? 'min-h-screen bg-slate-950 text-slate-100'
          : 'min-h-screen bg-slate-100 text-slate-900',
      )}
    >
      <section
        className={cn(
          'rounded-xl border p-4',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white',
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <h1
              className={cn(
                'text-xl font-bold sm:text-2xl',
                isDark ? 'text-slate-100' : 'text-slate-900',
              )}
            >
              Server Actions Workbench
            </h1>
            <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
              Run server actions with structured request/response tooling, replay history, and
              developer shortcuts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ActionsThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                isDark
                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-200'
                  : 'border-blue-300 bg-blue-50 text-blue-700',
              )}
            >
              Dev Only
            </span>
          </div>
        </div>
      </section>

      {clipboardNotice ? (
        <output
          className={cn('block text-xs', isDark ? 'text-emerald-300' : 'text-emerald-700')}
          aria-live="polite"
        >
          {clipboardNotice}
        </output>
      ) : null}
      <div className="grid gap-3 xl:grid-cols-[280px_minmax(0,1fr)]">
        <ActionsSidebar
          categories={ACTION_CATEGORIES}
          activeCategoryId={activeCategoryId}
          activeActionId={activeActionId}
          recentActionIds={recentActionIds}
          favoriteActionIds={favoriteActionIds}
          isDark={isDark}
          onSelectCategory={onSelectCategory}
          onSelectAction={onSelectAction}
          onToggleFavorite={onToggleFavorite}
        />

        <div className="space-y-3">
          {activeAction === undefined && (
            <section
              className={cn(
                'rounded-xl border p-3',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white',
              )}
            >
              <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                No actions available in this category.
              </p>
            </section>
          )}

          {activeAction !== undefined && (
            <div className="grid gap-3 2xl:grid-cols-2">
              <ActionRequestEditor
                input={currentInput}
                error={editorError}
                isPending={isPending}
                isDark={isDark}
                editorRef={editorRef}
                onChange={onChangeInput}
                onRun={onRunAction}
                onFormat={onFormatInput}
                onReset={onResetInput}
                onCopy={onCopyInput}
              />

              <ActionResponsePanel
                output={responseState.output}
                status={responseState.status}
                executedAt={responseState.executedAt}
                durationMs={responseState.durationMs}
                isDark={isDark}
                onCopy={onCopyOutput}
              />
            </div>
          )}

          <ActionsHistory
            items={historyItems}
            categories={ACTION_CATEGORIES}
            isDark={isDark}
            onSelectHistory={onSelectHistory}
            onClear={onClearHistory}
          />
        </div>
      </div>
    </div>
  );
}

// NOSONAR - The playground orchestrates multiple concerns intentionally in one dev-only component.
export function ActionsPlayground() {
  const { isDark, toggleTheme } = useActionsTheme();
  const actionCategoryByActionId = useMemo(() => buildActionCategoryByActionId(), []);
  const defaultInputByActionId = useMemo(() => getDefaultInputByActionId(), []);
  const [activeCategoryId, setActiveCategoryId] = useState(ACTION_CATEGORIES[0]?.id ?? '');
  const [activeActionByCategory, setActiveActionByCategory] = useState<Record<string, string>>({});
  const [requestInputByAction, setRequestInputByAction] =
    useState<Record<string, string>>(defaultInputByActionId);
  const { favoriteActionIds, setFavoriteActionIds, historyItems, setHistoryItems } =
    usePersistedActionsState();
  const [editorError, setEditorError] = useState<string | null>(null);
  const [responseState, setResponseState] = useState<ResponseState>({
    output: '',
    status: 'idle',
    executedAt: null,
    durationMs: null,
  });
  const [clipboardNotice, setClipboardNotice] = useState<string>('');
  useTransientClipboardNotice(clipboardNotice, setClipboardNotice);

  const [isPending, startTransition] = useTransition();
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  const activeCategory = useMemo(
    () =>
      ACTION_CATEGORIES.find((category) => category.id === activeCategoryId) ??
      ACTION_CATEGORIES[0] ??
      null,
    [activeCategoryId],
  );
  const categoryForRender = activeCategory ?? ACTION_CATEGORIES[0] ?? null;
  const fallbackActionId = categoryForRender?.actions[0]?.id ?? '';
  const categoryIdForSelection = categoryForRender?.id ?? '';
  const activeActionId = activeActionByCategory[categoryIdForSelection] ?? fallbackActionId;
  const activeAction = categoryForRender?.actions.find((action) => action.id === activeActionId);
  const activeCategoryTitle = categoryForRender?.title ?? 'Unknown';
  const currentInput = activeActionId
    ? (requestInputByAction[activeActionId] ?? defaultInputByActionId[activeActionId] ?? '')
    : '';

  const recentActionIds = useMemo(
    () => [...new Set(historyItems.map((item) => item.actionId))].slice(0, 6),
    [historyItems],
  );

  const setActiveAction = useCallback((categoryId: string, actionId: string) => {
    setActiveCategoryId(categoryId);
    setActiveActionByCategory((current) => ({
      ...current,
      [categoryId]: actionId,
    }));
  }, []);

  const toggleFavorite = useCallback((actionId: string) => {
    setFavoriteActionIds((current) =>
      current.includes(actionId)
        ? current.filter((existingId) => existingId !== actionId)
        : [actionId, ...current],
    );
  }, []);

  const formatInput = useCallback(() => {
    formatActionInput({
      activeActionId,
      currentInput,
      setRequestInputByAction,
      setEditorError,
    });
  }, [activeActionId, currentInput]);

  const resetInput = useCallback(() => {
    resetActionInput({
      activeAction,
      setRequestInputByAction,
      setEditorError,
    });
  }, [activeAction]);

  const copyInput = useCallback(async () => {
    await copyTextWithNotice(currentInput, 'Input copied to clipboard.', setClipboardNotice);
  }, [currentInput]);

  const copyOutput = useCallback(async () => {
    await copyTextWithNotice(
      responseState.output,
      'Output copied to clipboard.',
      setClipboardNotice,
    );
  }, [responseState.output]);

  const runAction = useCallback(() => {
    triggerActionRun({
      activeAction,
      currentInput,
      activeCategoryTitle,
      setEditorError,
      setResponseState,
      setHistoryItems,
      startTransition,
    });
  }, [activeAction, activeCategoryTitle, currentInput, startTransition]);

  const replayFromHistory = useCallback(
    (historyItem: ActionRunHistoryItem) => {
      replayHistorySelection({
        historyItem,
        actionCategoryByActionId,
        setActiveAction,
        setRequestInputByAction,
        setEditorError,
      });
    },
    [actionCategoryByActionId, setActiveAction],
  );

  const updateCurrentInput = useCallback(
    (nextValue: string) => {
      setRequestInputByAction((current) =>
        activeActionId
          ? {
              ...current,
              [activeActionId]: nextValue,
            }
          : current,
      );
    },
    [activeActionId],
  );

  useEffect(() => {
    const handleKeyDown = createActionsKeyboardHandler({
      runAction,
      formatInput,
      focusEditor: () => editorRef.current?.focus(),
    });

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [formatInput, runAction]);

  if (!categoryForRender) {
    return (
      <section
        className={cn(
          'rounded-xl border p-4 sm:p-5',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white',
        )}
      >
        <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
          No action categories configured.
        </p>
      </section>
    );
  }

  return (
    <ActionsPlaygroundView
      isDark={isDark}
      toggleTheme={toggleTheme}
      clipboardNotice={clipboardNotice}
      activeCategoryId={categoryForRender.id}
      activeActionId={activeActionId}
      activeAction={activeAction}
      currentInput={currentInput}
      editorError={editorError}
      isPending={isPending}
      editorRef={editorRef}
      recentActionIds={recentActionIds}
      favoriteActionIds={favoriteActionIds}
      responseState={responseState}
      historyItems={historyItems}
      onSelectCategory={setActiveCategoryId}
      onSelectAction={setActiveAction}
      onToggleFavorite={toggleFavorite}
      onChangeInput={updateCurrentInput}
      onRunAction={runAction}
      onFormatInput={formatInput}
      onResetInput={resetInput}
      onCopyInput={copyInput}
      onCopyOutput={copyOutput}
      onSelectHistory={replayFromHistory}
      onClearHistory={() => setHistoryItems([])}
    />
  );
}
