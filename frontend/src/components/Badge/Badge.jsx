import "./Badge.css";

export default function Badge({
  children,
  tone = "default",
  variant = "badge",
  className = "",
}) {
  if (variant === "state") {
    const stateClass = [
      "state",
      tone === "danger" || tone === "red" ? "state--red" : "",
      tone === "muted" ? "state--muted" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return <span className={stateClass}>{children}</span>;
  }

  const badgeClass = [
    "badge",
    `badge--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={badgeClass}>
      <span className="badge__indicator" aria-hidden="true" />
      {children}
    </span>
  );
}