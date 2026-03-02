# **App Name**: FamiliaFlow

## Core Features:

- Dynamic Calendar Views: Display events across customizable Day/Week views, switching between all 4 people or a single person, with configurable time bounds and 30-minute increments. Includes a clear view toggle and person filter dropdown.
- Event Lifecycle Management: Create new calendar events via quick-add directly on the grid or by scheduling from templates, edit event details (title, time, person, notes, recurrence), and delete events with confirmation. Input fields enforce 30-minute time increments.
- Fixed Event Template Management: Create, manage, and utilize a library of reusable event templates with default durations, optional times, assignees, and categories for quick scheduling. Includes fields for template name, duration, notes, and assignee.
- Recurring Event Configuration: Define comprehensive recurrence patterns (Does not repeat, Daily, Weekly, Monthly by day-of-month, Custom intervals) with various end conditions (No end date, On date, After X occurrences) during event creation or editing.
- Event Completion Tracking: Toggle the completion status for individual event occurrences using a checkmark, with immediate and distinct visual styling changes to clearly indicate completion. Completion state is tracked per occurrence.
- Application & Person Settings: Configure core application preferences including global day start/end times for the calendar, rename persons 1-4, choose distinct colors for each person, and select the application language between English and Arabic.
- Bilingual UI & RTL Support: Seamlessly switch the entire user interface between English and Arabic, with all UI text translated and the layout fully adapting to Right-to-Left (RTL) mode, including flipped alignments and calendar column ordering, when Arabic is selected.

## Style Guidelines:

- The visual scheme embraces a clean, modern aesthetic with a primary calming blue to denote organization and clarity, allowing the distinct person colors to provide individual vibrancy. Primary interactive elements utilize a mid-brightness, moderately saturated blue: #2680D9.
- The background color is a very lightly desaturated version of the primary hue, providing a clean and subtle canvas that complements interactive elements: #F0F2F5.
- An accent color is used for calls-to-action and highlights. This vibrant turquoise contrasts effectively with the primary blue and background, drawing attention where needed: #11D4D4.
- Each of the four persons will have a distinct, user-configurable color, ensuring visual clarity in the multi-person calendar view. These colors will be thoughtfully selected to maintain readability and visual harmony within the overall palette.
- The application uses 'Inter' (sans-serif) for all text elements. This modern and highly readable typeface is suitable for both headlines and body text, supporting a clear and objective aesthetic, and provides excellent legibility across diverse screen sizes and multilingual content, including Arabic.
- Utilize clear, crisp, and functionally driven icons that are large enough for touch targets. Icons should be easily understandable, minimal in design, and support both LTR and RTL layouts (flipping where appropriate, e.g., navigation arrows).
- The layout is highly responsive, adapting gracefully from large screens (Laptop, TV) with side-by-side columns to single-column usability on phones. The entire application layout (columns, headers, text alignment) dynamically adjusts to Right-to-Left (RTL) orientation when the Arabic language is selected.
- Subtle, fluid animations and transitions are applied to state changes (e.g., event completion toggle, view switching, modal presentations) to enhance user experience and provide clear visual feedback without being distracting.