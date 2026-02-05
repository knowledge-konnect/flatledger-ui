# SocietyLedger Professional Design System

## 📐 Layout & Spacing (8px System)

### Container Widths
```css
Max Width: 1280px (screens > 1400px)
Content Width: 1200px (standard desktop)
```

### Responsive Padding
```css
Desktop (≥1024px):  40px (5 × 8px)
Tablet (768-1023px): 24px (3 × 8px)  
Mobile (<768px):     16px (2 × 8px)
```

### Spacing Scale (8px Base)
```css
--space-1:  4px   (0.5 × 8px) - Tiny gaps
--space-2:  8px   (1 × 8px)   - Small gaps
--space-3:  12px  (1.5 × 8px) - Medium gaps
--space-4:  16px  (2 × 8px)   - Default gap
--space-5:  20px  (2.5 × 8px) - Large gap
--space-6:  24px  (3 × 8px)   - Section padding
--space-8:  32px  (4 × 8px)   - Section spacing
--space-10: 40px  (5 × 8px)   - Page padding
--space-12: 48px  (6 × 8px)   - Large sections
--space-16: 64px  (8 × 8px)   - Extra large
```

### Component Spacing
```css
Card padding: 16px (mobile) → 20px (desktop)
Section spacing: 32px
Element gap: 16px
Button gap: 8px
```

---

## 🎯 Typography System

### Font Families
```css
Primary: Inter (UI, body text)
Monospace: JetBrains Mono (numbers, code)
```

### Font Sizes
```css
Page Title:     32px (2rem)    - font-bold, line-height: 1.2
Section Title:  22px (1.375rem) - font-semibold, line-height: 1.3
Subsection:     18px (1.125rem) - font-semibold, line-height: 1.4
Body:           15px (0.9375rem)- font-normal, line-height: 1.5
Small:          13px (0.8125rem)- font-normal, line-height: 1.5
Tiny:           12px (0.75rem)  - font-normal, line-height: 1.4
```

### Font Weights
```css
Normal:    400 (body text)
Medium:    500 (emphasis)
Semibold:  600 (headings, labels)
Bold:      700 (page titles)
```

### Line Heights
```css
Tight:   1.2 (large headings)
Normal:  1.5 (body text)
Relaxed: 1.75 (long-form content)
```

---

## 🎨 Color Palette

### Primary Brand
```
Primary 500: #8b5cf6 (Main brand color)
Primary 600: #7c3aed (Hover state)
Primary 700: #6d28d9 (Active state)
Primary 50:  #f5f3ff (Light backgrounds)
```

### Neutrals (Warm Gray)
```
Neutral 50:  #fafaf9 (Page background)
Neutral 100: #f5f5f4 (Card background)
Neutral 200: #e7e5e4 (Borders)
Neutral 400: #a8a29e (Disabled text)
Neutral 600: #57534e (Body text)
Neutral 900: #1c1917 (Headings)
```

### Semantic Colors
```
Success: #10b981 (Green)
Warning: #f59e0b (Amber)
Error:   #f43f5e (Rose)
Info:    #0ea5e9 (Sky)
```

### Usage Guidelines
```
Text Primary:   Neutral 900
Text Secondary: Neutral 600
Text Disabled:  Neutral 400
Border Default: Neutral 200
Background:     Neutral 50
Card:           White / Neutral 100
```

---

## 🧩 Component Specifications

### Buttons
```css
Height: 40px (5 × 8px)
Padding: 16px horizontal (2 × 8px)
Border radius: 8px (1 × 8px)
Font size: 15px
Font weight: 600 (semibold)
Min width: 80px (10 × 8px)

Sizes:
- Small:  32px height, 12px padding
- Medium: 40px height, 16px padding (default)
- Large:  48px height, 20px padding
```

### Input Fields
```css
Height: 40px (5 × 8px)
Padding: 12px horizontal
Border: 2px solid
Border radius: 8px (1 × 8px)
Font size: 15px
Label position: Top (8px gap)
Label font size: 13px
Label font weight: 600
```

### Cards
```css
Border radius: 12px (1.5 × 8px)
Padding: 16px (mobile) → 20px (desktop)
Border: 1px solid Neutral 200
Shadow: 0 1px 3px rgba(0,0,0,0.05)
Background: White

Hover state:
- Shadow: 0 4px 12px rgba(0,0,0,0.08)
- Transform: translateY(-2px)
```

### Tables
```css
Row height: 48px (6 × 8px)
Cell padding: 12px horizontal, 16px vertical
Header background: Neutral 50
Border: 1px solid Neutral 200
Font size: 14px
```

### Modals
```css
Max width: 480px (small), 720px (medium), 960px (large)
Padding: 24px (3 × 8px)
Border radius: 16px (2 × 8px)
Backdrop: rgba(0,0,0,0.5) with blur
```

---

## 📱 Responsive Breakpoints

```css
Mobile:  0-767px    (< 768px)
Tablet:  768-1023px (768px - 1023px)
Desktop: 1024px+    (≥ 1024px)
Wide:    1400px+    (≥ 1400px)
```

### Responsive Rules

#### Mobile (<768px)
```css
- Single column layout
- Sidebar hidden (hamburger menu)
- Tables become horizontal scroll
- Cards stack vertically
- Touch targets: min 44px
- Padding: 16px
- Font sizes: -2px from desktop
- Bottom navigation for main actions
```

#### Tablet (768-1023px)
```css
- 2-column grid for cards
- Collapsible sidebar
- Padding: 24px
- Font sizes: -1px from desktop
```

#### Desktop (≥1024px)
```css
- Multi-column layouts
- Fixed sidebar navigation
- Padding: 40px
- Full font sizes
- Hover states enabled
```

---

## 🎭 Design Principles

### 1. Visual Hierarchy
```
1. Use size, weight, color to establish importance
2. Page title (32px, bold) > Section title (22px, semibold) > Body (15px)
3. Primary actions prominent, secondary subtle
```

### 2. White Space
```
1. Never cramped - generous padding
2. Section spacing: 32px minimum
3. Element spacing: 16px default
4. Breathing room around content
```

### 3. Consistency
```
1. Same patterns everywhere
2. Predictable interactions
3. Unified color usage
4. Consistent spacing
```

### 4. Accessibility
```
1. Color contrast: 4.5:1 minimum
2. Touch targets: 44px minimum
3. Focus indicators: 2px ring
4. Keyboard navigation support
```

---

## 💡 Component Library

### Button Classes
```css
.btn-primary   - Main action (purple gradient)
.btn-secondary - Secondary action (neutral)
.btn-ghost     - Subtle action
.btn-danger    - Destructive action (red)

.btn-sm  - 32px height
.btn-md  - 40px height (default)
.btn-lg  - 48px height
```

### Card Classes
```css
.card         - Base card
.card-hover   - Adds hover lift effect
.card-compact - 12px padding
.card-normal  - 16px padding (mobile)
.card-relaxed - 24px padding (desktop)
```

### Input Classes
```css
.input        - Base input (40px)
.input-sm     - 32px height
.input-lg     - 48px height
.input-error  - Error state
```

---

## 📊 Grid System

### Containers
```css
.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px; /* mobile */
}

@media (min-width: 768px) {
  .container { padding: 24px; }
}

@media (min-width: 1024px) {
  .container { padding: 40px; }
}
```

### Grid Layouts
```css
/* 2-column grid */
.grid-cols-2 { 
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

/* 3-column grid */
.grid-cols-3 { 
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* 4-column grid */
.grid-cols-4 { 
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* Responsive: Stack on mobile */
@media (max-width: 767px) {
  .grid-cols-2,
  .grid-cols-3,
  .grid-cols-4 {
    grid-template-columns: 1fr;
  }
}
```

---

## 🎯 Implementation Checklist

- [ ] Update Tailwind config with 8px spacing
- [ ] Set typography scale (32, 22, 18, 15, 13, 12)
- [ ] Standardize button heights (40px)
- [ ] Standardize input heights (40px)
- [ ] Set card border-radius to 12px
- [ ] Update table row height to 48px
- [ ] Implement responsive padding (40/24/16)
- [ ] Add touch-friendly mobile buttons (44px)
- [ ] Test on mobile, tablet, desktop
- [ ] Verify color contrast ratios

---

## 📐 Spacing Examples

```tsx
// Page Layout
<div className="p-4 md:p-6 lg:p-10">  {/* 16/24/40 */}
  
  // Section spacing
  <div className="space-y-8">  {/* 32px between sections */}
    
    // Card
    <div className="card p-4 md:p-5">  {/* 16/20 */}
      
      // Content spacing
      <div className="space-y-4">  {/* 16px between elements */}
        <h2>Title</h2>
        <p>Content</p>
      </div>
      
    </div>
    
  </div>
  
</div>
```

---

**This design system ensures:**
✅ Professional SaaS appearance
✅ Perfect spacing consistency
✅ Clear visual hierarchy
✅ Mobile-first responsive
✅ Accessible & usable
✅ Developer-friendly
