import { Observable, of } from "rxjs";
import { Word } from "../lexicon/model/word";

export function handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      console.log(`${operation} failed: ${error.message}`);
      console.error(error); // log to console instead         

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
}

export interface WordFromServer {
    id: string;
    lexiconId: string;
    elements: {[k:string]: string};
    attributes: string;
    audioFiles: string[];
    createInstant: string | null;
    updateInstant: string | null;
}

export function convertWordFromServer(wordFromServer: WordFromServer): Word {
    return {
        id: wordFromServer.id,
        lexiconId: wordFromServer.lexiconId,
        elements: wordFromServer.elements,
        attributes: wordFromServer.attributes,
        audioFiles: wordFromServer.audioFiles,
        createInstant: wordFromServer.createInstant ? new Date(wordFromServer.createInstant) : null,
        updateInstant: wordFromServer.updateInstant ? new Date(wordFromServer.updateInstant) : null
    }
}

export function convertWordFromServerBatch(wordsFromServer: WordFromServer[]) {
    let words: Word[] = [];

    for (let wordFromServer of wordsFromServer) {
        words.push(convertWordFromServer(wordFromServer));
    }

    return words;
}

export function convertWord(word: Word): WordFromServer {
    console.dir(word);
    return {
        id: word.id,
        lexiconId: word.lexiconId,
        elements: word.elements,
        attributes: word.attributes,
        audioFiles: word.audioFiles,
        createInstant: word.createInstant ? word.createInstant.toISOString() : null,
        updateInstant: word.updateInstant ? word.updateInstant.toISOString() : null
    }
}

export function convertWordsBatch(words: Word[]): WordFromServer[] {
    let wordsFromServer: WordFromServer[] = [];

    for (let word of words) {
        wordsFromServer.push(convertWord(word));
    }

    return wordsFromServer;
}