import { Observable, of } from "rxjs";

export function handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      console.log(`${operation} failed: ${error.message}`);
      console.error(error); // log to console instead         

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
}