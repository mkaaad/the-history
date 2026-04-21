# AGENTS.md - Historical Figures Interactive Map

This document provides essential information for AI agents working on this codebase.

## Project Overview

- **Type**: React single-page application (SPA) with interactive map visualization
- **Purpose**: Interactive timeline map showcasing historical figures (李白, 李清照, 苏轼) with biographical events
- **Frontend**: React 19, Create React App, AMap (高德地图) for Chinese maps
- **Backend**: None (static frontend only)
- **Deployment**: Docker + Nginx, GitHub Pages via GitHub Actions
- **Language**: Chinese comments and UI text, English variable names

## Essential Commands

### Development
```bash
cd fe
npm install          # Install dependencies
npm start            # Start dev server at http://localhost:3000
npm run build        # Build production bundle
npm test             # Run tests (Jest + React Testing Library)
npm run eject        # Eject from Create React App (not recommended)
```

### Docker Deployment
```bash
# Build image
docker build -t history-app .

# Run container
docker run -d -p 8080:80 --name history-container history-app

# Stop container
docker stop history-container
docker rm history-container
```

### GitHub Pages Deployment
- Automatic deployment via GitHub Actions on push to `main`
- Manual trigger available in Actions tab
- Builds frontend and deploys to GitHub Pages

## Project Structure

```
history/
├── fe/                    # Frontend React application
│   ├── src/
│   │   ├── components/    # React components (screen-based)
│   │   ├── data/         # JSON data for historical figures
│   │   ├── styles/       # CSS files with Chinese aesthetic
│   │   ├── constants/    # Character definitions and configurations
│   │   ├── App.js        # Main app with screen routing
│   │   └── index.js      # Entry point
│   ├── public/           # Static assets (images, icons)
│   │   └── images/
│   │       ├── markers/  # Character-specific map markers
│   │       └── *.png     # Character portraits
│   ├── package.json      # Dependencies and scripts
│   └── nginx.conf        # Nginx configuration for SPA routing
├── be/                   # Backend placeholder (empty)
├── Dockerfile           # Multi-stage Docker build
├── .github/workflows/   # CI/CD for GitHub Pages
└── README.md           # Project documentation (Chinese)
```

## Code Organization

### Component Architecture
- **Screen-based navigation**: `StartScreen` → `SelectScreen` → `GameScreen` → `DialogScreen` → `EndScreen`
- **Main component**: `HistoricalGame` (in `App.js`) manages current view state
- **Map component**: `GameScreen` contains all map logic and key choice system
- **Sidebar**: `RightSidebar` displays event details
- **Functional components** with React Hooks (`useState`, `useEffect`, `useRef`, `useMemo`)

### Key Components
- `StartScreen.js`: Landing page with start button
- `SelectScreen.js`: Character selection with biography popups
- `GameScreen.js`: Interactive map with timeline, markers, and key choices
- `DialogScreen.js`: Key choice dialog interface
- `EndScreen.js`: Conclusion screen with restart option
- `RightSidebar.js`: Event details panel

### Data Flow
- Character data loaded from `src/constants/characters.js`
- Event data from JSON files in `src/data/`
- Key choice data from `*_option.json` files
- State managed via React hooks, passed down as props

## Data Format

### Event Data (`*_option.json`)
```json
{
  "name": "李白",
  "state": "降生·太白入梦",
  "start_year": 701,
  "end_year": 701,
  "stage": "碎叶",
  "longitude": 75.29,
  "latitude": 42.84,
  "color": "蓝色",
  "content": "事件描述文本..."
}
```

### Key Choice Data (`*_option.json`)
```json
{
  "description": "抉择描述文本",
  "end_content": "错误选择的结果文本",
  "name": "李白",
  "option": ["选项1", "选项2"],
  "year": 725
}
```
**Important**: The second option (index 1) is always the correct choice.

### Character Configuration (`characters.js`)
```javascript
{
  id: 1,
  name: '李白',
  era: '唐朝',
  status: '日常状态',
  color: 'blue',
  events: liBaiData,  // Imported JSON data
  image: 'images/libai.png',
  markerIcon: 'images/markers/libai/point.png',
  markerIconSelected: 'images/markers/libai/point_selected.png',
  biography: { ... }  // Detailed biographical information
}
```

## Styling and Design System

### CSS Architecture
- **`common.css`**: Global styles, CSS custom properties, Chinese aesthetic
- **Component-specific CSS**: Each component has corresponding CSS file
- **Design tokens**: Chinese traditional colors with semantic names
  - `--primary-color`: #8E2323 (宫墙红)
  - `--warning-color`: #C09553 (琉璃金)
  - `--light-bg`: #F7F3E8 (熟宣色)
- **Typography**: Chinese fonts (Noto Serif SC, STSong, Kaiti)
- **Responsive breakpoints**: 768px (tablet), 480px (mobile)

### Key CSS Classes
- `.btn-chinese`: Styled buttons with Chinese aesthetic
- `.title-main`, `.title-sub`: Chinese typography styles
- `.character-card`: Character selection cards with hover effects
- `.choice-modal`: Key choice dialog styling
- `.timeline-container`: Timeline visualization

## Testing

- **Framework**: Jest + React Testing Library (via Create React App)
- **Test location**: `src/App.test.js` (basic smoke test)
- **Run tests**: `npm test`
- **Coverage**: Minimal; project primarily uses manual testing
- **No E2E tests**: Consider adding Cypress if needed

## Deployment

### Docker Deployment (Recommended)
1. **Build**: `docker build -t history-app .`
2. **Run**: `docker run -d -p 8080:80 --name history-container history-app`
3. **Access**: http://localhost:8080

### Nginx Configuration
- SPA routing support (all routes redirect to `index.html`)
- Gzip compression enabled
- Static resource caching (1 year)
- Hidden file access blocked

### GitHub Pages
- Automatic deployment via GitHub Actions
- Builds `fe/build` directory
- Deploys to `https://mkaaad.github.io/the-history`

### Traditional Deployment
1. Build with `npm run build`
2. Copy `build/` contents to web server
3. Configure SPA routing (reference `fe/nginx.conf`)

## Gotchas and Non-Obvious Patterns

### Map Integration
- **AMap API key**: Hardcoded in `GameScreen.js:184` - consider environment variable for production
- **Map style**: Uses custom style `amap://styles/1f31d45ad8388e6139202a76bc1ff339`
- **Center coordinates**: China-focused (`[108.93984, 34.34127]`)
- **Marker icons**: Character-specific PNGs in `public/images/markers/{character}/`
- **Polyline color**: #8E2323 (matches primary color)

### Key Choice System
- **Correct option**: Always the second option (index 1)
- **Result display**: Correct choices show event content from same year
- **Wrong choices**: Show `end_content` from choice data
- **Completion tracking**: `completedChoices` state prevents re-triggering

### Data Processing Logic (`GameScreen.js`)
- **Event deduplication**: Only one event per year kept (prefers events containing "岁")
- **Sorting**: Events sorted by `start_year`
- **Timeline calculation**: Uses midpoint between `start_year` and `end_year`
- **Map marker synchronization**: Complex `useEffect` chain for map updates

### State Management Patterns
- **Ref synchronization**: `showChoiceRef` and `choiceResultRef` used to access latest state in effects
- **Memoized computations**: `useMemo` for `sortedEvents`, `choiceData`, `eventPaths`
- **Conditional rendering**: View switching via `currentView` state

### Image Assets
- **Character portraits**: `public/images/{character}.png`
- **Map markers**: `public/images/markers/{character}/point.png` (normal) and `point_selected.png` (selected)
- **Asset paths**: Relative to `public/` directory (e.g., `images/libai.png`)

## Adding New Features

### Adding a New Historical Figure
1. **Create data files** in `src/data/`:
   - `{name_pinyin}.json` (event data)
   - `{name_pinyin}_option.json` (key choices)
2. **Add character configuration** in `src/constants/characters.js`:
   - Import new data files
   - Add to `CHARACTERS` array with all required fields
3. **Add image assets** in `public/images/`:
   - Portrait: `{name_pinyin}.png`
   - Map markers: `markers/{name_pinyin}/point.png` and `point_selected.png`
4. **Update `SelectScreen.js`**: Character list will auto-update from `CHARACTERS`

### Modifying Styles
- **Global styles**: Edit `src/styles/common.css`
- **Component styles**: Edit corresponding CSS file in `src/styles/`
- **Color scheme**: Update CSS custom properties in `:root`
- **Responsive design**: Use existing breakpoints (768px, 480px)

### Extending the Map
- **New map features**: Add AMap plugins in `GameScreen.js` line 186
- **Marker customization**: Modify icon creation in `GameScreen.js` lines 226-236
- **Map interactions**: Add event handlers to marker creation (line 245)

### Adding New Screen
1. **Create component** in `src/components/`
2. **Add CSS file** in `src/styles/`
3. **Update `App.js`**:
   - Import component
   - Add to `currentView` state logic
   - Create navigation handler

## Common Issues and Solutions

### Map Not Loading
- Check AMap API key (hardcoded, may expire)
- Ensure network can access AMap services (China-specific)
- Verify map container dimensions (100% width/height)

### Build Failures
- Node.js version: Requires 18+
- Dependency conflicts: Delete `node_modules` and `package-lock.json`, re-run `npm install`
- Memory issues: Increase Node memory limit with `--max-old-space-size`

### Routing Issues in Production
- Ensure web server configured for SPA routing (see `fe/nginx.conf`)
- All routes should redirect to `index.html`
- Check `homepage` field in `package.json` for correct base path

### Key Choices Not Triggering
- Verify choice year matches event `start_year`
- Check `completedChoices` state isn't already containing the year
- Ensure `choiceData` is correctly loaded for the character

## Performance Considerations

- **Code splitting**: Consider `React.lazy()` for screen components
- **Image optimization**: PNG files could be converted to WebP
- **Map performance**: Marker count limited by deduplication logic
- **Bundle size**: Regular dependency audits recommended

---

*Last updated: April 2026*  
*Maintainer: Project Team*  
*Documentation generated by AI agent*