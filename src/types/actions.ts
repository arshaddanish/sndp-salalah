/**
 * Standard server action result shape.
 */
export type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
