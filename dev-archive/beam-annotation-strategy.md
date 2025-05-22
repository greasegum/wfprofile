# Beam Section Annotation Goals & Implementation Strategy

## Annotation Goals

The objective is to visually replicate the CAD-style dimensional annotations as shown in the provided SolidWorks drawing, including:

- **Linear dimensions** (vertical and horizontal) with extension lines, dimension lines, arrowheads, and text.
- **Dual units** (decimal and fractional inches) in brackets and below, as in the screenshot.
- **Clear, non-overlapping placement** of all annotation elements.
- **Consistent CAD-like style** (font, arrowheads, line weights, etc.).
- **Layered rendering:** Annotations should appear above the beam and hatch, but not obscure the geometry.

## Annotation Types to Support

- **Horizontal dimensions** (e.g., flange width, web thickness)
- **Vertical dimensions** (e.g., overall height, flange thickness)
- **Internal dimensions** (e.g., web thickness, flange-to-flange distance)

## Implementation Strategy

### 1. Pixel-Based, Group-Centric Drawing
- All coordinates and style values (arrows, gaps, offsets) are in screen pixels for simplicity and consistency.
- World unit conversion is only performed for text labels (e.g., to show inches or fractions).
- All graphical elements (beam, hatch, annotations, etc.) are added to a single parent group or layer (the "graphics area").
- After all elements are drawn, scaling and centering are applied to this parent group/layer, ensuring everything remains aligned and nothing is forgotten.

### 2. Annotation Class Structure
- Create a `DimensionalAnnotation` class (and possibly subclasses for different types).
- Each annotation is defined by:
  - Start and end points (in pixels)
  - Orientation (horizontal/vertical)
  - Value(s) to display (decimal, fractional)
  - Optional: label, offset, style overrides

### 3. Drawing Logic
- For each annotation:
  - Draw extension lines from geometry to offset dimension line.
  - Draw the dimension line with arrowheads at both ends.
  - Place the dimension text (with dual units) centered above/below the line.
  - Group all elements for easy manipulation.
- Use a dedicated Paper.js group or layer for annotations, but always add it to the main graphics group/layer.

### 4. Styling
- Use a consistent font (e.g., Arial or a CAD-like font).
- Arrowheads: filled triangles or "slash" style, sized proportionally.
- Thin, solid lines for extension/dimension lines.
- Text size and offset should scale with the drawing.

### 5. Placement & Collision Avoidance
- Allow for configurable offsets from the geometry.
- (Future) Optionally implement basic collision avoidance for overlapping annotations.

### 6. Integration & Graphics Area Management
- All elements (beam, hatch, annotations, etc.) are added to a single parent group or layer.
- After all drawing is complete, the bounding box of this group/layer is used to compute scaling and centering, so all graphics remain aligned and nothing is forgotten.
- Do not scale/center individual layers or groups separately.
- The main graphics area combines the beam, hatch, and annotation layers, all scaled and centered together as one.

### 7. Refinement & Extensibility
- Make annotation parameters (offsets, font size, arrow size, etc.) easily adjustable.
- Support for additional annotation types (e.g., radii, angles, notes) as needed.

---

## Next Steps

1. Implement the `DimensionalAnnotation` class with support for horizontal and vertical dimensions.
2. Add a few sample annotations to the beam drawing for visual verification.
3. Refine placement, styling, and dual-unit formatting.
4. Expand to support more annotation types and advanced features as needed. 