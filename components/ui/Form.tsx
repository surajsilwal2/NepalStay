'use client';

import React from 'react';

interface FormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Form Component Wrapper
 * Provides consistent form styling and submission handling
 *
 * Usage:
 * <Form onSubmit={handleSubmit}>
 *   <FormGroup>
 *     <Input name="email" type="email" required />
 *   </FormGroup>
 *   <button type="submit">Submit</button>
 * </Form>
 */
export function Form({
  onSubmit,
  children,
  className = '',
  isLoading = false,
}: FormProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;
    await onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {children}
    </form>
  );
}

/**
 * FormGroup Component
 * Wrapper for form fields with consistent spacing
 */
export function FormGroup({ children, className = '' }: FormGroupProps) {
  return <div className={`space-y-2 ${className}`}>{children}</div>;
}

interface FormLabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}

/**
 * FormLabel Component
 */
export function FormLabel({ htmlFor, children, required }: FormLabelProps) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

interface FormErrorProps {
  message?: string;
}

/**
 * FormError Component
 */
export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return <p className="text-sm text-red-500">{message}</p>;
}

interface FormHintProps {
  children: React.ReactNode;
}

/**
 * FormHint Component
 * For helper text below form fields
 */
export function FormHint({ children }: FormHintProps) {
  return <p className="text-xs text-gray-500">{children}</p>;
}

interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
}

/**
 * FormField Component
 * Complete field wrapper with label, error, and hint
 *
 * Usage:
 * <FormField label="Email" error={errors.email} required>
 *   <Input name="email" type="email" />
 * </FormField>
 */
export function FormField({
  label,
  error,
  hint,
  children,
  required,
}: FormFieldProps) {
  return (
    <div className="mb-6">
      {label && <FormLabel required={required}>{label}</FormLabel>}
      <div className="mt-1">{children}</div>
      {error && <FormError message={error} />}
      {hint && !error && <FormHint>{hint}</FormHint>}
    </div>
  );
}
