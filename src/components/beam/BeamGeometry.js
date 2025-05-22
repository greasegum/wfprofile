import { paper } from 'paper';
import beamProfiles from '../../config/beam-profiles.json';

export class BeamGeometry {
    constructor(profileName = 'W8x31') {
        const profile = beamProfiles[profileName];
        if (!profile) {
            throw new Error(`Profile ${profileName} not found`);
        }
        this.dimensions = profile.dimensions;
        this.properties = profile.properties;
        this.calculatePoints();
    }

    calculatePoints() {
        const { width, height, webThickness, flangeThickness } = this.dimensions;
        
        // Calculate key points
        const xLeft = 0;
        const xRight = width;
        const xWebLeft = (width - webThickness) / 2;
        const xWebRight = (width + webThickness) / 2;
        const yTop = 0;
        const yFlange = flangeThickness;
        const yWebTop = yFlange;
        const yWebBottom = height - flangeThickness;
        const yBottom = height;

        // Store points in inches
        this.points = {
            tf1: { x: xLeft, y: yTop },
            tf2: { x: xRight, y: yTop },
            tf3: { x: xRight, y: yFlange },
            tf4: { x: xLeft, y: yFlange },
            w1: { x: xWebLeft, y: yFlange },
            w2: { x: xWebRight, y: yFlange },
            w3: { x: xWebRight, y: yWebBottom },
            w4: { x: xWebLeft, y: yWebBottom },
            bf1: { x: xLeft, y: yWebBottom },
            bf2: { x: xRight, y: yWebBottom },
            bf3: { x: xRight, y: yBottom },
            bf4: { x: xLeft, y: yBottom }
        };

        // Define perimeter order for path creation
        this.perimeterOrder = [
            'tf1', 'tf2', 'tf3', 'w2', 'w3',
            'bf2', 'bf3', 'bf4', 'bf1', 'w4', 'w1', 'tf4'
        ];

        // Define fillet corners
        this.filletCorners = {
            'w2': this.dimensions.filletRadius,
            'w3': this.dimensions.filletRadius,
            'w4': this.dimensions.filletRadius,
            'w1': this.dimensions.filletRadius
        };
    }

    calculateFilletPoints(prev, corner, next, radius) {
        // Convert points to vectors for calculation
        const v1 = {
            x: corner.x - prev.x,
            y: corner.y - prev.y
        };
        const v2 = {
            x: next.x - corner.x,
            y: next.y - corner.y
        };

        // Normalize vectors
        const v1Len = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const v2Len = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        
        v1.x /= v1Len;
        v1.y /= v1Len;
        v2.x /= v2Len;
        v2.y /= v2Len;

        // Calculate fillet points
        const filletStart = {
            x: corner.x - v1.x * radius,
            y: corner.y - v1.y * radius
        };
        
        const filletEnd = {
            x: corner.x + v2.x * radius,
            y: corner.y + v2.y * radius
        };

        // Calculate control points for bezier curve
        const k = 0.5523 * radius; // Magic number for circular approximation
        const cp1 = {
            x: filletStart.x + v1.x * k,
            y: filletStart.y + v1.y * k
        };
        
        const cp2 = {
            x: filletEnd.x - v2.x * k,
            y: filletEnd.y - v2.y * k
        };

        return {
            start: filletStart,
            end: filletEnd,
            cp1,
            cp2
        };
    }

    getPerimeterPoints() {
        return {
            points: this.points,
            order: this.perimeterOrder,
            filletCorners: this.filletCorners
        };
    }
} 