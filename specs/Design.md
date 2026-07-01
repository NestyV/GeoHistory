# GeoHistory Design Specification

*Last Updated: 2026-06-25*

**Related Specs**: [Constitution.md](Constitution.md) defines file structure; [Features.md](Features.md) defines what components render; [Operations.md](Operations.md) covers performance optimization.

---

## 1. Design System Overview

### 1.1 Tailwind CSS Configuration

The project uses Tailwind CSS for all styling. Configuration is in `tailwind.config.js`.

#### Color Palette

| Name | Value | Usage |
|------|-------|-------|
| **Primary** | #2563EB (blue-600) | Buttons, links, active states |
| **Secondary** | #10B981 (emerald-500) | Success, approval, confirmed |
| **Danger** | #EF4444 (red-500) | Delete, reject, errors |
| **Warning** | #F59E0B (amber-500) | Pending, needs attention |
| **Dark** | #1F2937 (gray-800) | Text, backgrounds |
| **Light** | #F9FAFB (gray-50) | Backgrounds, cards |

#### Typography Scale

```
Text sizes (Tailwind scale):
- xs: 12px (captions, labels)
- sm: 14px (body text)
- base: 16px (default body)
- lg: 18px (emphasis)
- xl: 20px (section headers)
- 2xl: 24px (page headers)
- 3xl: 30px (major headings)
```

#### Spacing Scale

```
Tailwind 4-px baseline:
- 1: 4px    (tight spacing)
- 2: 8px    (padding between elements)
- 4: 16px   (standard padding)
- 6: 24px   (generous padding)
- 8: 32px   (large spacing)
- 12: 48px  (major spacing)
```

#### Responsive Breakpoints

```
sm: 640px   (small phones)
md: 768px   (tablets)
lg: 1024px  (desktops)
xl: 1280px  (large screens)
```

**Example responsive classes**:
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  {/* 1 column on mobile, 2 on tablet, 4 on desktop */}
</div>
```

---

## 2. Component Architecture

### 2.1 Component Organization

Components are organized into three categories:

#### Atomic Components (Reusable, No Domain Logic)
Located in `app/components/common/`.

Examples:
- Button
- Input
- Modal
- Spinner
- Badge
- Card

**Rules**:
- Completely generic (no business logic)
- Accept all styling via `className` prop
- Never import services or API calls
- Composable (children prop for content)

#### Feature Components (Domain-Specific UI)
Located in `app/components/features/`.

Examples:
- Map
- EventForm
- Timeline
- EventCard
- CharacterList

**Rules**:
- Implement specific features
- Can use services and hooks
- Still mostly UI-focused (light business logic)
- Accept props to customize behavior

#### Layout Components (Structure)
Located in `app/components/layout/`.

Examples:
- Navbar
- Sidebar
- AdminNav
- Footer

**Rules**:
- Provide page structure
- Integrate navigation
- Typically wrapped around pages

#### Admin Components (Specialized)
Located in `app/components/admin/`.

Examples:
- EventReviewPanel
- UserManagementTable
- AdminDashboard

**Rules**:
- Curator/SuperUser only
- More complex interactions
- Can orchestrate multiple features

### 2.2 Props Contract Pattern

Every component must export a TypeScript interface for its props:

```typescript
// Button.tsx
interface ButtonProps {
  /** Button text */
  children: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Button type (primary, secondary, danger) */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Whether button is disabled */
  disabled?: boolean;
  /** CSS classes */
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = ''
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded font-medium transition ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
```

### 2.3 Component Export Pattern (Barrel Exports)

**app/components/index.ts**:
```typescript
// Atomic
export { Button } from './common/Button';
export { Input } from './common/Input';
export { Modal } from './common/Modal';

// Features
export { Map } from './features/Map';
export { EventForm } from './features/EventForm';
export { Timeline } from './features/Timeline';

// Layout
export { Navbar } from './layout/Navbar';
export { AdminNav } from './layout/AdminNav';
```

**Consumer usage** (clean imports):
```typescript
import { Button, Map, Navbar } from '@/components';
```

---

## 3. Naming & File Conventions

### 3.1 Component File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Component | `{Name}.tsx` | `EventForm.tsx`, `MapContainer.tsx` |
| Props interface | Inline in component file | In `EventForm.tsx`: `interface EventFormProps` |
| Constants | `{name}.constants.ts` | `map.constants.ts` |
| Utilities | `{name}.utils.ts` | `validation.utils.ts` |

### 3.2 Export Naming

**Named exports only** (not default exports):

```typescript
// ✓ Correct
export function EventForm({ ... }) { ... }

// ✗ Avoid default exports
export default function EventForm({ ... }) { ... }
```

Why: Easier refactoring, consistent imports across codebase.

### 3.3 Event Handler Naming

All event handlers follow pattern: `on{EventName}`:

```typescript
interface EventFormProps {
  onSubmit?: (event: Event) => void;
  onCancel?: () => void;
  onFieldChange?: (field: string, value: any) => void;
}
```

### 3.4 State Variable Naming

**Boolean states**:
```typescript
const [isLoading, setIsLoading] = useState(false);
const [hasError, setHasError] = useState(false);
const [canEdit, setCanEdit] = useState(false);
```

**Data states**:
```typescript
const [events, setEvents] = useState<Event[]>([]);
const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
```

---

## 4. Reusable Components with Props Specifications

### 4.1 Button Component

**Location**: `app/components/common/Button.tsx`

```typescript
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  isLoading = false,
  className = '',
  type = 'button'
}: ButtonProps) {
  // Implementation
}
```

**Usage**:
```typescript
<Button variant="primary" onClick={handleClick}>
  Create Event
</Button>

<Button variant="danger" size="sm" disabled={isLoading}>
  Delete
</Button>
```

### 4.2 Input Component

**Location**: `app/components/common/Input.tsx`

```typescript
interface InputProps {
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
}

export function Input({
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled,
  required,
  maxLength
}: InputProps) {
  // Implementation
}
```

**Usage**:
```typescript
<Input
  name="title"
  label="Event Title"
  placeholder="Enter event title"
  value={title}
  onChange={setTitle}
  error={errors.title}
  required
  maxLength={200}
/>
```

### 4.3 Modal Component

**Location**: `app/components/common/Modal.tsx`

```typescript
interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
  isOpen,
  title,
  onClose,
  children,
  footer,
  size = 'md'
}: ModalProps) {
  // Implementation
}
```

**Usage**:
```typescript
<Modal isOpen={isOpen} title="Create Event" onClose={handleClose} size="lg">
  <EventForm onSubmit={handleSubmit} />
</Modal>
```

### 4.4 Map Component

**Location**: `app/components/features/Map.tsx`

```typescript
interface MapProps {
  events: Event[];
  selectedEventId?: string;
  onEventClick?: (eventId: string) => void;
  onMapRightClick?: (lat: number, lon: number) => void;
  zoom?: number;
  center?: [number, number];
  className?: string;
}

export function Map({
  events,
  selectedEventId,
  onEventClick,
  onMapRightClick,
  zoom = 3,
  center = [20, 0],
  className = ''
}: MapProps) {
  // Leaflet integration
  // Right-click to create event
  // Click markers to select event
}
```

**Usage**:
```typescript
<Map
  events={approvedEvents}
  selectedEventId={selected}
  onEventClick={handleSelect}
  onMapRightClick={handleCreateEvent}
  zoom={4}
/>
```

### 4.5 EventForm Component

**Location**: `app/components/features/EventForm.tsx`

```typescript
interface EventFormProps {
  initialEvent?: Event;
  onSubmit: (event: CreateEventDto) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

interface CreateEventDto {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  year: number;
  historical_frame_id?: string;
  character_ids?: string[];
}

export function EventForm({
  initialEvent,
  onSubmit,
  onCancel,
  isLoading = false,
  error
}: EventFormProps) {
  // Form logic
  // Validation
  // Submit handling
}
```

**Usage**:
```typescript
<EventForm
  onSubmit={handleCreateEvent}
  onCancel={handleClose}
  isLoading={isCreating}
/>
```

### 4.6 Timeline Component

**Location**: `app/components/features/Timeline.tsx`

```typescript
interface TimelineProps {
  frames: HistoricalFrame[];
  selectedFrameId?: string;
  onFrameSelect?: (frameId: string) => void;
  onYearChange?: (minYear: number, maxYear: number) => void;
  minYear: number;
  maxYear: number;
}

export function Timeline({
  frames,
  selectedFrameId,
  onFrameSelect,
  onYearChange,
  minYear,
  maxYear
}: TimelineProps) {
  // Timeline rendering
  // Frame selection
  // Year filtering
}
```

### 4.7 Navbar Component

**Location**: `app/components/layout/Navbar.tsx`

```typescript
interface NavbarProps {
  user?: User;
  onLogout?: () => void;
  currentPath?: string;
}

export function Navbar({
  user,
  onLogout,
  currentPath
}: NavbarProps) {
  // Navigation links
  // User profile (if authenticated)
  // Language selector
  // Logout button (if admin)
}
```

---

## 5. State Management Strategy

### 5.1 Local State (useState)

Use for UI state that doesn't need to persist:

```typescript
const [isOpen, setIsOpen] = useState(false);
const [formValues, setFormValues] = useState({ title: '', description: '' });
```

### 5.2 Server State (API data)

Fetch once, cache, update via API mutations:

```typescript
const [events, setEvents] = useState<Event[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  async function fetchEvents() {
    setIsLoading(true);
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (err) {
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }
  
  fetchEvents();
}, []);
```

### 5.3 User Preferences (Persistent Local)

Use custom hook `useUserPreferences`:

```typescript
const [preferences, setPreferences] = useUserPreferences();

// Preferences persist in localStorage
// Example: selected year range, language preference
```

**Usage**:
```typescript
const { language, yearRange } = useUserPreferences();
```

### 5.4 API Data Patterns

**Pattern 1: Fetch on component mount**
```typescript
useEffect(() => {
  api.getEvents().then(setEvents);
}, []);
```

**Pattern 2: Fetch based on dependency**
```typescript
useEffect(() => {
  api.getEventsByYear(year).then(setEvents);
}, [year]);
```

**Pattern 3: Invalidate cache after mutation**
```typescript
const handleApprove = async (eventId: string) => {
  await api.approveEvent(eventId);
  // Refetch list
  const updated = await api.getEvents();
  setEvents(updated);
};
```

---

## 6. Error Boundaries & Loading States

### 6.1 Global Error Boundary

**Location**: `app/components/common/ErrorBoundary.tsx`

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

**Usage in layout**:
```typescript
<ErrorBoundary>
  <Navbar />
  <main>
    {/* Page content */}
  </main>
</ErrorBoundary>
```

### 6.2 Loading Skeleton Pattern

**Location**: `app/components/common/Skeleton.tsx`

```typescript
export function EventSkeleton() {
  return (
    <div className="p-4 border rounded animate-pulse">
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>
  );
}
```

**Usage**:
```typescript
{isLoading ? (
  <EventSkeleton />
) : (
  <EventCard event={event} />
)}
```

### 6.3 Error Message Component

**Location**: `app/components/common/Alert.tsx`

```typescript
interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

export function Alert({ type, message, onClose }: AlertProps) {
  const colors = {
    success: 'bg-green-100 text-green-800 border-green-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    info: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  return (
    <div className={`p-4 border rounded ${colors[type]}`}>
      {message}
      {onClose && <button onClick={onClose}>×</button>}
    </div>
  );
}
```

**Usage**:
```typescript
{error && <Alert type="error" message={error} onClose={() => setError(null)} />}
```

---

## 7. Accessibility Requirements (WCAG 2.1 AA)

### 7.1 Semantic HTML

Use semantic elements:

```typescript
// ✓ Correct
<main>
  <section>
    <h2>Event Details</h2>
    <article>...</article>
  </section>
</main>

// ✗ Avoid generic divs
<div>
  <div>Event Details</div>
  <div>...</div>
</div>
```

### 7.2 ARIA Labels

Add labels for screen readers:

```typescript
<button aria-label="Close modal">×</button>
<input aria-label="Search events" type="text" />
<div role="status" aria-live="polite">{statusMessage}</div>
```

### 7.3 Keyboard Navigation

All interactive elements must be keyboard accessible:

```typescript
// All buttons accessible with Tab + Enter
<button onClick={handleDelete}>Delete</button>

// Form inputs navigable with Tab
<input type="text" />

// Modals closeable with Escape
<Modal isOpen={isOpen} onClose={handleClose}>
  {/* Escape key triggers onClose */}
</Modal>
```

### 7.4 Color Contrast

- Text: Contrast ratio ≥ 4.5:1
- UI components: Contrast ratio ≥ 3:1

Use Tailwind color palette (all meet WCAG AA).

### 7.5 Alternative Text

All images must have alt text:

```typescript
// ✓ Correct
<img src="character.jpg" alt="Portrait of Louis XIV, King of France" />

// ✗ Avoid
<img src="character.jpg" />

// For decorative images
<img src="decoration.svg" alt="" aria-hidden="true" />
```

---

## 8. Performance Optimization

### 8.1 Image Optimization

Use Next.js Image component:

```typescript
import Image from 'next/image';

// ✓ Correct
<Image
  src={characterImage}
  alt="Character portrait"
  width={200}
  height={200}
  priority={true} // For above-fold images
/>

// ✗ Avoid
<img src={characterImage} />
```

### 8.2 Code Splitting

Use dynamic imports for large features:

```typescript
import dynamic from 'next/dynamic';

const AdminPanel = dynamic(() => import('@/components/admin/AdminPanel'), {
  loading: () => <div>Loading...</div>
});
```

### 8.3 Memoization

Prevent unnecessary re-renders:

```typescript
// Memoize expensive components
export const EventCard = memo(function EventCard({ event }: EventCardProps) {
  return <div>{/* event details */}</div>;
});

// Memoize callbacks
const handleClick = useCallback(() => {
  // ...
}, [dependency]);
```

---

## 9. Cross-References

- [Constitution.md](Constitution.md#42-layer-responsibilities) — Component layer responsibilities
- [Features.md](Features.md#2-core-features) — Feature implementations
- [Operations.md](Operations.md#8-performance-optimization) — Bundle size management

---

## Appendix: Component Checklist

Before submitting a new component:

- [ ] TypeScript interface for all props
- [ ] Exported from `components/index.ts`
- [ ] Follows naming conventions (PascalCase for components)
- [ ] Has JSDoc comments for public props
- [ ] Responsive design (works on mobile, tablet, desktop)
- [ ] Accessibility (semantic HTML, ARIA labels, keyboard navigation)
- [ ] Error handling (graceful fallbacks)
- [ ] Loading state (skeleton or spinner)
- [ ] Props are immutable (no prop mutations)
- [ ] No console.log or debugging code
- [ ] Tested on multiple browsers

---

