CS 665 Project 1: A CRUD Application (Individual Project) General Description In this project, you will develop a desktop/web/mobile application that uses relational databases. Non-relational databases, such as NoSQL or XML databases are NOT allowed as they do not reflect the database relations we’ve covered in this class. This is an individual project. It is recommended that you choose from popular database software such as 1) SQL Server Express, 2) MySQL, 3) SQLite, 4) PostgreSQL, etc. This project has five (5) parts. That is, there will be five (5) submission threads on Blackboard. Please submit each part by its own deadline. Total points: 2 + 4 + 4 + 6 + 4 = 20 points. General Step-by-Step Guidelines == Step 1 == choose a business/story as your mock business, design tentative database tables (at least 5 tables), then select a tech stack to implement the information management tool for the business. Submit a proposal document (in .pdf format to include some figures) at the end of this step. == Step 2 == based on the tentative database tables, perform functional dependency analysis on all tables. Please identify all non-trivial functional dependencies, any partial dependencies and/or transitive dependencies. Submit a doc (in .md format) to include the result of FD analysis. == Step 3 == based on the FD analysis, submit a document to list all tables you need to use for your project. It is required that all tables are in the 3rd normal form. Include an analysis to state that 1) tables are in 1NF, 2) tables are in 2NF, and 3) tables are in 3NF. Submit a doc (in .md format) to include all tables and the analysis. == Step 4 == choose a database software (local or online) to create tables and insert data. Note that 1) please have at least 5 tables, and 2) each table should have at least 10 rows (for test account). Take a screenshot for each table. Then, develop a web application using the tech stack proposed in Step 1 to use the database. The web app should have the following functionalities: 1) user authentication, 2) basic CRUD functionalities, 3) data visualization on the web app. Note that version control (git and GitHub) is required for the app development. At the end of this step, submit a document (.pdf format) that contains 1) screenshots of data in each table and 2) screenshots of your app showing major functionalities. == Step 5 == create a public GitHub repo for this project and have at least 10 commits. Each commit should make non-trivial contributions, such as 1) adding views to your app and 2) implementing database services. Each commit needs to have a meaningful and descriptive message. At the end of this step, submit a document (.pdf format) that contains 1) a screenshot of list of your commits, 3) screenshots of three major commits and 3) a link to your repo. DO NOT PUT SENSITIVE INFORMATION IN A PUBLIC REPO. Due Dates Step 1 submission: 11/06/25 Thursday Step 2 submission: 11/11/25 Tuesday Step 3 submission: 11/13/25 Thursday Step 4 submission: 11/20/25 Thursday Step 5 submission: 11/21/25 Friday Final Note Project management: evenly distribute your workload and development progress throughout the project. “The ‘last few days' Effort” is not recommended (e.g., all commits made only in the last one or two days of the project due date).

Step 1: Submitted solution

Car Rental Reservation System
Submission Date: November 6, 2025
1. Business / Story (General Description)
The Car Rental Reservation System helps manage users, vehicles, reservations, and
payments.
It supports CRUD operations, user authentication, vehicle tracking, reservation scheduling,
and payment processing. This system effectively demonstrates database normalization and
relational schema concepts taught in CS 665.

2. Why This Business?
A car rental service demonstrates multiple relationship types such as one-to-many
(Customers–Reservations, Reservations–Payments) and many-to-one (Vehicles–Branches).
It provides a realistic and structured environment to model relational databases
with practical business logic and real-world use cases.

3. Tentative Database Tables (At least 5)
Table Name Primary / Foreign Keys Description
Customers customer_id (PK), name,
email (unique), phone,
address

Stores customer
information who can rent
vehicles.

Vehicles vehicle_id (PK), name,
model, year, branch_id (FK),
availability

Contains vehicle details
including model and branch
association.

Reservations reservation_id (PK),
customer_id (FK), vehicle_id
(FK), start_date, end_date,
status

Stores all customer
reservations linked to
vehicles.

Payments payment_id (PK),
reservation_id (FK),
amount, payment_date,
method

Tracks payment
transactions for
reservations.

Branches branch_id (PK), name,
location, contact_number

Stores information of all
rental branches where
vehicles are kept.

4. Key Relationships
• Customers (1) — (N) Reservations
• Reservations (1) — (1) Payments
• Reservations (N) — (1) Vehicles
• Vehicles (N) — (1) Branches

5. Tentative ER Diagram
The following figure represents the tentative ER diagram for the Car Rental Reservation
System:

6. Appendix — Sample SQL Snippets
CREATE TABLE Customers (
customer_id SERIAL PRIMARY KEY,
name VARCHAR(100),
email VARCHAR(150) UNIQUE,
phone VARCHAR(15),
address TEXT
);

CREATE TABLE Vehicles (
vehicle_id SERIAL PRIMARY KEY,
name VARCHAR(100),
model VARCHAR(100),
year INT,
branch_id INT REFERENCES Branches(branch_id),
availability BOOLEAN DEFAULT TRUE
);
CREATE TABLE Reservations (
reservation_id SERIAL PRIMARY KEY,
customer_id INT REFERENCES Customers(customer_id),
vehicle_id INT REFERENCES Vehicles(vehicle_id),
start_date DATE,
end_date DATE,
status VARCHAR(50)
);
CREATE TABLE Payments (
payment_id SERIAL PRIMARY KEY,
reservation_id INT REFERENCES Reservations(reservation_id),
amount NUMERIC(10,2),
payment_date DATE,
method VARCHAR(50)
);
CREATE TABLE Branches (
branch_id SERIAL PRIMARY KEY,
name VARCHAR(100),
location VARCHAR(150),
contact_number VARCHAR(15)
);

Step 2: Submitted solution
## Step 2: Functional Dependency (FD) Analysis — *Car Rental Reservation System*
**Submission Date:** November 11, 2025  

---

## 0) Purpose and Deliverables
This document presents a complete FD analysis for the **Car Rental Reservation System** designed in Step 1.  
For each relation we provide:
- Attributes and key assumptions (including declared uniqueness constraints)
- All **non-trivial** functional dependencies (FDs)
- Candidate keys (with reasoning via attribute-closure)
- Detection of **partial** and **transitive** dependencies
- Notes on potential anomalies and how they’ll be addressed in Step 3

> **Scope note:** FD analysis is performed **within each relation**. Inter-table implications (e.g., `reservation_id → vehicle_id` and `vehicle_id → branch_id`, hence `reservation_id → branch_id`) are mentioned as design notes, but **normalization is applied per relation**.

---

## 1) Notation & Method
- Let an FD be denoted as **X → Y**, where **X** and **Y** are sets of attributes.
- An FD is **trivial** if `Y ⊆ X` (we omit such FDs from the lists).
- A **candidate key** is a minimal attribute set **K** such that **K⁺** (its closure) contains **all** attributes of the relation.
- **Partial dependency** occurs only when the **primary key is composite** and a proper subset of it determines a non-key attribute.
- **Transitive dependency** occurs when **X → Y** and **Y → Z**, with **X** not determining **Z** directly and **Y** being a non-key attribute (within the same relation).
- We use **attribute closure** to justify candidate keys (examples shown inline).

---

## 2) Relations Under Analysis (from Step 1)
We analyze the following relations (attributes shown with a typical schema — types omitted for brevity):

1. **Customers**(`customer_id` PK, `name`, `email` **UNIQUE**, `phone`, `address`)
2. **Vehicles**(`vehicle_id` PK, `make`, `model`, `year`, `branch_id` FK, `availability`, `daily_rate`)
3. **Reservations**(`reservation_id` PK, `customer_id` FK, `vehicle_id` FK, `start_date`, `end_date`, `status`, `total_cost`)
4. **Payments**(`payment_id` PK, `reservation_id` **UNIQUE** FK, `amount`, `payment_date`, `payment_method`, `status`, `txn_ref` **UNIQUE** *optional*)
5. **Branches**(`branch_id` PK, `name`, `location`, `contact_number`, *(optional)* `email` **UNIQUE**)

> **Explicit business rules (assumptions used in FDs):**
> - Emails of customers are unique per system.
> - Each reservation has **exactly one** payment (1–1 with `Payments`). Therefore `reservation_id` is **unique** in `Payments`.
> - Each vehicle belongs to **one** branch at a time (`branch_id` in `Vehicles`).
> - Branch (`name`, `location`) pairs are assumed unique *in practice*, but we do **not** rely on that composite uniqueness; instead we keep `branch_id` as the key. An optional unique `email` may exist for branches.
> - Attributes are **atomic** (1NF style).

---

## 3) FD Analysis by Relation

### 3.1) Customers
**Schema:** `Customers(customer_id, name, email, phone, address)`  
**Declared keys/uniques:** `customer_id` (PK), `email` (UNIQUE)

**Non-trivial FDs:**
1. `customer_id → name, email, phone, address`
2. `email → customer_id, name, phone, address`  *(because `email` is unique)*

**Candidate keys (via closure):**
- `{customer_id}⁺ = {customer_id, name, email, phone, address}` ⇒ **customer_id** is a key.
- `{email}⁺ = {email, customer_id, name, phone, address}` ⇒ **email** is an alternate key.

**Partial dependencies:** *None* (PK is single-attribute).  
**Transitive dependencies:** *None within the relation* (no non-key determinant leading to other non-key attributes).

**Anomaly notes:** If `address` contains multi-part data (street/city/state/zip), consider decomposing later if needed; currently atomic by assumption.

---

### 3.2) Vehicles
**Schema:** `Vehicles(vehicle_id, make, model, year, branch_id, availability, daily_rate)`  
**Declared keys/uniques:** `vehicle_id` (PK)

**Non-trivial FDs:**
1. `vehicle_id → make, model, year, branch_id, availability, daily_rate`

> *(Optional, if the business enforces price-by-model-year)*  
> 2. `(make, model, year) → daily_rate`  
> If adopted, this implies `daily_rate` is determined by the trim/year and not per physical vehicle. For this project we **retain per-vehicle pricing**; the optional FD is documented but **not enforced**.

**Candidate keys:**  
- `{vehicle_id}⁺ =` all attributes ⇒ **vehicle_id** is the (only) key.

**Partial dependencies:** *None* (PK is single-attribute).  
**Transitive dependencies:** *None within the relation.*

**Design note (inter-table implication):** `vehicle_id → branch_id` and in `Branches`, `branch_id → name, location, contact_number`, hence at the schema level `vehicle_id → branch_name, …` (not used for intra-relation normalization).

---

### 3.3) Reservations
**Schema:** `Reservations(reservation_id, customer_id, vehicle_id, start_date, end_date, status, total_cost)`  
**Declared keys/uniques:** `reservation_id` (PK)

**Non-trivial FDs:**
1. `reservation_id → customer_id, vehicle_id, start_date, end_date, status, total_cost`

*(Optional uniqueness sometimes enforced in apps: `(customer_id, vehicle_id, start_date) UNIQUE` to prevent duplicates. If present, then:*  
2. `(customer_id, vehicle_id, start_date) → reservation_id, end_date, status, total_cost`*) — **not assumed as a key** here.*

**Candidate keys:**  
- `{reservation_id}⁺ =` all attributes ⇒ **reservation_id** is the key.

**Partial dependencies:** *None* (PK is single-attribute).  
**Transitive dependencies (within relation):** *None.*

**Cross-relation observations:**  
`reservation_id → vehicle_id` and `vehicle_id → branch_id` implies `reservation_id → branch_id` at the schema level. This will guide view design, not table normalization.

---

### 3.4) Payments
**Schema:** `Payments(payment_id, reservation_id, amount, payment_date, payment_method, status, txn_ref)`  
**Declared keys/uniques:** `payment_id` (PK), `reservation_id` (**UNIQUE**), `txn_ref` (**UNIQUE**, optional but recommended)

**Non-trivial FDs:**
1. `payment_id → reservation_id, amount, payment_date, payment_method, status, txn_ref`
2. `reservation_id → payment_id, amount, payment_date, payment_method, status, txn_ref` *(because 1–1 with Reservations)*
3. *(If present)* `txn_ref → payment_id, reservation_id, amount, payment_date, payment_method, status`

**Candidate keys (via closure):**
- `{payment_id}⁺` includes all attributes ⇒ **payment_id** is a key.
- `{reservation_id}⁺` includes all attributes ⇒ **reservation_id** is an **alternate key**.
- `{txn_ref}⁺` includes all attributes ⇒ **txn_ref** is also an **alternate key** (if used).

**Partial dependencies:** *None* (PK is single-attribute).  
**Transitive dependencies:** *None within relation.*

**Anomaly note:** Ensure 1–1 is enforced with a **UNIQUE** index on `reservation_id` to keep FD (2) valid.

---

### 3.5) Branches
**Schema:** `Branches(branch_id, name, location, contact_number, email)`  
**Declared keys/uniques:** `branch_id` (PK), `email` (**UNIQUE**, optional)

**Non-trivial FDs:**
1. `branch_id → name, location, contact_number, email`
2. *(If email stored and unique)* `email → branch_id, name, location, contact_number`

**Candidate keys:**  
- `{branch_id}⁺` ⇒ **branch_id** is a key.  
- If email is present & unique, **email** is an alternate key.

**Partial dependencies:** *None* (PK is single-attribute).  
**Transitive dependencies:** *None within relation.*

---

## 4) Summary Table — Keys & Dependency Types
| Relation     | Candidate Keys                                    | Partial Deps | Transitive Deps | Notes |
|--------------|----------------------------------------------------|--------------|------------------|-------|
| Customers    | `customer_id` (PK), `email` (AK)                   | None         | None             | Email unique ⇒ alternate key |
| Vehicles     | `vehicle_id` (PK)                                  | None         | None             | Optional `(make,model,year) → daily_rate` if enforced |
| Reservations | `reservation_id` (PK)                              | None         | None             | — |
| Payments     | `payment_id` (PK), `reservation_id` (AK), `txn_ref` (AK) | None   | None             | Enforce 1–1 with UNIQUE(`reservation_id`) |
| Branches     | `branch_id` (PK), `email` (AK, optional)           | None         | None             | — |

> **Result:** No relation currently has **partial** or **transitive** dependencies under the stated assumptions; all are poised for 3NF with minor confirmations (enforcing declared UNIQUE constraints). Any optional FDs listed are clearly marked and won’t be used for decomposition unless adopted as hard rules in Step 3.

---

## 5) How We Derived and Verified FDs (Step-by-Step you can follow)
1. **List attributes** in each relation as designed in Step 1.
2. **Record declared keys/uniques** (e.g., natural keys like `email`, or business constraints such as 1–1 mapping).
3. **Propose candidate FDs** from the semantics of each attribute and key:
   - For each primary key **K**, add `K → (all non-key attributes)`.
   - For each declared **UNIQUE** attribute set **U**, add `U → (all other attributes)` within the relation.
4. **Minimize determinants:** If an FD has a composite left side, check if any proper subset also determines the right side (not used here since PKs are single attributes).
5. **Compute closures** for suspected keys:  
   - Example: in **Customers**, `{email}⁺` gives `{customer_id, name, phone, address}` ⇒ **email** is an alternate key.
6. **Identify partial dependencies:** Only applicable if the **PK is composite** (none here).
7. **Identify transitive dependencies:** Look for **X → Y** and **Y → Z** where **Y** is a non-key attribute and **X** does not directly determine **Z** (none found within relations).
8. **Document anomalies & enforcement:** Note which FDs require DB-level constraints (e.g., `UNIQUE(email)`, `UNIQUE(reservation_id)` in `Payments`).
9. **Prepare for Step 3:** If any optional/borderline FDs are adopted as hard business rules, plan decompositions to ensure **3NF** (or **BCNF** where appropriate).

---

## 6) Appendix — Attribute-Closure Examples

### Example A — `email` as a key in **Customers**
- Start with **X = {{email}}**
- Using FD `email → customer_id, name, phone, address`, we reach **X⁺ = {{email, customer_id, name, phone, address}}**
- Since `Customers` has 5 attributes and **X⁺** includes them all, **email** is a **candidate key**.

### Example B — `reservation_id` in **Payments**
- Because of the 1–1 with `Reservations`, FD `reservation_id → payment_id, amount, payment_date, payment_method, status, txn_ref` holds.
- Thus **reservation_id** is also a **candidate key** (alternate) for **Payments**.

---

## 7) What Will Change in Step 3 (Preview)
- We will restate all relations, compute **candidate keys**, and formally justify **1NF, 2NF, and 3NF** for each.
- If optional FDs (like `(make, model, year) → daily_rate`) are adopted, we’ll normalize accordingly (e.g., split a `VehicleModelPricing` table). Otherwise, current schemas already satisfy **3NF** given the constraints above.

Step 03:
### Step 3: Relational Schemas & 3NF Justification — Car Rental Reservation System  


---

## 1. Overview / Purpose
This document presents the finalized relational schemas for the **Car Rental Reservation System** and proves that each table is in:

- **1st Normal Form (1NF)**  
- **2nd Normal Form (2NF)**  
- **3rd Normal Form (3NF)**  

SQL DDL statements for all tables are included.

The schemas here come directly from the FD analysis in Step 2.

---

# 2. Finalized Tables (All in 3NF)
The system consists of **five** tables:

1. Customers  
2. Branches  
3. Vehicles  
4. Reservations  
5. Payments  

Each table has been verified for 1NF, 2NF, and 3NF compliance.

---

# 3. Table-by-Table Analysis

---

## ⭐ Table 1 — Customers (3NF)

### **Schema**
`Customers(customer_id PK, name, email UNIQUE, phone, address)`

### **Functional Dependencies**
1. `customer_id → name, email, phone, address`  
2. `email → customer_id, name, phone, address`

### **Normal Form Justification**
- **1NF:** All values are atomic (no repeating groups).  
- **2NF:** PK (`customer_id`) is single-attribute → no partial dependencies.  
- **3NF:** No non-key attribute determines another non-key attribute.

### **SQL**
```sql
CREATE TABLE Customers (
  customer_id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(150) UNIQUE,
  phone VARCHAR(15),
  address TEXT
);
```

---

## ⭐ Table 2 — Branches (3NF)

### **Schema**
`Branches(branch_id PK, name, location, contact_number, email UNIQUE)`

### **Functional Dependencies**
1. `branch_id → name, location, contact_number, email`  
2. `email → branch_id, name, location, contact_number`

### **Normal Form Justification**
- **1NF:** Atomic attributes.  
- **2NF:** PK is single → no partial dependencies.  
- **3NF:** No transitive dependencies.

### **SQL**
```sql
CREATE TABLE Branches (
  branch_id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  location VARCHAR(150),
  contact_number VARCHAR(15),
  email VARCHAR(150) UNIQUE
);
```

---

## ⭐ Table 3 — Vehicles (3NF)

### **Schema**
`Vehicles(vehicle_id PK, make, model, year, branch_id FK, availability, daily_rate)`

### **Functional Dependencies**
- `vehicle_id → make, model, year, branch_id, availability, daily_rate`

### Normal Form Justification
- **1NF:** Atomic values.  
- **2NF:** PK is single → no partial dependency.  
- **3NF:** No non-key attribute determines another non-key attribute.

### **SQL**
```sql
CREATE TABLE Vehicles (
  vehicle_id SERIAL PRIMARY KEY,
  make VARCHAR(50),
  model VARCHAR(50),
  year INT,
  branch_id INT REFERENCES Branches(branch_id),
  availability BOOLEAN DEFAULT TRUE,
  daily_rate NUMERIC(8,2)
);
```

---

## ⭐ Table 4 — Reservations (3NF)

### **Schema**
`Reservations(reservation_id PK, customer_id FK, vehicle_id FK, start_date, end_date, status, total_cost)`

### **Functional Dependencies**
- `reservation_id → customer_id, vehicle_id, start_date, end_date, status, total_cost`

### **Normal Form Justification**
- **1NF:** All values are atomic.  
- **2NF:** PK is single → no partial dependency.  
- **3NF:** No transitive dependencies.

### **SQL**
```sql
CREATE TABLE Reservations (
  reservation_id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES Customers(customer_id),
  vehicle_id INT REFERENCES Vehicles(vehicle_id),
  start_date DATE,
  end_date DATE,
  status VARCHAR(50),
  total_cost NUMERIC(10,2)
);
```

---

## ⭐ Table 5 — Payments (3NF)

### **Schema**
`Payments(payment_id PK, reservation_id UNIQUE FK, amount, payment_date, payment_method, status, txn_ref UNIQUE)`

### **Functional Dependencies**
1. `payment_id → reservation_id, amount, payment_date, payment_method, status, txn_ref`  
2. `reservation_id → payment_id, amount, payment_date, payment_method, status, txn_ref`  

*(Due to 1–1 relationship with Reservations)*

### **Normal Form Justification**
- **1NF:** Atomic values.  
- **2NF:** PK is single → no partial dependencies.  
- **3NF:** No non-key attribute determines another.

### **SQL**
```sql
CREATE TABLE Payments (
  payment_id SERIAL PRIMARY KEY,
  reservation_id INT UNIQUE REFERENCES Reservations(reservation_id),
  amount NUMERIC(10,2),
  payment_date DATE,
  payment_method VARCHAR(50),
  status VARCHAR(50),
  txn_ref VARCHAR(100) UNIQUE
);
```

---

# 4. Summary of Normalization

| Table        | 1NF | 2NF | 3NF | Notes |
|--------------|-----|-----|-----|-------|
| Customers    | ✔️ | ✔️ | ✔️ | email is alternate key |
| Branches     | ✔️ | ✔️ | ✔️ | optional unique email |
| Vehicles     | ✔️ | ✔️ | ✔️ | FK to branch |
| Reservations | ✔️ | ✔️ | ✔️ | no transitive dependencies |
| Payments     | ✔️ | ✔️ | ✔️ | reservation_id is 1–1 |

---

# 5. Instructions for Submission
- Save this file as **Karthik_DB.md**  
- Upload it to Blackboard under Step 3  
- Commit to GitHub with message:  
  `"Step 3 – Finalized normalized schemas (3NF)"`

---

# 6. Appendix — Optional Decomposition (If Using Model-Based Pricing)
If pricing is based on `(make, model, year)` then:  
- Move daily_rate into a new table: `VehicleModels`
- Reference `model_id` in `Vehicles`

```sql
CREATE TABLE VehicleModels (
  model_id SERIAL PRIMARY KEY,
  make VARCHAR(50),
  model VARCHAR(50),
  year INT,
  daily_rate NUMERIC(8,2),
  UNIQUE(make, model, year)
);

ALTER TABLE Vehicles
  ADD COLUMN model_id INT REFERENCES VehicleModels(model_id),
  DROP COLUMN daily_rate;
```

---
