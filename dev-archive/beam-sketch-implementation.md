# Beam Sketch Implementation using Paper.js

## Overview
This document outlines the implementation of a beam sketch visualization using Paper.js. The sketch shows a section view of a beam with specific dimensions and features.

## Beam Dimensions
From the section view, we can observe:
- Overall height: 11.81" (300mm)
- Overall width: 7.87" (200mm)
- Web thickness: 0.79" (20mm)
- Flange thickness: 0.98" (25mm)

## Implementation Steps

### 1. Setup Paper.js
```javascript
// Initialize Paper.js
paper.setup('canvas');

// Set up view properties
paper.view.viewSize = new paper.Size(800, 600);
paper.view.scale(1);
```

### 2. Define Beam Geometry
```javascript
function defineBeamGeometry() {
    // Define dimensions in inches
    const dimensions = {
        width: 7.87,
        height: 11.81,
        webThickness: 0.79,
        flangeThickness: 0.98
    };
    
    // Calculate key points
    const points = {
        // Top flange points
        topLeft: new paper.Point(0, 0),
        topRight: new paper.Point(dimensions.width, 0),
        
        // Web points
        webTopLeft: new paper.Point(
            (dimensions.width - dimensions.webThickness) / 2,
            dimensions.flangeThickness
        ),
        webTopRight: new paper.Point(
            (dimensions.width + dimensions.webThickness) / 2,
            dimensions.flangeThickness
        ),
        webBottomLeft: new paper.Point(
            (dimensions.width - dimensions.webThickness) / 2,
            dimensions.height - dimensions.flangeThickness
        ),
        webBottomRight: new paper.Point(
            (dimensions.width + dimensions.webThickness) / 2,
            dimensions.height - dimensions.flangeThickness
        ),
        
        // Bottom flange points
        bottomLeft: new paper.Point(0, dimensions.height),
        bottomRight: new paper.Point(dimensions.width, dimensions.height)
    };
    
    return { dimensions, points };
}
```

### 3. Create Beam Components
```javascript
function createBeamComponents(geometry) {
    const { points, dimensions } = geometry;
    
    // Create top flange
    const topFlange = new paper.Path.Rectangle({
        from: points.topLeft,
        to: new paper.Point(points.topRight.x, points.webTopLeft.y),
        fillColor: '#e0e0e0'
    });
    
    // Create web
    const web = new paper.Path.Rectangle({
        from: points.webTopLeft,
        to: points.webBottomRight,
        fillColor: '#e0e0e0'
    });
    
    // Create bottom flange
    const bottomFlange = new paper.Path.Rectangle({
        from: points.webBottomLeft,
        to: points.bottomRight,
        fillColor: '#e0e0e0'
    });
    
    return { topFlange, web, bottomFlange };
}
```

### 4. Create Perimeter Path
```javascript
function createPerimeterPath(geometry) {
    const { points } = geometry;
    
    // Create a new path for the perimeter
    const path = new paper.Path();
    
    // Define the perimeter points in sequence
    const perimeterPoints = [
        points.bottomLeft,
        points.topLeft,
        points.topRight,
        points.bottomRight,
        points.bottomLeft
    ];
    
    // Create the path
    path.moveTo(perimeterPoints[0]);
    perimeterPoints.slice(1).forEach(point => {
        path.lineTo(point);
    });
    
    // Style the perimeter
    path.strokeColor = '#000000';
    path.strokeWidth = 2;
    path.fillColor = null;
    
    return path;
}
```

### 5. Main Drawing Function
```javascript
function drawBeam() {
    // Get geometry
    const geometry = defineBeamGeometry();
    
    // Create components
    const components = createBeamComponents(geometry);
    
    // Create perimeter
    const perimeter = createPerimeterPath(geometry);
    
    // Center the beam in the view
    const group = new paper.Group([components.topFlange, components.web, components.bottomFlange, perimeter]);
    group.position = paper.view.center;
}
```

## Implementation Notes

1. **Vertex Management**
   - All key points are defined in a single geometry object
   - Points are calculated once and reused across components
   - Makes it easier to modify dimensions and maintain consistency

2. **Component Approach**
   - The beam is constructed from three rectangles using the defined points
   - A separate perimeter path uses the same points
   - All components share the same geometry definition

3. **Styling**
   - Components are filled with a light gray color (#e0e0e0)
   - Perimeter is drawn in black with a 2px stroke
   - No fill for the perimeter path

4. **Graphics Area Management**
   - All graphical elements (beam, hatch, annotations, etc.) are added to a single parent group or layer.
   - After all elements are drawn, the bounding box of this group/layer is used to compute the scaling and centering transform.
   - This ensures all graphics remain aligned and nothing is forgotten, regardless of how many features are added.

## Next Steps

1. Implement the basic beam components
2. Add the perimeter path
3. Center the beam in the view
4. Add scaling to ensure proper display

## Dependencies

- Paper.js library
- HTML5 Canvas element
- Basic JavaScript knowledge

## References

- [Paper.js Documentation](http://paperjs.org/reference/)
- [Paper.js Examples](http://paperjs.org/examples/) 