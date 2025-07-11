# User Action History: Investigation and Implementation Plan

## 1. Introduction

This report details the investigation into the `UserActionHistory` system and outlines a plan to implement comprehensive tracking of user activities within the Elite Medicale Services application. The objective is to create a complete audit trail for all significant actions performed by employees, including task management, diagnostics, and inventory transfers.

## 2. Investigation Findings

Our investigation involved a thorough analysis of the database and the application's codebase to determine the current state of the `UserActionHistory` system.

### 2.1. Database Analysis

-   **Schema**: The `UserActionHistory` model is correctly defined in `prisma/schema.prisma`, with fields for `userId`, `actionType`, a `details` JSON blob, and timestamps.
-   **Data**: A query of the `UserActionHistory` table revealed that it is **empty**. This confirms that no user actions are currently being logged.

### 2.2. Codebase Audit

-   **Search Results**: A global search for `UserActionHistory` confirmed that while the model is referenced in the Prisma schema and TypeScript type definitions, there are **no instances of `prisma.userActionHistory.create()`** in the codebase.
-   **Conclusion**: The `UserActionHistory` feature has been designed at the data model level but has not yet been implemented in the application logic.

## 3. Implementation Plan

To build a comprehensive user activity log, we will need to modify several API endpoints to create `UserActionHistory` records for key events. All new logic will be integrated into existing Prisma transactions to ensure data consistency.

The following actions will be tracked:

### 3.1. Task Management

-   **Objective**: Log the creation, assignment, and completion of tasks.
-   **Files to Modify**:
    -   We will need to identify the API routes responsible for creating and updating tasks (e.g., `/api/tasks`, `/api/tasks/[id]`).
-   **Implementation**: We will add logic to these endpoints to create a `UserActionHistory` record whenever a task's status changes or it is assigned to a user.

### 3.2. Diagnostic Creation

-   **Objective**: Track which user creates a diagnostic report.
-   **File to Modify**: `src/pages/api/diagnostics/index.ts`
-   **Implementation**: We will extend the existing transaction in the diagnostic creation endpoint to also create a `UserActionHistory` record, linking the action to the user who performed it.

### 3.3. Inventory Transfers

-   **Objective**: Log the transfer of medical devices and products to an employee's personal stock.
-   **Files to Modify**:
    -   We will need to identify the API endpoints that handle inventory and stock management.
-   **Implementation**: We will add logic to these endpoints to create a `UserActionHistory` record for each transfer, detailing the items moved and the user who received them.

## 4. Next Steps

This investigation has provided a clear path forward for implementing a robust user action tracking system. The next phase will involve modifying the identified API endpoints to begin logging these activities. This will provide administrators with a powerful tool for monitoring employee actions and ensuring accountability across the application.
