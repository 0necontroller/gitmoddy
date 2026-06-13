# UI Description for SWE Agent: Wails/React/Tailwind Implementation

This document provides a detailed visual specification of the attached Wails application UI. The application is a dark-themed desktop application with a clear left-sidebar and right-main content area layout.

## 1. Global Application Shell

The overall container is a dark-themed application window.

- **Background:** The entire window background is a deep, dark grey/black.
- **Fonts:** Clear, readable dark-mode compatible sans-serif font for UI text, and a monospace font for all code elements.
- **Rounded Corners:** Panels have subtle rounded corners.

---

## 2. Top Header Bar

The header bar is a full-width horizontal area divided into specific status panels with subtle borders.

- **Total Width:** Spans the entire width of the application window.
- **Borders:** Each panel is separated by a dark grey vertical divider. The bottom has a subtle horizontal border.
- **Layout:** Three main flex/grid panels from left to right.

### 2.1 Current Repository Panel (Left)

- **Label:** "Current Repository" (grey, sans-serif text).
- **Icon:** `git-repository` icon (grey).
- **Content:** "desktop" (bold, white text).
- **Action:** A right-pointing chevrons icon (indicating a dropdown menu).

### 2.2 Current Branch Panel (Center)

- **Label:** "Current Branch" (grey, sans-serif text).
- **Icon:** `git-branch` icon (grey).
- **Content:** "development" (bold, white text).
- **Action:** A right-pointing chevrons icon.

### 2.3 Fetch/Sync Status Panel (Right)

- **Label:** "Pull origin" (grey, sans-serif text).
- **Icon:** `download` (down arrow) icon (grey).
- **Content:** "Last fetched 15 minutes ago" (white text).
- **Action:** A right-pointing chevrons icon.

---

## 3. Left Sidebar (Git Changes View)

A vertical panel on the left with a dark background and text-based controls.

- **Layout:** Column-based with distinct vertical sections.

### 3.1 Tab Bar

- **Items:** "Changes" and "History".
- **Active State:** "Changes" is active with a bright blue underline. Text is white.
- **Inactive State:** "History" text is grey.

### 3.2 File List Section

- **Header:** "3 changed files" (grey text).

- **List Item Component:**
  - **Layout:** Flex row with a leading checkbox, file path text, and a trailing indicator icon.
  - **Leading Checkbox:** Custom-styled checkbox (white border, blue fill with white checkmark when checked).
  - **File Path:** Monospace text (e.g., `app/src/lib/list/section-list.tsx`). The first part (`app/src/lib/`) is a darker grey, and the file name is white.
  - **Trailing Icon:** A unique Git-specific box icon with a gold border (appears next to each file).
  - **Item Spacing:** Regular vertical padding between list items.

### 3.3 Stashed Changes Section

- **Label:** "Stashed changes" (grey text).
- **Action:** A disclosure arrow icon (pointing right) to expand/collapse.

### 3.4 Branch Info / Commit Box Section

- **Text (Above Input):** "Add onRowKeyboardFocus support" (small grey text).
- **Input Box (Description):** A large, dark grey multi-line input area.
- **Label inside Input:** "Description" (grey, placeholder text).
- **Leading Icon:** A small, white circle icon inside the input box (appears to indicate the current user's profile/avatar placeholder).
- **Borders:** The text input has a subtle dark border.

---

## 4. Main Right Panel (Code Diff View)

The main area to the right, showing a syntax-highlighted code diff.

- **Background:** Very dark, near-black monospace code editor background.

### 4.1 Diff File Header

- **Top Bar:** A horizontal bar with a slightly dark grey background and rounded top corners.
- **Layout:** Flex layout with file info and actions.
- **File Icon:** `file-code` icon (gold/yellow).
- **File Path:** Monospace text, `app/src/lib/list/section-list.tsx` (white).
- **Action Icons (Right-aligned):** `settings` (gear icon) and `expand/contract` (maximize) icons, both gold/yellow.

### 4.2 Diff Content Area (Monospace Text)

The code view uses an industry-standard diff display format.

- **Line Numbers (Gutter):**
  - On the left, a grey gutter shows the line numbers.
  - **Original Line Numbers:** Shown in standard grey (e.g., 138-140, 142-145, 148-152, 154).
  - **Added Line Numbers:** Special highlighting for new lines (see "Green Blocks" below).

- **Diff Information Bar:**
  - **Line:** `@@ -137,10 +137,19 @@ interface ISectionListProps {` (grey monospace text).

- **Code Syntax Highlighting:**
  - **Keywords:** `interface`, `void`, `readonly` (gold/yellow text).
  - **Function/Prop Names:** `source`, `onRowFocus`, `indexPath`, `e`, `onRowKeyboardFocus`, `onRowBlur` (purple/lavender text).
  - **Types:** `IMouseClickSource`, `RowIndexPath`, `React.KeyboardEvent` (white/light grey text).

- **Diff Addition Blocks (Added Code):**
  These blocks use specific color-coding to denote added lines.
  1.  **Block 1 (Single Line):**
      - **Line:** 141
      - **Gutter:** Plus sign (`+`) and line number "141", both in white text. The gutter cell background is solid light green.
      - **Line Content:** Solid light green background block. Text `/** This function will be called when a row obtains focus, no matter how */` (white/light green comment text).

  2.  **Block 2 (Multiple Lines):**
      - **Lines:** 146 through 153.
      - **Gutter:** Plus signs (`+`) and new line numbers (e.g., "146") in white text. The entire gutter block has a solid light green background.
      - **Line Content:** A large, solid light green background block.
        - Lines 147 and 153 are block comments with white/light green text.
        - Lines 148-152 are the added property `onRowKeyboardFocus?: ( ... ) => void` with standard code highlighting (yellow keywords, purple prop names) on top of the green background.

- **Overall Spacing and Layout:** The main right panel should maximize to fill all available horizontal space to the right of the sidebar and all vertical space below the top header. Code lines should have standard monospace leading for readability.
