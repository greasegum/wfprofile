import { paper } from 'paper';
import { BeamDraw } from './components/beam/BeamDraw';
import { BeamGeometry } from './components/beam/BeamGeometry';
import { EnhancedDimension } from './components/dimension/Dimension';
import { ScaleManager } from './utils/ScaleManager';
import './styles/controls.css';
import './styles/styles.css';
import beamProfiles from './config/beam-profiles.json';

// Initialize Paper.js when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Set up Paper.js
    const canvas = document.getElementById('canvas');
    
    // Calculate canvas size with margins (80% of window size)
    const calculateCanvasSize = () => {
        const margin = 0.1; // 10% margin
        const maxWidth = Math.floor(window.innerWidth * (1 - 2 * margin));
        const maxHeight = Math.floor(window.innerHeight * (1 - 2 * margin));
        
        // Ensure minimum size
        return {
            width: Math.max(400, maxWidth),
            height: Math.max(300, maxHeight)
        };
    };

    // Set initial canvas size
    const initialSize = calculateCanvasSize();
    canvas.width = initialSize.width;
    canvas.height = initialSize.height;
    
    // Center the canvas
    canvas.style.position = 'absolute';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
    
    paper.setup(canvas);
    paper.view.viewSize = new paper.Size(initialSize.width, initialSize.height);

    // Create scale manager with initial scale (40px = 1 inch)
    const INITIAL_SCALE = 40;
    const scaleManager = new ScaleManager(INITIAL_SCALE);
    
    // Store references to layers and drawers
    let beamDraw;
    let dimensionLayer;
    let currentProfile = localStorage.getItem('selectedProfile') || 'W8x31';

    // Function to update profile info display
    function updateProfileInfo(profileName) {
        const profile = beamProfiles[profileName];
        if (!profile) return;

        // Helper functions to format values
        const formatDim = (value) => value.toFixed(3) + '"';
        const formatWeight = (value) => value.toFixed(1) + ' lb/ft';
        const formatArea = (value) => value.toFixed(2) + ' in²';
        const formatInertia = (value) => value.toFixed(1) + ' in⁴';
        const formatModulus = (value) => value.toFixed(1) + ' in³';
        const formatRadius = (value) => value.toFixed(2) + ' in';
        const formatTorsion = (value) => value.toFixed(3) + ' in⁴';
        const formatWarping = (value) => value.toFixed(0) + ' in⁶';
        
        // Update dimensions
        document.getElementById('profile-designation').textContent = profileName;
        document.getElementById('profile-height').textContent = formatDim(profile.dimensions.height);
        document.getElementById('profile-width').textContent = formatDim(profile.dimensions.width);
        document.getElementById('profile-web').textContent = formatDim(profile.dimensions.webThickness);
        document.getElementById('profile-flange').textContent = formatDim(profile.dimensions.flangeThickness);
        document.getElementById('profile-fillet').textContent = formatDim(profile.dimensions.filletRadius);

        // Update physical properties
        document.getElementById('profile-weight').textContent = formatWeight(profile.properties.weight);
        document.getElementById('profile-area').textContent = formatArea(profile.properties.area);

        // Update strong axis properties
        document.getElementById('profile-ix').textContent = formatInertia(profile.properties.Ix);
        document.getElementById('profile-sx').textContent = formatModulus(profile.properties.Sx);
        document.getElementById('profile-rx').textContent = formatRadius(profile.properties.rx);
        document.getElementById('profile-zx').textContent = formatModulus(profile.properties.Zx);

        // Update weak axis properties
        document.getElementById('profile-iy').textContent = formatInertia(profile.properties.Iy);
        document.getElementById('profile-sy').textContent = formatModulus(profile.properties.Sy);
        document.getElementById('profile-ry').textContent = formatRadius(profile.properties.ry);
        document.getElementById('profile-zy').textContent = formatModulus(profile.properties.Zy);

        // Update additional properties
        document.getElementById('profile-j').textContent = formatTorsion(profile.properties.J);
        document.getElementById('profile-cw').textContent = formatWarping(profile.properties.Cw);
    }

    // Create main drawing function
    function drawBeam(profileName = currentProfile) {
        // Reset scale manager to initial scale before each draw
        scaleManager.updateScale(INITIAL_SCALE);
        
        // Clear all layers
        paper.project.clear();
        
        // Create beam geometry
        const geometry = new BeamGeometry(profileName);
        
        // Create beam drawer
        beamDraw = new BeamDraw(geometry, scaleManager);
        
        // Set canvas background color from theme
        paper.view.element.style.backgroundColor = beamDraw.config.background;
        
        // Create main graphics layer
        const graphicsLayer = new paper.Layer();
        
        // Draw the beam
        const { perimeter, hatchGroup } = beamDraw.draw(graphicsLayer);
        
        // Create dimension layer
        dimensionLayer = new paper.Layer();
        graphicsLayer.addChild(dimensionLayer);
        
        // Create dimension drawer with theme config and debugging enabled
        const dimension = new EnhancedDimension(scaleManager, beamDraw.config, true);
        
        // Overall width (horizontal)
        dimension.drawOverallDimension(dimensionLayer, {
            start: geometry.points.tf1,
            end: geometry.points.tf2,
            value: geometry.dimensions.width,
            orientation: 'horizontal',
            placementHint: 'above'
        });

        // Overall height (vertical)
        dimension.drawOverallDimension(dimensionLayer, {
            start: geometry.points.tf1,
            end: geometry.points.bf4,
            value: geometry.dimensions.height,
            orientation: 'vertical',
            placementHint: 'left'
        });

        // Top flange thickness (vertical)
        dimension.drawVerticalThicknessDimension(dimensionLayer, {
            topEdge: geometry.points.tf1,
            bottomEdge: geometry.points.tf4,
            value: geometry.dimensions.flangeThickness,
            xPosition: geometry.points.tf1.x
        });

        // Web thickness (horizontal)
        const webMidY = (geometry.points.w1.y + geometry.points.w3.y) / 2;
        dimension.drawThicknessDimension(dimensionLayer, {
            leftEdge: geometry.points.w1,
            rightEdge: geometry.points.w2,
            value: geometry.dimensions.webThickness,
            yPosition: webMidY
        });

        // Calculate available space with padding
        const padding = Math.min(paper.view.viewSize.width, paper.view.viewSize.height) * 0.1;
        const availableWidth = paper.view.viewSize.width - (padding * 2);
        const availableHeight = paper.view.viewSize.height - (padding * 2);

        // Get the current bounds of all content
        const contentBounds = graphicsLayer.bounds;

        // Calculate scale to fit within available space while maintaining aspect ratio
        const scaleX = availableWidth / contentBounds.width;
        const scaleY = availableHeight / contentBounds.height;
        const finalScale = Math.min(scaleX, scaleY) * 0.9; // 90% of available space for safety margin

        // Apply the calculated scale
        graphicsLayer.scale(finalScale);

        // After scaling, get new bounds and center the content
        const newBounds = graphicsLayer.bounds;
        const centerOffset = paper.view.center.subtract(newBounds.center);
        graphicsLayer.translate(centerOffset);

        // Ensure view is updated
        paper.view.update();
    }

    // Set up profile selector
    function setupProfileSelector() {
        const profileSelect = document.getElementById('profile-select');
        
        // Set initial selection
        profileSelect.value = currentProfile;
        updateProfileInfo(currentProfile);
        
        // Handle profile changes
        profileSelect.addEventListener('change', (e) => {
            currentProfile = e.target.value;
            localStorage.setItem('selectedProfile', currentProfile);
            drawBeam(currentProfile);
            setupLayerControls(); // Reconnect controls after redraw
        });
    }

    // Set up layer visibility controls
    function setupLayerControls() {
        const profileCheckbox = document.getElementById('profile-layer');
        const hatchCheckbox = document.getElementById('hatch-layer');
        const dimensionCheckbox = document.getElementById('dimension-layer');

        // Load saved states or set defaults
        const loadSavedState = (checkbox, defaultState = true) => {
            const savedState = localStorage.getItem(checkbox.id);
            const state = savedState !== null ? savedState === 'true' : defaultState;
            checkbox.checked = state;
            return state;
        };

        // Initialize checkboxes with saved or default states
        const profileVisible = loadSavedState(profileCheckbox);
        const hatchVisible = loadSavedState(hatchCheckbox);
        const dimensionVisible = loadSavedState(dimensionCheckbox);

        // Apply initial states
        beamDraw.setLayerVisibility('profile', profileVisible);
        beamDraw.setLayerVisibility('hatch', hatchVisible);
        if (dimensionLayer) {
            dimensionLayer.visible = dimensionVisible;
        }
        paper.view.update();

        // Add event listeners
        const saveAndUpdateState = (checkbox, layerName) => {
            localStorage.setItem(checkbox.id, checkbox.checked);
            if (layerName === 'dimension') {
                if (dimensionLayer) {
                    dimensionLayer.visible = checkbox.checked;
                }
            } else {
                beamDraw.setLayerVisibility(layerName, checkbox.checked);
            }
            paper.view.update();
        };

        profileCheckbox.addEventListener('change', () => {
            saveAndUpdateState(profileCheckbox, 'profile');
        });

        hatchCheckbox.addEventListener('change', () => {
            saveAndUpdateState(hatchCheckbox, 'hatch');
        });

        dimensionCheckbox.addEventListener('change', () => {
            saveAndUpdateState(dimensionCheckbox, 'dimension');
        });
    }

    // Set up theme toggle
    function setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const savedTheme = localStorage.getItem('theme') || 'light';
        
        // Set initial theme
        document.documentElement.dataset.theme = savedTheme;
        themeToggle.checked = savedTheme === 'dark';
        
        // Handle theme changes
        themeToggle.addEventListener('change', (e) => {
            const newTheme = e.target.checked ? 'dark' : 'light';
            document.documentElement.dataset.theme = newTheme;
            localStorage.setItem('theme', newTheme);
            
            // Update beam drawing with new theme
            if (beamDraw) {
                beamDraw.updateTheme(newTheme);
                // Update canvas background immediately
                paper.view.element.style.backgroundColor = beamDraw.config.background;
                drawBeam(currentProfile);
            }
        });
    }

    // Set up collapsible sections
    function setupCollapsibleSections() {
        const headers = document.querySelectorAll('.group-header');
        
        // Load saved states
        headers.forEach(header => {
            const savedState = localStorage.getItem(`section-${header.querySelector('h4').textContent}`);
            if (savedState !== null) {
                header.setAttribute('aria-expanded', savedState);
            }
        });

        // Add click handlers
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const isExpanded = header.getAttribute('aria-expanded') === 'true';
                header.setAttribute('aria-expanded', !isExpanded);
                
                // Save state
                localStorage.setItem(
                    `section-${header.querySelector('h4').textContent}`, 
                    !isExpanded
                );
            });
        });
    }

    // Initialize everything
    drawBeam();
    setupProfileSelector();
    setupLayerControls();
    setupThemeToggle();
    setupCollapsibleSections();

    // Handle window resize with debouncing
    let resizeTimeout;
    window.addEventListener('resize', () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        
        resizeTimeout = setTimeout(() => {
            // Update canvas size with margins
            const newSize = calculateCanvasSize();
            
            // Only resize if the change is significant (more than 10px)
            if (Math.abs(canvas.width - newSize.width) > 10 || 
                Math.abs(canvas.height - newSize.height) > 10) {
                
                canvas.width = newSize.width;
                canvas.height = newSize.height;
                paper.view.viewSize = new paper.Size(newSize.width, newSize.height);
                
                // Redraw with new dimensions
                drawBeam();
                setupLayerControls(); // Reconnect controls after redraw
            }
        }, 250); // Increased debounce time for smoother resizing
    });
}); 