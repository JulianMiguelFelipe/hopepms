# 📦 HopePMS: Product Management System

The **Hope Product Management System** is a secure, role-based inventory dashboard designed for Hope, Inc. Built to replace basic CRUD applications, it features an enterprise-grade Rights Management matrix, automated PostgreSQL triggers, and a strict "Soft-Delete Only" architecture to ensure total data integrity and auditability.

---

## 🌐 Live Demonstration

<div align="center">
  <br>
  <a href="https://imhope.netlify.app/login">
    <img src="https://img.shields.io/badge/%20CLICK HERE TO OPEN%20LIVE%20SITE-000000?style=for-the-badge&logo=vercel&logoColor=white" width="350">
  </a>
  <br>
  <p align="center">
    <i>To test SUPERADMIN capabilities, register with the professor's email: jcesperanza@neu.edu.ph</i>
  </p>
</div>

> [!IMPORTANT]
> **Role-Based Access:** By default, new registrations are automatically assigned the `USER` role with `INACTIVE` status via database triggers. You must be activated by an Admin before accessing the dashboard.
> **Database Note:** This project uses Supabase free-tier. It will pause automatically if inactive for a prolonged period.

> [!CAUTION]
> ***Usage Guidelines:***
> * **No Hard Deletes:** This system strictly forbids `DELETE` statements. All removals are "Soft Deletes".
> * **Visibility Rules:** If you delete a product as an Admin, it will immediately disappear from the view of standard `USER` accounts, but will remain visible in your "Deleted Items" panel.

---

## ✨ System Walkthrough

### 🔐 Authentication & RBAC Provisioning
<details>
<summary><b>Click to view the secure login & auto-provisioning flow</b></summary>

The system handles permissions seamlessly at the database level using PostgreSQL triggers.

| Secure Login | Registration & Provisioning |
| :---: | :---: |
| <img src="https://placehold.co/400x250/f9fafb/374151?text=Login+Screen" width="400"> | <img src="https://placehold.co/400x250/f9fafb/374151?text=Registration+Form" width="400"> |

- **Automated Matrix:** The moment a user registers via Supabase Auth, a Postgres trigger automatically creates their `user_profile`, `modules`, and `rights_matrix` rows.
- **Professor Override:** Registering with `jcesperanza@neu.edu.ph` automatically overrides the default and grants full `SUPERADMIN` access.
- **Dynamic Routing:** Users with an `INACTIVE` record status are blocked at the frontend context level.
</details>

---

### 📦 Dynamic Product Management
<details>
<summary><b>Click to view the Role-Based Product Dashboard</b></summary>

UI elements physically disappear from the screen if the user lacks the database permissions.

| Active Products Table | Granular Action Rights |
| :---: | :---: |
| <img src="https://placehold.co/400x250/f9fafb/374151?text=Product+Table" width="400"> | <img src="https://placehold.co/400x250/f9fafb/374151?text=Hidden+Buttons+Based+on+Rights" width="400"> |

- **Smart Views:** Standard users query the `v_products_for_user` view (automatically hiding inactive items). Admins query the `v_products_admin` view.
- **Matrix-Driven UI:** The "+ Add Product", "Edit", and "Delete" buttons are only rendered if the user's `user_module_rights` matrix equals `1`.
</details>

---

### 🛡️ Admin Controls & Recovery
<details>
<summary><b>Click to view Admin Tools & Soft Delete Cascade</b></summary>

A powerful suite for administrators to recover data and manage the workforce.

#### 🗑️ Deleted Items Panel
| Invisible to Users | Admin Recovery Tool |
| :---: | :---: |
| <img src="https://placehold.co/400x250/f9fafb/374151?text=Hidden+Sidebar+Link" width="400"> | <img src="https://placehold.co/400x250/f9fafb/374151?text=Deleted+Items+Recovery" width="400"> |

#### 👥 User Management
| Activate Users | Adjust Rights Matrix |
| :---: | :---: |
| <img src="https://placehold.co/400x250/f9fafb/374151?text=Manage+Users" width="400"> | <img src="https://placehold.co/400x250/f9fafb/374151?text=Toggle+Permissions" width="400"> |

- **RPC Functions:** Deleting or Recovering items triggers Supabase Remote Procedure Calls (`rpc`).
- **Cascading Soft-Deletes:** Soft-deleting a parent product triggers a database-level cascade, automatically marking its Price History records as `INACTIVE`.
- **Audit Trails:** Every action is stamped with the user's details and a timestamp (`stamp` column).
</details>

---

## 📂 System Architecture

| Component | Responsibility |
| :--- | :--- |
| **`/src/contexts`** | **State Management:** `AuthContext.jsx` holds the active session, profile, and rights matrix. |
| **`/src/pages`** | **Frontend Views:** React components for Dashboard, Products, Login, and Admin Tools. |
| **`/src/components`** | **Layout & Routing:** `Layout.jsx` dynamically renders sidebar links based on the user's RBAC matrix. |
| **`/src/lib`** | **Backend Bridge:** `supabase.js` manages the connection pool to the Supabase API. |
| **`/supabase`** | **Database Schema:** SQL scripts containing the Table definitions, Postgres Triggers, and Database Views. |

---

## 🧰 Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React.js (Vite) |
| **Styling** | Tailwind CSS |
| **Routing** | React Router DOM |
| **Backend as a Service** | Supabase |
| **Database** | PostgreSQL (with Triggers & RPC) |
| **Hosting** | Vercel / Netlify |

---

## 🚀 Local Development

### 🔧 Prerequisites
* **Node.js** (LTS version recommended)
* **Supabase Account** (For backend API keys)

### 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone [https://github.com/YourUsername/HopePMS.git](https://github.com/YourUsername/HopePMS.git)
   cd HopePMS
