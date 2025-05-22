import drawingConfig from '../../config/drawing-config.json';
import { paper } from 'paper';

export class BeamDraw {
    constructor(geometry, scaleManager) {
        this.geometry = geometry;
        this.scaleManager = scaleManager;
        this.config = drawingConfig.themes[document.documentElement.dataset.theme || 'light'];
        this.layers = {
            profile: null,
            hatch: null,
            debug: null,
            info: null
        };
        this.debug = true; // Enable debug mode
    }

    // Method to update theme
    updateTheme(theme) {
        this.config = drawingConfig.themes[theme];
    }

    draw(targetLayer) {
        // Create named layers as children of the target layer
        this.layers.hatch = new paper.Group();
        this.layers.profile = new paper.Group();
        this.layers.debug = new paper.Group();
        this.layers.info = new paper.Group();
        
        // Create elements
        const perimeter = this.createPerimeterPath();
        const hatchGroup = this.createHatchPattern(perimeter);
        
        // Add elements to their respective groups
        this.layers.hatch.addChild(hatchGroup);
        this.layers.profile.addChild(perimeter);
        
        // Add groups to target layer in correct order
        // Order: hatch (bottom) -> profile -> debug -> info (top)
        targetLayer.addChild(this.layers.hatch);    // Draw hatch first (bottom)
        targetLayer.addChild(this.layers.profile);  // Profile on top of hatch
        targetLayer.addChild(this.layers.debug);    // Debug on top
        targetLayer.addChild(this.layers.info);     // Info layer on very top
        
        // Draw scale info
        this.drawScaleInfo();

        if (this.debug) {
            console.log('Layer order:');
            console.log('- Bottom to top:', targetLayer.children.map(child => ({
                type: child.className,
                visible: child.visible,
                children: child.children.length
            })));
        }

        return { perimeter, hatchGroup };
    }

    drawDebugVisuals(perimeter, hatchGroup) {
        // Draw perimeter bounds in red
        const perimeterBounds = new paper.Path.Rectangle({
            rectangle: perimeter.bounds,
            strokeColor: 'red',
            strokeWidth: 1,
            dashArray: [4, 4]
        });
        
        // Draw hatch bounds in blue
        const hatchBounds = new paper.Path.Rectangle({
            rectangle: hatchGroup.bounds,
            strokeColor: 'blue',
            strokeWidth: 1,
            dashArray: [4, 4]
        });
        
        // Draw hatch clip mask outline in green
        const clipMask = hatchGroup.children.find(child => child.clipMask);
        if (clipMask) {
            const clipOutline = clipMask.clone();
            clipOutline.clipMask = false;
            clipOutline.strokeColor = 'green';
            clipOutline.strokeWidth = 2;
            clipOutline.fillColor = null;
            this.layers.debug.addChild(clipOutline);
        }
        
        this.layers.debug.addChildren([perimeterBounds, hatchBounds]);
        
        // Add text labels
        const addLabel = (text, point, color) => {
            const label = new paper.PointText({
                point: point.add(new paper.Point(5, 15)),
                content: text,
                fillColor: color,
                fontSize: 12
            });
            this.layers.debug.addChild(label);
        };
        
        addLabel('Perimeter', perimeterBounds.bounds.topLeft, 'red');
        addLabel('Hatch', hatchBounds.bounds.topLeft, 'blue');
    }

    setLayerVisibility(layerName, visible) {
        if (this.layers[layerName]) {
            // Log before state
            if (this.debug) {
                console.log(`\n=== Visibility Change Debug ===`);
                console.log('Before change:');
                console.log(`- ${layerName} layer:`, this.layers[layerName].visible);
                if (this.layers[layerName].children) {
                    this.layers[layerName].children.forEach((child, i) => {
                        console.log(`- Child ${i}:`, child.visible);
                    });
                }
            }

            this.layers[layerName].visible = visible;

            // Log after state
            if (this.debug) {
                console.log('\nAfter change:');
                console.log(`- ${layerName} layer:`, this.layers[layerName].visible);
                if (this.layers[layerName].children) {
                    this.layers[layerName].children.forEach((child, i) => {
                        console.log(`- Child ${i}:`, child.visible);
                    });
                }
                console.log('\nView updated:', paper.view.update());
            }
        }
    }

    createPerimeterPath() {
        const { points, order, filletCorners } = this.geometry.getPerimeterPoints();
        const path = new paper.Path();
        
        // Convert first point to pixels and add to path
        const firstPoint = this.scaleManager.pointToPixels(points[order[0]]);
        path.add(firstPoint);

        // Add remaining points with fillets where specified
        for (let i = 1; i < order.length + 1; i++) {
            const currIdx = i % order.length;
            const prevIdx = (i - 1 + order.length) % order.length;
            const nextIdx = (i + 1) % order.length;

            const curr = points[order[currIdx]];
            const prev = points[order[prevIdx]];
            const next = points[order[nextIdx]];

            if (filletCorners[order[currIdx]]) {
                // Calculate fillet points
                const radius = filletCorners[order[currIdx]];
                const fillet = this.geometry.calculateFilletPoints(prev, curr, next, radius);
                
                // Convert to pixels and add to path
                const filletStart = this.scaleManager.pointToPixels(fillet.start);
                const filletEnd = this.scaleManager.pointToPixels(fillet.end);
                const cp1 = this.scaleManager.pointToPixels(fillet.cp1);
                const cp2 = this.scaleManager.pointToPixels(fillet.cp2);

                path.lineTo(filletStart);
                path.cubicCurveTo(cp1, cp2, filletEnd);
            } else {
                const point = this.scaleManager.pointToPixels(curr);
                path.lineTo(point);
            }
        }

        path.closed = true;
        path.strokeColor = this.config.beam.strokeColor;
        path.strokeWidth = this.config.beam.strokeWidth;
        path.fillColor = this.config.beam.fillColor;

        return path;
    }

    createHatchPattern(perimeter) {
        // Create the main group that will hold everything
        const hatchGroup = new paper.Group({
            clipped: true
        });

        // Calculate bounds with padding
        const bounds = perimeter.bounds.expand(this.scaleManager.toPixels(1.0));
        const hatchConfig = this.config.hatch;
        
        // Calculate angle and spacing
        const angleRad = (hatchConfig.angle || 45) * Math.PI / 180;
        const spacing = this.scaleManager.toPixels(hatchConfig.spacing / 25.4); // Convert mm to inches
        
        // Calculate diagonal length for full coverage
        const diag = Math.sqrt(bounds.width * bounds.width + bounds.height * bounds.height);
        const lines = Math.ceil(diag / spacing) * 2; // Double the lines for full coverage

        // Create lines group
        const linesGroup = new paper.Group();
        
        // Create individual lines
        for (let i = -lines; i < lines; i++) {
            const offset = i * spacing;
            
            // Calculate rotated line endpoints using center point
            const center = bounds.center;
            const x1 = center.x - diag * Math.cos(angleRad) - offset * Math.sin(angleRad);
            const y1 = center.y - diag * Math.sin(angleRad) + offset * Math.cos(angleRad);
            const x2 = center.x + diag * Math.cos(angleRad) - offset * Math.sin(angleRad);
            const y2 = center.y + diag * Math.sin(angleRad) + offset * Math.cos(angleRad);
            
            // Create line with explicit color
            const line = new paper.Path.Line({
                from: [x1, y1],
                to: [x2, y2],
                strokeColor: new paper.Color(hatchConfig.color),
                strokeWidth: hatchConfig.strokeWidth,
                strokeScaling: true
            });
            
            linesGroup.addChild(line);
        }

        // Add lines first
        hatchGroup.addChild(linesGroup);
        
        // Create and add clip mask last
        const clipMask = perimeter.clone();
        clipMask.clipMask = true;
        clipMask.fillColor = null;
        clipMask.strokeColor = null;
        hatchGroup.addChild(clipMask);

        if (this.debug) {
            console.log('Hatch pattern structure:');
            console.log('- Main group:', {
                clipped: hatchGroup.clipped,
                visible: hatchGroup.visible,
                children: hatchGroup.children.length
            });
            console.log('- Lines group:', {
                children: linesGroup.children.length,
                firstLine: linesGroup.firstChild ? {
                    strokeColor: linesGroup.firstChild.strokeColor?.toCSS(),
                    strokeWidth: linesGroup.firstChild.strokeWidth,
                    visible: linesGroup.firstChild.visible
                } : null
            });
            console.log('- Clip mask:', {
                clipMask: clipMask.clipMask,
                visible: clipMask.visible
            });
        }

        return hatchGroup;
    }

    drawScaleInfo() {
        const scale = this.scaleManager.getScale();
        const pixelsPerInch = scale.toFixed(1);
        const scaleText = new paper.PointText({
            point: new paper.Point(10, paper.view.size.height - 10),
            content: `Scale: ${pixelsPerInch} pixels = 1 inch`,
            fillColor: this.config.dimensions.color,
            fontFamily: 'monospace',
            fontSize: 12,
            justification: 'left'
        });

        const textBackground = new paper.Path.Rectangle({
            rectangle: scaleText.bounds.expand(4),
            fillColor: this.config.background,
            strokeWidth: 0
        });

        this.layers.info.addChildren([textBackground, scaleText]);
    }
} 