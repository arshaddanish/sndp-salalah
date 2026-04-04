import { createShakha, deleteShakha, fetchShakhas, updateShakha } from '@/lib/actions/shakhas';

export type JsonRecord = Record<string, unknown>;
// eslint-disable-next-line no-unused-vars
export type ActionValidator = (payload: JsonRecord) => string | null;
// eslint-disable-next-line no-unused-vars
export type ActionRunner = (payload: JsonRecord) => Promise<unknown>;

export type ActionDefinition = {
  id: string;
  title: string;
  description: string;
  defaultInput: string;
  validate: ActionValidator;
  onRun: ActionRunner;
};

export type ActionCategory = {
  id: string;
  title: string;
  description: string;
  actions: ActionDefinition[];
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export const ACTION_CATEGORIES: ActionCategory[] = [
  {
    id: 'shakhas',
    title: 'Shakhas',
    description: 'Branch management actions',
    actions: [
      {
        id: 'fetch-shakhas',
        title: 'Fetch Shakhas',
        description: 'Load paginated shakhas with mock member counts.',
        defaultInput: JSON.stringify({ page: 1, pageSize: 10 }, null, 2),
        validate: (payload) => {
          const page = payload['page'];
          const pageSize = payload['pageSize'];
          if (typeof page !== 'number' || page <= 0) {
            return 'page must be a positive number.';
          }
          if (typeof pageSize !== 'number' || pageSize <= 0) {
            return 'pageSize must be a positive number.';
          }
          return null;
        },
        onRun: (payload) => fetchShakhas(payload['page'] as number, payload['pageSize'] as number),
      },
      {
        id: 'create-shakha',
        title: 'Create Shakha',
        description: 'Create a new shakha with the provided name.',
        defaultInput: JSON.stringify({ name: 'Salalah City' }, null, 2),
        validate: (payload) => {
          if (!isNonEmptyString(payload['name'])) {
            return 'name is required.';
          }
          return null;
        },
        onRun: (payload) => createShakha(payload['name'] as string),
      },
      {
        id: 'update-shakha',
        title: 'Update Shakha',
        description: 'Rename an existing shakha.',
        defaultInput: JSON.stringify({ id: 'ckshakha123', name: 'Al Baleed' }, null, 2),
        validate: (payload) => {
          if (!isNonEmptyString(payload['id'])) {
            return 'id is required.';
          }
          if (!isNonEmptyString(payload['name'])) {
            return 'name is required.';
          }
          return null;
        },
        onRun: (payload) => updateShakha(payload['id'] as string, payload['name'] as string),
      },
      {
        id: 'delete-shakha',
        title: 'Delete Shakha',
        description: 'Delete a shakha with no assigned members.',
        defaultInput: JSON.stringify({ id: 'ckshakha123' }, null, 2),
        validate: (payload) => {
          if (!isNonEmptyString(payload['id'])) {
            return 'id is required.';
          }
          return null;
        },
        onRun: (payload) => deleteShakha(payload['id'] as string),
      },
    ],
  },
  {
    id: 'members',
    title: 'Members',
    description: 'Member profile and renewal actions',
    actions: [],
  },
];
