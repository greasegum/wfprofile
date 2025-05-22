import dimensionConfig from '../../config/dimension-config.json';
import { paper } from 'paper';

// Base dimension class with shared utilities
class Dimension {
    constructor(scaleManager, themeConfig) {
        this.scaleManager = scaleManager;
        this.config = dimensionConfig;
        this.themeConfig = themeConfig;
    }

    drawOverallDimension(targetLayer, {
        start,
        end,
        value,
        orientation = 'horizontal',
        placementHint = null
    }) {
        // Default placement based on orientation
        placementHint = placementHint || (orientation === 'horizontal' ? 'above' : 'left');
        const offset = orientation === 'horizontal' ? 
            this.config.offsets.horizontal : 
            this.config.offsets.vertical;

        const group = new paper.Group();
        
        // Convert points to pixels
        start = this.scaleManager.pointToPixels(start);
        end = this.scaleManager.pointToPixels(end);

        // Calculate vectors
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const dir = length > 0 ? new paper.Point(dx / length, dy / length) : new paper.Point(1, 0);
        
        // Calculate normal vector
        let normal;
        if (orientation === 'horizontal') {
            normal = new paper.Point(0, placementHint === 'below' ? 1 : -1);
        } else {
            normal = new paper.Point(placementHint === 'left' ? -1 : 1, 0);
        }

        // Calculate dimension line points
        const offsetVec = normal.multiply(offset);
        const dimStart = start.add(offsetVec);
        const dimEnd = end.add(offsetVec);

        // Draw extension lines
        const ext1End = orientation === 'horizontal' ?
            new paper.Point(start.x, dimStart.y) :
            new paper.Point(dimStart.x, start.y);
        
        const ext2End = orientation === 'horizontal' ?
            new paper.Point(end.x, dimEnd.y) :
            new paper.Point(dimEnd.x, end.y);

        group.addChild(new paper.Path.Line({
            from: start,
            to: ext1End,
            strokeColor: this.themeConfig.dimensions.color,
            strokeWidth: this.config.style.lineWidth,
            strokeScaling: false
        }));

        group.addChild(new paper.Path.Line({
            from: end,
            to: ext2End,
            strokeColor: this.themeConfig.dimensions.color,
            strokeWidth: this.config.style.lineWidth,
            strokeScaling: false
        }));

        // Draw dimension line
        group.addChild(new paper.Path.Line({
            from: dimStart,
            to: dimEnd,
            strokeColor: this.themeConfig.dimensions.color,
            strokeWidth: this.config.style.lineWidth,
            strokeScaling: false
        }));

        // Add arrows
        const textInside = length >= this.config.style.minSpaceForInside;
        if (textInside) {
            this.drawArrow(group, dimStart, dir);
            this.drawArrow(group, dimEnd, dir.multiply(-1));
        } else {
            this.drawArrow(group, dimStart, dir.multiply(-1));
            this.drawArrow(group, dimEnd, dir);
        }

        // Add dimension text
        const midPoint = dimStart.add(dimEnd).divide(2);
        const textPoint = midPoint.add(normal.multiply(this.config.style.textGap));
        
        const text = new paper.PointText({
            point: textPoint,
            content: this.formatValue(value),
            fillColor: this.themeConfig.dimensions.color,
            fontFamily: this.config.style.fontFamily,
            fontSize: this.themeConfig.dimensions.fontSize,
            justification: 'center'
        });

        const textBackground = new paper.Path.Rectangle({
            rectangle: text.bounds.expand(4),
            fillColor: this.themeConfig.background,
            strokeWidth: 0
        });

        group.addChildren([textBackground, text]);
        targetLayer.addChild(group);
        return group;
    }

    drawThicknessDimension(targetLayer, {
        leftEdge,
        rightEdge,
        value,
        yPosition,
        midpointOffset = null  // New parameter to support midpoint positioning
    }) {
        try {
            this.logDebug('Drawing thickness dimension:', { leftEdge, rightEdge, value, yPosition, midpointOffset });
            
            const group = new paper.Group();
            
            // Convert points and position to pixels
            leftEdge = this.scaleManager.pointToPixels(leftEdge);
            rightEdge = this.scaleManager.pointToPixels(rightEdge);
            yPosition = this.scaleManager.toPixels(yPosition);

            // If midpointOffset is provided, use it to position the dimension
            let xPosition = leftEdge.x;
            if (midpointOffset !== null) {
                xPosition = this.scaleManager.toPixels(midpointOffset);
            }
            
            const { leftExtension, rightExtension, textOffset } = this.style.thickness;

            // Create the main dimension line with extensions
            const dimLine = new paper.Path.Line({
                from: new paper.Point(xPosition - leftExtension, yPosition),
                to: new paper.Point(xPosition + rightExtension, yPosition),
                strokeColor: this.style.lineColor,
                strokeWidth: this.style.lineWidth,
                strokeScaling: false
            });

            // Add arrows at edges (pointing inward)
            this.drawArrow(group, new paper.Point(leftEdge.x, yPosition), new paper.Point(1, 0));
            this.drawArrow(group, new paper.Point(rightEdge.x, yPosition), new paper.Point(-1, 0));

            // Add text to the right of the dimension
            const text = new paper.PointText({
                point: new paper.Point(xPosition + rightExtension + textOffset, yPosition),
                content: this.formatValue(value),
                fillColor: this.style.textColor,
                fontFamily: this.style.fontFamily,
                fontSize: this.style.fontSize,
                justification: 'left'
            });

            // Center text vertically
            text.position.y += text.bounds.height / 4;

            // Add background
            const textBackground = new paper.Path.Rectangle({
                rectangle: text.bounds.expand(4),
                fillColor: this.style.backgroundColor,
                strokeWidth: 0
            });

            group.addChildren([dimLine, textBackground, text]);
            targetLayer.addChild(group);
            return group;
        } catch (error) {
            this.logDebug('Error in drawThicknessDimension:', error);
            return this.drawFailsafeDimension(targetLayer, { 
                start: leftEdge, 
                end: rightEdge, 
                value 
            });
        }
    }

    drawArrow(group, point, direction) {
        const arrowSize = this.themeConfig.dimensions.arrowSize;
        const normal = new paper.Point(-direction.y, direction.x);
        
        const arrowPath = new paper.Path({
            segments: [
                point.add(direction.multiply(arrowSize)),
                point,
                point.add(direction.multiply(arrowSize).add(normal.multiply(arrowSize/2)))
            ],
            strokeColor: this.themeConfig.dimensions.color,
            strokeWidth: this.config.style.lineWidth,
            strokeScaling: false,
            closed: true
        });
        
        group.addChild(arrowPath);
    }

    formatValue(value) {
        // Handle undefined or null values
        if (value === undefined || value === null) {
            return '-';
        }

        // Format decimal inches (3 places) in brackets
        const decimalStr = `[${value.toFixed(3)}"]`;
        
        // Convert to fraction (in 32nds)
        const whole = Math.floor(value);
        const frac = value - whole;
        const num = Math.round(frac * 32);
        const den = 32;
        
        // Reduce fraction
        const gcd = (a, b) => b ? gcd(b, a % b) : a;
        const div = gcd(num, den);
        
        const fractionStr = whole > 0 
            ? `${whole} ${num/div}/${den/div}"`
            : `${num/div}/${den/div}"`;
        
        return `${decimalStr}\n${fractionStr}`;
    }
}

// Enhanced dimension class with modern drawing features
class EnhancedDimension extends Dimension {
    constructor(scaleManager, config, debug = false) {
        super(scaleManager, config);
        this.debug = debug;
        
        // Constants for dimension styling
        this.style = {
            fontSize: config.dimensions.fontSize || 11,
            fontFamily: 'Arial',
            textColor: config.dimensions.color,
            lineColor: config.dimensions.color,
            lineWidth: 1,
            arrowSize: 12,  // Length of the arrow
            arrowWidth: 0.4,  // Width ratio relative to length (was 0.6)
            textGap: 4,
            extensionOffset: 2,
            extensionGap: 3,  // Gap between extension line and vertex
            extensionLength: 4,
            minSpaceForInside: 40,
            backgroundColor: config.background,
            thickness: {
                leftExtension: 4,
                rightExtension: 40,
                textOffset: 10
            }
        };

        if (this.debug) {
            console.log('EnhancedDimension initialized with config:', {
                config: this.config,
                style: this.style
            });
        }
    }

    logDebug(message, data = null) {
        if (this.debug) {
            console.log(`[EnhancedDimension] ${message}`, data || '');
        }
    }

    drawArrow(group, base, dir, options = {}) {
        try {
            const size = options.size || this.style.arrowSize;
            const perp = new paper.Point(-dir.y, dir.x).normalize();
            const tip = base;  // The tip is now at the base point
            const left = base.subtract(dir.multiply(size * 1.2)).add(perp.multiply(size * this.style.arrowWidth));
            const right = base.subtract(dir.multiply(size * 1.2)).subtract(perp.multiply(size * this.style.arrowWidth));
            
            const arrow = new paper.Path({
                segments: [left, tip, right],
                closed: true,
                fillColor: this.style.lineColor,
                strokeColor: null
            });
            
            group.addChild(arrow);
            return arrow;
        } catch (error) {
            this.logDebug('Error drawing arrow:', error);
            return null;
        }
    }

    drawOverallDimension(targetLayer, {
        start,
        end,
        value,
        orientation = 'horizontal',
        placementHint = null
    }) {
        try {
            this.logDebug('Drawing overall dimension:', { start, end, value, orientation, placementHint });
            
            // Default placement based on orientation
            placementHint = placementHint || (orientation === 'horizontal' ? 'above' : 'left');
            
            // Convert points to pixels
            start = this.scaleManager.pointToPixels(start);
            end = this.scaleManager.pointToPixels(end);
            
            const group = new paper.Group();
            
            // Calculate vectors
            const delta = end.subtract(start);
            const length = delta.length;
            const dir = length > 0 ? delta.normalize() : new paper.Point(1, 0);
            
            // Calculate normal vector based on orientation and placement
            let normal;
            if (orientation === 'horizontal') {
                normal = new paper.Point(0, placementHint === 'below' ? 1 : -1);
            } else {
                normal = new paper.Point(placementHint === 'right' ? 1 : -1, 0);
            }

            // Draw extension and dimension lines
            const offset = this.scaleManager.toPixels(1); // 1" offset for overall dimensions
            this.drawExtensionLines(group, start, end, normal, offset);
            const { dimStart, dimEnd } = this.drawDimensionLine(group, start, end, normal, offset);

            // Determine text placement
            const textInside = length >= this.style.minSpaceForInside;

            // Draw arrows based on space available
            if (textInside) {
                this.drawArrow(group, dimStart, dir.multiply(-1));
                this.drawArrow(group, dimEnd, dir);
            } else {
                this.drawArrow(group, dimStart, dir);
                this.drawArrow(group, dimEnd, dir.multiply(-1));
            }

            // Add dimension text
            this.addDimensionText(group, dimStart, dimEnd, normal, value, textInside);

            targetLayer.addChild(group);
            return group;
        } catch (error) {
            this.logDebug('Error in drawOverallDimension:', error);
            return this.drawFailsafeDimension(targetLayer, { start, end, value });
        }
    }

    drawThicknessDimension(targetLayer, {
        leftEdge,
        rightEdge,
        value,
        yPosition,
        midpointOffset = null  // New parameter to support midpoint positioning
    }) {
        try {
            this.logDebug('Drawing thickness dimension:', { leftEdge, rightEdge, value, yPosition, midpointOffset });
            
            const group = new paper.Group();
            
            // Convert points and position to pixels
            leftEdge = this.scaleManager.pointToPixels(leftEdge);
            rightEdge = this.scaleManager.pointToPixels(rightEdge);
            yPosition = this.scaleManager.toPixels(yPosition);

            // If midpointOffset is provided, use it to position the dimension
            let xPosition = leftEdge.x;
            if (midpointOffset !== null) {
                xPosition = this.scaleManager.toPixels(midpointOffset);
            }
            
            const { leftExtension, rightExtension, textOffset } = this.style.thickness;

            // Create the main dimension line with extensions
            const dimLine = new paper.Path.Line({
                from: new paper.Point(xPosition - leftExtension, yPosition),
                to: new paper.Point(xPosition + rightExtension, yPosition),
                strokeColor: this.style.lineColor,
                strokeWidth: this.style.lineWidth,
                strokeScaling: false
            });

            // Add arrows at edges (pointing inward)
            this.drawArrow(group, new paper.Point(leftEdge.x, yPosition), new paper.Point(1, 0));
            this.drawArrow(group, new paper.Point(rightEdge.x, yPosition), new paper.Point(-1, 0));

            // Add text to the right of the dimension
            const text = new paper.PointText({
                point: new paper.Point(xPosition + rightExtension + textOffset, yPosition),
                content: this.formatValue(value),
                fillColor: this.style.textColor,
                fontFamily: this.style.fontFamily,
                fontSize: this.style.fontSize,
                justification: 'left'
            });

            // Center text vertically
            text.position.y += text.bounds.height / 4;

            // Add background
            const textBackground = new paper.Path.Rectangle({
                rectangle: text.bounds.expand(4),
                fillColor: this.style.backgroundColor,
                strokeWidth: 0
            });

            group.addChildren([dimLine, textBackground, text]);
            targetLayer.addChild(group);
            return group;
        } catch (error) {
            this.logDebug('Error in drawThicknessDimension:', error);
            return this.drawFailsafeDimension(targetLayer, { 
                start: leftEdge, 
                end: rightEdge, 
                value 
            });
        }
    }

    drawVerticalThicknessDimension(targetLayer, {
        topEdge,
        bottomEdge,
        value,
        xPosition,
        midpointOffset = null  // New parameter to support midpoint positioning
    }) {
        try {
            this.logDebug('Drawing vertical thickness dimension:', { topEdge, bottomEdge, value, xPosition, midpointOffset });
            
            const group = new paper.Group();
            
            // Convert points and position to pixels
            topEdge = this.scaleManager.pointToPixels(topEdge);
            bottomEdge = this.scaleManager.pointToPixels(bottomEdge);

            // Handle xPosition based on whether it's a direct position or an offset from the edge
            let finalXPosition;
            if (typeof xPosition === 'object' && xPosition.x !== undefined) {
                // If xPosition is a point, use its x coordinate directly
                finalXPosition = this.scaleManager.toPixels(xPosition.x);
            } else {
                // If xPosition is a number, use it directly
                finalXPosition = this.scaleManager.toPixels(xPosition);
            }
            
            const { leftExtension: topExtension, rightExtension: bottomExtension, textOffset } = this.style.thickness;

            // Create the main dimension line with extensions
            const dimLine = new paper.Path.Line({
                from: new paper.Point(finalXPosition, topEdge.y - topExtension),
                to: new paper.Point(finalXPosition, bottomEdge.y + bottomExtension),
                strokeColor: this.style.lineColor,
                strokeWidth: this.style.lineWidth,
                strokeScaling: false
            });

            // Add arrows at edges (pointing inward)
            this.drawArrow(group, new paper.Point(finalXPosition, topEdge.y), new paper.Point(0, 1));
            this.drawArrow(group, new paper.Point(finalXPosition, bottomEdge.y), new paper.Point(0, -1));

            // Add text below the dimension
            const text = new paper.PointText({
                point: new paper.Point(finalXPosition, bottomEdge.y + bottomExtension + textOffset),
                content: this.formatValue(value),
                fillColor: this.style.textColor,
                fontFamily: this.style.fontFamily,
                fontSize: this.style.fontSize,
                justification: 'left'
            });

            // Add background
            const textBackground = new paper.Path.Rectangle({
                rectangle: text.bounds.expand(4),
                fillColor: this.style.backgroundColor,
                strokeWidth: 0
            });

            group.addChildren([dimLine, textBackground, text]);
            targetLayer.addChild(group);
            return group;
        } catch (error) {
            this.logDebug('Error in drawVerticalThicknessDimension:', error);
            return this.drawFailsafeDimension(targetLayer, { 
                start: topEdge, 
                end: bottomEdge, 
                value 
            });
        }
    }

    drawExtensionLines(group, start, end, normal, offset) {
        try {
            const offsetVec = normal.multiply(offset);
            const gapVec = normal.multiply(this.style.extensionGap);
            
            // Calculate extension line start points with gaps from vertices
            const ext1Start = start.add(gapVec);
            const ext2Start = end.add(gapVec);
            
            // Calculate extension line endpoints at the dimension line
            let ext1End, ext2End;

            // Make extension lines perfectly vertical/horizontal
            if (normal.x === 0) {
                // Vertical extension lines
                ext1End = new paper.Point(ext1Start.x, start.y + offsetVec.y);
                ext2End = new paper.Point(ext2Start.x, end.y + offsetVec.y);
            } else {
                // Horizontal extension lines
                ext1End = new paper.Point(start.x + offsetVec.x, ext1Start.y);
                ext2End = new paper.Point(end.x + offsetVec.x, ext2Start.y);
            }

            const ext1 = new paper.Path.Line({
                from: ext1Start,
                to: ext1End,
                strokeColor: this.style.lineColor,
                strokeWidth: this.style.lineWidth,
                strokeScaling: false
            });

            const ext2 = new paper.Path.Line({
                from: ext2Start,
                to: ext2End,
                strokeColor: this.style.lineColor,
                strokeWidth: this.style.lineWidth,
                strokeScaling: false
            });

            group.addChildren([ext1, ext2]);
        } catch (error) {
            this.logDebug('Error drawing extension lines:', error);
        }
    }

    drawDimensionLine(group, start, end, normal, offset) {
        try {
            const offsetVec = normal.multiply(offset);
            const dimStart = start.add(offsetVec);
            const dimEnd = end.add(offsetVec);
            
            const dimLine = new paper.Path.Line({
                from: dimStart,
                to: dimEnd,
                strokeColor: this.style.lineColor,
                strokeWidth: this.style.lineWidth,
                strokeScaling: false
            });
            group.addChild(dimLine);
            
            return { dimStart, dimEnd };
        } catch (error) {
            this.logDebug('Error drawing dimension line:', error);
            return { dimStart: start, dimEnd: end };
        }
    }

    addDimensionText(group, dimStart, dimEnd, normal, value, textInside) {
        try {
            const midPoint = dimStart.add(dimEnd).divide(2);
            const textPoint = midPoint.add(normal.multiply(this.style.textGap));
            
            const text = new paper.PointText({
                point: textPoint,
                content: this.formatValue(value),
                fillColor: this.style.textColor,
                fontFamily: this.style.fontFamily,
                fontSize: this.style.fontSize,
                justification: 'center'
            });
            
            // Center text vertically
            text.position.y += text.bounds.height / 4;
            
            // Add background
            const textBackground = new paper.Path.Rectangle({
                rectangle: text.bounds.expand(4),
                fillColor: this.style.backgroundColor,
                strokeWidth: 0
            });
            
            group.addChildren([textBackground, text]);
        } catch (error) {
            this.logDebug('Error adding dimension text:', error);
        }
    }

    drawFailsafeDimension(targetLayer, params) {
        try {
            const group = new paper.Group();
            let { start, end, value } = params;
            
            // Convert points to pixels
            start = this.scaleManager.pointToPixels(start);
            end = this.scaleManager.pointToPixels(end);
            
            // Simple line
            const line = new paper.Path.Line({
                from: start,
                to: end,
                strokeColor: 'red',
                strokeWidth: 1,
                strokeScaling: false
            });
            
            // Simple text
            const text = new paper.PointText({
                point: start.add(end).divide(2),
                content: `${value}"`,
                fillColor: 'red',
                fontSize: 10,
                justification: 'center'
            });
            
            group.addChildren([line, text]);
            targetLayer.addChild(group);
            return group;
        } catch (error) {
            this.logDebug('Failsafe dimension failed:', error);
            return new paper.Group();
        }
    }
}

export { Dimension, EnhancedDimension }; 