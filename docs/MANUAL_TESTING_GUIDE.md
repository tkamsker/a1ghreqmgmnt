# Manual Testing Guide - User Story 2: Project Management

## 🎯 Quick Start

### Services Running

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **GraphQL Playground**: http://localhost:4000/graphql

### Test Credentials

- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Role**: SUPER_ADMIN

---

## 📊 Current Database State

### Available Project Types

1. **Software Development** - `07830a70-e4ab-4dc2-ab5a-3abbbaafe07c`
2. **Hardware Development** - `c56fefbe-2dfb-4c84-9b1b-7b788451002c`
3. **Research & Development** - `a1f627e0-c7d1-41d7-9587-1109c42cb5cd`
4. **Compliance & Standards** - `ea8c6639-37f1-4d74-b3d7-5a75e92d1ff8`

### Existing Data

- **1 Project**: TEST-001 (Test Project)
- **0 Groups**
- **0 Subjects**

---

## 🔬 Part 1: GraphQL API Testing

### Test Suite 1: Authentication & Queries

#### 1.1 Login (Get Token)

Open http://localhost:4000/graphql and execute:

```graphql
mutation Login {
  login(email: "admin@example.com", password: "admin123") {
    accessToken
    user {
      id
      username
      userType
      email
    }
  }
}
```

✅ **Expected**: Returns access token and user details

#### 1.2 Set Authorization

In GraphQL Playground, click "HTTP HEADERS" button and add:

```json
{
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

#### 1.3 Query All Projects

```graphql
query GetAllProjects {
  projects {
    id
    name
    code
    description
    isActive
    createdAt
    projectTypeId
    groups {
      id
      name
      description
    }
    subjects {
      id
      name
      description
    }
  }
}
```

✅ **Expected**: Returns TEST-001 project

#### 1.4 Query Single Project

```graphql
query GetProject {
  project(id: "7b38d904-37fe-4e73-9b6c-7f2d28b18d79") {
    id
    name
    code
    description
    groups {
      id
      name
      subjects {
        id
        name
      }
    }
    subjects {
      id
      name
    }
  }
}
```

✅ **Expected**: Returns detailed project information

---

### Test Suite 2: Project CRUD Operations

#### 2.1 Create Project

```graphql
mutation CreateProject {
  createProject(
    input: {
      name: "E-Commerce Platform"
      code: "ECOM-001"
      description: "Online shopping platform with payment integration"
      projectTypeId: "07830a70-e4ab-4dc2-ab5a-3abbbaafe07c"
    }
  ) {
    id
    name
    code
    description
    isActive
    createdAt
  }
}
```

✅ **Expected**: New project created, returns project details
📝 **Copy the `id` for next tests**

#### 2.2 Update Project

```graphql
mutation UpdateProject {
  updateProject(
    id: "YOUR_PROJECT_ID"
    input: { description: "Updated: Full-stack e-commerce with mobile support", isActive: true }
  ) {
    id
    name
    description
    isActive
  }
}
```

✅ **Expected**: Project updated successfully

#### 2.3 Create Duplicate Code (Error Test)

```graphql
mutation CreateDuplicate {
  createProject(
    input: {
      name: "Another Project"
      code: "ECOM-001"
      description: "This should fail"
      projectTypeId: "07830a70-e4ab-4dc2-ab5a-3abbbaafe07c"
    }
  ) {
    id
  }
}
```

❌ **Expected Error**: "Project with code 'ECOM-001' already exists"

---

### Test Suite 3: Group Management

#### 3.1 Create Group

```graphql
mutation CreateGroup {
  createProjectGroup(
    input: {
      projectId: "YOUR_PROJECT_ID"
      name: "User Management"
      description: "Authentication, authorization, and user profiles"
      orderIndex: 1
    }
  ) {
    id
    name
    description
    projectId
    orderIndex
  }
}
```

✅ **Expected**: Group created
📝 **Copy the `id` for next tests**

#### 3.2 Create Multiple Groups

```graphql
mutation CreateMultipleGroups {
  productGroup: createProjectGroup(
    input: {
      projectId: "YOUR_PROJECT_ID"
      name: "Product Catalog"
      description: "Product listings, search, and filtering"
      orderIndex: 2
    }
  ) {
    id
    name
  }

  cartGroup: createProjectGroup(
    input: {
      projectId: "YOUR_PROJECT_ID"
      name: "Shopping Cart"
      description: "Cart management and checkout"
      orderIndex: 3
    }
  ) {
    id
    name
  }
}
```

✅ **Expected**: Both groups created

#### 3.3 Update Group

```graphql
mutation UpdateGroup {
  updateProjectGroup(
    id: "YOUR_GROUP_ID"
    name: "User Management & Authentication"
    description: "Updated description with more details"
  ) {
    id
    name
    description
  }
}
```

✅ **Expected**: Group updated

---

### Test Suite 4: Subject Management

#### 4.1 Create Subject in Group

```graphql
mutation CreateSubject {
  createSubject(
    input: {
      projectId: "YOUR_PROJECT_ID"
      groupId: "YOUR_GROUP_ID"
      name: "User Registration"
      description: "Sign up with email, password, and profile information"
      orderIndex: 1
    }
  ) {
    id
    name
    description
    groupId
    projectId
  }
}
```

✅ **Expected**: Subject created within group

#### 4.2 Create Top-Level Subject (No Group)

```graphql
mutation CreateTopLevelSubject {
  createSubject(
    input: {
      projectId: "YOUR_PROJECT_ID"
      name: "System Performance Requirements"
      description: "Response time, throughput, and scalability requirements"
      orderIndex: 1
    }
  ) {
    id
    name
    description
    groupId
  }
}
```

✅ **Expected**: Subject created at project level (`groupId` will be null)

#### 4.3 Create Multiple Subjects

```graphql
mutation CreateMultipleSubjects {
  login: createSubject(
    input: {
      projectId: "YOUR_PROJECT_ID"
      groupId: "YOUR_GROUP_ID"
      name: "User Login"
      description: "Login with email/password and social auth"
    }
  ) {
    id
    name
  }

  passwordReset: createSubject(
    input: {
      projectId: "YOUR_PROJECT_ID"
      groupId: "YOUR_GROUP_ID"
      name: "Password Reset"
      description: "Forgot password flow with email verification"
    }
  ) {
    id
    name
  }

  profile: createSubject(
    input: {
      projectId: "YOUR_PROJECT_ID"
      groupId: "YOUR_GROUP_ID"
      name: "User Profile Management"
      description: "Edit profile, change password, upload avatar"
    }
  ) {
    id
    name
  }
}
```

✅ **Expected**: All three subjects created

#### 4.4 Update Subject

```graphql
mutation UpdateSubject {
  updateSubject(
    id: "YOUR_SUBJECT_ID"
    name: "User Registration & Onboarding"
    description: "Enhanced description with onboarding flow"
  ) {
    id
    name
    description
  }
}
```

✅ **Expected**: Subject updated

---

### Test Suite 5: Complete Hierarchy Query

#### 5.1 Get Full Project Structure

```graphql
query GetCompleteHierarchy {
  project(id: "YOUR_PROJECT_ID") {
    id
    name
    code
    description
    isActive
    createdAt

    # Groups with their subjects
    groups {
      id
      name
      description
      orderIndex
      subjects {
        id
        name
        description
        orderIndex
      }
    }

    # Top-level subjects (not in groups)
    subjects {
      id
      name
      description
      orderIndex
    }
  }
}
```

✅ **Expected**: Complete hierarchical structure showing:

- Project details
- All groups with their subjects
- Top-level subjects

---

### Test Suite 6: Delete Operations

#### 6.1 Delete Subject

```graphql
mutation DeleteSubject {
  deleteSubject(id: "YOUR_SUBJECT_ID")
}
```

✅ **Expected**: Returns `true`

#### 6.2 Delete Group (Cascades to Subjects)

```graphql
mutation DeleteGroup {
  deleteProjectGroup(id: "YOUR_GROUP_ID")
}
```

✅ **Expected**: Returns `true`, all subjects in group are also deleted

#### 6.3 Delete Project (Cascades Everything)

```graphql
mutation DeleteProject {
  deleteProject(id: "YOUR_PROJECT_ID")
}
```

✅ **Expected**: Returns `true`, entire hierarchy deleted

---

## 🖥️ Part 2: Frontend UI Testing

### Test Suite 7: Authentication & Navigation

#### 7.1 Login Flow

1. Open http://localhost:3000
2. Should auto-redirect to `/login`
3. Enter credentials:
   - Email: `admin@example.com`
   - Password: `admin123`
4. Click "Sign In"

✅ **Expected**: Redirected to `/dashboard`

#### 7.2 Navigation Test

1. Click "Projects" in header
2. URL should change to `/projects`
3. Click "Dashboard" in header
4. URL should change to `/dashboard`

✅ **Expected**: Smooth navigation, no errors

#### 7.3 User Dropdown

1. Click username in top-right
2. Should show:
   - Full name: "System Administrator"
   - Email: "admin@example.com"
   - Role: "SUPER ADMIN"
   - "Log out" option

✅ **Expected**: User info displayed correctly

---

### Test Suite 8: Projects List Page

#### 8.1 View Projects

Navigate to http://localhost:3000/projects

✅ **Expected**:

- Table with columns: Code, Name, Description, Status, Created, Actions
- Existing projects displayed (TEST-001)
- "Create Project" button in top-right

#### 8.2 Create Project via UI

1. Click "Create Project"
2. Fill form:
   - **Code**: `MOBILE-001`
   - **Name**: `Mobile Banking App`
   - **Description**: `iOS and Android banking application`
3. Click "Create Project"

✅ **Expected**:

- Dialog closes
- New project appears in table
- Status shows "Active" (green)

#### 8.3 Form Validation

1. Click "Create Project"
2. Try to submit with empty fields
3. Button should be disabled

✅ **Expected**: Cannot submit without required fields

#### 8.4 View Project

1. Click "View" button next to "Mobile Banking App"
2. Should navigate to project detail page

✅ **Expected**: URL changes to `/projects/{id}`

#### 8.5 Delete Project

1. Back to projects list
2. Click "Delete" next to a project
3. Confirm deletion in browser dialog

✅ **Expected**: Project removed from list

---

### Test Suite 9: Project Detail Page

#### 9.1 Initial State

Navigate to a project (click View)

✅ **Expected**:

- Project name and code at top
- "Create Group" button
- "Create Top-Level Subject" button
- Message: "No groups or subjects yet"

#### 9.2 Create Group

1. Click "Create Group"
2. Fill form:
   - **Name**: `Backend Services`
   - **Description**: `APIs, database, and server logic`
3. Click "Create Group"

✅ **Expected**:

- Dialog closes
- Group appears as card
- Shows "No subjects in this group" message
- "Add Subject" and "Delete Group" buttons visible

#### 9.3 Create Multiple Groups

Repeat to create:

- `Frontend Application` - "React web and mobile interfaces"
- `Infrastructure` - "DevOps, monitoring, and deployment"
- `Testing & QA` - "Test automation and quality assurance"

✅ **Expected**: All groups displayed in order

#### 9.4 Add Subject to Group

1. In "Backend Services" group, click "Add Subject"
2. Fill form:
   - **Name**: `REST API Development`
   - **Description**: `RESTful endpoints for all features`
3. Click "Create Subject"

✅ **Expected**:

- Subject appears under group
- Displayed in bordered box
- "Delete" button visible

#### 9.5 Add Multiple Subjects to Group

Add more subjects to "Backend Services":

- `Database Schema Design` - "PostgreSQL schema and migrations"
- `Authentication Service` - "JWT and OAuth implementation"
- `Business Logic Layer` - "Core business rules and validation"

✅ **Expected**: All subjects listed under group

#### 9.6 Add Subjects to Other Groups

In "Frontend Application":

- `React Component Library` - "Reusable UI components"
- `State Management` - "Redux/Context setup"
- `Responsive Design` - "Mobile and desktop layouts"

In "Infrastructure":

- `CI/CD Pipeline` - "GitHub Actions workflows"
- `Docker Configuration` - "Containerization setup"
- `Monitoring Setup` - "Logging and alerting"

✅ **Expected**: Hierarchical structure clearly visible

#### 9.7 Create Top-Level Subject

1. Click "Create Top-Level Subject"
2. Fill form:
   - **Name**: `Security Requirements`
   - **Description**: `Cross-cutting security concerns`
3. Click "Create Subject"

✅ **Expected**:

- Appears in "Top-Level Subjects" section
- Separate from groups

#### 9.8 Delete Subject

1. Click "Delete" next to any subject
2. Confirm deletion

✅ **Expected**: Subject removed

#### 9.9 Delete Group

1. Click "Delete Group"
2. Confirm deletion

✅ **Expected**:

- Group removed
- All subjects in that group also removed

---

### Test Suite 10: Data Persistence

#### 10.1 Page Refresh

1. Create some projects, groups, and subjects
2. Press F5 to refresh page

✅ **Expected**: All data still present

#### 10.2 Navigate Away and Back

1. Go to Dashboard
2. Return to Projects
3. View project details

✅ **Expected**: Data persists

#### 10.3 Logout and Login

1. Logout
2. Login again
3. Navigate to projects

✅ **Expected**: All data intact

---

## 🔐 Part 3: Security & Authorization Testing

### Test Suite 11: Protected Routes

#### 11.1 Unauthenticated Access

1. Open browser incognito/private window
2. Try to access http://localhost:3000/projects directly

✅ **Expected**: Redirected to `/login`

#### 11.2 Token Expiration

1. Login
2. Wait 16 minutes (token expires after 15 min)
3. Try to create a project

✅ **Expected**: Should require re-login

---

## 🐛 Part 4: Error Handling

### Test Suite 12: Error Scenarios

#### 12.1 Network Error Simulation

In browser DevTools:

1. Open Network tab
2. Set throttling to "Offline"
3. Try to load projects page

✅ **Expected**: Error message displayed

#### 12.2 Invalid Project Type ID

In GraphQL Playground:

```graphql
mutation InvalidProjectType {
  createProject(
    input: { name: "Test", code: "TEST-999", description: "Test", projectTypeId: "invalid-uuid" }
  ) {
    id
  }
}
```

❌ **Expected Error**: "ProjectType with ID invalid-uuid not found"

#### 12.3 Duplicate Code Validation

Try creating two projects with same code

❌ **Expected Error**: "Project with code already exists"

---

## 📈 Part 5: Performance Testing

### Test Suite 13: Load Testing

#### 13.1 Create Many Projects

Create 20+ projects and verify:

- List page loads quickly
- Pagination works (if implemented)
- No UI lag

#### 13.2 Deep Hierarchy

Create project with:

- 10 groups
- 5 subjects per group (50 total subjects)
- 10 top-level subjects

✅ **Expected**: UI renders efficiently

---

## ✅ Testing Checklist

Use this checklist to track your testing progress:

### Backend API

- [ ] Login and get auth token
- [ ] Query all projects
- [ ] Query single project with hierarchy
- [ ] Create project
- [ ] Update project
- [ ] Create groups (3+)
- [ ] Update group
- [ ] Create subjects in groups (5+)
- [ ] Create top-level subjects (2+)
- [ ] Query complete hierarchy
- [ ] Delete subject
- [ ] Delete group (cascades subjects)
- [ ] Delete project (cascades everything)
- [ ] Test duplicate code error
- [ ] Test invalid project type error

### Frontend UI

- [ ] Login flow
- [ ] Navigate between pages
- [ ] View projects list
- [ ] Create project via UI
- [ ] Form validation works
- [ ] View project details
- [ ] Delete project
- [ ] Create groups (3+)
- [ ] Add subjects to groups (5+)
- [ ] Create top-level subjects (2+)
- [ ] Delete subject
- [ ] Delete group
- [ ] User dropdown menu
- [ ] Logout
- [ ] Data persists after refresh

### Security

- [ ] Protected routes redirect to login
- [ ] Token required for API calls
- [ ] Unauthenticated access blocked

### Error Handling

- [ ] Network errors handled gracefully
- [ ] Validation errors shown
- [ ] Duplicate code prevented
- [ ] Invalid data rejected

---

## 🎬 Quick Demo Script

For a quick 5-minute demo:

1. **Login** (30 seconds)
   - Show login page
   - Login as admin

2. **Create Project** (1 minute)
   - Navigate to Projects
   - Create "Demo Project" (CODE-001)
   - View project details

3. **Build Hierarchy** (2 minutes)
   - Create 2 groups: "Features", "Infrastructure"
   - Add 2 subjects to "Features": "User Login", "Dashboard"
   - Add 1 top-level subject: "Performance Goals"

4. **Show Complete Structure** (1 minute)
   - Navigate back to projects list
   - View project again to show hierarchy

5. **Demonstrate CRUD** (30 seconds)
   - Delete a subject
   - Delete a group
   - Show changes persist

---

## 📞 Troubleshooting

### Issue: Backend won't start

```bash
# Kill any processes on port 4000
lsof -ti:4000 | xargs kill -9
# Restart
npm run dev
```

### Issue: Frontend won't start

```bash
# Kill any processes on port 3000
lsof -ti:3000 | xargs kill -9
# Restart
npm run dev
```

### Issue: Database connection error

```bash
# Check PostgreSQL is running
brew services list | grep postgresql
# Start if needed
brew services start postgresql
```

### Issue: Cannot login

```bash
# Re-run database seed
cd backend
npx prisma db seed
```

---

## 📝 Test Results Template

```markdown
## Test Execution Report

**Date**: ****\_\_\_****
**Tester**: ****\_\_\_****
**Environment**: Local Development

### Summary

- Total Tests: \_\_\_
- Passed: \_\_\_
- Failed: \_\_\_
- Skipped: \_\_\_

### Failed Tests

1. Test Name: ****\_\_\_****
   - Expected: ****\_\_\_****
   - Actual: ****\_\_\_****
   - Screenshot: ****\_\_\_****

### Notes

---
```

---

**Happy Testing! 🚀**
