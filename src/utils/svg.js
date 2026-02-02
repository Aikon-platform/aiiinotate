/**
 * module to compute XYWH bounding box of any SVG.
 *
 * we do not compute the bounding box from `svg/@width` and `svg/@height` attributes:
 * in Mirador, those are used to store a canvas' full width and height.
 * instead, we compute from child elements: circles, rectangles, paths...
 *
 * NOTE: the following things are not supported
 * - Rotation transforms (requires full matrix math)
 * - CSS styles (stroke-width in <style> tags)
 * - Text elements (would need font metrics)
 * - Nested transforms (stack management is simplified)
 */

import { svgPathBbox } from "svg-path-bbox";

import { visibleLog } from "#utils/utils.js";


/**
 * Extract bbox from circle element
 * <circle cx='100' cy='100' r='50'/>
 */
const circleBbox = (attrs) => {
  const cx = parseFloat(attrs.cx || 0);
  const cy = parseFloat(attrs.cy || 0);
  const r = parseFloat(attrs.r || 0);

  if (isNaN(cx) || isNaN(cy) || isNaN(r)) return null;

  return [cx - r, cy - r, cx + r, cy + r];
}

/**
 * Extract bbox from ellipse element
 * <ellipse cx='100' cy='100' rx='60' ry='40'/>
 */
const ellipseBbox = (attrs) => {
  const cx = parseFloat(attrs.cx || 0);
  const cy = parseFloat(attrs.cy || 0);
  const rx = parseFloat(attrs.rx || 0);
  const ry = parseFloat(attrs.ry || 0);

  if (isNaN(cx) || isNaN(cy) || isNaN(rx) || isNaN(ry)) return null;

  return [cx - rx, cy - ry, cx + rx, cy + ry];
}

/**
 * Extract bbox from rect element
 * <rect x='10' y='10' width='80' height='60'/>
 */
const rectBbox = (attrs) => {
  const x = parseFloat(attrs.x || 0);
  const y = parseFloat(attrs.y || 0);
  const width = parseFloat(attrs.width || 0);
  const height = parseFloat(attrs.height || 0);

  if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) return null;

  return [x, y, x + width, y + height];
}

/**
 * Extract bbox from line element
 * <line x1='10' y1='10' x2='90' y2='90'/>
 */
const lineBbox = (attrs) => {
  const x1 = parseFloat(attrs.x1 || 0);
  const y1 = parseFloat(attrs.y1 || 0);
  const x2 = parseFloat(attrs.x2 || 0);
  const y2 = parseFloat(attrs.y2 || 0);

  if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) return null;

  return [
    Math.min(x1, x2),
    Math.min(y1, y2),
    Math.max(x1, x2),
    Math.max(y1, y2),
  ];
}

/**
 * Extract bbox from polyline/polygon element
 * <polyline points='10,10 90,90 10,90'/>
 */
const polylineBbox = (attrs) => {
  const points = attrs.points;
  if (!points || typeof points !== "string") return null;

  const coords = points
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter(n => !isNaN(n));

  if (coords.length < 2) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < coords.length; i += 2) {
    const x = coords[i];
    const y = coords[i + 1];
    if (!isNaN(x) && !isNaN(y)) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return minX === Infinity ? null : [minX, minY, maxX, maxY];
}

/**
 * Extract bbox from path element
 * <path d='M 10 10 L 90 90'/>
 */
const pathBbox = (pathD) => {
  if (!pathD || typeof pathD !== "string") return null;

  try {
    return svgPathBbox(pathD);
  } catch (e) {
    return null;
  }
}

/**
 * Parse element attributes from XML string
 */
const parseAttributes = (elementString) => {
  const attrs = {};
  const attrRegex = /(\w+(?:[-:][\w]+)*)\s*=\s*["']([^"']*)["']/g;
  let match;

  while ((match = attrRegex.exec(elementString)) !== null) {
    attrs[match[1]] = match[2];
  }

  return attrs;
}

/**
 * Parse transform attribute and apply to bbox
 * Supports: translate, scale, rotate (simplified)
 */
const applyTransform = (bbox, transformStr) => {
  if (!bbox || !transformStr) return bbox;

  const transforms = [];
  const regex = /(\w+)\s*\(\s*([^)]*)\s*\)/g;
  let match;

  while ((match = regex.exec(transformStr)) !== null) {
    const [, func, args] = match;
    const nums = args.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    transforms.push({ func: func.toLowerCase(), nums });
  }

  let [x1, y1, x2, y2] = bbox;

  for (const { func, nums } of transforms) {
    switch (func) {
      case "translate": {
        const tx = nums[0] || 0;
        const ty = nums[1] || 0;
        x1 += tx;
        x2 += tx;
        y1 += ty;
        y2 += ty;
        break;
      }
      case "scale": {
        const sx = nums[0] || 1;
        const sy = nums[1] ?? sx;
        x1 *= sx;
        x2 *= sx;
        y1 *= sy;
        y2 *= sy;
        break;
      }
      case "rotate": {
        // Simplified: for rotation, we'd need to calculate 4 corners
        // For now, we'll skip proper rotation (requires matrix math)
        console.warn("Rotation not fully supported in bbox calculation");
        break;
      }
      case "matrix": {
        // a c e, b d f
        if (nums.length >= 6) {
          const [a, b, c, d, e, f] = nums;
          const x = x1 * a + y1 * c + e;
          const y = x1 * b + y1 * d + f;
          const x2new = x2 * a + y2 * c + e;
          const y2new = x2 * b + y2 * d + f;
          x1 = Math.min(x, x2new);
          x2 = Math.max(x, x2new);
          y1 = Math.min(y, y2new);
          y2 = Math.max(y, y2new);
        }
        break;
      }
    }
  }

  return [x1, y1, x2, y2];
}

/**
 * Compute bounding box for single element
 */
const computeElementBbox = (elementString, parentTransform = null) => {
  let bbox = null;
  const attrs = parseAttributes(elementString);

  // Determine element type and compute bbox
  if (elementString.includes("<circle")) {
    bbox = circleBbox(attrs);
  } else if (elementString.includes("<ellipse")) {
    bbox = ellipseBbox(attrs);
  } else if (elementString.includes("<rect")) {
    bbox = rectBbox(attrs);
  } else if (elementString.includes("<line")) {
    bbox = lineBbox(attrs);
  } else if (elementString.includes("<polyline") || elementString.includes("<polygon")) {
    bbox = polylineBbox(attrs);
  } else if (elementString.includes("<path")) {
    bbox = pathBbox(attrs.d);
  }

  if (!bbox) return null;

  // Apply element's own transform
  if (attrs.transform) {
    bbox = applyTransform(bbox, attrs.transform);
  }

  // Apply parent transform
  if (parentTransform) {
    bbox = applyTransform(bbox, parentTransform);
  }

  return bbox;
}

/**
 * Recursively extract all element bboxes from SVG string
 */
const extractAllBboxes = (svgString) => {
  const bboxes = [];
  const elementRegex = /<(circle|ellipse|rect|line|polyline|polygon|path|g|svg)\s*([^>]*?)(?:>|\/\s*>)/gi;
  const groupStack = []; // Track group transforms

  let match;
  while ((match = elementRegex.exec(svgString)) !== null) {
    const [fullMatch, tagName, attrs] = match;
    const normalizedTag = tagName.toLowerCase();

    if (normalizedTag === "g") {
      // Handle group transform
      const gAttrs = parseAttributes(fullMatch);
      if (gAttrs.transform) {
        groupStack.push(gAttrs.transform);
      }
    } else {
      // Compute bbox for element
      const parentTransform = groupStack.length > 0 ? groupStack[groupStack.length - 1] : null;
      const bbox = computeElementBbox(fullMatch, parentTransform);

      if (bbox) {
        bboxes.push(bbox);
      }
    }
  }

  return bboxes;
}

/**
 * Main method: compute union bbox for entire SVG.
 *
 * see documentation on top of this file for more info.
 *
 * @param {string} svgString
 * @returns {number[]?}
 */
const computeXywh = (svgString) => {

  // Quick check: try viewBox first
  const viewBoxMatch = svgString.match(/viewBox\s*=\s*["']([^"']+)["']/i);
  if (viewBoxMatch) {
    const nums = viewBoxMatch[1].split(/[\s,]+/).map(Number);
    if (nums.length === 4 && nums.every(n => !isNaN(n))) {
      return nums;
    }
  }

  // Full element extraction
  const bboxes = extractAllBboxes(svgString);

  if (bboxes.length === 0) {
    return null;
  }

  // Compute union
  const [minX, minY, maxX, maxY] = bboxes.reduce(
    ([x1, y1, x2, y2], [nx1, ny1, nx2, ny2]) => [
      Math.min(x1, nx1),
      Math.min(y1, ny1),
      Math.max(x2, nx2),
      Math.max(y2, ny2),
    ]
  );

  return [minX, minY, maxX - minX, maxY - minY];
}

/**
 * compute the XYWH bounds of an SVG.
 *
 * since `svgStringToXywh` receives SVG strings from clients,
 * we add some dirty solutions to mitigate malicious input
 * that could cause a ReDos.
 *
 * @param {string} svgString
 * @returns {Promise<number[]?>}
 */
async function svgStringToXywh(svgString) {
  const timeoutMs = 500;

  return new Promise((res, rej) => {
    const timeout = setTimeout(() => {
      rej(new Error(`svgStringToXywh: SVG processing timeout after ${timeoutMs}ms`))
    }, timeoutMs);

    try {
      // sanity checks
      if ( !(typeof svgString === "string" || svgString instanceof String) || !svgString?.length ) {
        rej(new Error("svgStringToXywh: SVG must be a string"))
      }
      if (svgString.length > 10000000) {
        throw new Error("svgStringToXywh: SVG exceeds maximum size (10MB)");
      }
      if (!/<svg[^>]*>/i.test(svgString)) {
        throw new Error("svgStringToXywh: invalid SVG: missing <svg> tag");
      }
      // compute xywh
      const xywh = computeXywh(svgString);
      clearTimeout(timeout);
      res(xywh);

    } catch (err) {
      clearTimeout(timeout);
      rej(err);
    }
  })
}

export { svgStringToXywh };

// QUICK PEFORMANCE TESTING: ~80ms / 10K SVGs
// const n = 10000
// const testSVGs = Array(10000).fill().map((_, i) => `
//   <svg xmlns='http://www.w3.org/2000/svg'>
//     <circle cx='${100 + i}' cy='100' r='50'/>
//     <rect x='10' y='10' width='80' height='60'/>
//     <polyline points='10,10 90,90 10,90'/>
//     <circle cx='${100 + i}' cy='100' r='50'/>
//     <rect x='10' y='10' width='80' height='60'/>
//     <polyline points='10,10 90,90 10,90'/>
//     <circle cx='${100 + i}' cy='100' r='50'/>
//     <rect x='10' y='10' width='80' height='60'/>
//     <polyline points='10,10 90,90 10,90'/>
//   </svg>
// `);
// const msg = `Compute bbox for ${n} SVGs`;
// console.time(msg);
// testSVGs.forEach(svg => computeXywh(svg));
// console.timeEnd(msg);

// OTHER USE CASES:
// const testCases = [
//   // Circle
//   `<svg xmlns='http://www.w3.org/2000/svg'>
//     <circle cx='100' cy='100' r='50'/>
//   </svg>`,
//
//   // Rectangle
//   `<svg xmlns='http://www.w3.org/2000/svg'>
//     <rect x='10' y='10' width='80' height='60'/>
//   </svg>`,
//
//   // Polyline
//   `<svg xmlns='http://www.w3.org/2000/svg'>
//     <polyline points='10,10 90,90 10,90'/>
//   </svg>`,
//
//   // Mixed with transform
//   `<svg xmlns='http://www.w3.org/2000/svg'>
//     <g transform='translate(100, 100)'>
//       <circle cx='0' cy='0' r='50'/>
//       <rect x='-40' y='-30' width='80' height='60'/>
//     </g>
//   </svg>`,
// ];
//
// testCases.forEach((svg, i) => {
//   const bbox = svgStringToXywh(svg);
//   console.log(`Test ${i + 1}:`, bbox);
// });

