export class DateUtility {
  static convertDatetimeToEpoch(datetime: any, onSec = false) {
    return new Date(String(datetime)).getTime()
  }
}