# Ranch Hand 🐴

A service tracking and billing reference app for ranch owners, staff, and horse owners. Ranch Hand keeps everyone on the same page — from daily task checklists to monthly billing summaries — without any money changing hands through the app.

---

## What It Does

Ranch Hand connects two types of users around a shared ranch:

**Admins** (ranch owners and staff) manage the operation — they create the ranch, set up animals and services, run the daily task checklist, and monitor billing across all owners.

**Users** (horse/animal owners) join the ranch with a 6-digit code, manage their animal's record, request services, and track what they're being charged for each month.

---

## How It Works

### Joining a Ranch
An admin creates a ranch and receives a unique 6-digit code. Animal owners use that code to join. Once inside, users can either claim an animal the admin already created or add their own.

### Animals
Each animal has a full record — breed, age, color, feed details, vet contact, farrier contact, and notes for special needs. Owners can set their record to **public** (full details visible to all ranch members) or **private** (only the name and owner name are shown to other users; admins always see everything).

Animals can be sorted by name, owner, or a **custom route order** — admins arrange animals into the order they physically walk the property, so the task list matches their real-world service route.

### Services
Admins create reusable services with a name, description, price, and payment type:

- **One-time** — billed each time the task is marked complete (e.g. a vet visit, a grain delivery)
- **Recurring** — a monthly fee billed by percentage of completion (e.g. daily blanketing at $20/month)

Services are then assigned to individual animals. Admins can add per-animal notes on a service — for example, "blanket at 60°F and below" for one horse and "blanket at 50°F" for another.

Users can also **request services**, which go into a pending queue for admin approval before billing begins.

### Daily Task Checklist
The admin's core daily tool. Every active service for every animal shows up as a checkbox. Admins work through the list as they move through the ranch, checking off tasks as they go. The page shows a live progress bar across the whole ranch for the day.

### Billing
Billing figures are **for tracking and reference only** — no money is processed through the app. All payments are arranged directly between owners and the ranch.

- **One-time services** are added to the bill only when the task is marked complete
- **Recurring services** are calculated at the end of the month based on completion percentage — if a daily task was completed 20 out of 30 days, the owner sees 66% of the monthly rate

Admins see a full breakdown per owner and per animal. Users see only their own animals and a summary of what they're on track to be charged.

### Members
Admins can view all ranch members and their roles. The ranch's 6-digit join code is always visible here to share with new owners. Any user can be promoted to admin — useful for staff or co-owners who need full access.

---

## User Roles

| Feature | Admin | User |
|---|---|---|
| Create / edit any animal | ✅ | Own animals only |
| Assign services to animals | ✅ | Request only |
| Approve service requests | ✅ | — |
| Daily task checklist | ✅ | — |
| View all billing | ✅ | Own billing only |
| Manage members | ✅ | — |
| Promote users to admin | ✅ | — |
| View ranch board | ✅ | ✅ |
| Edit profile & password | ✅ | ✅ |

---

## Billing Logic

| Service Type | How It's Calculated |
|---|---|
| One-time | Price × number of completions that month |
| Recurring (daily) | Monthly price × (days completed ÷ days in month) |

A $30/month daily service completed 20 of 30 days → **$20.00** shown for that month.

Billing is a calculation only. The app does not process, hold, or transfer any money.

---

## Roadmap

- **Phase 1 — Web app** *(current)*: Mobile-first React web app, tested with a real ranch admin
- **Phase 2 — Polish**: Animal photo uploads, push notifications for service requests and approvals
- **Phase 3 — Mobile app**: React Native build for iOS and Android
- **Phase 4 — Launch**: App Store submission and distribution
