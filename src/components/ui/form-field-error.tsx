interface FormFieldErrorProps {
  fieldErrors: Record<string, string>;
  fieldKey: string;
  errorId: string;
}

export function getFieldAriaProps(
  fieldErrors: Record<string, string>,
  fieldKey: string,
  errorId: string,
): {
  'aria-invalid': true | undefined;
  'aria-describedby': string | undefined;
} {
  if (!fieldErrors[fieldKey]) {
    return {
      'aria-invalid': undefined,
      'aria-describedby': undefined,
    };
  }

  return {
    'aria-invalid': true,
    'aria-describedby': errorId,
  };
}

export function FormFieldError({ fieldErrors, fieldKey, errorId }: Readonly<FormFieldErrorProps>) {
  const error = fieldErrors[fieldKey];
  if (!error) {
    return null;
  }

  return (
    <p id={errorId} className="text-danger text-xs" role="alert">
      {error}
    </p>
  );
}
