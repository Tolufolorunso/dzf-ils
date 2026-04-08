# DZF-ILS — Dzuels Integrated Library System

## Overview

DZF-ILS (Dzuels Integrated Library System) is a full-stack web-based library management system built with **Next.js 15**, **React 19**, and **MongoDB**. It is designed for community and school libraries to manage books, patrons, circulation, attendance, analytics, and patron engagement through a gamified points system.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19 |
| Backend | Next.js API Routes (REST) |
| Database | MongoDB via Mongoose 8 |
| Auth | JWT (jsonwebtoken) + HTTP-only cookies |
| Image Storage | Cloudinary |
| Password Hashing | bcryptjs |
| Barcode Generation | JsBarcode |
| PDF/Print | react-to-print, html2canvas, jszip |
| Icons | lucide-react |

---

## Environment Variables

Create a `.env` file at the root with the following:

```env
MONGODB_URI_LOCAL=mongodb://127.0.0.1:27017/dzuelsDB
MONGODB_URI_LOCAL_COHORT=mongodb://127.0.0.1:27017/dbCohort
MONGODB_URI=                        # Production MongoDB URI
BASEURL=                            # Production base URL
LOCALURL=http://localhost:3000/api  # Local API base URL
JWT_SECRET=                         # Secret key for JWT signing
JWT_EXPIRES_IN=2d                   # Token expiry (default 2 days)
NEXT_ENV=development
NEXT_PUBLIC_SECRET=
NEXTAUTH_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## Project Structure

```
src/
  app/
    api/                  # All API routes (REST endpoints)
      auth/               # login, register, me, logout
      patrons/            # CRUD + upload
      catalogs/           # CRUD by barcode
      circulations/       # check-in, check-out, holds, overdues, renew
      book-summaries/     # submit + review
      attendance/         # mark + fetch
      analytics/monthly/  # leaderboard + stats
      dashboard/          # summary stats
      transcomm/articles/ # staff articles
    auth/                 # Login & Register pages
    catalog/              # Catalog list, new, view, edit
    patrons/              # Patron list, new, view, edit
    circulations/         # Checkout, checkin, holds, overdues, renewal, summaries
    attendance/           # Attendance marking
    analytics/            # Monthly analytics
    leaderboard/          # Public leaderboard
    submit-summary/       # Public summary submission
    transcomm/            # Staff communication articles
    dashboard/            # Main dashboard
  models/                 # Mongoose schemas
  lib/                    # dbConnect, auth, permissions, utils
  components/             # Reusable UI components
```

---

## Data Models

### 1. UserModel (System Staff Accounts)

```js
{
  username: String (unique, lowercase),
  name: String,
  password: String (bcrypt hashed),
  phone: String,
  active: Boolean (default: false — must be activated by admin),
  role: enum ['admin', 'asst_admin', 'ima', 'librarian', 'ict', 'facility'],
  userImg: { secure_url, public_id },
  createdAt: Date
}
```

### 2. PatronModel (Library Members)

```js
{
  firstname, surname, middlename: String,
  email, phoneNumber: String,
  gender: enum ['male', 'female'],
  address: { street, city, state, country },
  patronType: enum ['student', 'teacher', 'staff', 'guest'],
  barcode: String (unique, auto-generated: YYYY0001),
  active: Boolean (default: true),
  patronExpiryDate: Date (2 years for students, 5 for staff),
  points: Number (gamification score),
  hasBorrowedBook: Boolean,
  studentSchoolInfo: { schoolName, schoolAdress, headOfSchool, currentClass, schoolEmail, schoolPhoneNumber },
  parentInfo: { parentName, parentAddress, parentPhoneNumber, relationshipToPatron, parentEmail },
  employerInfo: { employerName, schoolName, schoolAdress, headOfSchool, schoolEmail, schoolPhoneNumber },
  image_url: { secure_url, public_id },
  messagePreferences: Array,
  registeredBy: String,
  itemsCheckedOutHistory: [{ itemId, itemTitle, itemBarcode, checkoutDate, dueDate, eventTitle }],
  event: [{ eventTitle, points, eventDate }],
  is18: Boolean (soft-delete flag)
}
```

### 3. CatalogingModel (Library Items)

```js
{
  title: { mainTitle, subtitle },
  author: { mainAuthor, additionalAuthors },
  publicationInfo: { publisher, place, year },
  ISBN: String,
  classification: String (Dewey Decimal or similar),
  controlNumber: String (unique),
  indexTermGenre: Array of strings,
  informationSummary: String,
  language: String,
  physicalDescription: String,
  holdingsInformation: Number,
  barcode: String (unique),
  image_url: String,
  isCheckedOut: Boolean (default: false),
  library: String (default: 'AAoJ'),
  checkedOutHistory: [{ checkedOutBy (ref Patron), checkedOutAt, dueDate }],
  patronsCheckedOutHistory: [{ checkedOutBy, checkedOutAt, dueDate, fullname, contactNumber, barcode, returnedAt }]
}
```

### 4. BookSummaryModel

```js
{
  patronId, patronBarcode, patronName,
  bookId, bookTitle, bookBarcode,
  summary: String (min 100 chars),
  rating: Number (1-5),
  submissionDate: Date,
  status: enum ['pending', 'approved', 'rejected'],
  points: Number (25 base + bonus),
  reviewedBy, reviewDate, feedback,
  library: String
}
// Unique constraint: one summary per patron per book
```

### 5. AttendanceModel

```js
{
  patronId, patronBarcode, patronName,
  classType: enum ['literacy', 'reading_club', 'book_discussion', 'workshop', 'other'],
  className: String,
  classDate: Date,
  attendanceTime: Date,
  markedBy: String,
  points: Number (fixed: 20),
  notes: String,
  library: String
}
```

### 6. MonthlyActivityModel (Leaderboard Engine)

```js
{
  patronId, patronBarcode, patronName,
  year: Number, month: Number (1-12),
  booksCheckedOut, booksReturned,
  classesAttended,
  summariesSubmitted, summariesApproved,
  totalPoints,
  pointsFromBooks, pointsFromAttendance, pointsFromSummaries,
  activityScore: Number (calculated),
  rank: Number,
  isActive: Boolean,
  library: String
}
// Unique: one record per patron per month
```

### 7. TranscommArticleModel

```js
{
  title, excerpt, content (min 200 chars),
  category: enum ['drnicer-values','leadership-basics','communication','teamwork','problem-solving','confidence','inspiration'],
  readTime, tags: Array,
  author: String,
  isActive: Boolean,
  viewCount: Number,
  library: String
}
```

### 8. LibraryModel

```js
{
  libraryName: String,
  address: { street, city, state, zipCode, country },
  competitionDetails: { isActive: Boolean, title: String }
}
```

---

## Points System (Gamification)

| Activity | Points Awarded |
|---|---|
| Borrow a book (checkout) | 10 pts |
| Return a book (check-in) | 15 pts |
| Attend a class | 20 pts |
| Submit a book summary | 25 pts (base, auto) |
| Staff bonus on summary | +1 to +20 pts |

Activity Score Formula (for leaderboard ranking):
```
activityScore = (booksCheckedOut × 10) + (booksReturned × 15) + (classesAttended × 20) + (summariesApproved × 25) + (totalPoints × 1)
```

---

## Role-Based Permissions

| Permission | admin | asst_admin | ict | librarian | ima | facility |
|---|---|---|---|---|---|---|
| View all patrons (incl. inactive) | ✅ | ✅ | ✅ | ✅ | | |
| Activate patrons | ✅ | ✅ | ✅ | | | |
| Deactivate patrons | ✅ | ✅ | ✅ | | | |
| Delete patrons | ✅ | | | | | |
| Edit patrons | ✅ | ✅ | ✅ | ✅ | | |
| User management | ✅ | | | | | |
| System settings | ✅ | | | | | |
| Book checkout/checkin | ✅ | ✅ | ✅ | ✅ | | |
| Mark attendance | ✅ | ✅ | ✅ | ✅ | | |
| View analytics | ✅ | ✅ | ✅ | ✅ | | |
| Generate reports | ✅ | ✅ | ✅ | | | |

---

## Feature: Authentication

### /auth/login — Login Page

**Purpose:** Entry point for all staff users.

**Inputs:**
- Username (text, required)
- Password (password, required)

**Process:**
1. POST to /api/auth/login
2. Server normalizes username to lowercase
3. Looks up user in UserModel
4. Checks active === true — inactive accounts are blocked with message to contact admin
5. Compares password with bcrypt
6. On success: generates JWT, sets HTTP-only cookie named ils_token (1 day expiry)

**Output on success:**
- Cookie set: ils_token (httpOnly, secure in production, sameSite: strict)
- Redirect to /dashboard
- Response: { status, message, user (no password), token }

**Output on error:**
- Missing fields → 400
- User not found or wrong password → 401 (same message, prevents enumeration)
- Account inactive → 403

**Security notes:**
- Timing delay applied on all auth paths to prevent timing attacks
- Admin must activate new accounts before first login

---

### /auth/register — Register Page

**Purpose:** Create a new staff account.

**Inputs:**
- Full Name (text, required)
- Username (text, required)
- Role (select): librarian | asst_admin | ima | ict | facility
- Password (password, min 5 chars, required)
- Confirm Password (required, must match)

**Process:**
1. Client validates passwords match and length >= 5
2. POST to /api/auth/register
3. Server hashes password with bcryptjs (10 salt rounds)
4. Creates user with active: false — admin must activate before login

**Output on success:**
- Success message shown
- Redirect to /auth/login after 1.5 seconds

**Output on error:**
- Duplicate username → 409
- Passwords don't match → client error
- Password too short → client error

**Note:** The admin role cannot be self-registered. New accounts are inactive by default.

---

## Feature: Patron Management

Patrons are library members. Types: student, teacher, staff, guest.

### /patrons — Patron List

**Purpose:** View and search all registered patrons.

**Inputs (client-side filters):**
- Search (text): matches surname, firstname, or barcode
- Patron Type (select): All | student | teacher | staff | guest
- Gender (select): All | male | female

**Process:**
- GET /api/patrons (auth required)
- All filtering done client-side after fetch
- Pagination: 80 per page

**Output (table):**
- Avatar (photo or initials)
- Name (Surname, Firstname)
- Barcode
- Type badge (color-coded)
- Gender
- Status: Active (green) / Inactive (yellow)
- Points total
- Actions: View | Edit

**Role note:** admin, asst_admin, ict, librarian see ALL patrons including inactive. Other roles see active only.

---

### /patrons/new — Register New Patron

**Purpose:** Add a new patron to the library system.

**Inputs (all patron types):**
- First Name (required)
- Surname (required)
- Middle Name (optional)
- Email (optional)
- Phone Number (optional)
- Gender: male | female
- Patron Type: student | teacher | staff | guest
- Address: Street, City, State, Country
- Message Preferences (default: email)

**Additional inputs for students:**
- School Name (select, with "others" option)
- Other School Name (text, shown when "others" selected)
- School Address, Head of School, Current Class
- School Email, School Phone Number
- Parent Name, Parent Address, Parent Phone Number
- Relationship to Patron, Parent Email

**Additional inputs for teacher/staff:**
- Employer Name
- School Name, School Address, Head of School
- School Email, School Phone Number

**Process:**
1. POST to /api/patrons (auth required)
2. Validates firstname and surname
3. Auto-generates barcode: YYYY + zero-padded count (e.g., 20250001)
4. Sets expiry: 2 years for students/guests, 5 years for staff/teacher
5. Saves registeredBy from logged-in user name

**Output on success:**
- { barcode, name, type }
- Redirect to patron list or barcode print page

---

### /patrons/[barcode] — Patron Profile

**Purpose:** Full view of a patron's details, photo, and borrowing history.

**Displays:**
- Photo (or initials avatar)
- Name, barcode, type, gender, active/inactive status
- Contact: email, phone, full address
- School info (students): school name, class, school email/phone
- Parent info (students): parent name, relationship, email, phone
- Employer info (teacher/staff): employer, school details
- Account: points, expiry date, registered by, message preferences
- Borrowing history: all books borrowed with title, barcode, checkout date, due date, return date

**Actions (role-dependent):**
- Edit Patron
- Deactivate (admin, asst_admin, ict) — sets active: false
- Reactivate (admin, asst_admin, ict, librarian) — sets active: true
- Delete Patron (admin only) — requires typing DELETE [barcode] to confirm

**Photo upload flow:**
- Choose File: file picker (max 5MB, images only)
- Take Photo: opens device camera via getUserMedia API
- Photo is auto-cropped to 300x300px square
- Uploaded to Cloudinary via POST /api/patrons/upload
- Stored as image_url: { secure_url, public_id }

**IMPORTANT:** A patron MUST have a photo uploaded before they can borrow books. Checkout will be blocked without a photo.

**Delete confirmation:**
- Admin only
- Modal requires typing exactly: DELETE [barcode]
- e.g., DELETE 20250001

---

### /patrons/[barcode]/edit — Edit Patron

**Purpose:** Update patron information.

**Editable fields:**
- firstname, surname, middlename
- email, phoneNumber, gender
- address (street, city, state, country)
- School info (students): schoolName, schoolAddress, currentClass, schoolPhoneNumber
- Parent info (students): parentName, parentAddress, parentPhoneNumber, parentEmail, relationshipToPatron
- messagePreferences, active status

**Non-editable:**
- barcode (permanent, auto-generated)
- patronType (set at registration)
- points (managed by system activities)

**Process:**
- PATCH to /api/patrons with { patronId, ...fields }
- Server uses a whitelist of allowed fields
- Nested fields updated via MongoDB dot notation

---

## Feature: Catalog Management

The catalog stores all library items.

### /catalog — Catalog List

**Purpose:** Browse and search all library items.

**Inputs (server-side filters, debounced 300ms):**
- Title (text)
- Subtitle (text)
- Author (text)
- Classification (text, e.g., Dewey Decimal)
- Control Number (text)
- Item Barcode (text)

**Process:**
- GET /api/catalogs with query params
- MongoDB regex search (case-insensitive)
- Pagination: 20 items per page

**Output (table):**
- Title + Subtitle
- Author
- Classification
- Item Type badge
- Barcode (monospace)
- Availability: Available (green) | Checked Out (yellow) | On Hold (blue)
- Actions: View | Edit

---

### /catalog/new — Add New Catalog Item

**Purpose:** Add a new book or item to the library catalog.

**Inputs — Basic Information:**
- Title (required)
- Subtitle (optional)
- Main Author (required)
- Additional Authors (optional)
- Publisher (required)
- Place of Publication (required)
- Publication Year (required)
- ISBN (optional)

**Inputs — Classification:**
- Classification Number (required, e.g., Dewey Decimal)
- Item Type (select): book | journal | magazine | newspaper | cd | dvd | ebook | audiobook | reference
- Item Barcode (required, must be unique)
- Control Number (required, must be unique)
- Call Number (optional)
- Location (optional, e.g., Main Stacks)

**Inputs — Additional:**
- Number of Pages (optional)
- Language (select, default: English)
- Edition (optional)
- Series (optional)
- Index Terms / Genre (optional, comma-separated, stored as array)
- Keywords (optional)
- Information Summary / Description (textarea)
- Notes (textarea)
- Holdings Information (number of copies)
- Physical Description (e.g., 300 pages; 24 cm)
- Library code (default: AAoJ)

**Process:**
1. POST to /api/catalogs
2. Validates required fields: title, mainAuthor, publisher, place, year, classification, controlNumber, language, barcode, library
3. Checks for duplicate barcode OR control number (returns 409 if found)
4. Parses indexTermGenre from comma-separated string to array
5. Creates catalog record

**Output on success:**
- { status: true, catalog: { title, controlNumber, barcode } }
- Redirect to /catalog after 2 seconds

**Output on error:**
- Missing required fields → 400 with list of which fields are missing
- Duplicate barcode or control number → 409

---

### /catalog/[barcode] — Item Detail View

**Displays:**
- Title, subtitle, author(s)
- Publisher, place, year, ISBN
- Classification, control number, barcode
- Language, physical description, holdings info
- Index terms / genre tags
- Information summary
- Availability status
- If checked out: patron name, contact, due date
- Full checkout history: all patrons who borrowed it with dates

**Actions:**
- Edit → /catalog/[barcode]/edit
- Back to Catalog

---

### /catalog/[barcode]/edit — Edit Catalog Item

**Purpose:** Update any field of an existing catalog item.

**Editable:** All fields from the add form
**Process:** PATCH to /api/catalogs/[barcode]

---

## Feature: Circulation — Check-Out

### /circulations/checkout — Checkout Page

**Purpose:** Issue a library item to a patron.

**Inputs:**
- Patron Barcode (text, required) — scan or type
- Item Barcode (text, required) — scan or type
- Due Days (number, default: 2) — how many days until due
- Event Title (text, optional) — label for special events

**Process:**
1. POST to /api/circulations/check-out (auth required)
2. Looks up patron by barcode
3. Checks patron is active — if inactive, blocks with message to contact ICT
4. Checks patron has a photo uploaded — blocks if no image_url
5. Checks monthly borrowing limit: max 4 books per month per patron
6. Checks patron does not already have a book borrowed (hasBorrowedBook: true blocks)
7. Looks up catalog item by barcode
8. Checks item is not already checked out (isCheckedOut: true blocks)
9. Calculates due date: today + dueDay days
10. Updates catalog: adds to patronsCheckedOutHistory, sets isCheckedOut: true
11. Updates patron: adds to itemsCheckedOutHistory, sets hasBorrowedBook: true
12. Awards 10 points to patron
13. Updates MonthlyActivity: increments booksCheckedOut + totalPoints

**Output on success:**
- { title, itemBarcode, dueDate, patronName, patronBarcode, patronImage }
- Displays confirmation card with patron photo and book details

**Output on errors:**
- Patron not found → 404
- Patron inactive → 403 with code PATRON_INACTIVE
- No photo uploaded → 403
- Monthly limit reached (4 books) → 400 with count info
- Already has a borrowed book → 409
- Item already checked out → 409
- Item not found → 404

**Business rules:**
- One book at a time per patron (hasBorrowedBook flag)
- Max 4 books per patron per calendar month
- Patron must have a passport photo on file
- Patron must be active

---

## Feature: Circulation — Check-In

### /circulations/checkin — Check-In Page

**Purpose:** Process the return of a borrowed book.

**Inputs:**
- Patron Barcode (text, required) — scan or type
- Item Barcode (text, required) — scan or type

**Process:**
1. POST to /api/circulations/check-in
2. Looks up patron and catalog item concurrently (Promise.all)
3. Validates item is currently checked out (isCheckedOut: true)
4. Sets isCheckedOut: false on catalog item
5. Updates returnedAt on the last patronsCheckedOutHistory entry
6. Sets patron hasBorrowedBook: false
7. Awards 15 points to patron
8. Adds event record to patron.event array: { eventTitle: 'Book Check-in', points: 15 }
9. Updates MonthlyActivity: increments booksReturned + pointsFromBooks + totalPoints

**Output on success:**
- { patron: "Surname, Firstname", item: "Book Title", pointsAwarded: 15 }
- Confirmation message shown

**Output on errors:**
- Patron not found → 404
- Item not found → 404
- Item is not checked out → 400

---

## Feature: Circulation — Holds

### /circulations/holds — Holds Page

**Purpose:** View all items that have been or are currently checked out (full borrowing history).

**Inputs:** None (no filters on this page)

**Process:**
1. GET /api/circulations/holds
2. Finds all catalog items that have at least one entry in patronsCheckedOutHistory
3. Flattens all checkout records across all items

**Output (table/list):**
- Item Barcode
- Book Title + Subtitle
- Patron Barcode
- Patron Name
- Contact Number
- Borrowing Date
- Due Date
- Returned At (null if still out)

**Note:** This shows ALL historical checkouts, not just current ones. Items with returnedAt populated are past holds; items without returnedAt are currently out.

---

## Feature: Circulation — Overdues

### /circulations/overdues — Overdues Page

**Purpose:** View all items that are currently checked out AND past their due date.

**Inputs:** None

**Process:**
1. GET /api/circulations/overdues
2. Finds all catalog items where isCheckedOut: true
3. For each item, checks the LAST entry in patronsCheckedOutHistory
4. If returnedAt is null AND dueDate < today → item is overdue
5. Calculates overdueDays: Math.ceil((today - dueDate) / 86400000)
6. Sorts results by overdueDays descending (most overdue first)

**Output (table/list):**
- Item Barcode
- Book Title + Subtitle
- Patron Barcode
- Patron Name
- Contact Number
- Borrowing Date
- Due Date
- Overdue Days (number of days past due)

**Use case:** Staff use this to contact patrons and follow up on unreturned books.

---

## Feature: Circulation — Renewal

### /circulations/renewal — Renewal Page

**Purpose:** Extend the due date of a currently borrowed book.

**Inputs:**
- Patron Barcode (text, required)
- Item Barcode (text, required)
- New Due Date (date picker, required)

**Process:**
1. POST to /api/circulations/renew
2. Looks up patron and catalog item
3. Validates item is currently checked out
4. Validates the last checkout record has no returnedAt (still active)
5. Validates the patron barcode matches the last checkout record
6. Updates dueDate in catalog's patronsCheckedOutHistory (last entry)
7. Sets renewedAt: new Date() on the checkout record
8. Updates patron's itemsCheckedOutHistory dueDate for the matching item

**Output on success:**
- { itemTitle, patronName, newDueDate, renewalDate }
- Confirmation message

**Output on errors:**
- Patron not found → 404
- Item not found → 404
- Item not checked out → 400
- Item not checked out by this patron → 400

**Note:** No points are awarded for renewals.

---

## Feature: Circulation — Book Summaries (Staff View)

### /circulations/summaries — Book Summaries Management

**Purpose:** Staff interface to create book summary records for patrons and manage/review submitted summaries.

**Section 1: Create Book Summary (Staff)**

**Inputs:**
- Patron Barcode (required) — scan or type
- Book Barcode (required) — scan or type
- Bonus Points to Award (number, 1–20, required)
- Rating (select, 1–5 stars, required)

**Process:**
1. POST to /api/book-summaries with isStaffCreated: true (auth required)
2. Validates bonus points between 1 and 20
3. Finds patron and book by barcode
4. Checks no existing summary for this patron+book combination
5. Creates summary with:
   - Auto-generated summary text (staff acknowledgment text)
   - status: 'approved' (immediately approved)
   - points: 25 (base) + bonus (1–20)
   - reviewedBy: logged-in staff name
   - reviewDate: now
6. Awards total points to patron
7. Updates MonthlyActivity: increments summariesApproved + totalPoints

**Output on success:**
- { summaryId, bookTitle, status: 'approved', points: total }
- Points confirmation message

**Section 2: Summary List / Management**

**Filters:**
- Status (select): All | Pending Review | Approved | Rejected
- Patron Barcode (text)

**Output (cards):**
- Book title + barcode
- Status badge (Pending / Approved / Rejected)
- Patron name + barcode
- Submission date
- Star rating
- Points awarded
- Summary text
- Staff feedback (if reviewed)
- Reviewed by + review date

**Stats shown:**
- Total summaries count
- Approved count
- Pending count

---

## Feature: Submit Book Summary (Public/Patron)

### /submit-summary — Public Summary Submission

**Purpose:** Patrons submit their own book summaries without logging in.

**Inputs:**
- Your Library Barcode (required)
- Book Barcode (required)
- Rating (select, 1–5 stars, required)
- Summary text (textarea, min 100 characters, required)

**Process:**
1. POST to /api/book-summaries (no auth required for patron submissions)
2. Validates all fields present and summary >= 100 chars
3. Finds patron by barcode (must exist and not be is18)
4. Finds book by barcode
5. Checks monthly limit: max 4 summaries per patron per month
6. Checks patron has actually borrowed this book (itemsCheckedOutHistory check)
7. Checks book is not currently checked out by this patron (must return first)
8. Checks no existing summary for this patron+book (unique constraint)
9. Creates summary with status: 'pending', points: 25 (auto-awarded immediately)
10. Updates patron points +25
11. Updates MonthlyActivity: increments summariesSubmitted + totalPoints

**Output on success:**
- Success message: "You have earned 25 points! Staff will review for potential bonus points."
- Form is cleared

**Output on errors:**
- Missing fields → 400
- Summary too short → 400
- Patron not found → 404
- Book not found → 404
- Monthly limit reached (4) → 400 with count
- Book not borrowed by patron → 400
- Book not yet returned → 400
- Duplicate summary → 400 with existing summary status info

**Business rules:**
- Patron must have borrowed AND returned the book
- Max 4 summaries per month
- One summary per patron per book (ever)
- 25 points awarded immediately on submission
- Staff can award additional 1–20 bonus points on review

---

## Feature: Attendance

### /attendance — Attendance Management

**Purpose:** Mark patron attendance for literacy classes and activities.

**Section 1: Mark Attendance Form**

**Inputs:**
- Patron Barcode (required) — supports scanner mode (press Enter to submit)
- Class Type (select): Literacy Class | Reading Club | Book Discussion | Workshop | Other
- Class Name (select):
  - Early Elementary (Primary 1-3)
  - Upper Elementary (Primary 4-6)
  - Junior Secondary School
  - Senior Secondary School
  - Mixed Age Group
  - Adult Literacy Program
- Class Date (date, default: today)
- Notes (optional)

**Scanner Mode:**
- Toggle button enables scanner mode
- Barcode input auto-focuses
- Pressing Enter after scanning submits the form automatically
- After success, input clears and re-focuses for next scan

**Process:**
1. POST to /api/attendance (auth required)
2. Finds patron by barcode
3. Checks patron is active — blocks if inactive with code PATRON_INACTIVE
4. Checks for duplicate: same patronBarcode + className + classDate → blocks if already marked
5. Creates attendance record with 20 points
6. Updates patron points +20
7. Updates MonthlyActivity: increments classesAttended + pointsFromAttendance + totalPoints

**Output on success:**
- "Attendance marked for [Name]. Points awarded: 20"
- Form resets (barcode clears, other fields stay for batch scanning)

**Output on errors:**
- Missing fields → 400
- Patron not found → 404
- Patron inactive → 403
- Already marked for this class → 400

**Section 2: Today's Attendance List**

**Displays:**
- Total attendance count for today
- Total points awarded today
- List of records: patron name, barcode, class name, class type, time, notes, points badge

---

## Feature: Analytics

### /analytics — Monthly Analytics (Staff View)

**Purpose:** Staff view of monthly patron activity statistics and leaderboard.

**Inputs:**
- Year (select, current year to 5 years back)
- Month (select, January–December)

**Process:**
- GET /api/analytics/monthly?year=YYYY&month=MM
- Calculates activity scores for all patrons with activity that month
- Activity score formula: (booksCheckedOut × 10) + (booksReturned × 15) + (classesAttended × 20) + (summariesApproved × 25) + (totalPoints × 1)
- Ranks patrons by score
- Identifies inactive patrons (active students with no activity that month)

**Output — Statistics Cards:**
- Active Patrons (had any activity)
- Inactive Patrons (no activity)
- Books Checked Out
- Classes Attended
- Summaries Submitted
- Total Points Awarded

**Output — Top Performers Leaderboard:**
- Rank badge (1st/2nd/3rd/Top 10)
- Avatar with initials
- Patron name + barcode
- Books borrowed count
- Classes attended count
- Summaries approved count
- Total points
- Activity score

**Output — Inactive Patrons List:**
- All active student patrons with zero activity for the selected month
- Shows name, barcode, patron type

---

## Feature: Leaderboard (Public)

### /leaderboard — Public Leaderboard

**Purpose:** Public-facing page showing top readers. No login required.

**Inputs:**
- Month (select)
- Year (select, current year to 3 years back)

**Process:**
- GET /api/analytics/monthly?year=YYYY&month=MM (public endpoint)

**Output — Stats Summary:**
- Active Readers count
- Books Borrowed count
- Classes Attended count
- Book Summaries count

**Output — Top 3 Podium:**
- Visual podium with 1st, 2nd, 3rd place
- Avatar with initials, name, activity score

**Output — Full Rankings Table:**
- Rank number + emoji (crown for 1st, star for 2nd/3rd, book for others)
- Patron name + barcode
- Books, Classes, Summaries counts
- Activity score
- Rank badge

**Output — How to Earn Points Guide:**
- Borrow Books: 10 pts
- Return Books: 15 pts + bonus
- Attend Classes: 20 pts
- Write Book Summaries: 25 pts + bonus

---

## Feature: Dashboard

### /dashboard — Main Dashboard

**Purpose:** Overview of library statistics for staff.

**Inputs:** None (auto-loads on page visit)

**Process:**
- GET /api/dashboard (auth required)
- Aggregates data from Cataloging and Patron collections

**Output — Statistics Cards:**
- Total Borrowed (items currently checked out)
- Total Overdues (checked out items past due date)
- Overdue Over a Month (overdue > 30 days)
- Total Students (with gender breakdown)
- Total Staff
- Total Guests
- Total Teachers
- Female Students
- Male Students
- Active Patrons

**Output — Quick Action Cards:**
- Circulation Management: Checkout Books | Check-in Books buttons
- Quick Actions grid: Checkout | Check-in | Holds | Overdues
- Last Registered Patron info
- System Information: status, last updated

---

## Feature: Transcomm (Staff Communication)

### /transcomm — Articles Management

**Purpose:** Staff communication hub for sharing articles on values, leadership, and skills.

**Article Categories:**
- drnicer-values
- leadership-basics
- communication
- teamwork
- problem-solving
- confidence
- inspiration

**Create Article Inputs:**
- Title (required)
- Category (select, required)
- Read Time (optional, e.g., "5 min read")
- Excerpt (required, short description)
- Content (required, min 200 characters)
- Tags (optional, comma-separated)

**Process:**
1. POST to /api/transcomm/articles (auth required)
2. Validates title, category, excerpt, content
3. Content must be >= 200 characters
4. Tags parsed from comma-separated string to array
5. Author set from logged-in user name

**Get Articles:**
- GET /api/transcomm/articles
- Filter by category (optional)
- Filter by active status (default: active only)
- Limit (default: 50)
- Full-text search supported via MongoDB text index

**Article fields stored:**
- title, category, readTime, excerpt, content, tags
- author, isActive, viewCount, library, timestamps

---

## API Reference Summary

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/login | No | Login, returns JWT cookie |
| POST | /api/auth/register | No | Register new staff account |
| GET | /api/auth/me | Yes | Get current user info |
| POST | /api/auth/logout | Yes | Clear auth cookie |

### Patrons
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/patrons | Yes | List all patrons |
| POST | /api/patrons | Yes | Create new patron |
| PATCH | /api/patrons | Yes | Edit patron by patronId |
| GET | /api/patrons/[barcode] | Yes | Get patron by barcode |
| PATCH | /api/patrons/[barcode] | Yes | Activate/deactivate patron |
| DELETE | /api/patrons/[barcode] | Yes (admin) | Delete patron |
| POST | /api/patrons/upload | Yes | Upload patron photo to Cloudinary |

### Catalog
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/catalogs | No | List catalog items (paginated, filterable) |
| POST | /api/catalogs | Yes | Add new catalog item |
| GET | /api/catalogs/[barcode] | No | Get item by barcode |
| PATCH | /api/catalogs/[barcode] | Yes | Update item |
| DELETE | /api/catalogs/[barcode] | Yes (admin) | Delete item |

### Circulations
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/circulations/check-out | Yes | Checkout book to patron |
| POST | /api/circulations/check-in | No | Return book from patron |
| GET | /api/circulations/holds | No | Get all checkout history |
| GET | /api/circulations/overdues | No | Get overdue items |
| POST | /api/circulations/renew | No | Renew a checkout |

### Book Summaries
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/book-summaries | Yes | List summaries (filterable) |
| POST | /api/book-summaries | Conditional | Submit or create summary |
| PATCH | /api/book-summaries/[id] | Yes | Review summary (approve/reject) |

### Attendance
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/attendance | Yes | Get attendance records |
| POST | /api/attendance | Yes | Mark attendance |

### Analytics
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/analytics/monthly | No | Monthly stats + leaderboard |

### Dashboard
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/dashboard | Yes | Dashboard statistics |

### Transcomm
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/transcomm/articles | No | List articles |
| POST | /api/transcomm/articles | Yes | Create article |
| GET | /api/transcomm/articles/[id] | No | Get article by ID |
| PATCH | /api/transcomm/articles/[id] | Yes | Update article |
| DELETE | /api/transcomm/articles/[id] | Yes | Delete article |

---

## Page Routes Summary

| Route | Auth Required | Description |
|---|---|---|
| / | No | Landing page |
| /auth/login | No | Staff login |
| /auth/register | No | Staff registration |
| /dashboard | Yes | Main dashboard |
| /catalog | Yes | Catalog list |
| /catalog/new | Yes | Add new item |
| /catalog/[barcode] | Yes | Item detail |
| /catalog/[barcode]/edit | Yes | Edit item |
| /patrons | Yes | Patron list |
| /patrons/new | Yes | Register patron |
| /patrons/generate-barcode | Yes | Print barcodes |
| /patrons/[barcode] | Yes | Patron profile |
| /patrons/[barcode]/edit | Yes | Edit patron |
| /circulations/checkout | Yes | Checkout books |
| /circulations/checkin | Yes | Check-in books |
| /circulations/holds | Yes | View holds |
| /circulations/overdues | Yes | View overdues |
| /circulations/renewal | Yes | Renew books |
| /circulations/summaries | Yes | Manage summaries |
| /circulations/summaries/review | Yes | Review a summary |
| /attendance | Yes | Mark attendance |
| /analytics | Yes | Monthly analytics |
| /leaderboard | No | Public leaderboard |
| /submit-summary | No | Public summary submission |
| /transcomm | Yes | Staff articles |

---

## How to Build From Scratch

### Step 1: Project Setup
```bash
npx create-next-app@latest dzuels-ils --app --js
cd dzuels-ils
npm install mongoose bcryptjs jsonwebtoken jose http-status-codes cloudinary jsbarcode html2canvas jszip react-to-print lucide-react
```

### Step 2: Environment
Create .env with all variables listed in the Environment Variables section above.

### Step 3: Database Connection
Create src/lib/dbConnect.js — standard Mongoose connection with caching for Next.js.

### Step 4: Build Models (in order)
1. UserModel
2. PatronModel
3. CatalogingModel
4. AttendanceModel
5. BookSummaryModel
6. MonthlyActivityModel
7. TranscommArticleModel
8. LibraryModel

### Step 5: Build Auth
1. /api/auth/login — bcrypt compare, JWT sign, set httpOnly cookie
2. /api/auth/register — bcrypt hash, create user with active: false
3. /api/auth/me — verify JWT from cookie, return user
4. /api/auth/logout — clear cookie
5. src/lib/auth.js — verifyAuth helper that reads cookie and verifies JWT
6. src/lib/permissions.js — PERMISSIONS object + hasPermission() helper

### Step 6: Build Patron APIs
1. GET/POST /api/patrons
2. GET/PATCH/DELETE /api/patrons/[barcode]
3. POST /api/patrons/upload (Cloudinary integration)

### Step 7: Build Catalog APIs
1. GET/POST /api/catalogs
2. GET/PATCH/DELETE /api/catalogs/[barcode]

### Step 8: Build Circulation APIs
1. POST /api/circulations/check-out
2. POST /api/circulations/check-in
3. GET /api/circulations/holds
4. GET /api/circulations/overdues
5. POST /api/circulations/renew

### Step 9: Build Engagement APIs
1. GET/POST /api/attendance
2. GET/POST /api/book-summaries
3. PATCH /api/book-summaries/[id]

### Step 10: Build Analytics APIs
1. GET /api/analytics/monthly
2. GET /api/dashboard

### Step 11: Build UI Components
Create reusable components: Card, Button, Input, Select, TextArea, Alert, Badge, Avatar, Table, StatsCard, StudentNav

### Step 12: Build Pages (in order)
1. Auth pages (login, register)
2. Dashboard
3. Catalog pages
4. Patron pages
5. Circulation pages (checkout, checkin, holds, overdues, renewal, summaries)
6. Attendance page
7. Analytics page
8. Public pages (leaderboard, submit-summary)
9. Transcomm pages

### Step 13: Middleware / Route Protection
Create src/middleware.js to protect all non-public routes by checking the ils_token cookie.

---

## Key Business Rules Summary

1. A patron must have a photo uploaded before borrowing any book.
2. A patron can only borrow one book at a time (hasBorrowedBook flag).
3. A patron can borrow a maximum of 4 books per calendar month.
4. A patron can submit a maximum of 4 book summaries per calendar month.
5. A patron can only submit one summary per book (ever), regardless of how many times they borrow it.
6. A patron must return a book before submitting a summary for it.
7. A patron must have actually borrowed a book to submit a summary for it (student submissions only).
8. Staff-created summaries bypass borrowing history checks and are approved immediately.
9. New staff accounts start as inactive and must be activated by an admin.
10. Patron barcodes are auto-generated as YYYY + zero-padded count (e.g., 20250001).
11. Student patrons expire after 2 years; staff/teacher patrons expire after 5 years.
12. Deleting a patron requires admin role and typing DELETE [barcode] as confirmation.
13. Attendance cannot be marked twice for the same patron, class, and date.
14. The leaderboard and submit-summary pages are publicly accessible (no login required).
15. Points are awarded automatically and cannot be manually subtracted through the UI.
