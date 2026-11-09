# Late Checkout & Liquidation (V42)

## Rule

- `endDate` inclusive. `daysLate = max(0, today - effectiveDueDate)`.
- `lateFee = daysLate × dailyRent × LATE_FEE_PERCENT / 100` (default `300`).
- Escalate when `daysLate > LATE_ESCALATION_DAYS` (default `3`) — day 4.
- No `OVERDUE` reservation status: lateness is derived on-read (AD-4).
- Policy snapshot of the reservation is used (`reservation.policy`; fallback active policy).

## Case lifecycle (`late_checkout_cases`)

| Status | Meaning | Staff can settle? |
|---|---|---|
| `LATE` | 1..threshold late days; manager may act early | Yes |
| `PENDING_MANAGER` | `daysLate > threshold` | No |
| `EXTENDED` | Manager approved `extendedUntil`; penalty continues | Yes until `extendedUntil` |
| `RESOLVED` | Customer settled | No |
| `LIQUIDATED` | Contract terminated | No |

Manager can act from day 1. `EXTEND 0` means “allow checkout today” and sets
`extendedUntil = today`. After `extendedUntil`, the case re-evaluates to
`PENDING_MANAGER` if still over threshold.

## Force checkout vs liquidation

- **Force checkout** (`POST /reservations/{id}/checkout-request/forced`):
  `CHECKED_IN → CHECKOUT_REQUESTED`, creates/updates a `CHECKOUT` task,
  manager reason + deadline (max +3 days). No automatic deposit forfeiture.
- **Liquidation** (`POST /reservations/{id}/liquidation` or case decision):
  contract + reservation `CLOSED`, settlement `LIQUIDATION` (`refund = 0`,
  `lateFee` recorded), access code cleared, pending checkout requests cancelled,
  `CHECKOUT` task cancelled, `CLEANING` task created with note, unit `PREPARING`
  and blocked until the cleaning task is `DONE`.

## Money

Normal checkout (server-authoritative):

```text
refund   = max(0, deposit - damageFee - lateFee)
extraDue = max(0, damageFee + lateFee - deposit)
```

Staff collects `extraDue` at the counter; one `EXTRA_FEE` payment row records it.
No QR/PayOS is created for this.

Liquidation: `refund = 0`; no extra collection, no goods proceeds.
If `lateFee > deposit`, only a note “vượt cọc” is stored.

## Endpoints (manager, FACILITY_MANAGER/SYSTEM_ADMIN)

- `GET /api/v1/checkout-cases`
- `GET /api/v1/checkout-cases/active-rentals`
- `POST /api/v1/checkout-cases/{caseId}/decision`
- `POST /api/v1/reservations/{reservationId}/checkout-request/forced`
- `POST /api/v1/reservations/{reservationId}/liquidation`

FE tab: `/facility/checkouts` — “Trả kho & Thanh lý”.

## Availability

`units` `PREPARING` with an active `CLEANING` task is not available. When the
cleaning task is marked `DONE`, the unit flips to `AVAILABLE` if no active/future
reservation remains. For normal late checkout, `reservations.closed_at` is used
as the buffer start instead of the old `endDate`.
