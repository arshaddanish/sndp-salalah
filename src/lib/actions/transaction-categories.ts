'use server';

import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { transactionCategories, transactions } from '@/lib/db/schema';
import {
  createCategorySchema,
  deleteCategorySchema,
  updateCategorySchema,
} from '@/lib/validations/transaction-categories';
import type { ActionResult } from '@/types/actions';
import type { PaginationResponse } from '@/types/pagination';
import type {
  TransactionCategoryOption,
  TransactionCategoryWithUsageCount,
} from '@/types/transaction-categories';

function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase();
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

  try {
    const offset = (page - 1) * pageSize;

    const [items, countResult] = await Promise.all([
      db
        .select({
          id: transactionCategories.id,
          name: transactionCategories.name,
          description: transactionCategories.description,
          type: transactionCategories.type,
          is_system: transactionCategories.is_system,
          created_at: transactionCategories.created_at,
          updated_at: transactionCategories.updated_at,
          transactionCount: sql<number>`cast(count(${transactions.id}) as int)`,
        })
        .from(transactionCategories)
        .leftJoin(transactions, eq(transactions.category_id, transactionCategories.id))
        .groupBy(transactionCategories.id)
        .orderBy(transactionCategories.created_at)
        .limit(pageSize)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(transactionCategories),
    ]);

    const totalCount = Number(countResult[0]?.count ?? 0);

    const itemsWithUsageCount: TransactionCategoryWithUsageCount[] = items.map((item) => ({
      ...item,
      transactionCount: item.transactionCount ?? 0,
    }));

    return {
      success: true,
      data: {
        items: itemsWithUsageCount,
        totalCount,
      },
    };
  } catch (error) {
    console.error('Error fetching transaction categories:', error);
    return {
      success: false,
      error: 'Unable to load transaction categories.',
    };
  }
}

export async function fetchTransactionCategoryOptions(): Promise<
  ActionResult<TransactionCategoryOption[]>
> {
  try {
    const items = await db
      .select({
        id: transactionCategories.id,
        name: transactionCategories.name,
        type: transactionCategories.type,
      })
      .from(transactionCategories)
      .where(eq(transactionCategories.is_system, false));

    return {
      success: true,
      data: items,
    };
  } catch (error) {
    console.error('Error fetching transaction category options:', error);
    return {
      success: false,
      error: 'Unable to load transaction categories.',
    };
  }
}

export async function fetchTransactionCategoryFilterOptions(): Promise<
  ActionResult<TransactionCategoryOption[]>
> {
  try {
    const items = await db
      .select({
        id: transactionCategories.id,
        name: transactionCategories.name,
        type: transactionCategories.type,
      })
      .from(transactionCategories);

    return {
      success: true,
      data: items,
    };
  } catch (error) {
    console.error('Error fetching transaction category filter options:', error);
    return {
      success: false,
      error: 'Unable to load transaction categories.',
    };
  }
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

    const existing = await db
      .select({ id: transactionCategories.id })
      .from(transactionCategories)
      .where(sql`lower(${transactionCategories.name}) = ${normalizeCategoryName(sanitizedName)}`)
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        error: 'A category with this name already exists.',
      };
    }

    const [created] = await db
      .insert(transactionCategories)
      .values({
        name: sanitizedName,
        type: validationResult.data.type,
        is_system: false,
      })
      .returning();

    revalidatePath('/transactions/categories');

    if (!created) {
      return {
        success: false,
        error: 'Failed to create category',
      };
    }

    return {
      success: true,
      data: { ...created, transactionCount: 0 },
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

    const [existing] = await db
      .select()
      .from(transactionCategories)
      .where(eq(transactionCategories.id, id));

    if (!existing) {
      return {
        success: false,
        error: 'Category not found',
      };
    }

    if (existing.is_system) {
      return {
        success: false,
        error: 'System category names cannot be changed.',
      };
    }

    // Fix 2: derive both normalized names from validated data and existing row
    const normalizedNextName = normalizeCategoryName(validationResult.data.name);
    const normalizedCurrentName = normalizeCategoryName(existing.name);
    const typeHasChanged = validationResult.data.type !== existing.type;

    if (normalizedNextName === normalizedCurrentName && !typeHasChanged) {
      return {
        success: true,
        data: { ...existing, transactionCount: 0 },
      };
    }

    if (normalizedNextName !== normalizedCurrentName) {
      // Fix 3: use normalizedNextName (correct variable) in the WHERE clause
      // and fix the duplicate check — query already excludes current id via .limit(1)
      // so just check if any row came back
      const duplicate = await db
        .select({ id: transactionCategories.id })
        .from(transactionCategories)
        .where(
          sql`lower(${transactionCategories.name}) = ${normalizedNextName} AND ${transactionCategories.id} != ${id}`,
        )
        .limit(1);

      if (duplicate.length > 0) {
        return {
          success: false,
          error: 'A category with this name already exists.',
        };
      }
    }

    const [updated] = await db
      .update(transactionCategories)
      .set({
        name: validationResult.data.name,
        type: validationResult.data.type,
        updated_at: new Date(),
      })
      .where(eq(transactionCategories.id, id))
      .returning();

    revalidatePath('/transactions/categories');

    if (!updated) {
      return {
        success: false,
        error: 'Category was deleted during update.',
      };
    }

    return {
      success: true,
      data: { ...updated, transactionCount: 0 },
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

    const [category] = await db
      .select()
      .from(transactionCategories)
      .where(eq(transactionCategories.id, validationResult.data.id));

    if (!category) {
      return {
        success: false,
        error: 'Category not found',
      };
    }

    if (category.is_system) {
      return {
        success: false,
        error: 'System categories cannot be deleted.',
      };
    }

    await db
      .delete(transactionCategories)
      .where(eq(transactionCategories.id, validationResult.data.id));

    revalidatePath('/transactions/categories');

    return {
      success: true,
      data: { id: validationResult.data.id },
    };
  } catch (error) {
    console.error('Error deleting transaction category:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while deleting the category',
    };
  }
}
