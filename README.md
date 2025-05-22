# Wide Flange Profile Visualizer

## Project Overview
This project is a web-based application for visualizing and analyzing wide flange (WF) beam profiles. It utilizes Paper.js for rendering and provides a user-friendly interface for engineers and architects to explore standard beam sections with real-time visualization and dimensioning capabilities.

## Features
- Interactive visualization of standard wide flange beam profiles
- Real-time visualization of beam geometry and dimensions
- Configurable scale and measurement units
- Theme support with light/dark mode
- Layer visibility controls for profile, hatch pattern, and dimensions
- Comprehensive beam property information display
- Responsive design that adapts to window size

## Dimensioning Capabilities
### Current Features
- **Overall Dimensions:** Horizontal and vertical measurements with automatic placement
- **Thickness Dimensions:** Specialized dimension lines for flange and web measurements
- **Smart Placement:** Automatic positioning of dimension lines and text
- **Configurable Styles:** Customizable arrows, text, and line styles
- **Unit Formatting:** Support for both decimal and fractional measurements
- **Theme Integration:** Dimension styles adapt to the current theme

### Future Features
- Chain dimensioning for sequential measurements
- Angular dimensioning for non-orthogonal features
- Automatic dimensioning based on beam features
- Dimension groups and organization
- Export dimensions to CAD formats
- Custom annotation capabilities
- Dimension presets for different standards (ISO, ANSI, etc.)

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/greasegum/wfprofile.git
   ```
2. Navigate to the project directory:
   ```bash
   cd wfprofile
   ```
3. No package installation is required as the project uses CDN-hosted dependencies.
4. Open `src/index.html` in a web browser to start the application.

## Project Structure
```
wfprofile/
├── src/
│   ├── components/
│   │   ├── beam/
│   │   │   ├── BeamDraw.js      # Beam rendering logic
│   │   │   └── BeamGeometry.js  # Beam geometry calculations
│   │   └── dimension/
│   │       └── Dimension.js     # Dimensioning system
│   ├── utils/
│   │   └── ScaleManager.js      # Scale conversion utilities
│   ├── config/
│   │   ├── beam-profiles.json   # Standard beam section data
│   │   ├── dimension-config.json # Dimension styling config
│   │   └── drawing-config.json  # Theme and visual settings
│   ├── styles/
│   │   ├── controls.css        # Control panel styling
│   │   └── styles.css         # Global styles
│   └── index.html            # Main application entry
└── README.md
```

## Usage
1. Open `src/index.html` in a web browser
2. Select a beam profile from the dropdown menu
3. Use the theme toggle to switch between light and dark modes
4. Toggle layer visibility using the checkboxes
5. View comprehensive beam properties in the collapsible panels

### Available Beam Profiles
- W8x31
- W10x33
- W12x40
- W14x48
- W16x57
- W18x76
- W21x93
- W24x104

## Technical Details

### BeamDraw Class
- **Constructor**: Initializes the BeamDraw class with geometry, scale manager, and configuration settings
- **updateTheme**: Updates the drawing theme based on user selection
- **draw**: Sets up layers and draws the beam's perimeter and hatch pattern
- **drawDebugVisuals**: Adds visual aids for debugging
- **setLayerVisibility**: Toggles visibility of specified layers
- **createPerimeterPath**: Constructs the path for the beam's perimeter, including fillets
- **createHatchPattern**: Generates a hatch pattern within the beam's perimeter

### Configuration
- Theme settings in `drawing-config.json` control visual appearance
- Dimension styling in `dimension-config.json` manages measurement display
- Beam profile data in `beam-profiles.json` contains standard section properties

### Dependencies
- Paper.js v0.12.17 (via CDN) for canvas rendering

## Contributing
Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.

## Contact
For questions or feedback about this visualization tool, please open an issue on the GitHub repository.

## Acknowledgments
- Paper.js team for their excellent canvas rendering library
- AISC for standard beam section data 