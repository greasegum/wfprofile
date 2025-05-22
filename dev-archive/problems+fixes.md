# Beam Sketch Hatch Pattern Debug Checklist

## Current Symptoms
- ✓ Hatch lines are visible on screen
- ✓ Hatch lines are not clipped to beam profile
- ✗ Hatch visibility toggle not working
- ✓ Console shows correct visibility state changes

## Debug Findings

### 1. Group Structure Issues ✗
- Current structure is flat, not nested as expected
- Individual Path objects not properly grouped
- Hatch lines and clip mask are siblings instead of parent-child
- Actual structure:
  ```
  Layer
   └─ Group (this.layers.hatch)
       ├─ Path (hatch line) × many
       └─ Path (clipMask=true)
  ```

### 2. Clipping Issues ✗
- Clipping mask exists but not functioning
- `clipped` property undefined on all objects
- Clip mask is sibling to hatch lines instead of parent

### 3. Visibility Control ✗
- All objects show correct visible=true state
- Visibility changes not propagating due to flat structure
- Need to restructure for proper visibility inheritance

## Proposed Fix Strategy (In Order)

### 1. Fix Group Structure (Safest First)
```javascript
createHatchPattern(perimeter) {
    // Create main container
    const hatchGroup = new paper.Group({
        clipped: true
    });

    // Create and add hatch lines container
    const linesContainer = new paper.Group();
    hatchGroup.addChild(linesContainer);

    // Create and add clip mask
    const clipMask = perimeter.clone({
        clipMask: true
    });
    hatchGroup.addChild(clipMask);

    // Add hatch lines to container
    // ... existing hatch line creation code ...
    linesContainer.addChild(line);

    return hatchGroup;
}
```

### 2. Add Visibility Safeguards
```javascript
setLayerVisibility(layerName, visible) {
    if (this.layers[layerName]) {
        const group = this.layers[layerName];
        
        // Store original states
        const originalStates = new Map();
        const storeState = (item) => {
            originalStates.set(item, item.visible);
            if (item.children) {
                item.children.forEach(storeState);
            }
        };
        storeState(group);

        try {
            // Apply new visibility
            const applyVisibility = (item) => {
                item.visible = visible;
                if (item.children) {
                    item.children.forEach(applyVisibility);
                }
            };
            applyVisibility(group);
            
            // Force view update
            paper.view.update();
        } catch (e) {
            console.error('Visibility change failed, restoring:', e);
            // Restore original states
            originalStates.forEach((state, item) => {
                item.visible = state;
            });
        }
    }
}
```

### 3. Verify Clipping (After Structure Fix)
```javascript
// Add to createHatchPattern
if (!hatchGroup.clipped || !clipMask.clipMask) {
    console.warn('Clipping not properly set up');
    // Force clipping properties
    hatchGroup.clipped = true;
    clipMask.clipMask = true;
}
```

## Implementation Plan

1. First implement the group structure fix
2. Verify clipping works with new structure
3. Add visibility safeguards
4. Add verification checks
5. Test with different beam profiles

Would you like me to proceed with implementing the group structure fix first, since that appears to be the root cause of both the clipping and visibility issues?

## Possible Issues

### 1. Layer/Group Hierarchy
- [ ] Check if visibility property is being applied at correct level in hierarchy
- [ ] Verify parent-child relationship between groups is correct
- [ ] Confirm that hatch group structure matches expected:
  ```
  this.layers.hatch (Group)
   └─ finalGroup (Group, clipped=true)
       ├─ hatchContainer (Group)
       │   └─ hatch lines (Path.Line)
       └─ perimeterClip (Path, clipMask=true)
  ```

### 2. Visibility Propagation
- [ ] Test if Paper.js is propagating visibility changes through nested groups
- [ ] Check if any parent groups are overriding visibility
- [ ] Verify that all relevant groups have proper visibility inheritance

### 3. Event Handler Connection
- [ ] Confirm checkbox change events are firing
- [ ] Verify event handler is calling setLayerVisibility
- [ ] Check if view is being updated after visibility change

### 4. Clipping Mask Setup
- [ ] Verify perimeterClip properties (clipMask=true)
- [ ] Check finalGroup properties (clipped=true)
- [ ] Confirm correct z-ordering of clip mask and hatch lines

## Potential Solutions

### 1. Flatten Group Hierarchy
```javascript
// Remove nested group structure
this.layers.hatch = finalGroup; // Direct reference
```

### 2. Recursive Visibility
```javascript
setLayerVisibility(layerName, visible) {
    if (this.layers[layerName]) {
        this.layers[layerName].visible = visible;
        this.layers[layerName].children.forEach(child => {
            child.visible = visible;
        });
    }
}
```

### 3. Rebuild Group Structure
```javascript
const finalGroup = new paper.Group();
hatchLines.forEach(line => finalGroup.addChild(line));
finalGroup.addChild(perimeterClip);
finalGroup.clipped = true;
this.layers.hatch = finalGroup;
```

## Debug Steps

1. Add hierarchy logging:
   ```javascript
   console.log(JSON.stringify(this.layers.hatch.structure, null, 2));
   ```

2. Test visibility manually:
   ```javascript
   // In browser console
   paper.project.activeLayer.children[0].visible = false;
   paper.view.update();
   ```

3. Add breakpoints:
   - In setLayerVisibility
   - In checkbox event handler
   - After view updates

4. Check Paper.js version and documentation for any known visibility inheritance issues

## Implementation Strategy

1. First implement hierarchy logging to understand current structure
2. Based on results, either:
   - Flatten hierarchy if nesting is the issue
   - Implement recursive visibility if propagation is the issue
   - Rebuild group structure if current setup is incorrect
3. Add additional debug visualization to confirm changes
4. Test with different beam profiles to ensure fix is robust
