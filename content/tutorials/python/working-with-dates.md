Dates and times appear everywhere: order timestamps, subscription renewals, report periods, scheduling. Python's `datetime` module covers them — as long as you handle **time zones** carefully.

## Dates, times and datetimes

```python
from datetime import date, datetime, time, timedelta

today = date.today()
launch = date(2026, 10, 1)
meeting = datetime(2026, 9, 30, 14, 30)
opening = time(9, 0)

print(launch.year, launch.month, launch.day)
print(launch.strftime("%d %b %Y"))      # 01 Oct 2026
print(launch.isoformat())               # 2026-10-01
```

## Arithmetic with `timedelta`

```python
from datetime import date, timedelta

order_date = date(2026, 9, 28)
delivery = order_date + timedelta(days=5)
print(delivery)                               # 2026-10-03

days_left = date(2026, 12, 31) - date(2026, 9, 30)
print(days_left.days)                          # 92
```

`timedelta` supports days, seconds, microseconds, minutes, hours and weeks — but not months or years, because they vary in length. For "one month later", use `dateutil.relativedelta` or calendar logic.

## Parsing and formatting

```python
from datetime import datetime

dt = datetime.strptime("30/09/2026 18:45", "%d/%m/%Y %H:%M")
print(dt.strftime("%A, %d %B %Y at %I:%M %p"))   # Wednesday, 30 September 2026 at 06:45 PM

iso = datetime.fromisoformat("2026-09-30T18:45:00+05:30")
print(iso.isoformat())                           # 2026-09-30T18:45:00+05:30
```

| Code | Meaning | Example |
| --- | --- | --- |
| `%Y` | Year | 2026 |
| `%m` | Month (01–12) | 09 |
| `%d` | Day (01–31) | 30 |
| `%H` / `%I` | Hour 24h / 12h | 18 / 06 |
| `%M` | Minute | 45 |
| `%b` / `%B` | Month name | Sep / September |
| `%a` / `%A` | Weekday name | Wed / Wednesday |
| `%p` | AM/PM | PM |

Use ISO 8601 (`2026-09-30T18:45:00+05:30`) for storing and exchanging timestamps — it's unambiguous and sorts correctly as text.

## Time zones

A datetime without time-zone information is **naive**: Python doesn't know whether "18:45" is in India or London. Always use **aware** datetimes for real timestamps:

```python
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

now_utc = datetime.now(timezone.utc)
now_india = now_utc.astimezone(ZoneInfo("Asia/Kolkata"))
now_dubai = now_utc.astimezone(ZoneInfo("Asia/Dubai"))

print(now_india.tzname())   # IST
```

Best practice:

1. **Store and compute in UTC.**
2. **Convert to the user's time zone only for display.**
3. Never subtract naive and aware datetimes (Python raises a `TypeError`).

Daylight saving time matters for zones like `Europe/Berlin`: adding 24 hours isn't always "the same time tomorrow". `zoneinfo` handles the transitions correctly.

(On Windows, install the `tzdata` package so `zoneinfo` has time-zone data.)

## Unix timestamps

```python
from datetime import datetime, timezone

ts = 1790812800
print(datetime.fromtimestamp(ts, tz=timezone.utc))     # 2026-10-01 00:00:00+00:00
print(datetime(2026, 10, 1, tzinfo=timezone.utc).timestamp())  # 1790812800.0
```

## Common tasks

```python
from datetime import date, timedelta

def business_days_between(start: date, end: date) -> int:
    days = 0
    current = start
    while current < end:
        if current.weekday() < 5:        # Monday=0 … Friday=4
            days += 1
        current += timedelta(days=1)
    return days

def age(born: date, today: date) -> int:
    return today.year - born.year - ((today.month, today.day) < (born.month, born.day))

print(business_days_between(date(2026, 9, 28), date(2026, 10, 5)))  # 5
print(age(date(1996, 10, 15), date(2026, 9, 30)))                  # 29
```

## Try it yourself

Write a function that takes an order timestamp in UTC and a customer's time zone, and returns the estimated delivery date (3 business days later) formatted for that customer, e.g. "Mon, 05 Oct 2026". Test it with `Asia/Kolkata` and `America/New_York` for an order placed at 23:30 UTC.
