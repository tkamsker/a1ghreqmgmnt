Perfect! Both servers are running. Here's your comprehensive manual testing guide:

🚀 Manual Testing Guide - User Story 2: Project Management

Server Status

✅ Backend: http://localhost:4000
✅ Frontend: http://localhost:3000
✅ GraphQL Playground: http://localhost:4000/graphql

---

Part 1: Backend API Testing (GraphQL)

Step 1: Get Authentication Token

Open your browser to http://localhost:4000/graphql and run this mutation:

mutation Login {
login(email: "admin@example.com", password: "admin123") {
accessToken
user {
id
username
userType
}
}
}

Expected Result: You should get an access token. Copy it for the next steps.

Step 2: Set Authorization Header

In GraphQL Playground, click "HTTP HEADERS" at the bottom and add:
{
"Authorization": "Bearer YOUR_ACCESS_TOKEN_HERE"
}

Step 3: Test Project Queries

Query all projects:
query GetProjects {
projects {
id
name
code
description
isActive
createdAt
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

Expected Result: Should return the test project we created earlier (TEST-001).

---

Step 4: Test Project Creation

Let me first get you a valid project type ID:

⏺ Bash(PGPASSWORD=postgres psql -h localhost -U postgres -d reqmgmt -t -c "SELECT id, name FROM project_types LIMIT 3;")
⎿   07830a70-e4ab-4dc2-ab5a-3abbbaafe07c | Software Development
c56fefbe-2dfb-4c84-9b1b-7b788451002c | Hardware Development
a1f627e0-c7d1-41d7-9587-1109c42cb5cd | Research & Development

⏺ Create a new project:
mutation CreateProject {
createProject(input: {
name: "Mobile App Project"
code: "MOBILE-001"
description: "iOS and Android mobile application"
projectTypeId: "07830a70-e4ab-4dc2-ab5a-3abbbaafe07c"
}) {
id
name
code
description
isActive
}
}

Expected Result: New project created successfully. Copy the project id for next steps.

---

Step 5: Test Group Management

Create a group within the project (use the project ID from Step 4):
mutation CreateGroup {
createProjectGroup(input: {
projectId: "YOUR_PROJECT_ID_HERE"
name: "Authentication & Security"
description: "User authentication and security features"
}) {
id
name
description
orderIndex
}
}

Expected Result: Group created. Copy the group id.

---

Step 6: Test Subject Management

Create a subject within the group:
mutation CreateSubject {
createSubject(input: {
projectId: "YOUR_PROJECT_ID_HERE"
groupId: "YOUR_GROUP_ID_HERE"
name: "User Login"
description: "Login functionality with email/password"
}) {
id
name
description
groupId
}
}

Create a top-level subject (no group):
mutation CreateTopLevelSubject {
createSubject(input: {
projectId: "YOUR_PROJECT_ID_HERE"
name: "General Requirements"
description: "Cross-cutting requirements"
}) {
id
name
description
groupId
}
}

Expected Results: Subjects created successfully.

---

Step 7: Test Complete Hierarchy Query

Get project with full hierarchy:
query GetProjectDetail {
project(id: "YOUR_PROJECT_ID_HERE") {
id
name
code
description
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
subjects {
id
name
description
}
}
}

Expected Result: Should show the complete hierarchy:

- Project
- Groups
- Subjects within groups
- Top-level subjects

---

Step 8: Test Update Operations

Update a project:
mutation UpdateProject {
updateProject(
id: "YOUR_PROJECT_ID_HERE"
input: {
description: "Updated description for mobile app"
}
) {
id
name
description
}
}

Update a group:
mutation UpdateGroup {
updateProjectGroup(
id: "YOUR_GROUP_ID_HERE"
name: "Authentication, Authorization & Security"
description: "Updated description"
) {
id
name
description
}
}

---

Step 9: Test Delete Operations

Delete a subject:
mutation DeleteSubject {
deleteSubject(id: "YOUR_SUBJECT_ID_HERE")
}

Delete a group:
mutation DeleteGroup {
deleteProjectGroup(id: "YOUR_GROUP_ID_HERE")
}

Delete a project:
mutation DeleteProject {
deleteProject(id: "YOUR_PROJECT_ID_HERE")
}

Expected Result: All return true on success.

---

Part 2: Frontend UI Testing

Step 1: Login to the Application

1. Open your browser to http://localhost:3000
2. You should be redirected to /login
3. Login with:

- Email: admin@example.com
- Password: admin123

Expected Result: Redirected to /dashboard

---

Step 2: Navigate to Projects

1. Click on "Projects" in the navigation header
2. You should see the Projects list page

Expected Result:

- URL changes to /projects
- Table shows existing projects (TEST-001, MOBILE-001 if you created it)
- "Create Project" button visible in top-right

---

Step 3: Create a New Project

1. Click "Create Project" button
2. Fill in the form:

- Project Code: WEB-001
- Project Name: E-commerce Website
- Description: Online shopping platform

3. Click "Create Project"

Expected Result:

- Dialog closes
- New project appears in the table
- Success (implicit - no error alert)

Error Case: Try creating a project with the same code (e.g., WEB-001 again)

- Should show error: "Project with code 'WEB-001' already exists"

---

Step 4: View Project Details

1. Click "View" button next to the "E-commerce Website" project
2. You should navigate to the project detail page

Expected Result:

- URL changes to /projects/{project-id}
- Project name and code displayed at top
- Two buttons: "Create Group" and "Create Top-Level Subject"
- Empty state message: "No groups or subjects yet"

---

Step 5: Create Groups

1. Click "Create Group" button
2. Fill in the form:

- Group Name: User Management
- Description: User registration, profiles, and authentication

3. Click "Create Group"

Expected Result:

- Dialog closes
- New group appears as a card with name and description
- "Add Subject" and "Delete Group" buttons visible

Repeat to create more groups:

- Product Catalog - "Product listings and search"
- Shopping Cart - "Cart and checkout functionality"

---

Step 6: Create Subjects within Groups

1. In the "User Management" group, click "Add Subject"
2. Fill in the form:

- Subject Name: User Registration
- Description: Sign up with email and password

3. Click "Create Subject"

Expected Result:

- Subject appears under the group
- Shown in a bordered box with name and description
- "Delete" button visible

Repeat to add more subjects:

- Under "User Management":
- User Login
- Password Reset
- Under "Product Catalog":
- Product Search
- Product Details
- Under "Shopping Cart":
- Add to Cart
- Checkout Process

---

Step 7: Create Top-Level Subjects

1. Click "Create Top-Level Subject" button
2. Fill in:

- Subject Name: Performance Requirements
- Description: System-wide performance criteria

3. Click "Create Subject"

Expected Result:

- Subject appears in "Top-Level Subjects" section
- Displayed separately from groups

---

Step 8: Test Delete Operations

Delete a Subject:

1. Click "Delete" button next to any subject
2. Confirm the deletion in the browser dialog

Expected Result: Subject is removed from the list

Delete a Group:

1. Click "Delete Group" button
2. Confirm deletion

Expected Result: Entire group and its subjects are removed

---

Step 9: Test Navigation

1. Click "Projects" in the header to return to projects list
2. Verify all projects are still listed
3. Click "Dashboard" to return to dashboard
4. Navigate back to Projects and click into different projects

Expected Result: Smooth navigation, data persists

---

Step 10: Test Delete Project

1. In the projects list, click "Delete" next to a project
2. Confirm deletion

Expected Result: Project removed from list

---

Step 11: Test User Dropdown

1. Click on your username in the top-right corner
2. Verify the dropdown shows:

- Your full name
- Your email
- Your role (SUPER ADMIN)
- "Log out" option

---

Step 12: Test Logout

1. Click "Log out" from the user dropdown
2. Verify you're redirected to /login
3. Try accessing /projects directly

Expected Result: Redirected back to login (protected route working)

---

Part 3: Edge Cases & Error Handling

Let me create some test scenarios:

⏺ Bash(cat > /tmp/test-scenarios.md << 'EOF'

# Additional Test Scenarios…)

⎿  Running…

──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Bash command

cat > /tmp/test-scenarios.md << 'EOF'

# Additional Test Scenarios

## Authorization Testing

### Test 1: Role-Based Access

1.  Create a CONTRIBUTOR user in GraphQL Playground
2.  Login as that user
3.  Try to create a project (should succeed for PROJECT_ADMIN)
4.  Try to delete a project (should be restricted)

### Test 2: Unauthenticated Access

1.  Clear localStorage in browser DevTools
2.  Try to access /projects directly
3.  Should redirect to /login

## Data Validation Testing

### Test 3: Required Fields

1.  Try creating a project without a name
2.  Button should be disabled
3.  Try creating with only spaces - should show validation error

### Test 4: Duplicate Code

1.  Create project with code "DUP-001"
2.  Try creating another project with "DUP-001"
3.  Should show error message

## UI Responsiveness

### Test 5: Loading States

1.  Watch for loading spinners when fetching data
2.  Verify "Creating..." text appears during mutations

### Test 6: Empty States

1.  Create a fresh project with no groups/subjects
2.  Should show "No groups or subjects yet" message

## Data Persistence

### Test 7: Refresh Page

1.  Create some projects, groups, and subjects
2.  Refresh the browser (F5)
3.  All data should still be there

### Test 8: Cross-Browser

1.  Test in Chrome
2.  Test in Firefox
3.  Test in Safari (if on Mac)
    EOF
    cat /tmp/test-scenarios.md
