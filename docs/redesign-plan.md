# Website Redesign Plan

## Current Stack Analysis
- **Technology**: Vanilla HTML, CSS, JavaScript
- **Styling**: Inline CSS with CSS animations
- **Build/Hosting**: Static files (GitHub Pages via CNAME)
- **Current Features**: 
  - Animated intro with flying numbers
  - Typing animation
  - Tab switching (About/Skills)
  - Projects showcase
  - Responsive design

## Files to Modify

### Core Files
- `index.html` - Main homepage with new canvas particle system
- `Jeremy_Barry_Projects.html` - Update with new design system
- `styles/tokens.css` - New design system tokens (to be created)
- `styles/components.css` - Component styles (to be created)
- `styles/animation.css` - Animation utilities (to be created)
- `lib/particles/canvasField.js` - Canvas particle system (to be created)

### Assets to Preserve
- All existing images (`IMG_*.JPEG`, `favicon.png`, etc.)
- All project files in `projects/` directory
- All PDF documents
- Social media icons

## Design System

### Color Tokens
```css
/* Dark theme (primary) */
--bg: #0B0C10;
--surface: #111318;
--text: #E6E8EC;
--muted: #AAB1C2;
--brand: #7AA2FF;
--brand-2: #7CFFC4;

/* Light theme */
--bg-light: #FEFEFE;
--surface-light: #F8F9FA;
--text-light: #1A1B1F;
--muted-light: #6C757D;
--brand-light: #2563EB;
--brand-2-light: #059669;
```

### Typography & Layout
- **Fonts**: Inter for UI, system fonts fallback
- **Headings**: Clamp-based responsive sizing
- **Body**: 65-75ch measure, system/Inter
- **Container**: max-width 1100-1200px
- **Radius**: --radius-lg: 16px, --radius-xl: 24px
- **Motion**: --ease: cubic-bezier(.22,.8,.31,1), --dur: 280ms

### Core Components
1. **Header/Nav** - Sticky navigation with theme toggle
2. **Hero** - Canvas particle field + typing animation
3. **Card** - Project cards with hover effects
4. **Button** - Primary/secondary/subtle variants
5. **Footer** - Consistent across pages

## Canvas Particle System Specifications

### Behavioral Requirements
- **Idle**: 400-800 particles with Perlin noise drift
- **Mouse Move**: Magnetic attraction within influence radius
- **Mouse Click**: Radial burst effect
- **Inactivity**: Particles form headline outline
- **Performance**: <60fps, devicePixelRatio aware, hidden tab optimization

### Animation Timeline
1. Canvas loads with particle field (0-2s)
2. Mouse interactions available immediately
3. After 2-3s inactivity: particle organization
4. Typing animation triggers: "Hello Im Jeremy! Welcome to my Website:)"
5. Canvas fades to 30-40% opacity
6. Main content reveals

### Accessibility
- `prefers-reduced-motion` support
- Static gradient fallback
- Immediate text display (no typing)
- Toggle for motion preferences
- Proper ARIA labels

## Performance Budget
- **Target**: Lighthouse ≥ 95/95/95/100
- **Canvas**: ~3-5KB vanilla JS/TS
- **Font loading**: Preload critical subsets
- **Images**: Responsive sizes, lazy loading
- **CLS**: 0 layout shift in hero section

## Implementation Strategy

### Phase 1: Foundation
1. Create design tokens CSS file
2. Extract common components
3. Set up proper file structure

### Phase 2: Canvas System
1. Build particle field engine
2. Implement mouse interactions
3. Add reduced motion support
4. Integrate typing animation

### Phase 3: Layout Updates
1. Update homepage with new hero
2. Apply design system to projects page
3. Add theme toggle functionality

### Phase 4: Optimization
1. Performance testing
2. Accessibility audit
3. Lighthouse validation
4. Cross-browser testing

## Content Preservation
- **Text**: All copy remains identical
- **URLs**: No slug changes, preserve existing paths
- **SEO**: Maintain all meta tags and OG data
- **Images**: All current assets preserved
- **Functionality**: Tab switching, navigation preserved

## Success Criteria
- [x] All content unchanged
- [ ] Canvas field with mouse interactions
- [ ] Exact typing text: "Hello Im Jeremy! Welcome to my Website:)"
- [ ] Reduced motion support
- [ ] Lighthouse scores ≥ 95/95/95/100
- [ ] Zero CLS
- [ ] Keyboard navigation excellent
- [ ] Theme toggle functional

## Notes
- Maintain existing Google Analytics
- Preserve favicon and CNAME
- Keep current build/deploy process
- No breaking changes to existing URLs