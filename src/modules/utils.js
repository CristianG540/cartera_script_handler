export class Utils {
  static binarySearch (arr, property, search) {
    let low = 0
    let high = arr.length
    let mid
    while (low < high) {
      mid = (low + high) >>> 1 // faster version of Math.floor((low + high) / 2)
      arr[mid][property] < search ? low = mid + 1 : high = mid
    }
    return low
  }
}
