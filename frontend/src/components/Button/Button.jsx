import "./Button.css";

export default function Button({
  children,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  className = "",
  type = "button",
  disabled = false,
  onClick,
  ...props
}) {
  const classNames = [
    "button",
    variant && `button--${variant}`,
    size && `button--${size}`,
    fullWidth && "button--full-width",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

