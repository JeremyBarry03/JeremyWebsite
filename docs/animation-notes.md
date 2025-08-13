# Animation System Documentation

## Overview
The website features a performant canvas-based particle field system with mouse interactions and a typing animation. The system is fully accessible and respects motion preferences.

## Components

### Canvas Particle Field (`lib/particles/canvasField.js`)

#### Configuration Constants
- **Particle Count**: Responsive density (300-600 particles based on viewport)
- **Max Speed**: `0.5` - Base particle velocity limit
- **Influence Radius**: `120px` - Mouse interaction distance
- **Mouse Influence**: `0.3` - Strength of cursor attraction
- **Burst Force**: `8` - Click force multiplier
- **Settle Duration**: `2000ms` - Inactivity timeout before organization
- **Noise Scale**: `0.005` - Perlin noise influence for drift

#### Performance Optimizations
- Device pixel ratio awareness for crisp rendering
- FPS limiting when tab is hidden (30fps vs 60fps)
- RequestAnimationFrame-based animation loop
- Efficient particle count calculation based on viewport size
- Memory-efficient particle system (no DOM per particle)

#### States
1. **Idle**: Particles drift with Perlin noise and respond to mouse
2. **Organizing**: Particles form outline around headline after inactivity
3. **Typing**: Particles fade to 30% opacity, typing animation begins
4. **Complete**: System maintains minimal activity

### Typing Animation (`lib/typing.js`)

#### Exact Text Output
The system types exactly: `"Hello Im Jeremy! Welcome to my Website:)"`

#### Timing Configuration
- **Base Speed**: `55ms` per character
- **Speed Variation**: `±15ms` random variation for natural feel
- **Total Duration**: ~1.6 seconds

#### Accessibility Features
- Screen reader announcements via `aria-live="polite"`
- Immediate display for `prefers-reduced-motion`
- Proper focus management
- Semantic cursor implementation

### Motion Preferences

#### Reduced Motion Support
When `prefers-reduced-motion: reduce` is detected:
- Canvas shows static gradient background
- Typing animation displays text immediately
- All hover transforms are disabled
- Animation durations set to `0.01ms`

#### Manual Motion Toggle
Users can override system preferences via the "Reduce Motion" button:
- Preference stored in `localStorage`
- Real-time canvas system toggle
- Maintains accessibility compliance

## Integration Points

### Event Flow
1. Page loads → Initialize particle field (if motion enabled)
2. After 2-3s inactivity → Particles organize around headline
3. Organization complete → `particles:typing-ready` event fired
4. Typing animation starts → Text types out character by character
5. Typing complete → Main content fades in

### Theme Integration
- Particle colors adapt to theme: `['#7AA2FF', '#7CFFC4', '#E6E8EC']`
- Theme toggle affects all design tokens
- Smooth transitions between light/dark modes

### Responsive Behavior
- Mobile: Reduced particle count (300 vs 600)
- Touch devices: Simplified interactions
- Small screens: Adjusted influence radius

## Performance Budget

### Metrics
- Canvas system: ~3-5KB minified
- Typing system: ~2KB minified
- Total animation overhead: <10KB
- Target FPS: 60fps (30fps hidden)
- Memory usage: <5MB for particle system

### Optimization Strategies
- Particle pooling to avoid garbage collection
- Efficient collision detection with spatial partitioning
- Canvas-only rendering (no DOM manipulation per particle)
- Throttled resize handlers
- Visibility API for performance management

## Accessibility Compliance

### Screen Reader Support
- Hidden announcements for typing completion
- Semantic HTML structure maintained
- ARIA labels and live regions
- Focus management during transitions

### Motor Accessibility
- Large touch targets (min 44px)
- Reduced motion preferences respected
- Alternative interaction methods
- No seizure-inducing effects

### Visual Accessibility
- High contrast mode support
- Scalable text (no fixed pixel sizes)
- Focus indicators meet WCAG 2.1 AA standards
- 4.5:1 minimum contrast ratios

## Browser Support
- Modern browsers with Canvas and ES6 support
- Graceful degradation for older browsers
- Progressive enhancement architecture
- Fallback to static content if JS fails

## Customization Points

### Easy Adjustments
```javascript
// Particle density
particleCount: window.innerWidth < 768 ? 300 : 600

// Animation timing
speed: 55, // ms per character
speedVariation: 15 // ±ms variation

// Visual appearance
colors: ['#7AA2FF', '#7CFFC4', '#E6E8EC']
opacity: { idle: 0.6, active: 0.8, final: 0.3 }
```

### Advanced Tweaks
- Perlin noise parameters for particle drift
- Mouse influence curves and falloff
- Organization patterns (currently headline outline)
- Easing functions and animation curves

## Testing Notes
- Test with `prefers-reduced-motion` enabled/disabled
- Verify on various screen sizes and pixel ratios
- Check performance with dev tools profiler
- Validate screen reader announcements
- Test theme switching during animations

## Known Limitations
- Canvas requires JavaScript enabled
- Particle count auto-adjusts but may need manual tuning for very large/small screens
- Perlin noise implementation is simplified (could use more sophisticated algorithm)
- Theme colors are hardcoded (could be made more dynamic)

## Future Enhancements
- WebGL renderer for better performance with more particles
- More sophisticated particle interaction patterns
- Dynamic particle colors based on time of day/season
- Integration with Web Audio API for sound-reactive effects