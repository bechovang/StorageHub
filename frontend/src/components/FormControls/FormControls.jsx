import "./FormControls.css";

function FieldWrapper({
  id,
  label,
  required,
  error,
  helperText,
  children,
}) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required && (
          <span className="field__required" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {error ? (
        <p className="field__message field__message--error">
          {error}
        </p>
      ) : helperText ? (
        <p className="field__message">{helperText}</p>
      ) : null}
    </div>
  );
}

export function Input({
  id,
  label,
  required = false,
  error = "",
  helperText = "",
  className = "",
  ...props
}) {
  return (
    <FieldWrapper
      id={id}
      label={label}
      required={required}
      error={error}
      helperText={helperText}
    >
      <input
        {...props}
        id={id}
        className={`field__control ${error ? "is-invalid" : ""} ${className}`}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </FieldWrapper>
  );
}

export function Select({
  id,
  label,
  options = [],
  required = false,
  error = "",
  helperText = "",
  ...props
}) {
  return (
    <FieldWrapper
      id={id}
      label={label}
      required={required}
      error={error}
      helperText={helperText}
    >
      <select
        {...props}
        id={id}
        className={`field__control ${error ? "is-invalid" : ""}`}
        required={required}
        aria-invalid={Boolean(error)}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

export function Textarea({
  id,
  label,
  required = false,
  error = "",
  helperText = "",
  ...props
}) {
  return (
    <FieldWrapper
      id={id}
      label={label}
      required={required}
      error={error}
      helperText={helperText}
    >
      <textarea
        {...props}
        id={id}
        className={`field__control field__textarea ${
          error ? "is-invalid" : ""
        }`}
        required={required}
        aria-invalid={Boolean(error)}
      />
    </FieldWrapper>
  );
}

export function Checkbox({
  id,
  label,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <label className="checkbox" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />

      <span className="checkbox__box" aria-hidden="true" />

      <span>{label}</span>
    </label>
  );
}