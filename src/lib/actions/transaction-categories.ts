'use server';

import { revalidatePath } from 'next/cache';

import { MOCK_TRANSACTION_CATEGORIES } from '@/lib/mock-data/transaction-categories';
import {
  createCategorySchema,
  deleteCategorySchema,
  updateCategorySchema,
} from '@/lib/validations/transaction-categories';
import type { ActionResult } from '@/types/actions';
import type { PaginationResponse } from '@/types/pagination';
import type { TransactionCategoryWithUsageCount } from '@/types/transaction-categories';

function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase();
}

function getNextCategoryId(): string {
  const maxId = MOCK_TRANSACTION_CATEGORIES.reduce((currentMax, category) => {
    const parsedValue = Number.parseInt(category.id.replaceAll(/\D+/g, ''), 10);
    if (Number.isNaN(parsedValue)) {
      return currentMax;
    }

    return Math.max(currentMax, parsedValue);
  }, 0);

  return `cat-${maxId + 1}`;
}

export async function fetchTransactionCategories(
  page: number,
  pageSize: number,
): Promise<ActionResult<PaginationResponse<TransactionCategoryWithUsageCount>>> {
  const isValidPage = Number.isInteger(page) && page > 0;
  const isValidPageSize = Number.isInteger(pageSize) && pageSize > 0;

  if (!isValidPage || !isValidPageSize) {
    return {
      success: false,
      error: 'Invalid pagination: page and pageSize must be positive integers.',
    };
  }

  const start = (page - 1) * pageSize;
  const paginatedItems = MOCK_TRANSACTION_CATEGORIES.slice(start, start + pageSize);

  return {
    success: true,
    data: {
      items: paginatedItems,
      totalCount: MOCK_TRANSACTION_CATEGORIES.length,
    },
  };
}

export async function createTransactionCategory(
  name: string,
  type: 'income' | 'expense',
): Promise<ActionResult<TransactionCategoryWithUsageCount>> {
  try {
    const validationResult = createCategorySchema.safeParse({ name, type });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || 'Invalid input',
      };
    }

    const sanitizedName = validationResult.data.name;
    const normalizedName = normalizeCategoryName(sanitizedName);
    const hasDuplicateName = MOCK_TRANSACTION_CATEGORIES.some(
      (category) => normalizeCategoryName(category.name) === normalizedName,
    );

    if (hasDuplicateName) {
      return {
        success: false,
        error: 'A category with this name already exists.',
      };
    }

    const createdCategory: TransactionCategoryWithUsageCount = {
      id: getNextCategoryId(),
      name: sanitizedName,
      type: validationResult.data.type,
      is_system: false,
      transactionCount: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    MOCK_TRANSACTION_CATEGORIES.unshift(createdCategory);

    revalidatePath('/transactions/categories');

    return {
      success: true,
      data: createdCategory,
    };
  } catch (error) {
    console.error('Error creating transaction category:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while creating the category',
    };
  }
}

export async function updateTransactionCategory(
  id: string,
  name: string,
  type: 'income' | 'expense',
): Promise<ActionResult<TransactionCategoryWithUsageCount>> {
  try {
    const validationResult = updateCategorySchema.safeParse({ id, name, type });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || 'Invalid input',
      };
    }

    const categoryIndex = MOCK_TRANSACTION_CATEGORIES.findIndex((category) => category.id === id);

    if (categoryIndex === -1) {
      return {
        success: false,
        error: 'Category not found',
      };
    }

    const targetCategory = MOCK_TRANSACTION_CATEGORIES[categoryIndex]!;

    if (targetCategory.is_system) {
      return {
        success: false,
        error: 'System category names cannot be changed.',
      };
    }

    const normalizedNextName = normalizeCategoryName(validationResult.data.name);
    const normalizedCurrentName = normalizeCategoryName(targetCategory.name);

    if (normalizedNextName === normalizedCurrentName) {
      const unchangedCategory = { ...targetCategory };
      return {
        success: true,
        data: unchangedCategory,
      };
    }

    const hasDuplicateName = MOCK_TRANSACTION_CATEGORIES.some(
      (category) =>
        category.id !== id && normalizeCategoryName(category.name) === normalizedNextName,
    );

    if (hasDuplicateName) {
      return {
        success: false,
        error: 'A category with this name already exists.',
      };
    }

    targetCategory.name = validationResult.data.name;
    targetCategory.type = validationResult.data.type;
    targetCategory.updated_at = new Date();

    revalidatePath('/transactions/categories');

    return {
      success: true,
      data: targetCategory,
    };
  } catch (error) {
    console.error('Error updating transaction category:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while updating the category',
    };
  }
}

export async function deleteTransactionCategory(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const validationResult = deleteCategorySchema.safeParse({ id });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || 'Invalid input',
      };
    }

    const categoryIndex = MOCK_TRANSACTION_CATEGORIES.findIndex(
      (category) => category.id === validationResult.data.id,
    );

    if (categoryIndex === -1) {
      return {
        success: false,
        error: 'Category not found',
      };
    }

    const category = MOCK_TRANSACTION_CATEGORIES[categoryIndex]!;
    if (category.is_system) {
      return {
        success: false,
        error: 'System categories cannot be deleted.',
      };
    }

    if (category.transactionCount > 0) {
      return {
        success: false,
        error: `This category is used in ${category.transactionCount} transaction${category.transactionCount === 1 ? '' : 's'} and cannot be deleted.`,
      };
    }

    MOCK_TRANSACTION_CATEGORIES.splice(categoryIndex, 1);

    revalidatePath('/transactions/categories');

    return {
      success: true,
      data: {
        id: validationResult.data.id,
      },
    };
  } catch (error) {
    console.error('Error deleting transaction category:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while deleting the category',
    };
  }
}
