export class DateUtility {
  static convertDateTimeToEpoch(datetime: any, onSec = false) {
    return new Date(String(datetime)).getTime()
  }
}