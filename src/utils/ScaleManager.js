import { Point } from 'paper';

/**
 * ScaleManager.js
 * Handles conversion between world units (inches) and screen units (pixels)
 */
export class ScaleManager {
    constructor(initialPixelsPerInch = 40) {
        this.pixelsPerInch = initialPixelsPerInch;
    }

    // Convert from inches to pixels
    toPixels(inches) {
        return inches * this.pixelsPerInch;
    }

    // Convert from pixels to inches
    toInches(pixels) {
        return pixels / this.pixelsPerInch;
    }

    // Convert a Paper.js point from inches to pixels
    pointToPixels(point) {
        return new Point(
            this.toPixels(point.x),
            this.toPixels(point.y)
        );
    }

    // Convert a Paper.js point from pixels to inches
    pointToInches(point) {
        return new Point(
            this.toInches(point.x),
            this.toInches(point.y)
        );
    }

    // Update the scale factor
    updateScale(newPixelsPerInch) {
        this.pixelsPerInch = newPixelsPerInch;
    }

    // Get current scale factor
    getScale() {
        return this.pixelsPerInch;
    }
} 