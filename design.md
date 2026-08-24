# Design Decisions

## UI/UX Approach

The user interface follows a modern, dark glass theme to keep the focus on the content and give a sleek, professional vibe. 

**Layout:**
We opted for a 3-panel layout when interacting with artifacts:
1. **Sidebar**: For session history and navigation.
2. **Chat Panel**: The primary conversational interface.
3. **Artifact Viewer**: A dedicated panel that dynamically opens to display complex generated content (like essays, markdown docs, or HTML).

## Component Hierarchy

```text
App
 ├── Sidebar (Session list)
 └── Main Content
      ├── ChatInterface
      │    ├── MessageList
      │    │    ├── UserMessage
      │    │    └── BotMessage (Markdown/Artifact Preview)
      │    └── ChatInput
      └── ArtifactViewer (conditional)
           ├── ContentRenderer (Markdown / HTML)
           └── Sandbox Iframe (for HTML/JS)
```

## State Management

We use a custom `useChat` hook to manage conversation state, loading flags, and error handling. This isolates the API communication logic from the presentation components, making the UI components purely reactive to state changes.

## Markdown Rendering

We utilize `react-markdown` coupled with `remark-gfm`. This allows us to safely render Github-flavored markdown (tables, lists, inline code) right within chat bubbles and the artifact viewer, giving the LLM rich formatting capabilities.

## Artifact Sandboxing

Security is paramount when rendering AI-generated HTML/UI components. We use an `iframe` with the `sandbox` attribute for the Artifact Viewer. This ensures any generated scripts or styles are completely isolated from the parent application's DOM, mitigating XSS risks.

## Responsive Design Notes

- The 3-panel layout gracefully degrades to a 2-panel or single-panel view on smaller screens (mobile/tablet).
- Flexbox and CSS Grid are used to ensure chat messages wrap correctly and the input box remains fixed at the bottom.
- The Artifact Viewer overlays or stacks on small viewports, ensuring content remains readable without horizontal scrolling.
