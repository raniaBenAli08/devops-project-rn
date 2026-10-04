# HR Admin Panel

A comprehensive Human Resources Management System built with Spring Boot and React.

## Tech Stack

### Backend
- **Java 25** with **Spring Boot 3.5.16**
- **Spring Data JPA** for data access
- **Spring Security** with JWT authentication
- **MySQL** database (XAMPP-compatible)
- **Flyway** for database migrations

### Frontend
- **React 18** with **TypeScript**
- **Vite** build tool
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for HTTP client
- A refreshed HR workspace UI with a French/English language switch

The frontend preserves existing authentication and workflows while refreshing the shared HR Flow layout and adding contract management. Its shared layout uses Tailwind with shadcn-inspired visual tokens and components. The layout prioritizes desktop use and reflows on narrow screens.

## Features

- **Employee Management**: Full CRUD operations with search, filter, and pagination
- **Department Management**: Hierarchical department structure with parent-child relationships
- **Position Management**: Job positions with salary ranges per department
- **Attendance Tracking**: Daily check-in/check-out with automated status detection
- **Modern Attendance**: Daily signed QR code for employee check-in and check-out; login accounts can be linked to employee records by HR
- **Leave Management**: Leave requests with approval workflow and balance tracking
- **Payroll Calculation**: Monthly payroll generation with tax and insurance deductions
- **Performance Reviews**: Review system with draft/submit/acknowledge workflow
- **Org Chart**: Organizational structure visualization with reporting chains
- **Document Management**: Upload and manage employee documents
- **Contract Management**: Create, edit, archive, and attach PDF/DOC/DOCX files to employee contracts
- **HR Dashboard**: Analytics with department distribution, attendance trends
- **Reports**: Attendance, leave, and payroll reports with CSV export

## Getting Started

### Prerequisites
- Java 25+
- Maven 3.8+
- MySQL 8.0+ or MariaDB 10.4+ (XAMPP)
- Node.js 18+ (for frontend development)

### Database Setup

```sql
CREATE DATABASE hr_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Running Locally (without Docker)

Start MySQL from the XAMPP Control Panel, then create the database above in phpMyAdmin or the MySQL console. XAMPP commonly uses `root` with an empty password. From **PowerShell** at the project root, configure the database and initial administrator credentials, then start the backend:

```powershell
$env:DB_USERNAME = 'root'
$env:DB_PASSWORD = ''
$env:APP_BOOTSTRAP_ADMIN_USERNAME = 'admin'
$env:APP_BOOTSTRAP_ADMIN_EMAIL = 'admin@example.com'
$env:APP_BOOTSTRAP_ADMIN_PASSWORD = 'ChooseYourOwnPassword123!'
mvn spring-boot:run
```

The backend API will be available at `http://localhost:8080`.

Administrators and HR managers can display or regenerate the daily QR code. The generated token is saved in the database, remains valid for the server-local calendar day, and regenerating it immediately invalidates the previous token. Employees must first have their login account linked to their employee record from that employee's detail page. The token is required for both check-in and check-out.

The application connects to `jdbc:mysql://localhost:3306/hr_admin` by default and runs the Flyway migrations automatically. Start with an empty MySQL database; existing database data must be migrated separately.

The new contracts screen and API are included in Flyway migration `V9`. Contract attachments are stored under the configured `UPLOAD_DIR` (default: `uploads/contracts`) and are limited to 10 MB per file.

On first startup with all three `APP_BOOTSTRAP_ADMIN_*` variables set, the backend creates that administrator with a BCrypt-encoded password if the username and email are unused. Replace the example password with a private password of at least 12 characters. After the startup log says the administrator was created, stop the backend with `Ctrl+C`, clear the bootstrap settings, and start it again:

```powershell
$env:APP_BOOTSTRAP_ADMIN_USERNAME = ''
$env:APP_BOOTSTRAP_ADMIN_EMAIL = ''
$env:APP_BOOTSTRAP_ADMIN_PASSWORD = ''
mvn spring-boot:run
```

### Employee registration and Gmail verification

Employees can create an account from `http://localhost:5173/register`. The account remains disabled until the user clicks the verification link and an administrator approves it from **Registrations**. Configure a Gmail application password locally before starting the backend:

```powershell
$env:MAIL_USERNAME = 'your-account@gmail.com'
$env:MAIL_PASSWORD = 'your-16-character-gmail-app-password'
$env:APP_FRONTEND_URL = 'http://localhost:5173'
```

Use a Gmail App Password, not the normal Gmail password. Keep these values in the local shell or an ignored environment file; never commit them.

Existing accounts are never promoted automatically. Open `http://localhost:5173/login` and sign in with the configured username and password.

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Employee registration
- `POST /api/registrations` - Create a public employee registration request
- `GET /api/registrations/verify?token=` - Verify the email address
- `GET /api/registrations/pending` - List verified requests (ADMIN)
- `POST /api/registrations/{id}/approve` - Approve and create the employee account (ADMIN)
- `POST /api/registrations/{id}/reject` - Reject a request (ADMIN)

### Employees
- `GET /api/employees` - List employees (with search, filter, pagination)
- `GET /api/employees/{id}` - Get employee by ID
- `POST /api/employees` - Create employee
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Soft delete (terminate) employee

### Contracts
- `GET /api/contracts` - List contracts
- `GET /api/contracts/{id}` - Get a contract
- `POST /api/contracts` - Create a contract (ADMIN or HR_MANAGER)
- `PUT /api/contracts/{id}` - Update a contract (ADMIN or HR_MANAGER)
- `PATCH /api/contracts/{id}/archive` - Archive a contract (ADMIN or HR_MANAGER)
- `POST /api/contracts/{id}/attachment` - Upload a PDF, DOC, or DOCX contract file (maximum 10 MB; ADMIN or HR_MANAGER)
- `GET /api/contracts/{id}/attachment` - Download a contract file

### Departments
- `GET /api/departments` - List all departments
- `GET /api/departments/tree` - Get department tree
- `POST /api/departments` - Create department
- `PUT /api/departments/{id}` - Update department

### Positions
- `GET /api/positions` - List all positions
- `GET /api/positions/department/{id}` - Get positions by department
- `POST /api/positions` - Create position

### Attendance
- `POST /api/attendance/check-in/{employeeId}` - Check in
- `POST /api/attendance/check-out/{employeeId}` - Check out
- `GET /api/attendance/me/today` - Get the signed-in employee's attendance and account-link status
- `GET /api/attendance/qr/today` - Get today's signed QR token (ADMIN or HR_MANAGER)
- `POST /api/attendance/me/check-in` - Check in with today's QR token
- `POST /api/attendance/me/check-out` - Check out with today's QR token
- `GET /api/attendance/daily?date=` - Daily report
- `GET /api/attendance/monthly/{employeeId}?year=&month=` - Monthly report

### Attendance account linking
- `GET /api/users/attendance-accounts` - List login accounts for employee linking (ADMIN or HR_MANAGER)
- `PUT /api/employees/{id}/attendance-account` - Link or unlink an employee login account (ADMIN or HR_MANAGER)

### Leave
- `POST /api/leave/request` - Request leave
- `POST /api/leave/{id}/approve?approverId=` - Approve leave
- `POST /api/leave/{id}/reject?approverId=` - Reject leave
- `GET /api/leave/balance/{employeeId}?year=` - Get balance
- `GET /api/leave/pending` - Get pending requests

### Payroll
- `POST /api/payroll/calculate?month=&year=` - Calculate monthly payroll
- `GET /api/payroll/payslip/{employeeId}?month=&year=` - Get payslip
- `GET /api/payroll/monthly?month=&year=` - Get monthly payroll

### Performance Reviews
- `POST /api/reviews` - Create review
- `POST /api/reviews/{id}/submit` - Submit review
- `POST /api/reviews/{id}/acknowledge` - Acknowledge review
- `GET /api/reviews/employee/{employeeId}` - Get employee reviews

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/employee/{employeeId}` - Get employee documents
- `GET /api/documents/{id}/download` - Download document

### Org Chart
- `GET /api/org-chart/tree` - Get full org tree
- `GET /api/org-chart/direct-reports/{managerId}` - Get direct reports
- `GET /api/org-chart/reporting-chain/{employeeId}` - Get reporting chain

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Project Structure

```
hr-admin-panel/
|-- src/main/java/com/rania/hr/
|   |-- config/          # Security, metrics configuration
|   |-- controller/      # REST controllers
|   |-- dto/             # Data transfer objects
|   |-- entity/          # JPA entities
|   |-- enums/           # Enum types
|   |-- exception/       # Exception handling
|   |-- repository/      # Spring Data repositories
|   |-- security/        # JWT auth components
|   |-- service/         # Business logic
|-- src/main/resources/
|   |-- db/migration/    # Flyway SQL migrations
|   |-- application.yml  # Application configuration
|-- frontend/
|   |-- src/
|   |   |-- api/         # API client functions
|   |   |-- components/  # Reusable React components
|   |   |-- contexts/    # React context providers
|   |   |-- pages/       # Page components
|   |   |-- types/       # TypeScript type definitions
```

## License

This project is for educational and demonstration purposes.
