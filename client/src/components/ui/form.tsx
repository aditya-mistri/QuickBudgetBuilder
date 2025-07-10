import * as React from "react";
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

// -- Form wrapper --
const Form = FormProvider;

// -- Context to pass field name --
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue | undefined>(undefined);

// -- FormField component --
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

// -- Context for item ID --
type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue | undefined>(undefined);

// -- Hook to use form field context --
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  
  if (!fieldContext) {
    throw new Error("useFormField must be used within a <FormField>");
  }

  if (!itemContext) {
    throw new Error("useFormField must be used within a <FormItem>");
  }

  // Get form context
  const formContext = useFormContext();
  
  if (!formContext) {
    throw new Error("useFormField must be used within a <Form> provider");
  }

  const { getFieldState, formState } = formContext;

  // Create field state with proper error handling
  const fieldState = React.useMemo(() => {
    if (!formState) {
      return {
        invalid: false,
        isDirty: false,
        isTouched: false,
        isValidating: false,
        error: undefined,
      };
    }

    // Try to use getFieldState if available (React Hook Form v7.43.0+)
    if (getFieldState && typeof getFieldState === 'function') {
      try {
        return getFieldState(fieldContext.name, formState);
      } catch (error) {
        // If getFieldState fails, fall back to manual implementation
      }
    }
    
    // Fallback implementation for older versions or when getFieldState fails
    const fieldError = formState.errors?.[fieldContext.name];
    const isDirty = formState.dirtyFields?.[fieldContext.name];
    const isTouched = formState.touchedFields?.[fieldContext.name];
    const isValidating = formState.isValidating || false;
    
    return {
      invalid: !!fieldError,
      isDirty: !!isDirty,
      isTouched: !!isTouched,
      isValidating,
      error: fieldError,
    };
  }, [getFieldState, fieldContext.name, formState]);

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

// -- FormItem component --
const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId();
  
  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

// -- FormLabel component --
const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();
  
  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

// -- FormControl component --
const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  
  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error 
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

// -- FormDescription component --
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();
  
  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

// -- FormMessage component --
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

// -- Export all --
export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
};