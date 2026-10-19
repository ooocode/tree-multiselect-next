// keeps if pred is true
function filterInPlace<T> (arr: T[], pred: (val: T) => boolean): void {
  var idx = 0;
  for (var ii = 0; ii < arr.length; ++ii) {
    if (pred(arr[ii])) {
      arr[idx] = arr[ii];
      ++idx;
    }
  }
  arr.length = idx;
}

export function flatten<T> (arr: Array<T | T[]>, r?: T[]): T[];
export function flatten (arr: null): null;
export function flatten (arr: string): string;
export function flatten (arr: unknown, r: unknown[] = []): unknown {
  if (!Array.isArray(arr)) {
    return arr;
  }

  for (var ii = 0; ii < arr.length; ++ii) {
    if (Array.isArray(arr[ii])) {
      flatten(arr[ii], r);
    } else {
      r.push(arr[ii]);
    }
  }

  return r;
}

export function uniq<T> (arr: T[]): void {
  var hash: Record<PropertyKey, boolean> = {};

  var pred = function (val: T): boolean {
    var key = val as PropertyKey;
    var returnVal = !hash[key];
    hash[key] = true;
    return returnVal;
  };
  filterInPlace(arr, pred);
}

export function removeFalseyExceptZero<T> (arr: T[]): void {
  var pred = function (val: T): boolean {
    return !!val || val === 0;
  };
  filterInPlace(arr, pred);
}

export function moveEl<T> (arr: T[], oldPos: number, newPos: number): void {
  var el = arr[oldPos];
  arr.splice(oldPos, 1);
  arr.splice(newPos, 0, el);
}

export function subtract<T> (arr: T[], arrExcluded: T[]): void {
  var hash: Record<PropertyKey, boolean> = {};

  for (var ii = 0; ii < arrExcluded.length; ++ii) {
    hash[arrExcluded[ii] as PropertyKey] = true;
  }

  var pred = function (val: T): boolean {
    return !hash[val as PropertyKey];
  };
  filterInPlace(arr, pred);
}

export function intersect<T> (arr: T[], arrExcluded: T[]): void {
  var hash: Record<PropertyKey, boolean> = {};

  for (var ii = 0; ii < arrExcluded.length; ++ii) {
    hash[arrExcluded[ii] as PropertyKey] = true;
  }

  var pred = function (val: T): boolean {
    return !!hash[val as PropertyKey];
  };
  filterInPlace(arr, pred);
}

// takes in array of arrays
// arrays are presorted
export function intersectMany (arrays: number[][]): number[] {
  var indexLocations: number[] = [];
  var maxIndexLocations: number[] = [];
  arrays.forEach((array) => {
    indexLocations.push(0);
    maxIndexLocations.push(array.length - 1);
  });

  var finalOutput: number[] = [];
  for (; indexLocations.length > 0 && indexLocations[0] <= maxIndexLocations[0]; ++indexLocations[0]) {
    // advance indices to be at least equal to first array element
    var terminate = false;
    for (var ii = 1; ii < arrays.length; ++ii) {
      while (arrays[ii][indexLocations[ii]] < arrays[0][indexLocations[0]] &&
             indexLocations[ii] <= maxIndexLocations[ii]) {
        ++indexLocations[ii];
      }
      if (indexLocations[ii] > maxIndexLocations[ii]) {
        terminate = true;
        break;
      }
    }

    if (terminate) {
      break;
    }

    // check element equality
    var shouldAdd = true;
    for (var jj = 1; jj < arrays.length; ++jj) {
      if (arrays[0][indexLocations[0]] !== arrays[jj][indexLocations[jj]]) {
        shouldAdd = false;
        break;
      }
    }

    if (shouldAdd) {
      finalOutput.push(arrays[0][indexLocations[0]]);
    }
  }

  return finalOutput;
}
